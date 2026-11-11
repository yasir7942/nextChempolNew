/*
  Validates redirect records coming from Strapi (redirection-urls).

  The live site (middleware.js) uses exactMatch mode: a source only matches its own path.
  Without exactMatch the rules follow Apache mod_alias "Redirect" (prefix match).

    - source must be a URL-path starting with "/" (no domain, no spaces)
    - query strings / #hash in the source are never matched
    - a row is only "live" when it has no errors and is not superseded by a
      newer row with the same source
    - destination check results (libs/redirects/sync.js) are reportOnly: they are
      shown, but never switch a redirect off
*/

export const SEVERITY = {
  error: "error",
  warning: "warning",
  notice: "notice",
};

export const RULES = {
  MISSING_SOURCE: {
    severity: SEVERITY.error,
    label: "Missing source",
    hint: "The source URL is empty. Add a path like /old-page.",
  },
  MISSING_DESTINATION: {
    severity: SEVERITY.error,
    label: "Missing destination",
    hint: "The destination URL is empty. Add a path like /new-page or a full https:// URL.",
  },
  SOURCE_WHITESPACE: {
    severity: SEVERITY.error,
    label: "Spaces in source",
    hint: "Spaces (often copy-pasted at the start or end) break the Redirect line. Remove them.",
  },
  DEST_WHITESPACE: {
    severity: SEVERITY.error,
    label: "Spaces in destination",
    hint: "Spaces (often copy-pasted at the start or end) break the Redirect line. Remove them.",
  },
  SOURCE_ABSOLUTE: {
    severity: SEVERITY.error,
    label: "Source is a full URL",
    hint: "The source must be a path only, e.g. /about-us, not https://site.com/about-us.",
  },
  SOURCE_NO_SLASH: {
    severity: SEVERITY.error,
    label: "Source missing leading /",
    hint: "The source must start with /, e.g. /about-us.",
  },
  SOURCE_QUERY: {
    severity: SEVERITY.error,
    label: "Query string in source",
    hint: "Redirect only matches the path, never the ?query, so this rule never fires (it does not affect the page without the query). Use the RewriteRule shown instead, or remove the entry.",
  },
  SOURCE_HASH: {
    severity: SEVERITY.error,
    label: "#hash in source",
    hint: "Browsers never send the #hash to the server, so this rule will never match.",
  },
  ROOT_SOURCE: {
    severity: SEVERITY.error,
    label: "Redirects the homepage",
    hint: "A source of / would redirect the homepage (and with Apache prefix matching, every page).",
  },
  RESERVED_SOURCE: {
    severity: SEVERITY.error,
    label: "Reserved source path",
    hint: "Paths under /api and /_next belong to the website itself and can't be redirected.",
  },
  DEST_INVALID: {
    severity: SEVERITY.error,
    label: "Invalid destination",
    hint: "The destination must start with / or be a full http(s):// URL.",
  },
  DEST_LOCAL: {
    severity: SEVERITY.error,
    label: "Destination is a local address",
    hint: "The destination points at localhost or a private address, which visitors can't open. Use a path like /new-page instead.",
  },
  SELF_REDIRECT: {
    severity: SEVERITY.error,
    label: "Redirects to itself",
    hint: "Source and destination are the same page, which creates an infinite loop.",
  },
  DEST_INSIDE_SOURCE: {
    severity: SEVERITY.error,
    label: "Destination inside source",
    hint: "Redirect is a prefix match, so the destination matches the source again and loops forever.",
  },
  LOOP: {
    severity: SEVERITY.error,
    label: "Redirect loop",
    hint: "Following the redirects leads back to a page already visited, so the browser never lands.",
  },
  SUPERSEDED: {
    severity: SEVERITY.warning,
    label: "Replaced by another entry",
    hint: "Another entry has the same source with a different destination and wins, so this one is not used. Delete it in Strapi.",
    skip: true,
  },
  DUPLICATE: {
    severity: SEVERITY.warning,
    label: "Duplicate entry",
    hint: "The same redirect exists more than once. Only one copy is used; delete the extra copies.",
    skip: true,
  },
  OVERRIDES: {
    severity: SEVERITY.notice,
    label: "Wins over other entries",
    hint: "Other entries use the same source. This one is used; delete the others in Strapi.",
  },
  DEST_NOT_FOUND: {
    severity: SEVERITY.error,
    label: "Destination not found",
    hint: "The destination page returns 404/410, so visitors land on an error page. The redirect stays live; fix the destination in Strapi.",
    reportOnly: true,
  },
  DEST_LOOP: {
    severity: SEVERITY.error,
    label: "Destination loops",
    hint: "Opening the destination redirects back to a URL already visited, so the browser never lands. The redirect stays live; fix the destination in Strapi.",
    reportOnly: true,
  },
  DEST_BROKEN: {
    severity: SEVERITY.error,
    label: "Destination does not load",
    hint: "The destination redirects too many times or returns an error status. The redirect stays live; fix the destination in Strapi.",
    reportOnly: true,
  },
  DEST_REDIRECTS: {
    severity: SEVERITY.warning,
    label: "Destination redirects again",
    hint: "The destination works, but only after more redirects. Point the source straight to the final URL.",
    reportOnly: true,
  },
  DEST_UNVERIFIED: {
    severity: SEVERITY.warning,
    label: "Destination not verified",
    hint: "The destination could not be checked (timeout, server error, or blocked). The redirect stays live; it is checked again on the next sync.",
    reportOnly: true,
  },
  CHAIN: {
    severity: SEVERITY.warning,
    label: "Redirect chain",
    hint: "The destination is itself redirected. Point the source straight to the final page.",
  },
  TRAILING_SLASH: {
    severity: SEVERITY.notice,
    label: "No trailing slash",
    hint: "The site uses trailing slashes. The live redirect adds the / automatically; add it in Strapi to keep the data clean.",
  },
};

const MAX_HOPS = 25;

function stripQueryAndHash(path) {
  return path.split(/[?#]/)[0];
}

// "/About-Us/" -> "/About-Us"   ("/" stays "/")
export function normalizePath(path) {
  let clean = stripQueryAndHash(path || "").replace(/\/{2,}/g, "/");
  if (clean.length > 1 && clean.endsWith("/")) clean = clean.replace(/\/+$/, "");
  return clean || "/";
}

// Key used to store and look up live redirects: decoded + normalized, so
// "/caf%C3%A9/" from the browser matches "/café" saved in Strapi
export function redirectKey(path) {
  let decoded = path || "";
  try {
    decoded = decodeURI(decoded);
  } catch {
    /* keep malformed encodings as they are */
  }
  return normalizePath(decoded);
}

function bareHost(host) {
  return (host || "").toLowerCase().replace(/^www\./, "");
}

const LOCAL_HOST = /^(localhost|.+\.localhost|127(\.\d{1,3}){3}|0\.0\.0\.0|10(\.\d{1,3}){3}|192\.168(\.\d{1,3}){2}|\[::1?\])$/i;

// Returns { ok, internal, path, href } for a destination string ({ ok: false, local: true } for localhost)
function parseDestination(dest, siteHosts) {
  if (dest.startsWith("/") && !dest.startsWith("//")) {
    return { ok: true, internal: true, path: dest, href: dest };
  }

  if (/^https?:\/\//i.test(dest)) {
    try {
      const url = new URL(dest);
      if (LOCAL_HOST.test(url.hostname)) return { ok: false, local: true };
      if (!url.hostname.includes(".")) return { ok: false };
      const internal = siteHosts.has(bareHost(url.hostname));
      return {
        ok: true,
        internal,
        path: internal ? url.pathname + url.search + url.hash : null,
        href: url.href,
      };
    } catch {
      return { ok: false };
    }
  }

  return { ok: false };
}

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// "/?p=3850" -> /  ==>  RewriteCond %{QUERY_STRING} ^p=3850$ + RewriteRule ^$ / [R=301,L,QSD]
function queryRewriteHint(source, destination) {
  const [path, query = ""] = source.split("#")[0].split("?");
  const pattern = `^${escapeRegex(path.replace(/^\//, ""))}$`;
  return `Use: RewriteCond %{QUERY_STRING} ^${escapeRegex(query)}$ + RewriteRule ${pattern} ${destination || "/"} [R=301,L,QSD]`;
}

function hasExtension(path) {
  const lastSegment = path.split("/").pop() || "";
  return lastSegment.includes(".");
}

// Internal destinations become paths (stay on the current host) with the
// site's trailing slash, so visitors land in one hop
function toAppliedDestination(destination, siteHosts) {
  const dest = parseDestination(destination, siteHosts);
  if (!dest.ok) return destination;
  if (!dest.internal) return dest.href;

  const [, pathname, rest = ""] = dest.path.match(/^([^?#]*)(.*)$/);
  const needsSlash = pathname !== "/" && !pathname.endsWith("/") && !hasExtension(pathname);
  return `${needsSlash ? `${pathname}/` : pathname}${rest}`;
}

const isNewer = (a, b) => {
  const timeA = Date.parse(a.updatedAt || "") || 0;
  const timeB = Date.parse(b.updatedAt || "") || 0;
  if (timeA !== timeB) return timeA > timeB;
  return Number(a.id ?? 0) > Number(b.id ?? 0);
};

/**
 * @param {Array<{id?: number|string, source?: string, destination?: string, updatedAt?: string}>} records
 * @param {{ siteHosts?: string[], exactMatch?: boolean, conflict?: "first" | "newest" }} options
 *   exactMatch: sources match only their own path (middleware.js) instead of Apache prefix matching
 *   conflict:   which entry wins when several share a source: the first one (Apache) or the newest
 */
export function validateRedirects(records = [], options = {}) {
  const siteHosts = new Set((options.siteHosts || []).filter(Boolean).map(bareHost));
  const exactMatch = Boolean(options.exactMatch);
  const conflict = options.conflict === "newest" ? "newest" : "first";

  // Pass 1: per-record checks
  const rows = records.map((record, index) => {
    const rawSource = record?.source == null ? "" : String(record.source);
    const rawDestination = record?.destination == null ? "" : String(record.destination);
    const source = rawSource.trim();
    const destination = rawDestination.trim();
    const issues = [];
    const add = (code, detail) => issues.push({ code, ...RULES[code], detail });

    let sourceOk = false;
    if (!source) {
      add("MISSING_SOURCE");
    } else {
      if (/\s/.test(rawSource)) add("SOURCE_WHITESPACE");

      if (/^[a-z]+:\/\//i.test(source)) add("SOURCE_ABSOLUTE");
      else if (!source.startsWith("/")) add("SOURCE_NO_SLASH");
      else sourceOk = true;

      if (source.includes("?")) add("SOURCE_QUERY", sourceOk ? queryRewriteHint(source, destination) : undefined);
      if (source.includes("#")) add("SOURCE_HASH");
    }

    // A source with ?query or #hash never matches anything, so it can't redirect the
    // homepage, loop, or chain. Keep it out of those checks (e.g. "/?p=3850" is not "/").
    const matchable = sourceOk && !source.includes("?") && !source.includes("#");
    if (matchable && normalizePath(source) === "/") add("ROOT_SOURCE");
    if (matchable && /^\/(api|_next)(\/|$)/i.test(source)) add("RESERVED_SOURCE");

    let dest = { ok: false };
    if (!destination) {
      add("MISSING_DESTINATION");
    } else {
      if (/\s/.test(rawDestination)) add("DEST_WHITESPACE");
      dest = parseDestination(destination, siteHosts);
      if (!dest.ok) add(dest.local ? "DEST_LOCAL" : "DEST_INVALID");
    }

    const sourceKey = matchable ? normalizePath(source) : null;
    const duplicateKey = sourceKey ?? (source || null);
    const destKey = dest.ok && dest.internal ? normalizePath(dest.path) : null;

    if (sourceKey && destKey) {
      if (sourceKey === destKey) {
        add("SELF_REDIRECT");
      } else if (!exactMatch && sourceKey !== "/" && destKey.startsWith(sourceKey + "/")) {
        add("DEST_INSIDE_SOURCE", `${destination} starts with ${sourceKey}/`);
      }
    }

    if (dest.ok && dest.internal) {
      const destPath = stripQueryAndHash(dest.path);
      if (destPath !== "/" && !destPath.endsWith("/") && !hasExtension(destPath)) {
        add("TRAILING_SLASH", `Use ${destPath}/`);
      }
    }

    return {
      key: record?.id ?? `row-${index}`,
      id: record?.id ?? null,
      index: index + 1,
      source: rawSource,
      destination: rawDestination,
      updatedAt: record?.updatedAt || record?.createdAt || null,
      sourceKey,
      duplicateKey,
      destKey,
      destinationType: !dest.ok ? "invalid" : dest.internal ? "internal" : "external",
      issues,
    };
  });

  const hasError = (row) => row.issues.some((issue) => issue.severity === SEVERITY.error);
  const isSkipped = (row) => hasError(row) || row.issues.some((issue) => issue.skip);
  const label = (row) => (row.id != null ? `ID ${row.id}` : `row ${row.index}`);

  // Pass 2: several entries for the same source. One wins (the first like Apache,
  // or the newest); the others are not used. Entries with errors never win.
  const bySource = new Map();
  for (const row of rows) {
    if (!row.duplicateKey) continue;
    if (!bySource.has(row.duplicateKey)) bySource.set(row.duplicateKey, []);
    bySource.get(row.duplicateKey).push(row);
  }

  for (const group of bySource.values()) {
    const candidates = group.filter((row) => !hasError(row));
    if (candidates.length < 2) continue;

    const winner = conflict === "newest"
      ? candidates.reduce((best, row) => (isNewer(row, best) ? row : best))
      : candidates[0];
    const why = conflict === "newest" ? "is newer and is used" : "comes first and is used";

    for (const row of candidates) {
      if (row === winner) continue;
      const code = row.destination.trim() === winner.destination.trim() ? "DUPLICATE" : "SUPERSEDED";
      const detail = code === "DUPLICATE" ? `Same as ${label(winner)}, which is used` : `${label(winner)} ${why}`;
      row.issues.push({ code, ...RULES[code], detail });
    }

    const others = candidates.filter((row) => row !== winner).map(label);
    winner.issues.push({ code: "OVERRIDES", ...RULES.OVERRIDES, detail: `Also in ${others.join(", ")}` });
  }

  // Pass 3: chains and loops, only between entries that are still usable, so a
  // broken entry can't make good ones look like loops
  const usableBySource = new Map();
  for (const row of rows) {
    if (row.sourceKey && !isSkipped(row)) usableBySource.set(row.sourceKey, row);
  }

  for (const row of rows) {
    if (!row.sourceKey || !row.destKey || isSkipped(row)) continue;

    const seen = new Set([row.sourceKey]);
    const path = [row.destination.trim()];
    let current = row.destKey;
    let loop = false;

    while (usableBySource.has(current) && path.length <= MAX_HOPS) {
      if (seen.has(current)) {
        loop = true;
        break;
      }
      seen.add(current);
      const next = usableBySource.get(current);
      path.push(next.destination.trim());
      if (!next.destKey) break;
      current = next.destKey;
    }

    if (loop || path.length > MAX_HOPS) {
      row.issues.push({ code: "LOOP", ...RULES.LOOP, detail: [row.source.trim(), ...path].join(" → ") });
    } else if (path.length > 1) {
      row.finalDestination = path[path.length - 1];
      row.issues.push({
        code: "CHAIN",
        ...RULES.CHAIN,
        detail: `${path.length} hops: ${[row.source.trim(), ...path].join(" → ")}. Applied straight to the final page.`,
        finalDestination: row.finalDestination,
      });
    }
  }

  // What the live site redirects to: the end of any chain, internal links as paths with "/"
  for (const row of rows) {
    row.appliedDestination = isSkipped(row)
      ? null
      : toAppliedDestination(row.finalDestination || row.destination.trim(), siteHosts);
  }

  return finalizeRows(rows);
}

// Recomputes status/live after issues are added (also used after destination checks).
// reportOnly issues color the row but never take a redirect off the site.
export function finalizeRows(rows) {
  for (const row of rows) {
    const error = row.issues.some((issue) => issue.severity === SEVERITY.error);
    const blocking = row.issues.some((issue) => (issue.severity === SEVERITY.error && !issue.reportOnly) || issue.skip);
    row.status = error
      ? SEVERITY.error
      : row.issues.some((issue) => issue.severity === SEVERITY.warning)
        ? SEVERITY.warning
        : "valid";
    row.live = !blocking;
    if (!row.live) row.appliedDestination = null;
  }

  return { rows, summary: summarize(rows) };
}

export function summarize(rows) {
  const issueCounts = {};
  for (const row of rows) {
    for (const issue of row.issues) {
      issueCounts[issue.code] = (issueCounts[issue.code] || 0) + 1;
    }
  }

  const severityOrder = { error: 0, warning: 1, notice: 2 };
  const issueBreakdown = Object.entries(issueCounts)
    .map(([code, count]) => ({ code, count, ...RULES[code] }))
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || b.count - a.count);

  const lastUpdated = rows
    .map((row) => row.updatedAt)
    .filter(Boolean)
    .sort()
    .pop() || null;

  return {
    total: rows.length,
    live: rows.filter((row) => row.live).length,
    skipped: rows.filter((row) => !row.live).length,
    // live, but the destination check failed (404, loop, broken)
    destinationProblems: rows.filter((row) => row.live && row.status === SEVERITY.error).length,
    valid: rows.filter((row) => row.status === "valid").length,
    errors: rows.filter((row) => row.status === SEVERITY.error).length,
    warnings: rows.filter((row) => row.status === SEVERITY.warning).length,
    notices: rows.filter((row) => row.issues.some((issue) => issue.severity === SEVERITY.notice)).length,
    internal: rows.filter((row) => row.destinationType === "internal").length,
    external: rows.filter((row) => row.destinationType === "external").length,
    issueBreakdown,
    lastUpdated,
  };
}

// One entry of the live map (.redirects/redirects.json) as Apache config. RedirectMatch
// with an anchored pattern behaves like middleware.js: exact path, trailing slash optional.
export function toApacheLine({ source, destination }) {
  const key = redirectKey(source);
  const pattern = key === "/" ? "^/$" : `^${escapeRegex(key)}/?$`;
  return `RedirectMatch 301 ${pattern} ${destination.replace(/[\\$]/g, "\\$&")}`;
}

export function toCsv(rows) {
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const header = ["#", "ID", "Source", "Destination", "Destination type", "Live", "Applied destination", "Destination check", "Checked URL", "Status", "Issues"];
  const lines = rows.map((row) =>
    [
      row.index,
      row.id,
      row.source,
      row.destination,
      row.destinationType,
      row.live ? "yes" : "no",
      row.appliedDestination,
      row.check ? `${row.check.result}${row.check.status ? ` (HTTP ${row.check.status})` : ""}` : "",
      row.check?.url,
      row.status,
      row.issues.map((issue) => `${issue.label}${issue.detail ? ` (${issue.detail})` : ""}`).join("; "),
    ]
      .map(escape)
      .join(",")
  );
  return [header.map(escape).join(","), ...lines].join("\r\n");
}
