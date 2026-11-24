// Builds the JSON body for the Atlantic Inquiry Manager (POST /api/v1/submissions) from a website form.
// The one place where each form is mapped to the API. Pure functions, no network, no database.
// Used by libs/inquiry-forward.js; tested in tests/inquiry-payload.test.mjs.

import { randomUUID } from "node:crypto";

// Website form -> form_type / form_id / form_name in the Inquiry Manager
export const INQUIRY_FORMS = {
    contact: { form_type: "contact", form_id: "contact-page", form_name: "Contact form" },
    quote: { form_type: "quote", form_id: "product-quote", form_name: "Get a quote" },
    sample: { form_type: "sample", form_id: "product-sample", form_name: "Request a product sample" },
    support: { form_type: "other", form_id: "technical-question", form_name: "Ask our technical team" },
};

const MAX = { full_name: 190, company: 190, email: 190, phone: 50, country: 100, address: 500, city: 120, postcode: 32, message: 20000 };
const MAX_BODY_BYTES = 65536;
const SUBMISSION_ID = /^[A-Za-z0-9._:-]{1,128}$/;
// the browser's part of the ID; short enough that "<form_id>-<client id>" stays within 128 characters
const CLIENT_ID = /^[A-Za-z0-9._:-]{1,100}$/;
const EMAIL = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

// trimmed text cut to `max` characters, or "" (empty values are left out of the body)
const clip = (value, max) => String(value ?? "").trim().slice(0, max);

// "<form_id>-<id made in the browser when the form opened>", so a double submit gets the same ID.
// An invalid or missing browser ID is replaced by a new server-side one.
export function makeSubmissionId(formId, clientSubmissionId, newId = randomUUID) {
    const client = String(clientSubmissionId ?? "").trim();
    const id = `${formId}-${CLIENT_ID.test(client) ? client : newId()}`;
    return SUBMISSION_ID.test(id) ? id : `${formId}-${newId()}`;
}

// "500 kg" -> { quantity: 500, unit: "kg" }, "1,000 L" -> { quantity: 1000, unit: "L" }.
// Anything that is not a plain number (+ short unit) is kept word for word in `notes`.
export function parseQuantity(text) {
    const raw = clip(text, 200);
    if (!raw) return {};

    const match = raw.match(/^(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(?![\d.,])\s*(.*)$/);
    if (match) {
        const quantity = Number(match[1].replace(/,/g, "") + (match[2] ? `.${match[2]}` : ""));
        const unit = match[3].trim();
        if (Number.isFinite(quantity) && quantity >= 0 && quantity <= 1e9 && unit.length <= 30 && !/\d/.test(unit)) {
            return unit ? { quantity, unit } : { quantity };
        }
    }
    return { notes: `Requested quantity: ${raw}` };
}

/*
  input: {
    formType: "contact" | "quote" | "sample" | "support", clientSubmissionId, locale,
    fullName, company, email, phone, country, address, city, postcode, message,
    products: [{ title, quantity }], pageUrl, ip,
    emailResult: { sent: boolean, sentAt?: ISO string, attempts?: number, error?: string },
    test: boolean
  }
  Returns { submissionId, payload, body } where body is the exact JSON string to send (and to resend on retries).
*/
export function buildInquiryPayload(input) {
    const form = INQUIRY_FORMS[input?.formType];
    if (!form) throw new Error("Unknown form type");

    const submissionId = makeSubmissionId(form.form_id, input.clientSubmissionId);
    const payload = {
        submission_id: submissionId,
        form_type: form.form_type,
        form_id: form.form_id,
        form_name: form.form_name,
        locale: clip(input.locale, 20) || "en",
    };
    const fields = {};

    const put = (key, value) => {
        const text = clip(value, MAX[key]);
        if (text) payload[key] = text;
    };
    put("full_name", input.fullName);
    put("company", input.company);

    // an address the API would refuse (too long) is passed on as a labelled field instead of being lost
    const email = String(input.email ?? "").trim();
    if (email && email.length <= MAX.email && EMAIL.test(email)) payload.email = email;
    else if (email) fields.email_address = { label: "Email", value: email.slice(0, 5000) };

    put("phone", input.phone);
    put("country", input.country);
    put("address", input.address);
    put("city", input.city);
    put("postcode", input.postcode);

    // newlines are kept
    const message = String(input.message ?? "").trim().slice(0, MAX.message);
    if (message) payload.message = message;

    const products = (Array.isArray(input.products) ? input.products : [])
        .map((product) => ({ name: clip(product?.title, 190), ...parseQuantity(product?.quantity) }))
        .filter((product) => product.name);

    if (form.form_type === "other") {
        // technical question: the product it is about (at most one) is a labelled answer, not an order line
        if (products.length) fields.product = { label: "Product", value: products.map((product) => product.name).join("; ") };
    } else if (products.length) {
        payload.products = products.slice(0, 200);
    }

    if (Object.keys(fields).length) payload.fields = fields;

    const source = {};
    const pageUrl = clip(input.pageUrl, 2000);
    if (pageUrl) source.page_url = pageUrl;
    const ip = clip(input.ip, 64);
    if (ip && ip !== "unknown") source.ip = ip;
    if (input.emailResult) {
        const sent = input.emailResult.sent === true;
        source.email = {
            sent,
            sent_at: sent ? input.emailResult.sentAt || null : null,
            attempts: Number(input.emailResult.attempts) || 1,
            error: sent ? null : clip(input.emailResult.error, 500) || "unknown error",
        };
    }
    if (Object.keys(source).length) payload.source = source;

    if (input.test === true) payload.test = true;

    // the API accepts at most 64 KB: shorten the message until the body fits
    let body = JSON.stringify(payload);
    while (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES && payload.message?.length > 200) {
        payload.message = `${payload.message.slice(0, Math.floor(payload.message.length * 0.8))} [shortened]`;
        body = JSON.stringify(payload);
    }

    return { submissionId, payload, body };
}
