// Search bar suggestions: GET /api/products/search?lang=ar&q=rust
// Matches every language and returns the products in `lang` (see libs/product-search.js).
import { NextResponse } from "next/server";
import { i18n } from "@/i18n.config";
import { searchProducts, warmProductSearch } from "@/libs/product-search";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;

export async function GET(req) {
    const { searchParams } = new URL(req.url);

    const lang = i18n.locales.includes(searchParams.get("lang")) ? searchParams.get("lang") : i18n.defaultLocale;
    const query = (searchParams.get("q") || "").trim().slice(0, MAX_QUERY_LENGTH);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit"), 10) || 10, 1), 50);

    // No query (sent when the search box gets focus): get the index ready for the first letters
    if (query.length < MIN_QUERY_LENGTH) {
        warmProductSearch();
        return NextResponse.json({ ok: true, data: [], total: 0 });
    }

    try {
        const { data, total } = await searchProducts(lang, query, { limit });

        return NextResponse.json(
            { ok: true, data, total },
            // the same query typed again in this browser is answered without a request
            { headers: { "Cache-Control": "private, max-age=60" } }
        );
    } catch (error) {
        console.error("Search products API error:", error);
        return NextResponse.json({ ok: false, error: "Search is not available right now.", data: [] }, { status: 503 });
    }
}
