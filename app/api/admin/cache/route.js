// POST /api/admin/cache/ { action: "revalidate" | "cloudflare" }: the admin header buttons
// "Revalidate from Strapi" and "Clear Cloudflare cache" (app/admin/shared/components/cache-actions.js).
import { adminJson, checkAdminSession, isForeignOrigin } from "@/libs/admin-auth";
import { revalidateWholeSite } from "@/libs/revalidate-site";
import { purgeCloudflare } from "@/libs/cloudflare-purge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ACTIONS = ["revalidate", "cloudflare"];
const COOLDOWN_MS = 20_000;

// Last run time per action, shared by all admins (globalThis keeps it across dev reloads)
const lastRun = (globalThis.__adminCacheLastRun ??= new Map());

const fail = (status, error, action) => adminJson({ ok: false, ...(action && { action }), error }, status);

export async function POST(request) {
    if (isForeignOrigin(request)) return fail(403, "Forbidden.");

    const session = await checkAdminSession();
    if (session.unreachable) return fail(503, "Could not check your admin login right now. Please try again.");
    if (!session.user) return fail(401, "Please log in to the admin area.");

    let body;
    try {
        body = await request.json();
    } catch {
        return fail(400, "Invalid request.");
    }
    const action = body?.action;
    if (!ACTIONS.includes(action)) return fail(400, "Unknown action.");

    const waitMs = (lastRun.get(action) || 0) + COOLDOWN_MS - Date.now();
    if (waitMs > 0) {
        const seconds = Math.ceil(waitMs / 1000);
        return adminJson(
            { ok: false, action, error: `This was just done. Please wait ${seconds} second${seconds === 1 ? "" : "s"} and try again.` },
            429,
            { "Retry-After": String(seconds) }
        );
    }
    lastRun.set(action, Date.now());

    const { user } = session;
    const who = user.username || user.email || `user ${user.id}`;
    console.log(`[admin-cache] ${action} requested by ${who}`);

    try {
        if (action === "revalidate") {
            const revalidated = revalidateWholeSite();
            console.log(`[admin-cache] revalidated: ${revalidated.join(", ")}`);

            const cloudflare = await purgeCloudflare({ everything: true, trigger: `admin-revalidate:${who}` });
            let message = "All pages were marked as outdated. Each page is rebuilt with the latest Strapi content on its next visit (the first visit can be a little slower).";
            if (cloudflare.purged) message += " The Cloudflare cache was cleared too.";
            else if (cloudflare.error) message += ` Note: the Cloudflare cache could not be cleared (${cloudflare.error}); use "Clear Cloudflare cache" in a minute.`;

            return adminJson({ ok: true, action, message, at: new Date().toISOString() });
        }

        const cloudflare = await purgeCloudflare({ everything: true, trigger: `admin-cloudflare:${who}` });
        if (cloudflare.purged) {
            return adminJson({
                ok: true,
                action,
                message: "The whole Cloudflare cache was cleared. Visitors now get fresh pages from the server.",
                at: new Date().toISOString(),
            });
        }
        if (cloudflare.skipped) {
            return fail(503, "Cloudflare is not set up on this server: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN are missing in the .env file.", action);
        }
        return fail(502, `Cloudflare could not clear the cache: ${cloudflare.error}.`, action);
    } catch (error) {
        console.error(`[admin-cache] ${action} failed:`, error);
        return fail(500, `Something went wrong: ${error?.message || "unknown error"}. Check the server log.`, action);
    }
}
