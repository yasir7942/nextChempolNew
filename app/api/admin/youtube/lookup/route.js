// app/api/admin/youtube/lookup/route.js
// "Fill from YouTube" in the add/edit form: ?video=<link or ID> → title, description, dates. Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { lookupYouTubeVideo } from "@/libs/youtube/videos";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const video = new URL(request.url).searchParams.get("video") || "";
        return adminJson({ success: true, video: await lookupYouTubeVideo(video) });
    } catch (error) {
        return adminError(error);
    }
}
