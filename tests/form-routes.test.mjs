// The real form routes (app/api/send, app/api/inquiry) with every outside service mocked:
// the visitor's response is complete before any Inquiry Manager call, and is identical when it is down.
import { test, before } from "node:test";
import assert from "node:assert/strict";

const INQUIRY_URL = "https://inquiry.test/api/v1/submissions";

Object.assign(process.env, {
    NEXT_PUBLIC_BASE_URL: "http://localhost:3000",
    RECAPTCHA_SECRET_KEY: "test-secret",
    RESEND_API_KEY: "re_test",
    RESEND_FROM_EMAIL: "Chempol Website <site@example.com>",
    CONTACT_TO_EMAIL: "team@example.com",
    CONTACT_CC_EMAILS: "",
    INQUIRY_API_URL: INQUIRY_URL,
    INQUIRY_API_KEY: "aiq_test_key",
});

// every outgoing request of the routes: Google reCAPTCHA, Resend, Inquiry Manager
let inquiryMode = "up"; // "up" | "down"
const inquiryCalls = [];
globalThis.fetch = async (input, init = {}) => {
    const url = String(input?.url ?? input);
    if (url.startsWith("https://www.google.com/recaptcha/")) return Response.json({ success: true, hostname: "localhost" });
    if (url.startsWith("https://api.resend.com/")) return Response.json({ id: "email_test" });
    if (url === INQUIRY_URL) {
        inquiryCalls.push(init.body);
        if (inquiryMode === "down") throw new TypeError("fetch failed");
        return Response.json({ ok: true, status: "created", inquiry_id: "inq_test" }, { status: 201 });
    }
    throw new Error(`Unexpected request in test: ${url}`);
};

let send, inquiry, runAfter, pendingAfter;
before(async () => {
    ({ POST: send } = await import("../app/api/send/route.js"));
    ({ POST: inquiry } = await import("../app/api/inquiry/route.js"));
    ({ runAfter, pendingAfter } = await import("./support/next-server.mjs"));
});

let ipCounter = 10;
const post = (path, body) =>
    new Request(`http://localhost:3000${path}`, {
        method: "POST",
        headers: {
            origin: "http://localhost:3000",
            referer: "http://localhost:3000/en/contact/",
            "content-type": "application/json",
            "cf-connecting-ip": `203.0.113.${(ipCounter += 1)}`,
        },
        body: JSON.stringify(body),
    });

const contact = (n) => ({
    fullName: "Test Visitor",
    phoneNumber: "+971 50 000 0000",
    email: `visitor${n}@example.com`,
    country: "UAE",
    message: `Please call me about product ${n}`,
    isCaptchaCode: "captcha-token",
    website: "",
    locale: "en",
    clientSubmissionId: `route-test-${n}`,
});

async function respond(handler, path, body) {
    const before = inquiryCalls.length;
    const response = await handler(post(path, body));
    const snapshot = { status: response.status, body: await response.json(), callsDuringRequest: inquiryCalls.length - before };
    return snapshot;
}

test("contact form: response first, Inquiry Manager only afterwards", async () => {
    inquiryMode = "up";
    const result = await respond(send, "/api/send", contact(1));

    assert.deepEqual(result, { status: 200, body: { code: "sent", message: "Email sent successfully!" }, callsDuringRequest: 0 });
    assert.equal(pendingAfter(), 1, "the delivery is handed to after()");

    await runAfter();
    assert.equal(inquiryCalls.length, 1);
    const sent = JSON.parse(inquiryCalls[0]);
    assert.equal(sent.submission_id, "contact-page-route-test-1");
    assert.equal(sent.form_type, "contact");
    assert.equal(sent.email, "visitor1@example.com");
    assert.equal(sent.source.page_url, "http://localhost:3000/en/contact/");
    assert.equal(sent.source.email.sent, true);
});

test("contact form: identical response when the Inquiry Manager is down", async () => {
    inquiryMode = "up";
    const whenUp = await respond(send, "/api/send", contact(2));
    inquiryMode = "down";
    const whenDown = await respond(send, "/api/send", contact(3));

    assert.deepEqual(whenDown, whenUp);
    assert.equal(whenDown.callsDuringRequest, 0);
    // drop the queued deliveries without running them (their retries are covered in inquiry-forward.test.mjs)
    globalThis.__afterQueue.length = 0;
});

test("quote, sample and technical question: response first, mapped form types", async () => {
    inquiryMode = "up";
    const base = {
        locale: "en",
        fullName: "Test Buyer",
        company: "Example LLC",
        country: "UAE",
        phone: "+971500000001",
        address: "Street 1",
        city: "Dubai",
        isCaptchaCode: "captcha-token",
        products: [],
    };

    for (const [type, formType, extra] of [
        ["quote", "quote", { remarks: "Need a price" }],
        ["sample", "sample", { remarks: "Send a sample" }],
        ["support", "other", { remarks: "Which dosage for 5W-30?" }],
    ]) {
        const result = await respond(inquiry, "/api/inquiry", { ...base, ...extra, type, email: `${type}@example.com`, clientSubmissionId: `route-${type}` });
        assert.deepEqual(result, { status: 200, body: { code: "sent" }, callsDuringRequest: 0 }, type);

        const before = inquiryCalls.length;
        await runAfter();
        assert.equal(inquiryCalls.length, before + 1, type);
        assert.equal(JSON.parse(inquiryCalls.at(-1)).form_type, formType);
    }
});

test("rejected forms (validation, honeypot) are never forwarded", async () => {
    const invalid = await respond(send, "/api/send", { ...contact(4), email: "not-an-email" });
    assert.equal(invalid.status, 400);

    const bot = await respond(send, "/api/send", { ...contact(5), website: "spam" });
    assert.equal(bot.status, 200);

    assert.equal(pendingAfter(), 0);
});
