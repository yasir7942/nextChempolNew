// HTTP client of the Atlantic Inquiry Manager (libs/inquiry-api.js), with fetch mocked
import { test } from "node:test";
import assert from "node:assert/strict";
import { inquiryApiConfig, parseRetryAfter, postInquiry } from "../libs/inquiry-api.js";

const config = { ok: true, url: "https://inquiry.test/api/v1/submissions", key: "aiq_test_key" };
const item = { submissionId: "contact-page-1", body: '{"submission_id":"contact-page-1","form_type":"contact","full_name":"T"}' };

const answer = (status, json, headers = {}) => async () =>
    new Response(json === undefined ? null : JSON.stringify(json), { status, headers: { "content-type": "application/json", ...headers } });

test("configuration: both variables required, https only", () => {
    assert.equal(inquiryApiConfig({}).ok, false);
    assert.match(inquiryApiConfig({ INQUIRY_API_URL: "https://x.test/a" }).problem, /INQUIRY_API_KEY/);
    assert.match(inquiryApiConfig({ INQUIRY_API_URL: "http://x.test/a", INQUIRY_API_KEY: "k" }).problem, /https/);
    assert.deepEqual(inquiryApiConfig({ INQUIRY_API_URL: " https://x.test/a ", INQUIRY_API_KEY: " k " }), { ok: true, url: "https://x.test/a", key: "k" });
});

test("sends the stored body unchanged with the right headers", async () => {
    let call;
    const result = await postInquiry(item, {
        config,
        fetchImpl: async (url, init) => {
            call = { url, init };
            return new Response(JSON.stringify({ ok: true, status: "created", inquiry_id: "inq_42" }), { status: 201 });
        },
    });

    assert.equal(call.url, config.url);
    assert.equal(call.init.method, "POST");
    assert.equal(call.init.body, item.body);
    assert.equal(call.init.headers.Authorization, "Bearer aiq_test_key");
    assert.equal(call.init.headers["Content-Type"], "application/json");
    assert.equal(call.init.headers.Accept, "application/json");
    assert.equal(call.init.headers["Idempotency-Key"], "contact-page-1");
    assert.equal(call.init.cache, "no-store");
    assert.ok(call.init.signal instanceof AbortSignal);
    assert.deepEqual(result, { outcome: "delivered", httpStatus: 201, errorCode: null, errorFields: [], inquiryId: "inq_42", replayed: false });
});

test("200 replay counts as delivered", async () => {
    const result = await postInquiry(item, { config, fetchImpl: answer(200, { ok: true, status: "duplicate" }, { "Idempotent-Replayed": "true" }) });
    assert.equal(result.outcome, "delivered");
    assert.equal(result.replayed, true);
});

test("429, 5xx, timeout and network errors are retried", async () => {
    const limited = await postInquiry(item, { config, fetchImpl: answer(429, { ok: false, error: { code: "rate_limited" } }, { "Retry-After": "7" }) });
    assert.deepEqual([limited.outcome, limited.errorCode, limited.retryAfterMs], ["retry", "rate_limited", 7000]);

    const server = await postInquiry(item, { config, fetchImpl: answer(503, { ok: false, error: { code: "server_error" } }) });
    assert.deepEqual([server.outcome, server.httpStatus, server.errorCode], ["retry", 503, "server_error"]);

    const badGateway = await postInquiry(item, { config, fetchImpl: answer(502, undefined) });
    assert.deepEqual([badGateway.outcome, badGateway.errorCode], ["retry", "http_502"]);

    const network = await postInquiry(item, { config, fetchImpl: async () => { throw new TypeError("fetch failed"); } });
    assert.deepEqual([network.outcome, network.errorCode, network.httpStatus], ["retry", "network_error", null]);

    const timeout = await postInquiry(item, { config, fetchImpl: async () => { throw new DOMException("timed out", "TimeoutError"); } });
    assert.deepEqual([timeout.outcome, timeout.errorCode], ["retry", "timeout"]);
});

test("other 4xx fail without retry; 422 reports field names only", async () => {
    const invalid = await postInquiry(item, {
        config,
        fetchImpl: answer(422, { ok: false, error: { code: "validation_failed", message: "x", fields: { email: "must be valid", "products.0.quantity": "too big" } } }),
    });
    assert.deepEqual(invalid, { outcome: "failed", httpStatus: 422, errorCode: "validation_failed", errorFields: ["email", "products.0.quantity"] });

    for (const [status, code] of [[401, "invalid_credentials"], [403, "website_inactive"], [409, "idempotency_conflict"], [413, "payload_too_large"], [400, "invalid_json"]]) {
        const result = await postInquiry(item, { config, fetchImpl: answer(status, { ok: false, error: { code } }) });
        assert.deepEqual([result.outcome, result.errorCode], ["failed", code], `HTTP ${status}`);
    }
});

test("not configured: nothing is sent", async () => {
    let called = false;
    const result = await postInquiry(item, { config: { ok: false, problem: "INQUIRY_API_KEY is not set" }, fetchImpl: async () => { called = true; } });
    assert.equal(called, false);
    assert.equal(result.errorCode, "not_configured");
});

test("Retry-After parsing", () => {
    assert.equal(parseRetryAfter("30"), 30000);
    assert.equal(parseRetryAfter("0"), 1000);
    assert.equal(parseRetryAfter("99999"), 3600000);
    assert.equal(parseRetryAfter(new Date(Date.UTC(2030, 0, 1, 0, 0, 20)).toUTCString(), Date.UTC(2030, 0, 1)), 20000);
    assert.equal(parseRetryAfter(null), null);
    assert.equal(parseRetryAfter("soon"), null);
});
