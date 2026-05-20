import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function strapiBase() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
}

export async function GET() {
    try {
        const cookieStore = await cookies();

        const jwt = cookieStore.get("additives_admin_jwt")?.value || "";

        if (!jwt) {
            return NextResponse.json(
                {
                    ok: false,
                    user: null,
                    error: "Not logged in.",
                },
                { status: 401 }
            );
        }

        const base = strapiBase();

        if (!base) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "NEXT_PUBLIC_API_BASE_URL is missing in .env",
                },
                { status: 500 }
            );
        }

        const meRes = await fetch(`${base}/users/me`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${jwt}`,
            },
            cache: "no-store",
        });

        const user = await meRes.json().catch(() => null);

        if (!meRes.ok || !user?.id) {
            return NextResponse.json(
                {
                    ok: false,
                    user: null,
                    error: "Session expired. Please login again.",
                },
                { status: 401 }
            );
        }

        return NextResponse.json({
            ok: true,
            user: {
                id: user?.id || null,
                username: user?.username || "",
                email: user?.email || "",
                confirmed: user?.confirmed ?? null,
                blocked: user?.blocked ?? null,
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                user: null,
                error: error?.message || "Auth check failed.",
            },
            { status: 500 }
        );
    }
}