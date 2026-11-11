// route.js → /sitemap.xml: sitemap index listing /en/sitemap.xml, /ar/sitemap.xml and /es/sitemap.xml.

import { sitemapIndexResponse } from "@/libs/sitemap";

export const dynamic = "force-static";

export function GET() {
  return sitemapIndexResponse();
}
