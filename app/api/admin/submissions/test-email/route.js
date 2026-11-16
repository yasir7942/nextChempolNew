// "Send test email" button of /admin/submissions: sends one test email to the fixed test address
// (TEST_RECIPIENT in libs/team-mail.js) and returns a full technical report, pass or fail.
// SuperAdmin only. The report contains no secret (the API key is shown masked).

import { adminError, adminJson, requireSuperAdmin } from "@/libs/admin-auth";
import { sendTestMail } from "@/libs/team-mail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// one test every 5 seconds is plenty; stops a held-down button from sending a flood
let lastTest = 0;

export async function POST(request) {
    const denied = await requireSuperAdmin(request);
    if (denied) return denied;

    try {
        if (Date.now() - lastTest < 5000) {
            return adminJson({ success: false, message: "Please wait a few seconds before sending another test." }, 429);
        }
        lastTest = Date.now();

        return adminJson({ success: true, report: await sendTestMail() });
    } catch (error) {
        return adminError(error);
    }
}
