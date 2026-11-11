// app/api/admin/product-report/route.js
// Data for /admin/product-report/: always fresh from Strapi, in one response.
// Chempol's product categories are flat (no parent/child), so each category carries
// its own products and the report has no separate child category lookup.
import { NextResponse } from "next/server";
import { getAdminUser } from "@/libs/admin-auth";
import { getCategoryPostCounts, getProductsByLocaleForReport, getReportProductCategoryList, getUncategorizedProducts } from "@/app/[lang]/data/loader";
import { translationStatus } from "@/libs/translation-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Only the fields the report shows, to keep the response small
const media = (file) => (file?.url ? { url: file.url, alternativeText: file.alternativeText ?? null } : null);

// Strapi 5 returns relations as arrays; Strapi 4 (flattened) as { data: [] }
const list = (relation) => (Array.isArray(relation) ? relation : relation?.data || []);

// shortDescription is a rich-text (blocks) field: true when it has any text, the text itself is not sent
const hasText = (node) =>
    Array.isArray(node) ? node.some(hasText) : Boolean(node && (String(node.text ?? "").trim() || hasText(node.children)));

// name, grade, api, acea and packing don't exist on Chempol products: the report shows "---".
// Packing is filled from tdsPacking, the packing text on the product.
const TRANSLATION_LOCALES = ["ar", "es"];

const product = (item, translations) => ({
    id: item.id,
    documentId: item.documentId ?? null,
    title: item.title,
    name: item.name,
    slug: item.slug,
    publishedAt: item.publishedAt,
    grade: item.grade,
    api: item.api,
    acea: item.acea,
    packing: item.packing ?? item.tdsPacking,
    hasShortDescription: hasText(item.shortDescription),
    hasDescription: hasText(item.description),
    blockIndex: Boolean(item.seo?.preventIndexing),
    seoTitle: String(item.seo?.seoTitle ?? "").trim(),
    seoDescription: String(item.seo?.seoDesctiption ?? "").trim(),
    translations: Object.fromEntries(
        TRANSLATION_LOCALES.map((locale) => [locale, translationStatus(item, translations[locale].get(item.documentId))])
    ),
    faqCount: list(item.faq).filter((faq) => String(faq?.question ?? "").trim() && String(faq?.answer ?? "").trim()).length,
    productImage: media(item.productImage),
    TDSFile: media(item.TDSFile),
    MSDSFile: media(item.MSDSFile),
});

const category = (item, translations, postCounts) => ({
    id: item.id,
    documentId: item.documentId ?? null,
    title: item.title,
    slug: item.slug,
    index: item.index,
    postCount: postCounts.get(item.documentId) ?? 0,
    image: media(item.image),
    bImage: media(item.bImage),
    banner: item.banner
        ? { webBanner: media(item.banner.webBanner), mobileBanner: media(item.banner.mobileBanner) }
        : null,
    products: { data: list(item.products).map((entry) => product(entry, translations)) },
});

// Entries of `translated` whose document has no English version
const onlyIn = (translated, english) =>
    [...translated.values()]
        .filter((entry) => !english.has(entry.documentId))
        .map((entry) => ({ id: entry.id, documentId: entry.documentId, title: entry.title, slug: entry.slug }));

export async function GET() {
    if (!(await getAdminUser())) {
        return NextResponse.json(
            { success: false, error: "Not logged in. Please log in to the admin again." },
            { status: 401, headers: NO_STORE }
        );
    }

    const [categories, uncategorized, ar, es, en, postCounts] = await Promise.all([
        getReportProductCategoryList(),
        getUncategorizedProducts(),
        getProductsByLocaleForReport("ar"),
        getProductsByLocaleForReport("es"),
        getProductsByLocaleForReport("en"),
        getCategoryPostCounts(),
    ]);
    const translations = { ar, es };

    // The report loaders return null when Strapi is unreachable or answers with an error
    if (!categories || !uncategorized || !ar || !es || !en || !postCounts) {
        return NextResponse.json(
            { success: false, error: "Could not load product data from Strapi. Please try again." },
            { status: 502, headers: NO_STORE }
        );
    }

    return NextResponse.json(
        {
            success: true,
            fetchedAt: new Date().toISOString(),
            categories: (categories.data || []).map((entry) => category(entry, translations, postCounts)),
            uncategorized: uncategorized.map((entry) => product(entry, translations)),
            // Products that exist only in Arabic / only in Spanish (no English version)
            translationOnly: {
                ar: onlyIn(ar, en),
                es: onlyIn(es, en),
            },
        },
        { headers: NO_STORE }
    );
}
