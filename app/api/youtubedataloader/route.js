/**** YouTube import, protected by ?token=ADMIN_TOKEN (for a cron job or a manual run).
 * The admin "Fetch YouTube data" button (/admin/reports/youtube/) runs the same import.
 *
 * - Imports every channel video that is not in Strapi yet (the channel's uploads list).
 * - Videos are matched by YouTube video ID against every record (hidden ones too),
 *   so nothing is added twice; existing records only get empty fields filled.
 * - Thumbnails are saved in the Strapi media library.
 */

import { NextResponse } from "next/server";
import { importFromYouTube } from "@/libs/youtube/videos";
import { revalidateVideoPages } from "@/libs/revalidate-pages";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const VALID_TOKEN = process.env.ADMIN_TOKEN;

export async function GET(req) {
    const token = new URL(req.url).searchParams.get("token") || "";

    if (!VALID_TOKEN || token !== VALID_TOKEN) {
        return NextResponse.json({ success: false, error: "Unauthorized: Invalid token" }, { status: 401 });
    }

    try {
        const result = await importFromYouTube();

        // Show the changes right away on the home and videos pages (otherwise up to 1 hour)
        if (result.added > 0 || result.updated > 0) revalidateVideoPages();

        return NextResponse.json({ message: "Data updated", total: result.total, imported: result.added, ...result });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: error.status || 500 });
    }
}
