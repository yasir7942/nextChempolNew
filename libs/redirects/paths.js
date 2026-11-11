import { createHash } from "node:crypto";
import path from "node:path";

// The files are the only link between the sync code and middleware.js
// (Proxy must not rely on module state shared with the rest of the app).
// Kept outside .next so they survive `next build`.
export const REDIRECTS_DIR = process.env.REDIRECTS_DIR || path.join(process.cwd(), ".redirects");

// Small map read by middleware.js: { "/old-path": { destination, id } (always 301) }
export const REDIRECTS_FILE = path.join(REDIRECTS_DIR, "redirects.json");

// Full report for /admin/redirectlinks/, plus the destination check cache
export const REPORT_FILE = path.join(REDIRECTS_DIR, "report.json");

// Sent by the destination checks so middleware.js lets them see the site without redirects
export const CHECK_HEADER = "x-redirect-check";

let checkValue;

// Value CHECK_HEADER must carry. Derived from the admin token, so outsiders can't
// switch redirects off and the token itself is never sent. null = bypass disabled.
export function checkHeaderValue() {
    if (checkValue === undefined) {
        const secret = process.env.REDIRECT_CHECK_TOKEN || process.env.ADMIN_TOKEN || "";
        checkValue = secret
            ? createHash("sha256").update(`redirect-check:${secret}`).digest("hex").slice(0, 32)
            : null;
    }
    return checkValue;
}
