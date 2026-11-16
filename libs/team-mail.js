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

// Sends the notification. Returns { ok: true } when Resend accepted it, otherwise { ok: false, error } (also logged).
// `label` names the form in the log, `replyTo` is the visitor's already validated email.
export async function sendTeamMail({ label, subject, html, text, replyTo }) {
    const config = parseMailConfig();
    if (!config.ok) {
        console.error(`${label}: email not sent, configuration problem in .env:`, config.errors.join("; "));
        return { ok: false, error: `configuration: ${config.errors.join("; ")}` };
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
            return { ok: false, error: `Resend: ${error.name || "error"} ${error.message || ""}`.trim() };
        }
        return { ok: true };
    } catch (error) {
        // network failure, timeout...
        console.error(`${label}: Resend request failed`, error);
        return { ok: false, error: `request failed: ${error?.message || error}` };
    }
}

// ---------------------------------------------------------------------------------------------
// Test email for /admin/submissions ("Send test email", SuperAdmin only)
// ---------------------------------------------------------------------------------------------

// Fixed on purpose: a test email can only ever go to this address, never to a visitor or to a
// recipient an admin typed.
export const TEST_RECIPIENT = "it@atlanticlubes.com";

// Shows that a secret is set without revealing it: first 3 characters and the length only
const maskSecret = (value) => (value ? `${value.slice(0, 3)}${"*".repeat(8)} (${value.length} characters)` : "");

// Plain-language advice for the most common Resend / network failures
function hintsFor(error) {
    const text = `${error?.name || ""} ${error?.message || ""} ${error?.cause || ""}`.toLowerCase();
    const status = Number(error?.statusCode) || 0;
    const hints = [];

    if (status === 401 || status === 403 || text.includes("api key") || text.includes("api_key")) {
        hints.push("RESEND_API_KEY is wrong, deleted, or restricted. Create a new key in Resend (API Keys) with sending access, put it in the .env file the server loads, and restart the app.");
    }
    if (text.includes("domain") || text.includes("not verified") || text.includes("testing emails")) {
        hints.push("The sender domain is not verified in Resend. Verify the domain of RESEND_FROM_EMAIL (Resend > Domains: SPF and DKIM records must show Verified), or use an address on a domain that is verified.");
    }
    if (status === 422 || text.includes("invalid `from`") || text.includes("invalid from")) {
        hints.push("Resend rejected the address format. RESEND_FROM_EMAIL must look like name@domain.com or Name <name@domain.com>.");
    }
    if (status === 429 || text.includes("rate")) {
        hints.push("Resend rate limit reached. Wait a little and try again.");
    }
    if (/enotfound|econnrefused|etimedout|econnreset|fetch failed|unable to fetch|network/.test(text)) {
        hints.push("This server could not reach api.resend.com. Check the server's internet access, DNS and any firewall or proxy rule for outgoing HTTPS.");
    }
    if (!hints.length) hints.push("Read the error name, message and status code above. The Resend docs list every error code: https://resend.com/docs/api-reference/errors");
    return hints;
}

// Sends one test email to TEST_RECIPIENT and returns a full diagnostic report (never throws).
// The real recipients (CONTACT_TO_EMAIL, CONTACT_CC_EMAILS) are checked but not emailed.
export async function sendTestMail() {
    const started = Date.now();
    const env = process.env;
    const config = parseMailConfig(env);
    const failing = (name) => config.errors.some((message) => message.startsWith(name));

    const variable = (name, shown) => ({
        name,
        status: !String(env[name] ?? "").trim() ? (name === "CONTACT_CC_EMAILS" ? "empty (optional)" : "missing") : failing(name) ? "invalid" : "ok",
        value: shown,
    });

    const report = {
        ok: false,
        testedAt: new Date().toISOString(),
        durationMs: 0,
        recipient: TEST_RECIPIENT,
        environment: { node: process.version, nodeEnv: env.NODE_ENV || "", platform: process.platform },
        configuration: [
            variable("RESEND_API_KEY", maskSecret(String(env.RESEND_API_KEY ?? "").trim())),
            variable("RESEND_FROM_EMAIL", String(env.RESEND_FROM_EMAIL ?? "").trim()),
            variable("CONTACT_TO_EMAIL", String(env.CONTACT_TO_EMAIL ?? "").trim()),
            variable("CONTACT_CC_EMAILS", String(env.CONTACT_CC_EMAILS ?? "").trim()),
        ],
        configurationProblems: config.errors,
        request: null,
        resendResponse: null,
        error: null,
        hints: [],
    };
    const finish = () => {
        report.durationMs = Date.now() - started;
        return report;
    };

    // the test needs only the API key and the sender
    const blocking = config.errors.filter((message) => message.startsWith("RESEND_API_KEY") || message.startsWith("RESEND_FROM_EMAIL"));
    if (blocking.length) {
        report.error = { name: "configuration", message: blocking.join("; ") };
        report.hints = ["Add the missing variable to the .env file the server loads (.env or .env.production in the app folder), then restart the app (for pm2: pm2 restart <app> --update-env)."];
        return finish();
    }

    const subject = `Chempol website - test email (${report.testedAt})`;
    report.request = { from: config.from, to: TEST_RECIPIENT, subject };

    try {
        const resend = new Resend(config.apiKey);
        const { data, error } = await resend.emails.send({
            from: config.from,
            to: TEST_RECIPIENT,
            subject,
            html: `<p><b>This is a test email from the Chempol website admin (Customer Submissions page).</b></p>
                   <p>If you can read this, Resend is configured correctly and the website can send email.</p>
                   <p>Sent at ${escapeHtml(report.testedAt)} (UTC) from ${escapeHtml(config.from)}.</p>`,
            text: `This is a test email from the Chempol website admin. If you can read this, Resend works. Sent at ${report.testedAt} (UTC).`,
        });

        if (error) {
            report.error = {
                name: error.name || "error",
                message: error.message || "",
                statusCode: error.statusCode ?? null,
            };
            report.hints = hintsFor(report.error);
            console.error("Test email: Resend error", error);
        } else {
            report.ok = true;
            report.resendResponse = { id: data?.id || "" };
        }
    } catch (error) {
        report.error = {
            name: error?.name || "Error",
            message: error?.message || String(error),
            cause: error?.cause ? String(error.cause?.code || error.cause?.message || error.cause) : "",
            stack: String(error?.stack || "").split("\n").slice(0, 8).join("\n"),
        };
        report.hints = hintsFor(report.error);
        console.error("Test email: request failed", error);
    }

    return finish();
}
