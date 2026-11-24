import "server-only";

/*
  Clears the Cloudflare cache of the site's zone. Needs CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN
  (an API token with Zone > Cache Purge permission) in .env; without them Cloudflare is not called.
  Never throws. Returns { purged: "everything" }, { skipped: true } or { error: "<reason>" }.
*/
const TIMEOUT_MS = 10_000;

export async function purgeCloudflare({ everything = true, trigger = "unknown" } = {}) {
    const result = await purge(everything);
    const outcome = result.purged ? "purged everything" : result.skipped ? "skipped (not set up)" : `failed: ${result.error}`;
    console.log(`[cloudflare] ${trigger}: ${outcome}`);
    return result;
}

async function purge(everything) {
    const zone = String(process.env.CLOUDFLARE_ZONE_ID || "").trim();
    const token = String(process.env.CLOUDFLARE_API_TOKEN || "").trim();
    if (!zone || !token) return { skipped: true };

    // only a full purge is used on this site
    if (!everything) return { error: "only purging everything is supported" };

    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${encodeURIComponent(zone)}/purge_cache`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ purge_everything: true }),
            cache: "no-store",
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        const json = await response.json().catch(() => null);
        if (json?.success === true) return { purged: "everything" };

        const messages = (json?.errors || []).map((e) => e?.message).filter(Boolean);
        return { error: messages.join("; ") || `HTTP ${response.status}` };
    } catch (error) {
        if (error?.name === "TimeoutError") return { error: `Cloudflare did not answer within ${TIMEOUT_MS / 1000} seconds` };
        return { error: error?.message || "could not reach Cloudflare" };
    }
}
