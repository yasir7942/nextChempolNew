// Mapping of the website forms to the Atlantic Inquiry Manager body (libs/inquiry-payload.js)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildInquiryPayload, makeSubmissionId, parseQuantity } from "../libs/inquiry-payload.js";

const ALLOWED_KEYS = new Set([
    "submission_id", "form_type", "form_id", "form_name", "locale", "full_name", "company", "email", "phone",
    "country", "address", "city", "postcode", "message", "products", "fields", "source", "test",
]);

test("contact form: fields, ids, source; no empty values and no unknown keys", () => {
    const { submissionId, payload, body } = buildInquiryPayload({
        formType: "contact",
        clientSubmissionId: "0b7e5c1e-6f0a-4b8e-9a51-3d2f1c7a9e10",
        locale: "ar",
        fullName: "Sara Ahmed",
        email: "sara@example.com",
        phone: "+971 50 000 0000",
        country: "United Arab Emirates",
        company: "   ",
        message: "Line one\nLine two",
        pageUrl: "https://chempol.co.uk/ar/contact/",
        ip: "203.0.113.10",
        emailResult: { sent: true, sentAt: "2026-11-23T10:00:00.000Z", attempts: 1 },
    });

    assert.equal(submissionId, "contact-page-0b7e5c1e-6f0a-4b8e-9a51-3d2f1c7a9e10");
    assert.deepEqual(payload, {
        submission_id: submissionId,
        form_type: "contact",
        form_id: "contact-page",
        form_name: "Contact form",
        locale: "ar",
        full_name: "Sara Ahmed",
        email: "sara@example.com",
        phone: "+971 50 000 0000",
        country: "United Arab Emirates",
        message: "Line one\nLine two",
        source: {
            page_url: "https://chempol.co.uk/ar/contact/",
            ip: "203.0.113.10",
            email: { sent: true, sent_at: "2026-11-23T10:00:00.000Z", attempts: 1, error: null },
        },
    });
    assert.equal(body, JSON.stringify(payload));
    assert.ok(Object.keys(payload).every((key) => ALLOWED_KEYS.has(key)));
    assert.equal("submitted_at" in payload, false);
});

test("quote form: products with parsed quantity, phone and postcode stay strings", () => {
    const { payload } = buildInquiryPayload({
        formType: "quote",
        clientSubmissionId: "abc",
        fullName: "Ali",
        company: "Example Trading LLC",
        phone: "0501234567",
        postcode: "00000",
        products: [
            { title: "CHEMPOL 67490", quantity: "1,000 kg" },
            { title: "CHEMPOL 5026", quantity: "2 drums" },
            { title: "CHEMPOL 5510", quantity: "1 x 200L drum" },
            { title: "", quantity: "5" },
        ],
        emailResult: { sent: false, attempts: 1, error: "Resend: validation_error" },
        test: true,
    });

    assert.equal(payload.form_type, "quote");
    assert.equal(payload.form_id, "product-quote");
    assert.equal(payload.phone, "0501234567");
    assert.equal(typeof payload.postcode, "string");
    assert.deepEqual(payload.products, [
        { name: "CHEMPOL 67490", quantity: 1000, unit: "kg" },
        { name: "CHEMPOL 5026", quantity: 2, unit: "drums" },
        { name: "CHEMPOL 5510", notes: "Requested quantity: 1 x 200L drum" },
    ]);
    assert.deepEqual(payload.source, { email: { sent: false, sent_at: null, attempts: 1, error: "Resend: validation_error" } });
    assert.equal(payload.test, true);
});

test("sample form and technical question", () => {
    const sample = buildInquiryPayload({ formType: "sample", clientSubmissionId: "s1", fullName: "A", products: [{ title: "CHEMPOL 67490" }] }).payload;
    assert.equal(sample.form_type, "sample");
    assert.deepEqual(sample.products, [{ name: "CHEMPOL 67490" }]);

    const support = buildInquiryPayload({ formType: "support", clientSubmissionId: "t1", fullName: "B", message: "Which treat rate?", products: [{ title: "CHEMPOL 67490" }] }).payload;
    assert.equal(support.form_type, "other");
    assert.equal(support.form_id, "technical-question");
    assert.equal(support.products, undefined);
    assert.deepEqual(support.fields, { product: { label: "Product", value: "CHEMPOL 67490" } });
    assert.equal(support.message, "Which treat rate?");
});

test("submission_id: valid browser id is kept, anything else is replaced server-side", () => {
    assert.equal(makeSubmissionId("contact-page", "good-id_1:2.3"), "contact-page-good-id_1:2.3");
    assert.equal(makeSubmissionId("contact-page", "bad id<script>", () => "new"), "contact-page-new");
    assert.equal(makeSubmissionId("contact-page", "", () => "new"), "contact-page-new");
    assert.equal(makeSubmissionId("contact-page", "x".repeat(101), () => "new"), "contact-page-new");
    assert.match(makeSubmissionId("product-quote", undefined), /^product-quote-[0-9a-f-]{36}$/);
});

test("quantity parsing", () => {
    assert.deepEqual(parseQuantity("500"), { quantity: 500 });
    assert.deepEqual(parseQuantity("500kg"), { quantity: 500, unit: "kg" });
    assert.deepEqual(parseQuantity("2.5 tonnes"), { quantity: 2.5, unit: "tonnes" });
    assert.deepEqual(parseQuantity("2,5 kg"), { notes: "Requested quantity: 2,5 kg" });
    assert.deepEqual(parseQuantity("about 20 drums"), { notes: "Requested quantity: about 20 drums" });
    assert.deepEqual(parseQuantity("2000000000"), { notes: "Requested quantity: 2000000000" });
    assert.deepEqual(parseQuantity(""), {});
});

test("too-long email goes to a labelled field instead of failing validation; body stays under 64 KB", () => {
    const longEmail = `${"a".repeat(200)}@example.com`;
    const { payload, body } = buildInquiryPayload({ formType: "contact", clientSubmissionId: "e1", email: longEmail, message: "x".repeat(90000) });
    assert.equal(payload.email, undefined);
    assert.deepEqual(payload.fields.email_address, { label: "Email", value: longEmail });
    assert.ok(payload.message.length <= 20000);
    assert.ok(Buffer.byteLength(body) <= 65536);
});

test("unknown form type is refused", () => {
    assert.throws(() => buildInquiryPayload({ formType: "newsletter" }), /Unknown form type/);
});
