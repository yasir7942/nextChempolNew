// Read side of the redirect map, used by middleware.js on every page request.
// Lookups are a Map.get(); the file is re-read only when it changed,
// and that is checked at most every RECHECK_MS.
import fs from "node:fs";
import { redirectKey } from "@/libs/redirect-validator";
import { REDIRECTS_FILE } from "./paths";

const RECHECK_MS = 5000;

let state = { redirects: new Map(), mtimeMs: 0, checkedAt: 0 };

function currentRedirects() {
    const now = Date.now();
    if (now - state.checkedAt < RECHECK_MS) return state.redirects;
    state.checkedAt = now;

    try {
        const { mtimeMs } = fs.statSync(REDIRECTS_FILE);
        if (mtimeMs !== state.mtimeMs) {
            const data = JSON.parse(fs.readFileSync(REDIRECTS_FILE, "utf8"));
            state = { redirects: new Map(Object.entries(data.redirects || {})), mtimeMs, checkedAt: now };
        }
    } catch (error) {
        // Not synced yet, or unreadable: keep serving the last good map
        if (error.code !== "ENOENT") console.error("REDIRECTS_LOAD_FAILED:", error.message);
    }

    return state.redirects;
}

export function findRedirect(pathname) {
    const redirects = currentRedirects();
    if (!redirects.size) return null;
    return redirects.get(redirectKey(pathname)) || null;
}
