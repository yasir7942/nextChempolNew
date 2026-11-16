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

// Role name that may open the customer submissions page. Compared ignoring case, spaces and
// punctuation, so "SuperAdmin", "Super Admin" and "super_admin" all match. Create the role in Strapi
// (Settings > Users & Permissions plugin > Roles) and give it to the users who may see customer data.
const SUPER_ADMIN_ROLE = "superadmin";
const normalizeRole = (name) => String(name ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

export const isSuperAdminUser = (user) => normalizeRole(user?.role?.name) === SUPER_ADMIN_ROLE;

// Role of an already logged-in user, or null. This never decides whether someone is logged in
// (getAdminUser does); a failure here only means "not a SuperAdmin".
// 1. the user's own token, 2. the server API token (Strapi may not let a user read their own role).
export async function loadUserRole(jwt, user) {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
    if (!base || !user?.id) return null;

    const lookups = [[`${base}/users/me?populate=role`, jwt]];
    const serverToken = String(process.env.API_TOKEN || "").trim();
    if (serverToken) lookups.push([`${base}/users/${user.id}?populate=role`, serverToken]);

    for (const [url, token] of lookups) {
        try {
            const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
            const json = await response.json().catch(() => null);
            if (response.ok && json?.role?.name) return json.role;
        } catch { }
    }
    return null;
}

// The logged-in Strapi user together with their role, or null when there is no valid admin session
export async function getAdminUserWithRole() {
    const user = await getAdminUser();
    if (!user) return null;

    const jwt = (await cookies()).get(ADMIN_COOKIE)?.value || "";
    return { ...user, role: await loadUserRole(jwt, user) };
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

/*
  For routes that return customer data: same checks as requireAdmin, and the user must also have the
  SuperAdmin role. null when the request may go ahead, otherwise the error response.
*/
export async function requireSuperAdmin(request) {
    const denied = await requireAdmin(request);
    if (denied) return denied;

    if (!isSuperAdminUser(await getAdminUserWithRole())) {
        return NextResponse.json({ success: false, message: "Only a SuperAdmin can view this page." }, { status: 403, headers: NO_STORE });
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
