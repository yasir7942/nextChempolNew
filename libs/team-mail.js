// One notification email to the team inbox, sent with Resend. Shared by every form:
//   app/api/send     (contact form)
//   app/api/inquiry  (Get a Quote and Request a Sample on product pages)
//
// Recipients come only from server configuration (.env), never from the submitted form:
//   RESEND_API_KEY     Resend API key (server only, never NEXT_PUBLIC_)
//   RESEND_FROM_EMAIL  sender, "name@domain" or "Name <name@domain>"; the domain must be verified in Resend
//   CONTACT_TO_EMAIL   main recipient
//   CONTACT_CC_EMAILS  optional, comma-separated CC addresses
// A configuration problem is written to the server log with the variable name (never the address
// list to the visitor); the visitor only gets the generic "could not send" message.

import { Resend } from "resend";

const emailPattern = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

// "Chempol Site <website@chempol.co.uk>" -> "website@chempol.co.uk"
const addressOf = (value) => {
    const match = String(value ?? "").trim().match(/<([^<>]+)>\s*$/);
    return (match ? match[1] : String(value ?? "")).trim();
};

// Escapes a visitor's text for safe use inside an HTML email
export const escapeHtml = (value) =>
    String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

// "https://wa.me/<digits>" for a phone number typed with its country code, or "" when it is too short to be one
export const whatsappLink = (phone) => {
    const digits = String(phone ?? "").replace(/\D/g, "").replace(/^00/, "");
    return digits.length >= 8 ? `https://wa.me/${digits}` : "";
};

// The phone number as a WhatsApp link (escaped) for the team email
export const phoneHtml = (phone) => {
    const link = whatsappLink(phone);
    return link ? `<a href="${escapeHtml(link)}">${escapeHtml(phone)}</a> (WhatsApp)` : escapeHtml(phone);
};

// Reads and validates the recipients. Pure function of `env` so it can be tested.
export function parseMailConfig(env = process.env) {
    const errors = [];

    const apiKey = String(env.RESEND_API_KEY ?? "").trim();
    if (!apiKey) errors.push("RESEND_API_KEY is not set");

    const from = String(env.RESEND_FROM_EMAIL ?? "").trim();
    if (!from) errors.push("RESEND_FROM_EMAIL is not set");
    else if (!emailPattern.test(addressOf(from))) errors.push("RESEND_FROM_EMAIL is not a valid email address");

    const to = String(env.CONTACT_TO_EMAIL ?? "").trim();
    if (!to) errors.push("CONTACT_TO_EMAIL is not set");
    else if (!emailPattern.test(to)) errors.push("CONTACT_TO_EMAIL is not a valid email address");

    // CC: trim, skip empty entries, drop duplicates (case-insensitive) and the main recipient
    const seen = new Set([to.toLowerCase()]);
    const cc = [];
    const invalidCc = [];
    for (const entry of String(env.CONTACT_CC_EMAILS ?? "").split(",")) {
        const address = entry.trim();
        if (!address) continue;
        if (!emailPattern.test(address)) {
            invalidCc.push(address);
            continue;
        }
        if (seen.has(address.toLowerCase())) continue;
        seen.add(address.toLowerCase());
        cc.push(address);
    }
    if (invalidCc.length) errors.push(`CONTACT_CC_EMAILS contains ${invalidCc.length} invalid address(es)`);

    return { ok: errors.length === 0, errors, apiKey, from, to, cc };
}

// Sends the notification. Returns true when Resend accepted it, false otherwise (reason in the log).
// `label` names the form in the log, `replyTo` is the visitor's already validated email.
export async function sendTeamMail({ label, subject, html, text, replyTo }) {
    const config = parseMailConfig();
    if (!config.ok) {
        console.error(`${label}: email not sent, configuration problem in .env:`, config.errors.join("; "));
        return false;
    }

    try {
        const resend = new Resend(config.apiKey);
        const { error } = await resend.emails.send({
            from: config.from,
            to: config.to,
            ...(config.cc.length ? { cc: config.cc } : {}),
            ...(replyTo ? { replyTo } : {}),
            subject,
            ...(html ? { html } : {}),
            ...(text ? { text } : {}),
        });

        if (error) {
            console.error(`${label}: Resend error`, error);
            return false;
        }
        return true;
    } catch (error) {
        // network failure, timeout...
        console.error(`${label}: Resend request failed`, error);
        return false;
    }
}
