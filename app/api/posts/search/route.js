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

function normalizePost(post) {
    if (!post) return null;

    // Strapi v4 response
    if (post.attributes) {
        const attrs = post.attributes;

        return {
            id: post.id,
            documentId: attrs.documentId || post.documentId || "",
            title: attrs.title || "",
            slug: attrs.slug || "",
            PostDate: attrs.PostDate || "",
            featureImage: getMedia(attrs.featureImage),
            seo: attrs.seo || null,
        };
    }

    // Strapi v5 / already flattened response
    return {
        id: post.id,
        documentId: post.documentId || "",
        title: post.title || "",
        slug: post.slug || "",
        PostDate: post.PostDate || "",
        featureImage: getMedia(post.featureImage),
        seo: post.seo || null,
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

        const searchPostQuery = qs.stringify(
            {
                locale: lang,
                filters: {
                    $or: [
                        { title: { $containsi: query } },
                        { post_categories: { title: { $containsi: query } } },
                        { seo: { seoDesctiption: { $containsi: query } } }
                    ],
                },
                populate: ['seo', 'featureImage', 'post_categories', 'seo.schema'],

                pagination: {
                    pageSize: 10,
                    page: 1,
                },
            },
            {
                encodeValuesOnly: true,
            }
        );

        const url = `${base}/posts?${searchPostQuery}`;

        console.log(url);

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
                    error: json?.error?.message || "Failed to fetch search posts.",
                    data: [],
                },
                { status: res.status }
            );
        }

        const data = Array.isArray(json?.data)
            ? json.data.map(normalizePost).filter(Boolean)
            : [];

        return NextResponse.json({
            ok: true,
            data,
            meta: json?.meta || null,
        });
    } catch (error) {
        console.error("Search posts API error:", error);

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