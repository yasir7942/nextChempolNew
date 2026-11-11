// robots.js → /robots.txt. Points crawlers to the sitemap; keeps the internal admin tool and API out of the index.

import { getSiteUrl } from "@/libs/schema/entity";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api/"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
