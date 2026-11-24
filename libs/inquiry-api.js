// HTTP client of the Atlantic Inquiry Manager: POST /api/v1/submissions.
// Server only. Never called during a visitor's request: libs/inquiry-forward.js calls it after the
// response (Next's after()) and from the retry timer.
//
// Configuration (server .env, never NEXT_PUBLIC_):
//   INQUIRY_API_URL  https://connect.atlanticgroup.ae/api/v1/submissions
//   INQUIRY_API_KEY  this website's key
// Logs never contain the key or the inquiry content (only status, error code, field names, submission_id).

import "server-only";

const TIMEOUT_MS = 10_000;

export function inquiryApiConfig(env = process.env) {
    const url = String(env.INQUIRY_API_URL ?? "").trim();
    const key = String(env.INQUIRY_API_KEY ?? "").trim();

    if (!url) return { ok: false, problem: "INQUIRY_API_URL is not set" };
    if (!key) return { ok: false, problem: "INQUIRY_API_KEY is not set" };
    try {
        if (new URL(url).protocol !== "https:") return { ok: false, problem: "INQUIRY_API_URL must start with https://" };
    } catch {
        return { ok: false, problem: "INQUIRY_API_URL is not a valid URL" };
    }
    return { ok: true, url, key };
}

// only safe characters from the API's answer go into logs and the outbox
const safeCode = (value) => String(value ?? "").replace(/[^A-Za-z0-9_.:-]/g, "").slice(0, 60);

// Retry-After: seconds or an HTTP date -> milliseconds (1 s to 1 h), or null
export function parseRetryAfter(header, now = Date.now()) {
    if (!header) return null;
    const seconds = Number(header);
    const ms = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(header) - now;
    return Number.isFinite(ms) ? Math.min(Math.max(ms, 1000), 3600_000) : null;
}

/*
  Sends one stored body, unchanged. Never throws.
  Result: {
    outcome: "delivered" | "retry" | "failed",
    httpStatus, errorCode, errorFields: [field names], inquiryId, replayed, retryAfterMs
  }
  delivered: 201 created, or 200 (already stored: same submission_id and body)
  retry:     429 (Retry-After), 408, 5xx, timeout, network error
  failed:    every other answer (401 key, 403, 409 conflict, 413, 415, 422 mapping...): do not resend unchanged
*/
export async function postInquiry({ submissionId, body }, { config = inquiryApiConfig(), fetchImpl = globalThis.fetch } = {}) {
    if (!config.ok) return { outcome: "failed", httpStatus: null, errorCode: "not_configured", errorFields: [] };

    let response;
    try {
        response = await fetchImpl(config.url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${config.key}`,
                "Content-Type": "application/json",
                Accept: "application/json",
                "Idempotency-Key": submissionId,
            },
            body,
            cache: "no-store",
            redirect: "manual",
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
    } catch (error) {
        const timeout = error?.name === "TimeoutError" || error?.name === "AbortError";
        return { outcome: "retry", httpStatus: null, errorCode: timeout ? "timeout" : "network_error", errorFields: [] };
    }

    const status = response.status;
    let json = null;
    try {
        json = await response.json();
    } catch {
        // empty or non-JSON answer
    }

    if (status === 200 || status === 201) {
        return {
            outcome: "delivered",
            httpStatus: status,
            errorCode: null,
            errorFields: [],
            inquiryId: safeCode(json?.inquiry_id ?? json?.data?.inquiry_id) || null,
            replayed: response.headers.get("idempotent-replayed") === "true",
        };
    }

    const errorCode = safeCode(json?.error?.code) || `http_${status}`;
    const fields = json?.error?.fields;
    const errorFields = fields && typeof fields === "object" ? Object.keys(fields).map(safeCode).filter(Boolean).slice(0, 20) : [];

    if (status === 429) {
        return { outcome: "retry", httpStatus: status, errorCode, errorFields, retryAfterMs: parseRetryAfter(response.headers.get("retry-after")) };
    }
    if (status === 408 || status >= 500) return { outcome: "retry", httpStatus: status, errorCode, errorFields };

    return { outcome: "failed", httpStatus: status, errorCode, errorFields };
}
