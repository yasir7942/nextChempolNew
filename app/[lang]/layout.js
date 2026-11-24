import "./globals.css";

import Footer from "./components/layout/footer";
import Topbar from "./components/navigation/topbar";
import siteConfig from "@/config/site";
import { notFound } from "next/navigation";
import SiteSchema from "./components/elements/site-schema";
import { i18n } from "@/i18n.config";
import { openSans } from "@/libs/fonts";
import GoogleTagManager, { GoogleTagManagerNoScript } from "./components/elements/google-tag-manager";

const SUPPORTED = ["en", "ar", "es"];

/*
  Pre-render every page for each language, then refresh in the background at most
  once an hour (ISR). Pages are served from cache with s-maxage headers, so
  Cloudflare can cache the HTML too. Pages that read ?page= or ?s= stay dynamic.
*/
export const revalidate = 3600;

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

// ✅ Metadata
export const metadata = {

  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://chempol.co.uk"),
  title: siteConfig.homeTitle,
  description: siteConfig.description,

  /*alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL,
    languages: {
      'en': process.env.NEXT_PUBLIC_BASE_URL,
      'ar': process.env.NEXT_PUBLIC_BASE_URL,
      'es': process.env.NEXT_PUBLIC_BASE_URL,
    },
  },*/
  alternates: {
    canonical: "/",
    languages: {
      en: "/en/",
      ar: "/ar/",
      es: "/es/",
      "x-default": "/en/",
    },
  },
  openGraph: {
    images: siteConfig.ogImage,
    locale: 'en',
    type: 'website',
  },

};
export default async function LangLayout({ children, params }) {
  // Next.js 15+: `params` is a promise and *must* be awaited :contentReference[oaicite:0]{index=0}
  const { lang } = await params;

  if (!SUPPORTED.includes(lang)) {
    notFound();
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  /*
    Root layout for all language pages, so <html> declares the page's real language
    (lang="ar" dir="rtl" on /ar/, lang="es" on /es/) for search engines and screen
    readers. The inner div keeps its dir as before.
  */
  return (
    <html lang={lang} dir={dir}>
      <body className={openSans.className}>
        {/* Google Tag Manager (GA4 runs inside it): see components/elements/google-tag-manager.js */}
        <GoogleTagManagerNoScript />
        <GoogleTagManager />
        <div dir={dir}>
          <SiteSchema lang={lang} />
          <Topbar locale={lang} />
          {children}
          <Footer locale={lang} />
        </div>
      </body>
    </html>
  );
}