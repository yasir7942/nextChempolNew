// app/api/admin/youtube/fetch/route.js
// "Fetch YouTube data" button: same import as /api/youtubedataloader. Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { importFromYouTube } from "@/libs/youtube/videos";
import { revalidateVideoPages } from "@/libs/revalidate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const result = await importFromYouTube();

        if (result.added > 0 || result.updated > 0) revalidateVideoPages();

        return adminJson({ success: true, ...result });
    } catch (error) {
        return adminError(error);
    }
}
