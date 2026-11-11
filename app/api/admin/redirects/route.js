// app/api/admin/redirects/route.js
// /admin/redirectlinks/: add a redirect (POST). Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { createRedirect } from "@/libs/redirects/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json().catch(() => null);
        return adminJson({ success: true, ...(await createRedirect(body)) }, 201);
    } catch (error) {
        return adminError(error);
    }
}
