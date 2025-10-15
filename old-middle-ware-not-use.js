
{/*  

import { NextResponse } from 'next/server';
import Negotiator from 'negotiator';
import { match as matchLocale } from '@formatjs/intl-localematcher';
import { i18n } from './i18n.config'; // Ensure you have this file with locales and defaultLocale   

*/}

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
}*/

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
}*/

/* Matcher */

/*
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
*/

