// The public website address that redirects are validated against.
//
// Taken from NEXT_PUBLIC_BASE_URL in the .env of each environment (local, staging,
// production), the same value the site uses for canonical URLs and the sitemap.
// Optional:
//   REDIRECT_CHECK_BASE_URL  check destinations somewhere else, e.g. http://localhost:3000
//                            to test a local copy against its own Strapi data
//   REDIRECT_SITE_ALIASES    other domains that are this site, comma separated
//                            (e.g. www.chempol.co.uk), so absolute links to them count as internal

export const bareHost = (host) => (host || "").toLowerCase().replace(/^www\./, "");

function parseHttpUrl(value) {
    const text = (value || "").trim();
    if (!text) return null;
    try {
        const url = new URL(text.includes("://") ? text : `https://${text}`);
        return /^https?:$/.test(url.protocol) ? url : null;
    } catch {
        return null;
    }
}

/**
 * @returns {{ siteUrl: string|null, checkBaseUrl: string|null, siteHosts: string[], error: string|null }}
 *   error: the configuration can't be trusted; destination checks are skipped instead of guessing
 */
export function siteConfig() {
    const site = parseHttpUrl(process.env.NEXT_PUBLIC_BASE_URL);
    const strapi = parseHttpUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
    const checkOverride = parseHttpUrl(process.env.REDIRECT_CHECK_BASE_URL);

    let error = null;
    if (!site) {
        error = "NEXT_PUBLIC_BASE_URL is missing or is not a valid http(s) URL.";
    } else if (strapi && bareHost(site.hostname) === bareHost(strapi.hostname)) {
        error = `NEXT_PUBLIC_BASE_URL (${site.origin}) points at Strapi, not at the website.`;
    }

    const siteUrl = error ? null : site.origin;
    const aliases = (process.env.REDIRECT_SITE_ALIASES || "")
        .split(",")
        .map((alias) => parseHttpUrl(alias)?.hostname)
        .filter(Boolean);

    return {
        siteUrl,
        checkBaseUrl: checkOverride ? checkOverride.origin : siteUrl,
        siteHosts: [...new Set([siteUrl && site.hostname, ...aliases].filter(Boolean).map(bareHost))],
        error,
    };
}
