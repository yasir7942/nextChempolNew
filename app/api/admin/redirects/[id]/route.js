// app/api/admin/redirects/[id]/route.js
// Edit (PUT) and delete (DELETE) one redirect by its Strapi id. Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { deleteRedirect, updateRedirect } from "@/libs/redirects/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PUT(request, context) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { id } = await context.params;
        const body = await request.json().catch(() => null);
        return adminJson({ success: true, ...(await updateRedirect(id, body)) });
    } catch (error) {
        return adminError(error);
    }
}

export async function DELETE(request, context) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const { id } = await context.params;
        return adminJson({ success: true, ...(await deleteRedirect(id)) });
    } catch (error) {
        return adminError(error);
    }
}
