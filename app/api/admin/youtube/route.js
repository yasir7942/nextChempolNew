// app/api/admin/youtube/route.js
// /admin/reports/youtube/: list every video (GET) and add one (POST). Admin login required.
import { adminError, adminJson, requireAdmin } from "@/libs/admin-auth";
import { createVideo, getAdminVideos } from "@/libs/youtube/videos";
import { revalidateVideoPages } from "@/libs/revalidate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        return adminJson({ success: true, fetchedAt: new Date().toISOString(), videos: await getAdminVideos() });
    } catch (error) {
        return adminError(error);
    }
}

export async function POST(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json().catch(() => null);
        const result = await createVideo(body);

        // Only after Strapi saved it
        revalidateVideoPages();

        return adminJson({ success: true, ...result }, 201);
    } catch (error) {
        return adminError(error);
    }
}
