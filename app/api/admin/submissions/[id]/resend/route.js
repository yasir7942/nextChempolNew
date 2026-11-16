// "Resend email" button of /admin/submissions: sends the team notification again for a saved
// submission whose email was not delivered, and records the result. SuperAdmin only.

import { adminError, adminJson, requireSuperAdmin } from "@/libs/admin-auth";
import { getSubmission, markEmailResult } from "@/libs/inquiry-db";
import { sendTeamMail } from "@/libs/team-mail";
import { buildSubmissionMail } from "@/libs/submission-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request, { params }) {
    const denied = await requireSuperAdmin(request);
    if (denied) return denied;

    try {
        const id = Number((await params).id);
        if (!Number.isInteger(id) || id < 1) return adminJson({ success: false, message: "Invalid submission." }, 400);

        const row = getSubmission(id);
        if (!row) return adminJson({ success: false, message: "Submission not found." }, 404);
        if (row.email_sent) return adminJson({ success: true, alreadySent: true, data: row });

        const mail = buildSubmissionMail({
            formType: row.form_type,
            locale: row.locale,
            fullName: row.full_name,
            company: row.company,
            email: row.email,
            phone: row.phone,
            country: row.country,
            address: row.address,
            city: row.city,
            postcode: row.postcode,
            message: row.message,
            products: row.products,
        });

        const result = await sendTeamMail({ label: `${mail.label} (resend #${id})`, replyTo: mail.replyTo, subject: mail.subject, html: mail.html });
        markEmailResult(id, result.ok, result.error);

        return adminJson({ success: result.ok, message: result.ok ? "Email sent." : `Email failed: ${result.error}`, data: getSubmission(id) });
    } catch (error) {
        return adminError(error);
    }
}
