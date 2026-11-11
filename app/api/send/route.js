// Contact form (app/[lang]/components/elements/contact-form.js) → email to the team inbox (CONTACT_TO_EMAIL, CC: CONTACT_CC_EMAILS), see libs/team-mail.js
//
// Checks, in order:
// 1. the request comes from a page of this site (Origin header)
// 2. honeypot: a hidden field only bots fill in; those requests get a fake success
// 3. required fields, length limits, email format, no URLs or spam words
// 4. rate limit per visitor IP
// 5. Google reCAPTCHA, issued for this site's hostname
// Errors return a `code` the form turns into a translated message; details stay in the server log.
// The checks themselves are in libs/form-security.js (shared with app/api/inquiry).

import { EmailTemplate } from "@/app/[lang]/components/elements/email-template";
import { sendTeamMail } from "@/libs/team-mail";
import { isRateLimited, isSameSite, reply, singleLine, verifyCaptcha, visitorIp } from "@/libs/form-security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LENGTH = { fullName: 100, phoneNumber: 30, email: 254, country: 100, message: 5000 };

const urlPattern = /https?:\/\/[^\s]+|www\.[^\s]+|href\s*=\s*["'][^\s]+["']/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const spamWords = ['crypto', 'win prize', 'free money', 'investment', 'click here', 'grils', 'girl', 'https', 'http', 'href'];

export async function POST(request) {
    if (!isSameSite(request)) {
        console.warn("Contact form: blocked, not sent from this site. Origin:", request.headers.get("origin"));
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
        console.warn("Contact form: honeypot filled, dropped");
        return reply(200, "sent");
    }

    const fullName = singleLine(data?.fullName);
    const phoneNumber = singleLine(data?.phoneNumber);
    const email = singleLine(data?.email);
    const country = singleLine(data?.country);
    const message = String(data?.message ?? "").trim();
    const captchaToken = String(data?.isCaptchaCode ?? "");

    const fields = { fullName, phoneNumber, email, country, message };
    if (Object.values(fields).some((value) => !value)) return reply(400, "invalid", "Please fill in every field.");
    if (Object.entries(MAX_LENGTH).some(([field, max]) => fields[field].length > max)) return reply(400, "too_long");
    if (!emailPattern.test(email)) return reply(400, "invalid_email");
    if (urlPattern.test(message)) return reply(400, "url");
    if (spamWords.some((word) => message.toLowerCase().includes(word))) return reply(400, "spam");
    if (!captchaToken) return reply(400, "captcha");

    const ip = visitorIp(request);
    if (isRateLimited(ip)) {
        console.warn("Contact form: rate limit reached for", ip);
        return reply(429, "rate_limit");
    }

    try {
        if (!(await verifyCaptcha(captchaToken, ip))) return reply(400, "captcha");

        const sent = await sendTeamMail({
            label: "Contact form",
            replyTo: email,
            subject: `Chempol Contact Form - ${fullName}`,
            html: EmailTemplate({ name: fullName, phone: phoneNumber, mail: email, contry: country, msg: message }),
        });
        if (!sent) return reply(500, "send_failed");

        return reply(200, "sent", "Email sent successfully!");
    } catch (error) {
        console.error("Contact form: error", error);
        return reply(500, "send_failed");
    }
}
