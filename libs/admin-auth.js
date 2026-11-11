import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// Same session as the admin login (app/api/admin/login, app/api/admin/me):
// a Strapi users-permissions JWT in an httpOnly cookie.
export const ADMIN_COOKIE = "additives_admin_jwt";

// The logged-in Strapi user, or null when there is no valid admin session
export async function getAdminUser() {
    const jwt = (await cookies()).get(ADMIN_COOKIE)?.value || "";
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
    if (!jwt || !base) return null;

    try {
        const response = await fetch(`${base}/users/me`, {
            headers: { Authorization: `Bearer ${jwt}` },
            cache: "no-store",
        });
        const user = await response.json().catch(() => null);
        return response.ok && user?.id ? user : null;
    } catch {
        return null;
    }
}

const NO_STORE = { "Cache-Control": "no-store" };

/*
  For admin API routes that change data: null when the request may go ahead,
  otherwise the error response. Requires the admin session, and refuses requests
  sent from another website (the session cookie alone is not enough).
*/
export async function requireAdmin(request) {
    const origin = request.headers.get("origin");
    if (origin && request.method !== "GET") {
        const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
        let sameSite = false;
        try {
            sameSite = new URL(origin).host === host;
        } catch { }
        if (!sameSite) return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403, headers: NO_STORE });
    }

    if (!(await getAdminUser())) {
        return NextResponse.json({ success: false, message: "Please log in to the admin area." }, { status: 401, headers: NO_STORE });
    }

    return null;
}

// JSON response that browsers and proxies never cache
export function adminJson(body, status = 200) {
    return NextResponse.json(body, { status, headers: NO_STORE });
}

// Error from libs/youtube/videos.js (VideoError carries its status) or anything unexpected
export function adminError(error) {
    if (!error?.status) console.error("Admin API error:", error);
    return adminJson({ success: false, message: error?.status ? error.message : "Something went wrong. Check the server log." }, error?.status || 500);
}
