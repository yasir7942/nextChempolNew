// app/api/redirects/route.js
// Report of the last redirect sync, shown on /admin/redirectlinks/. Read-only: syncing
// happens through /api/revalidate (Strapi webhook or ?model=redirection-url).
import { NextResponse } from "next/server";
import { getAdminUser } from "@/libs/admin-auth";
import { readLiveRedirects, readReport } from "@/libs/redirects/sync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const headers = { "Cache-Control": "no-store" };

    // Admin login, like the rest of /admin
    if (!(await getAdminUser())) {
        return NextResponse.json(
            { success: false, message: "Not logged in. Please log in to the admin again." },
            { status: 401, headers }
        );
    }

    const [report, liveRedirects] = await Promise.all([readReport(), readLiveRedirects()]);

    if (!report) {
        return NextResponse.json(
            { success: false, pending: true, message: "Redirects have not been synced yet." },
            { status: 503, headers }
        );
    }

    // The destination check cache is internal
    const { checks, ...publicReport } = report;
    return NextResponse.json({ success: true, ...publicReport, liveRedirects }, { headers });
}
