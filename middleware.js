

/*
import { NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import { i18n } from './i18n.config'; // Ensure you have this file with locales and defaultLocale   

*/

/* Get Locale Handler 
function getLocale(request) {
    const negotiatorHeaders = {};
    request.headers.forEach((value, key) => {
        negotiatorHeaders[key] = value;
    });

    const negotiator = new Negotiator({ headers: negotiatorHeaders });
    const languages = negotiator.languages();
    const locales = i18n.locales;

    return matchLocale(languages, locales, i18n.defaultLocale);
}

/* Middleware 
export function middleware(request) {
    const pathname = request.nextUrl.pathname;

    // Skip language prefix for assets like images, styles, etc.
    if (pathname.startsWith('/images/') || pathname.startsWith('/_next/')) {
        return NextResponse.next();
    }

    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) =>
            !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
    );

    if (pathnameIsMissingLocale) {
        const locale = getLocale(request);
        const newUrl = new URL(`/${locale}${pathname}`, request.url);
        return NextResponse.redirect(newUrl);
    }

    return NextResponse.next();
}

 /*  Matcher  */   /*  
export const config = {
 matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};


*/



import { NextResponse } from "next/server";
import { i18n } from "./i18n.config";

const SUPPORTED = i18n.locales;      // ["en","ar","es"]
const DEFAULT = i18n.defaultLocale;  // "en"

function pickLocaleFromHeader(headerValue) {
    if (!headerValue) return DEFAULT;

    // Example: "en-US,en;q=0.9,ar;q=0.8,*;q=0.7"
    const parts = headerValue.split(",").map((p) => p.trim());

    for (const part of parts) {
        // remove ;q=...
        const tag = part.split(";")[0].trim();
        if (!tag || tag === "*") continue;

        // normalize underscore -> hyphen, lowercase base language
        const base = tag.replace(/_/g, "-").split("-")[0].toLowerCase();

        if (SUPPORTED.includes(base)) return base;
    }

    return DEFAULT;
}

export function middleware(request) {
    const pathname = request.nextUrl.pathname;

    // ✅ skip next internals + static files + uploads (IMPORTANT)
    if (
        pathname.startsWith("/_next/") ||
        pathname.startsWith("/admin/") ||
        pathname.startsWith("/images/") ||
        pathname.startsWith("/uploads/") ||
        pathname === "/favicon.ico" ||
        pathname === "/robots.txt" ||
        pathname === "/sitemap.xml" ||
        pathname.match(/\.(png|jpg|jpeg|webp|svg|gif|ico|css|js|map|txt|xml)$/i)
    ) {
        return NextResponse.next();
    }

    // already has locale?
    const hasLocale = SUPPORTED.some(
        (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
    );

    if (!hasLocale) {
        const acceptLanguage = request.headers.get("accept-language");
        const locale = pickLocaleFromHeader(acceptLanguage);

        const newUrl = new URL(`/${locale}${pathname}`, request.url);
        return NextResponse.redirect(newUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!api|_next/static|_next/image).*)"],
};