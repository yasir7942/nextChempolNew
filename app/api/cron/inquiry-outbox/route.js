// Outbox of the Atlantic Inquiry Manager: status and manual retry. Protected by CRON_SECRET.
// The retry timer (libs/inquiry-outbox-scheduler.js) already resends due copies every minute;
// this route is for checking the outbox and for an extra or external trigger (server cron).
//
//   GET  /api/cron/inquiry-outbox                  counts, pending and failed items (no inquiry content)
//   POST /api/cron/inquiry-outbox                  resend what is due now
//   POST /api/cron/inquiry-outbox?requeue=failed   put failed items back in the queue first, then resend
//
// Header: Authorization: Bearer <CRON_SECRET>

import { createHash, timingSafeEqual } from "node:crypto";
import { outboxSummary, requeueFailedOutbox } from "@/libs/inquiry-db";
import { processDueOutbox } from "@/libs/inquiry-forward";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" };
const json = (body, status = 200) => Response.json(body, { status, headers: HEADERS });

const digest = (value) => createHash("sha256").update(String(value)).digest();

// null when allowed, otherwise the error response
function checkSecret(request) {
    const secret = String(process.env.CRON_SECRET ?? "").trim();
    if (secret.length < 16) return json({ ok: false, error: "cron_disabled", message: "Set CRON_SECRET (at least 16 characters) in the server .env." }, 503);

    const sent = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
    if (!sent || !timingSafeEqual(digest(sent), digest(secret))) return json({ ok: false, error: "unauthorized" }, 401);
    return null;
}

export async function GET(request) {
    const denied = checkSecret(request);
    if (denied) return denied;

    try {
        return json({ ok: true, ...outboxSummary() });
    } catch (error) {
        console.error("Inquiry outbox route:", error?.code || error?.name || "error");
        return json({ ok: false, error: "server_error" }, 500);
    }
}

export async function POST(request) {
    const denied = checkSecret(request);
    if (denied) return denied;

    try {
        const requeued = new URL(request.url).searchParams.get("requeue") === "failed" ? requeueFailedOutbox() : 0;
        const run = await processDueOutbox();
        return json({ ok: true, requeued, run, ...outboxSummary() });
    } catch (error) {
        console.error("Inquiry outbox route:", error?.code || error?.name || "error");
        return json({ ok: false, error: "server_error" }, 500);
    }
}
