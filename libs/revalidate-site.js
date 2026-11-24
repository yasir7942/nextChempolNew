import "server-only";

// Refreshes everything Strapi feeds. One function for the admin "Revalidate from Strapi" button
// (app/api/admin/cache), the manual link /api/revalidate?model=all and the site-wide Strapi webhooks,
// so they always do the same thing.
import { revalidatePath } from "next/cache";
import { i18n } from "@/i18n.config";
import { revalidateProductSearch, revalidateSite } from "@/libs/revalidate-pages";

// /sitemap.xml is the sitemap index; each language has its own /<lang>/sitemap.xml
const SITEMAPS = ["/sitemap.xml", ...i18n.locales.map((loc) => `/${loc}/sitemap.xml`)];

// Marks every page as outdated; each one is rebuilt on its next visit. Returns what was revalidated.
export function revalidateWholeSite() {
    revalidateSite(); // "/" layout (every page) and each /<lang> layout
    revalidatePath("/");
    revalidateProductSearch(); // search bar and search page index
    for (const path of SITEMAPS) revalidatePath(path);

    return [
        "/ (layout)",
        ...i18n.locales.map((loc) => `/${loc} (layout)`),
        "/",
        "product search",
        ...SITEMAPS,
    ];
}
