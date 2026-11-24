// Background delivery and the outbox (libs/inquiry-forward.js + libs/inquiry-db.js), with fetch mocked.
// The database is a temporary file (tests/support/setup.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";
import { DatabaseSync } from "node:sqlite";
import { processDueOutbox, queueInquiryForward } from "../libs/inquiry-forward.js";
import { requeueFailedOutbox } from "../libs/inquiry-db.js";

const config = { ok: true, url: "https://inquiry.test/api/v1/submissions", key: "aiq_test_key" };
const noWait = async () => {};

// a second connection to the same file, to read and adjust outbox rows
let reader;
const db = () => (reader ||= new DatabaseSync(process.env.INQUIRY_DB_PATH));
const row = (submissionId) => db().prepare("SELECT * FROM inquiry_outbox WHERE submission_id = ?").get(submissionId);
const makeDue = (submissionId) => db().prepare("UPDATE inquiry_outbox SET next_attempt_at = ? WHERE submission_id = ?").run(new Date(Date.now() - 1000).toISOString(), submissionId);

let rowId = 1000;
const input = (clientSubmissionId, extra = {}) => ({
    formType: "contact",
    clientSubmissionId,
    submissionRowId: (rowId += 1),
    fullName: "Private Person",
    email: "private.person@example.com",
    phone: "+971500000000",
    message: "Private message text",
    ...extra,
});

// fetch stand-in: records every call and answers from the list (the last answer repeats)
function api(...answers) {
    const calls = [];
    const fetchImpl = async (url, init) => {
        calls.push({ url, body: init.body, headers: init.headers });
        const next = answers.length > 1 ? answers.shift() : answers[0];
        if (next instanceof Error) throw next;
        return new Response(JSON.stringify(next.json ?? {}), { status: next.status, headers: next.headers ?? {} });
    };
    return { calls, fetchImpl };
}
const created = { status: 201, json: { ok: true, status: "created", inquiry_id: "inq_1" } };

test("during the request: stored, nothing sent; the returned function sends the stored body", async () => {
    const { calls, fetchImpl } = api(created);
    const deliver = queueInquiryForward(input("t1"), { config, fetchImpl, wait: noWait });

    assert.equal(typeof deliver, "function");
    assert.equal(calls.length, 0, "no HTTP call may happen before the response");
    const stored = row("contact-page-t1");
    assert.equal(stored.status, "pending");

    await deliver();
    assert.equal(calls.length, 1);
    assert.equal(calls[0].body, stored.body, "the stored body is sent byte for byte");
    assert.equal(calls[0].headers["Idempotency-Key"], "contact-page-t1");

    const after = row("contact-page-t1");
    assert.equal(after.status, "delivered");
    assert.equal(after.inquiry_id, "inq_1");
    assert.equal(after.attempts, 1);
});

test("API down: never throws, stays pending, later resent with identical bytes", async () => {
    const down = api(new TypeError("fetch failed"));
    const deliver = queueInquiryForward(input("t2"), { config, fetchImpl: down.fetchImpl, wait: noWait });
    assert.equal(down.calls.length, 0);

    await deliver(); // resolves even though every attempt fails
    assert.equal(down.calls.length, 3, "1 attempt + 2 quick retries");
    const pending = row("contact-page-t2");
    assert.equal(pending.status, "pending");
    assert.equal(pending.last_error_code, "network_error");
    assert.ok(Date.parse(pending.next_attempt_at) > Date.now(), "next try is scheduled for later");

    // not due yet: the retry run leaves it alone
    const early = api(created);
    assert.equal((await processDueOutbox({ config, fetchImpl: early.fetchImpl })).checked, 0);

    makeDue("contact-page-t2");
    const up = api(created);
    const run = await processDueOutbox({ config, fetchImpl: up.fetchImpl });
    assert.equal(run.delivered, 1);
    assert.equal(up.calls[0].body, down.calls[0].body, "retry sends exactly the same bytes");
    assert.equal(row("contact-page-t2").status, "delivered");
});

test("429 honours a short Retry-After before the quick retry", async () => {
    const waits = [];
    const { calls, fetchImpl } = api({ status: 429, json: { ok: false, error: { code: "rate_limited" } }, headers: { "Retry-After": "3" } }, created);
    await queueInquiryForward(input("t3"), { config, fetchImpl, wait: async (ms) => waits.push(ms) })();
    assert.deepEqual(waits, [3000]);
    assert.equal(calls.length, 2);
    assert.equal(row("contact-page-t3").status, "delivered");
});

test("422 fails without retry; logs hold codes and field names, never the inquiry content or key", async () => {
    const lines = [];
    const original = { warn: console.warn, log: console.log, error: console.error };
    console.warn = console.log = console.error = (...args) => lines.push(args.join(" "));
    try {
        const { calls, fetchImpl } = api({ status: 422, json: { ok: false, error: { code: "validation_failed", fields: { email: "invalid" } } } });
        await queueInquiryForward(input("t4"), { config, fetchImpl, wait: noWait })();
        assert.equal(calls.length, 1);
    } finally {
        Object.assign(console, original);
    }

    const failed = row("contact-page-t4");
    assert.equal(failed.status, "failed");
    assert.equal(failed.last_error_code, "validation_failed");
    assert.equal(failed.last_error_fields, "email");

    const log = lines.join("\n");
    assert.match(log, /contact-page-t4/);
    assert.match(log, /validation_failed fields=email/);
    for (const secret of ["Private Person", "private.person@example.com", "+971500000000", "Private message text", "aiq_test_key"]) {
        assert.equal(log.includes(secret), false, `log must not contain ${secret}`);
    }
});

test("the same saved submission is queued only once (double submit)", () => {
    const first = input("t5");
    assert.equal(typeof queueInquiryForward(first, { config, fetchImpl: api(created).fetchImpl }), "function");
    // a second post of the same form reuses the saved row: no second copy
    assert.equal(queueInquiryForward({ ...first, clientSubmissionId: "t5-again" }, { config }), null);
    // the same browser id again: no second copy
    assert.equal(queueInquiryForward({ ...first, submissionRowId: 99999 }, { config }), null);
    assert.equal(row("contact-page-t5-again"), undefined);
});

test("forwarding switched off: nothing stored, nothing sent", () => {
    const { calls, fetchImpl } = api(created);
    assert.equal(queueInquiryForward(input("t6"), { config: { ok: false, problem: "INQUIRY_API_KEY is not set" }, fetchImpl }), null);
    assert.equal(row("contact-page-t6"), undefined);
    assert.equal(calls.length, 0);
});

test("bad input never throws into the form route", () => {
    assert.equal(queueInquiryForward({ formType: "unknown" }, { config }), null);
    assert.equal(queueInquiryForward(undefined, { config }), null);
});

test("retries stop after 24 hours; failed items can be put back in the queue", async () => {
    const down = api({ status: 503, json: { ok: false, error: { code: "server_error" } } });
    const deliver = queueInquiryForward(input("t7"), { config, fetchImpl: down.fetchImpl, wait: noWait });
    db().prepare("UPDATE inquiry_outbox SET retry_until = ? WHERE submission_id = ?").run(new Date(Date.now() - 1000).toISOString(), "contact-page-t7");

    await deliver();
    const expired = row("contact-page-t7");
    assert.equal(expired.status, "failed");
    assert.equal(expired.last_error_code, "expired:server_error");
    assert.equal(down.calls.length, 1);

    assert.ok(requeueFailedOutbox() >= 1);
    const requeued = row("contact-page-t7");
    assert.equal(requeued.status, "pending");
    assert.ok(Date.parse(requeued.retry_until) > Date.now() + 23 * 3600000);

    const up = api(created);
    await processDueOutbox({ config, fetchImpl: up.fetchImpl });
    assert.equal(row("contact-page-t7").status, "delivered");
    assert.equal(up.calls.filter((call) => call.headers["Idempotency-Key"] === "contact-page-t7").length, 1);
});
