import { NextResponse } from "next/server";

export const runtime = "nodejs";

function strapiBase() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/$/, "");
}

function isProduction() {
    return process.env.NODE_ENV === "production";
}

export async function POST(req) {
    try {
        const body = await req.json();

        const identifier = String(body?.identifier || "").trim();
        const password = String(body?.password || "");

        if (!identifier || !password) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "Username/email and password are required.",
                },
                { status: 400 }
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

        const loginRes = await fetch(`${base}/auth/local`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                identifier,
                password,
            }),
            cache: "no-store",
        });

        const loginJson = await loginRes.json().catch(() => null);

        if (!loginRes.ok || !loginJson?.jwt) {
            return NextResponse.json(
                {
                    ok: false,
                    error:
                        loginJson?.error?.message ||
                        loginJson?.message ||
                        "Invalid username/email or password.",
                },
                { status: loginRes.status || 401 }
            );
        }

        const user = loginJson?.user || {};

        const safeUser = {
            id: user?.id || null,
            username: user?.username || "",
            email: user?.email || "",
            confirmed: user?.confirmed ?? null,
            blocked: user?.blocked ?? null,
        };

        const res = NextResponse.json({
            ok: true,
            user: safeUser,
        });

        res.cookies.set("additives_admin_jwt", loginJson.jwt, {
            httpOnly: true,
            secure: isProduction(),
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        res.cookies.set("additives_admin_user", JSON.stringify(safeUser), {
            httpOnly: false,
            secure: isProduction(),
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return res;
    } catch (error) {
        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Login failed.",
            },
            { status: 500 }
        );
    }
}