import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isProduction() {
    return process.env.NODE_ENV === "production";
}

export async function POST() {
    const res = NextResponse.json({
        ok: true,
    });

    res.cookies.set("additives_admin_jwt", "", {
        httpOnly: true,
        secure: isProduction(),
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    res.cookies.set("additives_admin_user", "", {
        httpOnly: false,
        secure: isProduction(),
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return res;
}