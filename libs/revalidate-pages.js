// Clears cached pages after Strapi content changes. Used by the Strapi webhook
// (app/api/revalidate), the YouTube import and the admin YouTube page.
import { revalidatePath, revalidateTag } from "next/cache";
import { i18n } from "@/i18n.config";
import { PRODUCT_SEARCH_TAG, clearProductSearchIndex } from "@/libs/product-search";

// Tag on every cached Strapi video read (libs/youtube/videos.js)
export const VIDEOS_TAG = "videos";

// The site uses trailing slashes; clear both spellings of a path
export function revalidateBoth(path) {
    revalidatePath(path);
    if (path === "/") return;
    revalidatePath(path.endsWith("/") ? path.slice(0, -1) : `${path}/`);
}

// subPath "" = /<lang>/, "blog" = /<lang>/blog/ ...
export function revalidateLocales(subPath) {
    for (const loc of i18n.locales) revalidateBoth(subPath ? `/${loc}/${subPath}/` : `/${loc}/`);
}

export function revalidateSite() {
    revalidatePath("/", "layout");
    for (const loc of i18n.locales) revalidatePath(`/${loc}`, "layout");
}

// Search bar and search page index (product titles, categories, descriptions)
export function revalidateProductSearch() {
    revalidateTag(PRODUCT_SEARCH_TAG);
    clearProductSearchIndex();
}

// Home page video section, the videos pages (every ?page=N) and the sitemaps that list the videos
export function revalidateVideoPages() {
    revalidateTag(VIDEOS_TAG);
    revalidateBoth("/");
    revalidateLocales("");
    revalidateLocales("videos");
    for (const loc of i18n.locales) revalidatePath(`/${loc}/sitemap.xml`);
}
