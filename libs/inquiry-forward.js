// Sends a copy of every website inquiry to the Atlantic Inquiry Manager, in the background.
//
// During the visitor's request (app/api/send, app/api/inquiry) only queueInquiryForward() runs:
// it builds the body and stores it in the outbox (one local insert) and returns a delivery function.
// The route hands that function to Next's after(), so it runs AFTER the response has been sent:
// the visitor never waits for the Inquiry Manager and never sees whether it worked.
//
// Delivery: up to 3 quick attempts inside after() (2 s and 5 s apart, or Retry-After when it is short),
// then the retry timer (libs/inquiry-outbox-scheduler.js, every minute) resends what is still pending
// with growing waits (1, 2, 4 ... 60 minutes) for up to 24 hours. Every retry sends the stored body
// byte for byte with the same submission_id, so the Inquiry Manager stores it once.
//
// Logs: status, error code, field names and submission_id only; never the key or the inquiry content.

import "server-only";
import { buildInquiryPayload } from "./inquiry-payload.js";
import { inquiryApiConfig, postInquiry } from "./inquiry-api.js";
import { claimOutboxItem, dueOutboxIds, enqueueOutbox, recordOutboxResult } from "./inquiry-db.js";

const QUICK_WAITS_MS = [2000, 5000];
const MAX_QUICK_WAIT_MS = 10_000;
const LEASE_MS = 60_000;
const BATCH_SIZE = 30; // the API allows 60 requests a minute for this website

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// wait before the scheduled retry after `attempts` failed attempts: 1, 2, 4 ... minutes, at most 1 hour
export const backoffMs = (attempts) => Math.min(60_000 * 2 ** Math.max(0, attempts - 1), 3600_000);

let warnedNotConfigured = false;

function logResult(submissionId, result, attempts) {
    const fields = result.errorFields?.length ? ` fields=${result.errorFields.join(",")}` : "";
    const line = `Inquiry Manager: ${submissionId} attempt ${attempts} -> ${result.httpStatus ?? "no response"} ${result.outcome}${result.errorCode ? ` ${result.errorCode}` : ""}${fields}`;
    if (result.outcome === "delivered") console.log(line);
    else console.warn(line);
}

// Records the result of one attempt; returns the new status: "delivered" | "pending" | "failed"
function settle(item, result) {
    const attempts = item.attempts + 1;
    logResult(item.submission_id, result, attempts);

    if (result.outcome === "delivered") {
        recordOutboxResult(item.id, { status: "delivered", httpStatus: result.httpStatus, inquiryId: result.inquiryId });
        return "delivered";
    }
    if (result.outcome === "failed") {
        recordOutboxResult(item.id, { status: "failed", httpStatus: result.httpStatus, errorCode: result.errorCode, errorFields: result.errorFields });
        return "failed";
    }

    const next = Date.now() + Math.max(result.retryAfterMs || 0, backoffMs(attempts));
    if (next > Date.parse(item.retry_until)) {
        console.warn(`Inquiry Manager: ${item.submission_id} gave up after 24 hours (${result.errorCode})`);
        recordOutboxResult(item.id, { status: "failed", httpStatus: result.httpStatus, errorCode: `expired:${result.errorCode}` });
        return "failed";
    }
    recordOutboxResult(item.id, { status: "pending", httpStatus: result.httpStatus, errorCode: result.errorCode, nextAttemptAt: new Date(next).toISOString() });
    return "pending";
}

// After the response: a few quick attempts, then leave it to the retry timer. Never throws.
async function deliverQueued(id, { config, fetchImpl, wait = sleep }) {
    try {
        for (let attempt = 0; ; attempt += 1) {
            const item = claimOutboxItem(id, LEASE_MS);
            if (!item) return; // already delivered or failed, or another sender has it

            const result = await postInquiry({ submissionId: item.submission_id, body: item.body }, { config, fetchImpl });
            const status = settle(item, result);
            if (status !== "pending" || attempt >= QUICK_WAITS_MS.length) return;

            const pause = result.retryAfterMs ?? QUICK_WAITS_MS[attempt];
            if (pause > MAX_QUICK_WAIT_MS) return;
            await wait(pause);
        }
    } catch (error) {
        console.error("Inquiry Manager: background delivery failed", error?.code || error?.name || "error");
    }
}

// Fallback when the outbox could not be written (database problem): quick attempts from memory only
async function deliverUnstored(submissionId, body, { config, fetchImpl, wait = sleep }) {
    try {
        for (let attempt = 0; ; attempt += 1) {
            const result = await postInquiry({ submissionId, body }, { config, fetchImpl });
            logResult(submissionId, result, attempt + 1);
            if (result.outcome !== "retry") return;
            if (attempt >= QUICK_WAITS_MS.length) {
                console.error(`Inquiry Manager: ${submissionId} not delivered and not stored for retry (outbox unavailable)`);
                return;
            }
            await wait(Math.min(result.retryAfterMs ?? QUICK_WAITS_MS[attempt], MAX_QUICK_WAIT_MS));
        }
    } catch (error) {
        console.error("Inquiry Manager: background delivery failed", error?.code || error?.name || "error");
    }
}

/*
  Called by a form route once its own work (save + email) is done, BEFORE responding.
  Stores the copy and returns a function for after(), or null when there is nothing to send
  (forwarding not configured, or this submission was already queued). Never throws, never sends.

    const forward = queueInquiryForward({ formType, clientSubmissionId, submissionRowId, ...fields });
    if (forward) after(forward);

  options (tests): { config, fetchImpl, wait }
*/
export function queueInquiryForward(input, options = {}) {
    try {
        const config = options.config ?? inquiryApiConfig();
        if (!config.ok) {
            if (!warnedNotConfigured) {
                warnedNotConfigured = true;
                console.warn(`Inquiry Manager: forwarding is off (${config.problem})`);
            }
            return null;
        }

        const { submissionId, body } = buildInquiryPayload(input);
        const stored = enqueueOutbox({ submissionId, submissionRowId: input.submissionRowId ?? null, body });

        if (stored?.created) return () => deliverQueued(stored.id, { ...options, config });
        if (stored) return null; // the same submission sent again (double click, back button): already queued

        return () => deliverUnstored(submissionId, body, { ...options, config });
    } catch (error) {
        console.error("Inquiry Manager: could not prepare the copy", error?.message === "Unknown form type" ? error.message : error?.name || "error");
        return null;
    }
}

// Retry timer and the cron route: resends what is due, at most BATCH_SIZE items per run
export async function processDueOutbox({ limit = BATCH_SIZE, config = inquiryApiConfig(), fetchImpl } = {}) {
    const counts = { checked: 0, delivered: 0, pending: 0, failed: 0 };
    if (!config.ok) return { ...counts, skipped: config.problem };

    for (const id of dueOutboxIds(limit)) {
        try {
            const item = claimOutboxItem(id, LEASE_MS);
            if (!item) continue;
            counts.checked += 1;
            const result = await postInquiry({ submissionId: item.submission_id, body: item.body }, { config, fetchImpl });
            counts[settle(item, result)] += 1;
        } catch (error) {
            console.error("Inquiry Manager: retry run error", error?.code || error?.name || "error");
        }
    }
    return counts;
}
