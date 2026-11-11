// Protections shared by the public forms that send email (app/api/send, app/api/inquiry):
// same-site check, visitor IP, rate limit, single-line cleanup and Google reCAPTCHA.

const RATE_WINDOW_MS = 10 * 60 * 1000;

// Visitor IP -> timestamps of recent sends; on globalThis so it survives module reloads in one server process
const recentSends = (globalThis.__chempolFormSends ||= new Map());

export const reply = (status, code, message) => Response.json({ code, ...(message ? { message } : {}) }, { status });

export const bareHost = (host) => (host || "").toLowerCase().replace(/^www\./, "").replace(/:\d+$/, "");

export function hostOf(url) {
    try {
        return new URL(url).host;
    } catch {
        return "";
    }
}

// Browsers send Origin on every POST. Behind nginx the Host header may be the proxy
// address, so the site address from NEXT_PUBLIC_BASE_URL is accepted too.
export function isSameSite(request) {
    const origin = bareHost(hostOf(request.headers.get("origin")));
    if (!origin) return false;

    const allowed = [
        request.headers.get("host"),
        request.headers.get("x-forwarded-host"),
        hostOf(process.env.NEXT_PUBLIC_BASE_URL),
    ].map(bareHost).filter(Boolean);

    return allowed.includes(origin);
}

// Cloudflare and nginx put the visitor IP in these headers
export function visitorIp(request) {
    return (
        request.headers.get("cf-connecting-ip") ||
        request.headers.get("x-real-ip") ||
        (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() ||
        "unknown"
    );
}

// true when this IP already sent `limit` forms in the last 10 minutes; otherwise counts this one.
// All forms share one counter per IP.
export function isRateLimited(ip, limit = 5) {
    const now = Date.now();
    const sends = (recentSends.get(ip) || []).filter((time) => now - time < RATE_WINDOW_MS);
    recentSends.set(ip, sends);

    // drop IPs with no recent sends so the map does not grow forever
    if (recentSends.size > 5000) {
        for (const [key, times] of recentSends) if (!times.some((time) => now - time < RATE_WINDOW_MS)) recentSends.delete(key);
    }

    if (sends.length >= limit) return true;
    sends.push(now);
    return false;
}

// Text without line breaks or control characters (it goes into email subjects)
export const singleLine = (value) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

export async function verifyCaptcha(token, ip) {
    const body = new URLSearchParams({ secret: process.env.RECAPTCHA_SECRET_KEY || "", response: token });
    if (ip !== "unknown") body.set("remoteip", ip);

    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: "POST",
        body,
        signal: AbortSignal.timeout(10000),
    });
    const result = await res.json();

    const expectedHost = bareHost(process.env.NEXT_PUBLIC_SITE || hostOf(process.env.NEXT_PUBLIC_BASE_URL));
    if (!result.success || bareHost(result.hostname) !== expectedHost) {
        console.warn("Form: reCAPTCHA rejected", { errors: result["error-codes"], hostname: result.hostname, expectedHost });
        return false;
    }
    return true;
}
