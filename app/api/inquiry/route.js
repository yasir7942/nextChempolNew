// Product page forms: "Get a Quote" and "Request a Product Sample"
// (app/[lang]/components/elements/product-inquiry.js) → email to the team inbox (CONTACT_TO_EMAIL, CC: CONTACT_CC_EMAILS), see libs/team-mail.js
//
// Same protections as the contact form (libs/form-security.js): same-site Origin, honeypot,
// length limits, rate limit per IP (shared with the contact form) and Google reCAPTCHA.
// On top of that every product is checked against the real catalogue, so a visitor
// can't put their own text in the product list of the email.
// Errors return a `code` the form turns into a translated message; details stay in the server log.

import { i18n } from "@/i18n.config";
import { InquiryEmailTemplate } from "@/app/[lang]/components/elements/inquiry-email-template";
import { isRateLimited, isSameSite, reply, singleLine, verifyCaptcha, visitorIp } from "@/libs/form-security";
import { lookupProducts } from "@/libs/product-search";
import { sendTeamMail } from "@/libs/team-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_PRODUCTS = 10;
const MAX_LENGTH = {
    slug: 200,
    quantity: 60,
    fullName: 100,
    company: 150,
    country: 100,
    phone: 30,
    email: 254,
    address: 250,
    city: 100,
    postcode: 20,
    remarks: 2000,
};
// Fields each form needs (remarks and postcode are optional); the sample form also needs the address
const REQUIRED = {
    quote: ["fullName", "company", "country", "phone", "email"],
    sample: ["fullName", "company", "address", "city", "country", "phone", "email"],
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+\d][\d\s().-]{5,}$/;
const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|href\s*=\s*["'][^\s]+["']/i;

export async function POST(request) {
    if (!isSameSite(request)) {
        console.warn("Inquiry form: blocked, not sent from this site. Origin:", request.headers.get("origin"));
        return reply(403, "forbidden");
    }

    let data;
    try {
        data = await request.json();
    } catch {
        return reply(400, "invalid");
    }

    // Honeypot filled in: a bot. Pretend it worked so it does not try again.
    if (data?.website) {
        console.warn("Inquiry form: honeypot filled, dropped");
        return reply(200, "sent");
    }

    const type = data?.type === "sample" ? "sample" : data?.type === "quote" ? "quote" : null;
    const locale = i18n.locales.includes(data?.locale) ? data.locale : null;
    if (!type || !locale) return reply(400, "invalid");

    const fields = {};
    for (const name of ["fullName", "company", "country", "phone", "email", "address", "city", "postcode"]) {
        fields[name] = singleLine(data?.[name]);
    }
    const remarks = String(data?.remarks ?? "").trim();

    if (REQUIRED[type].some((name) => !fields[name])) return reply(400, "invalid");
    if (Object.entries(fields).some(([name, value]) => value.length > MAX_LENGTH[name]) || remarks.length > MAX_LENGTH.remarks) {
        return reply(400, "too_long");
    }
    if (!emailPattern.test(fields.email)) return reply(400, "invalid_email");
    if (!phonePattern.test(fields.phone)) return reply(400, "invalid_phone");
    if (urlPattern.test(remarks)) return reply(400, "url");

    // products: [{ slug, quantity }], at least one, no repeats
    const requested = Array.isArray(data?.products) ? data.products : [];
    if (!requested.length) return reply(400, "no_products");
    if (requested.length > MAX_PRODUCTS) return reply(400, "too_many_products");

    const quantities = new Map();
    for (const item of requested) {
        const slug = singleLine(item?.slug);
        // samples have no quantity: ignore whatever a client sends
        const quantity = type === "quote" ? singleLine(item?.quantity) : "";
        if (!slug || slug.length > MAX_LENGTH.slug || quantity.length > MAX_LENGTH.quantity) return reply(400, "invalid");
        if (type === "quote" && !quantity) return reply(400, "quantity_required");
        if (!quantities.has(slug)) quantities.set(slug, quantity);
    }

    const captchaToken = String(data?.isCaptchaCode ?? "");
    if (!captchaToken) return reply(400, "captcha");

    const ip = visitorIp(request);
    if (isRateLimited(ip)) {
        console.warn("Inquiry form: rate limit reached for", ip);
        return reply(429, "rate_limit");
    }

    try {
        if (!(await verifyCaptcha(captchaToken, ip))) return reply(400, "captcha");

        const found = await lookupProducts(locale, [...quantities.keys()]);
        if (found.length !== quantities.size) {
            console.warn("Inquiry form: unknown product slug(s) from", ip);
            return reply(400, "invalid");
        }
        const products = found.map((product) => ({ ...product, quantity: quantities.get(product.slug) }));

        const contact = [
            ["Name", fields.fullName],
            ["Company", fields.company],
            ...(type === "sample"
                ? [["Address", fields.address], ["City", fields.city], ["Postcode", fields.postcode]]
                : []),
            ["Country", fields.country],
            ["Phone", fields.phone],
            ["Email", fields.email],
        ];

        const subjectProduct = products.length > 1 ? `${products[0].title} +${products.length - 1} more` : products[0].title;
        const sent = await sendTeamMail({
            label: "Inquiry form",
            replyTo: fields.email,
            subject: `${type === "quote" ? "Quotation request" : "Sample request"} - ${fields.company} - ${subjectProduct}`.slice(0, 200),
            html: InquiryEmailTemplate({
                type,
                products,
                contact,
                remarks,
                locale,
                siteUrl: (process.env.NEXT_PUBLIC_BASE_URL || "https://chempol.co.uk").replace(/\/$/, ""),
            }),
        });
        if (!sent) return reply(500, "send_failed");

        return reply(200, "sent");
    } catch (error) {
        console.error("Inquiry form: error", error);
        return reply(500, "send_failed");
    }
}
