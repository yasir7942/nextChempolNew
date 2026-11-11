// app/api/admin/product-report/route.js
// Data for /admin/product-report/: always fresh from Strapi, in one response.
// Chempol's product categories are flat (no parent/child), so each category carries
// its own products and the report has no separate child category lookup.
import { NextResponse } from "next/server";
import { getAdminUser } from "@/libs/admin-auth";
import { getReportProductCategoryList, getUncategorizedProducts } from "@/app/[lang]/data/loader";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

// Only the fields the report shows, to keep the response small
const media = (file) => (file?.url ? { url: file.url, alternativeText: file.alternativeText ?? null } : null);

// Strapi 5 returns relations as arrays; Strapi 4 (flattened) as { data: [] }
const list = (relation) => (Array.isArray(relation) ? relation : relation?.data || []);

// name, grade, api, acea and packing don't exist on Chempol products: the report shows "---".
// Packing is filled from tdsPacking, the packing text on the product.
const product = (item) => ({
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
    productImage: media(item.productImage),
    TDSFile: media(item.TDSFile),
    MSDSFile: media(item.MSDSFile),
});

const category = (item) => ({
    id: item.id,
    documentId: item.documentId ?? null,
    title: item.title,
    slug: item.slug,
    index: item.index,
    image: media(item.image),
    bImage: media(item.bImage),
    banner: item.banner
        ? { webBanner: media(item.banner.webBanner), mobileBanner: media(item.banner.mobileBanner) }
        : null,
    products: { data: list(item.products).map(product) },
});

export async function GET() {
    if (!(await getAdminUser())) {
        return NextResponse.json(
            { success: false, error: "Not logged in. Please log in to the admin again." },
            { status: 401, headers: NO_STORE }
        );
    }

    const [categories, uncategorized] = await Promise.all([
        getReportProductCategoryList(),
        getUncategorizedProducts(),
    ]);

    // The report loaders return null when Strapi is unreachable or answers with an error
    if (!categories || !uncategorized) {
        return NextResponse.json(
            { success: false, error: "Could not load product data from Strapi. Please try again." },
            { status: 502, headers: NO_STORE }
        );
    }

    return NextResponse.json(
        {
            success: true,
            fetchedAt: new Date().toISOString(),
            categories: (categories.data || []).map(category),
            uncategorized: uncategorized.map(product),
        },
        { headers: NO_STORE }
    );
}
