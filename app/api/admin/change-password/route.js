// Profile page: the logged-in SuperAdmin changes their own password.
// Uses Strapi's own endpoint (POST /auth/change-password), which checks the current password.
// The user's role needs the permission Users-permissions > Auth > changePassword.

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminError, adminJson, ADMIN_COOKIE, requireSuperAdmin } from "@/libs/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_LENGTH = 8;
const MAX_LENGTH = 128;

export async function POST(request) {
    const denied = await requireSuperAdmin(request);
    if (denied) return denied;

    try {
        const body = await request.json().catch(() => null);
        const currentPassword = String(body?.currentPassword ?? "");
        const password = String(body?.password ?? "");
        const passwordConfirmation = String(body?.passwordConfirmation ?? "");

        if (!currentPassword || !password || !passwordConfirmation) {
            return adminJson({ success: false, message: "Fill in the current password, the new password and its confirmation." }, 400);
        }
        if (password.length < MIN_LENGTH) return adminJson({ success: false, message: `The new password must have at least ${MIN_LENGTH} characters.` }, 400);
        if (password.length > MAX_LENGTH || currentPassword.length > MAX_LENGTH) return adminJson({ success: false, message: "The password is too long." }, 400);
        if (password !== passwordConfirmation) return adminJson({ success: false, message: "The new password and its confirmation do not match." }, 400);
        if (password === currentPassword) return adminJson({ success: false, message: "The new password must be different from the current one." }, 400);

        const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
        const jwt = (await cookies()).get(ADMIN_COOKIE)?.value || "";
        if (!base || !jwt) return adminJson({ success: false, message: "Please log in again." }, 401);

        const response = await fetch(`${base}/auth/change-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
            body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
            cache: "no-store",
        });
        const json = await response.json().catch(() => null);

        if (!response.ok) {
            if (response.status === 403) {
                return adminJson(
                    {
                        success: false,
                        message: "Strapi refused: give this user's role the permission Users-permissions > Auth > changePassword (Settings > Users & Permissions plugin > Roles), then try again.",
                    },
                    403
                );
            }
            return adminJson({ success: false, message: json?.error?.message || "The password could not be changed." }, response.status === 400 ? 400 : 502);
        }

        // Strapi issues a fresh token: keep this browser logged in with it
        const result = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
        if (json?.jwt) {
            // a login made without "Remember me" stays a session cookie
            const remember = (await cookies()).get("additives_admin_remember")?.value !== "0";
            result.cookies.set(ADMIN_COOKIE, json.jwt, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                ...(remember ? { maxAge: 60 * 60 * 24 * 7 } : {}),
            });
        }
        return result;
    } catch (error) {
        return adminError(error);
    }
}
