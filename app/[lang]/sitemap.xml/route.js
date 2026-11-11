// route.js → /en/sitemap.xml, /ar/sitemap.xml, /es/sitemap.xml: one language's pages each,
// with hreflang alternates to the other languages. Listed by the /sitemap.xml index.

import { i18n } from "@/i18n.config";
import { localeSitemapResponse } from "@/libs/sitemap";

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return i18n.locales.map((lang) => ({ lang }));
}

export async function GET(_request, { params }) {
  const { lang } = await params;

  return localeSitemapResponse(lang);
}
