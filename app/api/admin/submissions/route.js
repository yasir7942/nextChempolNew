// Customer submissions (contact, quote, sample, technical team) for the admin page /admin/submissions.
// Customer data: needs the admin login AND the SuperAdmin role (libs/admin-auth.js requireSuperAdmin).
// Read only; nothing here can change or delete a record.

import { adminError, adminJson, requireSuperAdmin } from "@/libs/admin-auth";
import { listSubmissions, submissionReport } from "@/libs/inquiry-db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PAGE_SIZES = [10, 20, 50];

export async function GET(request) {
    const denied = await requireSuperAdmin(request);
    if (denied) return denied;

    try {
        const params = new URL(request.url).searchParams;
        const requestedSize = Number(params.get("pageSize"));

        const { rows, pagination } = listSubmissions({
            page: Number(params.get("page")) || 1,
            pageSize: PAGE_SIZES.includes(requestedSize) ? requestedSize : 20,
            formType: params.get("type") || "",
            status: params.get("status") || "",
            search: params.get("q") || "",
        });

        return adminJson({ success: true, data: rows, pagination, report: submissionReport() });
    } catch (error) {
        return adminError(error);
    }
}
