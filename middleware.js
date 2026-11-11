

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
import { redirectKey } from "@/libs/redirect-validator";
import { findRedirect } from "@/libs/redirects/lookup";
import { CHECK_HEADER, checkHeaderValue } from "@/libs/redirects/paths";

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

/*
    www → non-www (301). Canonical tags point to https://chempol.co.uk, so the www
    host must not serve pages. Behind the proxy the public host is in x-forwarded-host.
*/
function redirectWww(request) {
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
        .split(",")[0]
        .trim()
        .toLowerCase();

    if (!host.startsWith("www.")) return null;

    const { pathname, search } = request.nextUrl;
    const target = new URL(`https://${host.slice(4).replace(/:\d+$/, "")}${pathname}${search}`);

    return NextResponse.redirect(target, 301);
}

// Redirects from Strapi are always permanent
const STRAPI_REDIRECT_STATUS = 301;

// Applies the redirects managed in Strapi (built by libs/redirects/sync.js)
function strapiRedirect(request) {
    // Destination checks from the redirect sync must see the site without redirects
    const checkValue = checkHeaderValue();
    if (checkValue && request.headers.get(CHECK_HEADER) === checkValue) return null;

    const { pathname } = request.nextUrl;
    const redirect = findRedirect(pathname);
    if (!redirect) return null;

    const target = new URL(redirect.destination, request.url);

    // Last-line loop guard (the sync already rejects these): never redirect a page to itself
    if (target.origin === request.nextUrl.origin && redirectKey(target.pathname) === redirectKey(pathname)) {
        return null;
    }

    // Keep the visitor's query string (utm_*, gclid, ...) unless the destination sets the same key
    const ownKeys = new Set(target.searchParams.keys());
    for (const [key, value] of request.nextUrl.searchParams) {
        if (key !== "_rsc" && !ownKeys.has(key)) target.searchParams.append(key, value);
    }

    return NextResponse.redirect(target, STRAPI_REDIRECT_STATUS);
}

export function middleware(request) {
    const pathname = request.nextUrl.pathname;

    // runs before the skip list so robots.txt, sitemap.xml and images redirect too
    const wwwRedirect = redirectWww(request);
    if (wwwRedirect) return wwwRedirect;

    // Strapi redirects are old paths without a locale (/product/x/), so they run before
    // the skip list and the locale redirect
    const redirect = strapiRedirect(request);
    if (redirect) return redirect;

    // ✅ skip next internals + static files + uploads (IMPORTANT)
    if (
        pathname.startsWith("/_next/") ||
        pathname === "/admin" ||
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
    // Node.js (not Edge): the Strapi redirect lookup reads .redirects/redirects.json
    runtime: "nodejs",
    // Everything except Next.js internals and API routes (`api/` is also excluded from
    // the www redirect; those routes are not crawled pages)
    matcher: ["/((?!api/|_next/static|_next/image|favicon.ico).*)"],
};