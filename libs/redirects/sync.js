// Builds the live redirect map from Strapi (redirection-urls).
//
// 1. fetch every redirect from Strapi
// 2. validate them (libs/redirect-validator.js), invalid entries are skipped
// 3. request every destination on the configured website (libs/redirects/site.js);
//    the results are shown in the report but never switch a redirect off
// 4. write .redirects/redirects.json (read by middleware.js) and .redirects/report.json
//
// Nothing is written unless all steps succeed, so the site keeps the last good
// redirects when Strapi is down.
import fs from "node:fs/promises";
import { getRedirectLinks } from "@/app/[lang]/data/loader";
import { RULES, finalizeRows, redirectKey, validateRedirects } from "@/libs/redirect-validator";
import { CHECK_HEADER, REDIRECTS_DIR, REDIRECTS_FILE, REPORT_FILE, checkHeaderValue } from "./paths";
import { siteConfig } from "./site";

const CHECK_CONCURRENCY = 6;
const CHECK_TIMEOUT_MS = 15000;
const CHECK_MAX_HOPS = 5;
// How long a check result is trusted before the destination is requested again
const CHECK_TTL_MS = {
    ok: 12 * 60 * 60 * 1000,
    redirected: 12 * 60 * 60 * 1000,
    not_found: 60 * 60 * 1000,
    loop: 60 * 60 * 1000,
    broken: 60 * 60 * 1000,
};
const CHECK_ISSUES = {
    not_found: "DEST_NOT_FOUND",
    loop: "DEST_LOOP",
    broken: "DEST_BROKEN",
    redirected: "DEST_REDIRECTS",
    unverified: "DEST_UNVERIFIED",
};
// Statuses that mean "we were not allowed to look", not "the page is broken"
const BLOCKED_STATUSES = [401, 403, 407, 429];

// Where this server can be reached from itself; only used to wait for start-up
export function checkOrigin() {
    const origin =
        process.env.REDIRECT_CHECK_ORIGIN ||
        process.env.__NEXT_PRIVATE_ORIGIN ||
        `http://localhost:${process.env.PORT || 3000}`;
    return origin.replace(/\/+$/, "");
}

async function readJson(file) {
    try {
        return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
        return null;
    }
}

export function readReport() {
    return readJson(REPORT_FILE);
}

// The redirects middleware.js applies right now: [{ source, destination, id }]
export async function readLiveRedirects() {
    const data = await readJson(REDIRECTS_FILE);
    return Object.entries(data?.redirects || {}).map(([source, redirect]) => ({
        source,
        destination: redirect.destination,
        id: redirect.id ?? null,
    }));
}

async function writeJsonAtomic(file, data) {
    await fs.mkdir(REDIRECTS_DIR, { recursive: true });
    const tmp = `${file}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(data), "utf8");

    // Windows can briefly refuse the rename while middleware.js is reading the file
    for (let attempt = 0; ; attempt++) {
        try {
            await fs.rename(tmp, file);
            return;
        } catch (error) {
            if (attempt >= 4 || !["EPERM", "EBUSY", "EACCES"].includes(error.code)) {
                await fs.rm(tmp, { force: true });
                throw error;
            }
            await new Promise((resolve) => setTimeout(resolve, 50 * (attempt + 1)));
        }
    }
}

// Requests a destination the way a visitor would and follows its redirects.
// siteOrigin: the configured website; only requests to it carry the check header.
async function checkDestination(url, siteOrigin) {
    const headerValue = checkHeaderValue();
    const internal = new URL(url).origin === siteOrigin;
    const visited = [url];
    let current = url;

    for (let hops = 0; ; hops++) {
        let response;
        try {
            const toSite = new URL(current).origin === siteOrigin;
            response = await fetch(current, {
                redirect: "manual",
                cache: "no-store",
                headers: {
                    "user-agent": "ChempolRedirectCheck/1.0",
                    ...(toSite && headerValue ? { [CHECK_HEADER]: headerValue } : {}),
                },
                signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
            });
        } catch (error) {
            return { result: "unverified", detail: `${error.cause?.code || error.name} at ${current}` };
        }
        response.body?.cancel().catch(() => { });

        const { status } = response;
        const location = response.headers.get("location");

        if (status >= 300 && status < 400 && location) {
            const next = new URL(location, current).href;
            if (visited.includes(next)) {
                return { result: "loop", status, hops: hops + 1, detail: [...visited, next].join(" → ") };
            }
            if (hops + 1 > CHECK_MAX_HOPS) {
                return { result: "broken", status, hops: hops + 1, detail: `More than ${CHECK_MAX_HOPS} redirects after ${url}` };
            }
            visited.push(next);
            current = next;
            continue;
        }

        const base = { status, hops, finalUrl: current };
        if (status >= 200 && status < 300) {
            return hops
                ? { ...base, result: "redirected", detail: `${hops} more redirect${hops === 1 ? "" : "s"}: ${visited.join(" → ")}` }
                : { ...base, result: "ok" };
        }
        if (status === 404 || status === 410) return { ...base, result: "not_found", detail: `HTTP ${status} at ${current}` };
        if (status >= 500 || BLOCKED_STATUSES.includes(status) || !internal) {
            return { ...base, result: "unverified", detail: `HTTP ${status} at ${current}` };
        }
        return { ...base, result: "broken", detail: `HTTP ${status} at ${current}` };
    }
}

async function inPool(items, size, worker) {
    let next = 0;
    await Promise.all(
        Array.from({ length: Math.min(size, items.length) }, async () => {
            while (next < items.length) await worker(items[next++]);
        })
    );
}

// Internal destinations are paths; they are checked on the configured website
function toCheckUrl(destination, checkBaseUrl) {
    if (!destination.startsWith("/")) return destination;
    return checkBaseUrl ? new URL(destination, checkBaseUrl).href : null;
}

// Adds DEST_* (reportOnly) issues to live rows. Results are cached per checked URL,
// so switching domains never reuses another environment's results.
async function checkDestinations(rows, previousChecks, { force, recheck, checkBaseUrl }) {
    const now = Date.now();
    const checks = {};
    const urlOf = (row) => toCheckUrl(row.appliedDestination, checkBaseUrl);
    const urls = [...new Set(rows.filter((row) => row.live).map(urlOf).filter(Boolean))];

    const stale = urls.filter((url) => {
        const cached = previousChecks[url];
        const expired = !cached || now - cached.checkedAt > (CHECK_TTL_MS[cached.result] ?? 0);
        if (force || expired || recheck?.(url)) return true;
        checks[url] = cached;
        return false;
    });

    await inPool(stale, CHECK_CONCURRENCY, async (url) => {
        const check = await checkDestination(url, checkBaseUrl);
        const previous = previousChecks[url];

        // A timeout or server error keeps the last real verdict; its old checkedAt
        // makes it retry on the next sync
        checks[url] = check.result === "unverified" && previous && previous.result !== "unverified"
            ? previous
            : { ...check, checkedAt: now };
    });

    for (const row of rows) {
        if (!row.live) continue;
        const url = urlOf(row);
        const check = url ? checks[url] : null;
        const code = CHECK_ISSUES[check?.result];
        if (code) row.issues.push({ code, ...RULES[code], detail: check.detail });
        row.check = check
            ? { result: check.result, status: check.status ?? null, url, finalUrl: check.finalUrl ?? null, checkedAt: check.checkedAt }
            : null;
    }

    return { checks, checked: stale.length };
}

async function buildRedirects({ trigger, force, recheck }) {
    const startedAt = Date.now();
    const site = siteConfig();
    if (site.error) console.error(`[redirects] ${site.error} Destination checks are skipped.`);

    const records = await getRedirectLinks(); // throws when Strapi is unreachable

    const validated = validateRedirects(records, { siteHosts: site.siteHosts, exactMatch: true, conflict: "newest" });
    const previousReport = await readReport();
    const { checks, checked } = await checkDestinations(validated.rows, previousReport?.checks || {}, {
        force,
        recheck,
        checkBaseUrl: site.checkBaseUrl,
    });
    const { rows, summary } = finalizeRows(validated.rows);

    const redirects = {};
    for (const row of rows) {
        if (!row.live) continue;
        const key = redirectKey(row.source.trim());
        if (!redirects[key]) redirects[key] = { destination: row.appliedDestination, id: row.id };
    }

    // A sync that started later already wrote newer data
    const latest = await readReport();
    if (latest?.startedAt > startedAt) return { skipped: true };

    const meta = { startedAt, syncedAt: Date.now(), durationMs: Date.now() - startedAt, trigger, checked };
    await writeJsonAtomic(REDIRECTS_FILE, { ...meta, count: Object.keys(redirects).length, redirects });
    await writeJsonAtomic(REPORT_FILE, { ...meta, site, lastError: null, summary, rows, checks });

    console.log(
        `[redirects] synced (${trigger}): ${summary.live} live, ${summary.skipped} skipped of ${summary.total}, ` +
        `${summary.destinationProblems} with destination problems, ` +
        `${checked} destination(s) checked on ${site.checkBaseUrl || "(nothing: site URL not configured)"} in ${(meta.durationMs / 1000).toFixed(1)}s`
    );
    return { ...meta, summary };
}

async function recordError(error, trigger) {
    console.error(`[redirects] sync failed (${trigger}), keeping the last good redirects:`, error?.message || error);
    const report = await readReport();
    if (report) {
        await writeJsonAtomic(REPORT_FILE, { ...report, lastError: { message: String(error?.message || error), at: Date.now(), trigger } })
            .catch(() => { });
    }
}

let running = null;
let queued = null;

/**
 * Rebuilds the live redirects. Calls made while a sync is running are merged
 * into one follow-up run, so a burst of Strapi webhooks costs at most two syncs.
 * @param {{ trigger?: string, force?: boolean, recheck?: string | string[] }} options
 *   force:   re-check every destination, ignoring cached results
 *   recheck: re-check destinations whose path contains these slugs (a page was just added or removed)
 */
export function syncRedirects({ trigger = "manual", force = false, recheck = [] } = {}) {
    const slugs = [].concat(recheck).filter(Boolean);

    if (running) {
        queued = { trigger, force: force || Boolean(queued?.force), slugs: [...(queued?.slugs || []), ...slugs] };
        return running;
    }

    const recheckFn = slugs.length ? (url) => slugs.some((slug) => url.includes(`/${slug}`)) : null;

    running = buildRedirects({ trigger, force, recheck: recheckFn })
        .catch(async (error) => {
            await recordError(error, trigger);
            return { error: String(error?.message || error) };
        })
        .finally(() => {
            running = null;
            if (queued) {
                const next = queued;
                queued = null;
                syncRedirects({ trigger: next.trigger, force: next.force, recheck: next.slugs });
            }
        });

    return running;
}

// Waits until this server answers, so the first sync after start-up runs against a ready site
export async function waitForServer(timeoutMs = 120000) {
    const end = Date.now() + timeoutMs;
    while (Date.now() < end) {
        try {
            await fetch(`${checkOrigin()}/`, { cache: "no-store", signal: AbortSignal.timeout(5000) });
            return true;
        } catch {
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }
    }
    return false;
}
