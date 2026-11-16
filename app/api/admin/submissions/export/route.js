// Export of the customer submissions as a CSV or Excel (.xlsx) file, for /admin/submissions.
// Same filters as the page (form, email status, search), but ALL matching rows, not only one page.
// Customer data: admin login + SuperAdmin role (requireSuperAdmin). Read only.

import { adminError, requireSuperAdmin } from "@/libs/admin-auth";
import { exportSubmissions } from "@/libs/inquiry-db";
import { submissionsCsv, submissionsXlsx } from "@/libs/submission-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILES = {
    csv: { type: "text/csv; charset=utf-8", build: submissionsCsv },
    xlsx: { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", build: submissionsXlsx },
};

// the export day on the UAE clock, for the file name
const uaeToday = () => new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 10);

export async function GET(request) {
    const denied = await requireSuperAdmin(request);
    if (denied) return denied;

    try {
        const params = new URL(request.url).searchParams;
        const format = params.get("format") === "csv" ? "csv" : "xlsx";

        const { rows, truncated } = exportSubmissions({
            formType: params.get("type") || "",
            status: params.get("status") || "",
            search: params.get("q") || "",
        });

        const file = FILES[format].build(rows);

        return new Response(file, {
            status: 200,
            headers: {
                "Content-Type": FILES[format].type,
                "Content-Disposition": `attachment; filename="chempol-submissions-${uaeToday()}.${format}"`,
                "Cache-Control": "no-store",
                "X-Export-Rows": String(rows.length),
                "X-Export-Truncated": truncated ? "1" : "0",
            },
        });
    } catch (error) {
        return adminError(error);
    }
}
