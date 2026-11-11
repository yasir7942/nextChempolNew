// app/api/admin/youtube/[documentId]/route.js
// Edit (PUT), hide or show (PATCH { action }) and delete (DELETE) one video. Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { deleteVideo, hideVideo, showVideo, updateVideo, VideoError } from "@/libs/youtube/videos";
import { revalidateVideoPages } from "@/libs/revalidate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function documentIdOf(context) {
    const { documentId } = await context.params;
    if (!/^[a-z0-9]{10,40}$/i.test(documentId || "")) throw new VideoError("Invalid video.", 400);
    return documentId;
}

export async function PUT(request, context) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const documentId = await documentIdOf(context);
        const body = await request.json().catch(() => null);
        const result = await updateVideo(documentId, body);

        revalidateVideoPages();

        return adminJson({ success: true, ...result });
    } catch (error) {
        return adminError(error);
    }
}

export async function PATCH(request, context) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const documentId = await documentIdOf(context);
        const { action } = (await request.json().catch(() => null)) || {};
        if (action !== "hide" && action !== "show") throw new VideoError('action must be "hide" or "show".');

        const video = action === "hide" ? await hideVideo(documentId) : await showVideo(documentId);

        revalidateVideoPages();

        return adminJson({ success: true, video });
    } catch (error) {
        return adminError(error);
    }
}

export async function DELETE(request, context) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        await deleteVideo(await documentIdOf(context));

        revalidateVideoPages();

        return adminJson({ success: true });
    } catch (error) {
        return adminError(error);
    }
}
