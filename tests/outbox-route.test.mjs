// /api/cron/inquiry-outbox: CRON_SECRET check, status and manual retry (fetch mocked)
import { test, before } from "node:test";
import assert from "node:assert/strict";

const SECRET = "test-cron-secret-0123456789";
Object.assign(process.env, {
    CRON_SECRET: SECRET,
    INQUIRY_API_URL: "https://inquiry.test/api/v1/submissions",
    INQUIRY_API_KEY: "aiq_test_key",
});
globalThis.fetch = async () => Response.json({ ok: true, status: "created", inquiry_id: "inq_r" }, { status: 201 });

let GET, POST, enqueueOutbox;
before(async () => {
    ({ GET, POST } = await import("../app/api/cron/inquiry-outbox/route.js"));
    ({ enqueueOutbox } = await import("../libs/inquiry-db.js"));
});

const call = (handler, auth, query = "") =>
    handler(new Request(`http://localhost:3000/api/cron/inquiry-outbox${query}`, { method: handler === GET ? "GET" : "POST", headers: auth ? { authorization: auth } : {} }));

test("refuses requests without the right secret", async () => {
    assert.equal((await call(GET, "")).status, 401);
    assert.equal((await call(GET, "Bearer wrong")).status, 401);
    assert.equal((await call(POST, `Bearer ${SECRET}x`)).status, 401);
});

test("disabled while CRON_SECRET is empty or short", async () => {
    process.env.CRON_SECRET = "short";
    try {
        assert.equal((await call(GET, "Bearer short")).status, 503);
    } finally {
        process.env.CRON_SECRET = SECRET;
    }
});

test("status lists counts without inquiry content; POST sends what is due", async () => {
    enqueueOutbox({ submissionId: "contact-page-route-1", body: '{"submission_id":"contact-page-route-1","form_type":"contact","full_name":"Hidden Name"}' });

    const status = await call(GET, `Bearer ${SECRET}`);
    assert.equal(status.status, 200);
    assert.equal(status.headers.get("cache-control"), "no-store");
    const summary = await status.json();
    assert.equal(summary.counts.pending, 1);
    assert.equal(summary.pending[0].submission_id, "contact-page-route-1");
    assert.equal(JSON.stringify(summary).includes("Hidden Name"), false, "no inquiry content in the status");

    const run = await (await call(POST, `Bearer ${SECRET}`, "?requeue=failed")).json();
    assert.equal(run.run.delivered, 1);
    assert.equal(run.counts.delivered, 1);
    assert.equal(run.counts.pending, 0);
});
