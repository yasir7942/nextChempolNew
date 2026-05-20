import { NextResponse } from "next/server";
import qs from "qs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function strapiBase() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "")
        .trim()
        .replace(/\/$/, "");
}

function strapiToken() {
    return process.env.API_TOKEN || "";
}

function getMedia(media) {
    if (!media) return null;

    // already flattened
    if (media.url || media.formats) return media;

    // Strapi v4 media relation
    if (media?.data?.attributes) {
        return {
            id: media.data.id,
            ...media.data.attributes,
        };
    }

    return media;
}

function getRelationArray(value) {
    if (!value) return [];

    // already flattened array
    if (Array.isArray(value)) {
        return value.map((item) => {
            if (item?.attributes) {
                return {
                    id: item.id,
                    ...item.attributes,
                };
            }

            return item;
        });
    }

    // Strapi v4 relation array
    if (Array.isArray(value?.data)) {
        return value.data.map((item) => ({
            id: item.id,
            ...item.attributes,
        }));
    }

    return [];
}

function normalizeProduct(product) {
    if (!product) return null;

    // Strapi v4 response
    if (product.attributes) {
        const attrs = product.attributes;

        return {
            id: product.id,
            documentId: attrs.documentId || product.documentId || "",
            title: attrs.title || "",
            slug: attrs.slug || "",
            productImage: getMedia(attrs.productImage),
            product_categories: getRelationArray(attrs.product_categories),
            seo: attrs.seo || null,
        };
    }

    // Strapi v5 / already flattened response
    return {
        id: product.id,
        documentId: product.documentId || "",
        title: product.title || "",
        slug: product.slug || "",
        productImage: getMedia(product.productImage),
        product_categories: getRelationArray(product.product_categories),
        seo: product.seo || null,
    };
}

export async function GET(req) {
    try {
        const base = strapiBase();
        const token = strapiToken();

        if (!base) {
            return NextResponse.json(
                {
                    ok: false,
                    error: "NEXT_PUBLIC_API_BASE_URL is missing.",
                    data: [],
                },
                { status: 500 }
            );
        }

        const { searchParams } = new URL(req.url);

        const lang = searchParams.get("lang") || "en";
        const query = (searchParams.get("q") || "").trim();

        if (query.length <= 2) {
            return NextResponse.json({
                ok: true,
                data: [],
            });
        }

        const searchProductQuery = qs.stringify(
            {
                locale: lang,
                filters: {
                    $or: [
                        { title: { $containsi: query } },

                        { product_categories: { title: { $containsi: query } } }
                    ],
                },
                populate: ['productImage', 'product_categories', 'seo.schema'],
                pagination: {
                    pageSize: 10,
                    page: 1,
                },
            },
            {
                encodeValuesOnly: true,
            }
        );

        const url = `${base}/products?${searchProductQuery}`;


        console.log(url)


        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Content-Type": "application/json",
            "Strapi-Response-Format": "v4",
            Authorization: `Bearer ${token}`,
        };


        const res = await fetch(url, {
            method: "GET",
            headers,
            cache: "no-store",
        });

        const json = await res.json().catch(() => null);



        if (!res.ok) {
            return NextResponse.json(
                {
                    ok: false,
                    error: json?.error?.message || "Failed to fetch search products.",
                    data: [],
                },
                { status: res.status }
            );
        }

        const data = Array.isArray(json?.data)
            ? json.data.map(normalizeProduct).filter(Boolean)
            : [];

        return NextResponse.json({
            ok: true,
            data,
            meta: json?.meta || null,
        });
    } catch (error) {
        console.error("Search products API error:", error);

        return NextResponse.json(
            {
                ok: false,
                error: error?.message || "Internal server error.",
                data: [],
            },
            { status: 500 }
        );
    }
}