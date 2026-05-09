import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

const STATIC_CATEGORY = {
    title: "Speciality Chemicals",
    slug: "speciality-chemicals",
};

function joinUrl(base, endpoint) {
    const cleanBase = String(base || "").trim().replace(/\/$/, "");
    const cleanEndpoint = String(endpoint || "").trim().replace(/^\//, "");
    return `${cleanBase}/${cleanEndpoint}`;
}

async function fetchData(endpoint, query = "") {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = `${joinUrl(baseUrl, endpoint)}${query ? `?${query}` : ""}`;

    console.log("==================================================");
    console.log("[speciality fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const text = await res.text();

        console.log("[speciality fetchData] status:", res.status);
        console.log("[speciality fetchData] first 800 chars:", text.slice(0, 800));

        try {
            return JSON.parse(text);
        } catch (error) {
            console.log("[speciality fetchData] Invalid JSON:", error);
            return null;
        }
    } catch (err) {
        console.log("[speciality fetchData] ERROR:", err);
        return null;
    }
}

async function strapiPost(endpoint, payload) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log("[speciality strapiPost] URL:", url);
    console.log("[speciality strapiPost] payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Strapi-Response-Format": "v4",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    const text = await res.text();

    let data = null;

    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }

    console.log("[speciality strapiPost] status:", res.status);
    console.log("[speciality strapiPost] response:", JSON.stringify(data, null, 2));

    return {
        ok: res.ok,
        status: res.status,
        data,
    };
}

async function strapiPut(endpoint, payload) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log("[speciality strapiPut] URL:", url);
    console.log("[speciality strapiPut] payload:", JSON.stringify(payload, null, 2));

    const res = await fetch(url, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            "Strapi-Response-Format": "v4",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        cache: "no-store",
    });

    const text = await res.text();

    let data = null;

    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }

    console.log("[speciality strapiPut] status:", res.status);
    console.log("[speciality strapiPut] response:", JSON.stringify(data, null, 2));

    return {
        ok: res.ok,
        status: res.status,
        data,
    };
}

function getField(item, field) {
    if (!item) return "";

    if (item[field] !== undefined) return item[field];

    if (item?.attributes?.[field] !== undefined) {
        return item.attributes[field];
    }

    return "";
}

function enumItems(values = []) {
    return values.map((value) => ({
        id: value,
        documentId: value,
        value,
        label: value,
    }));
}

function getRelationArray(item, relationName) {
    const rel = item?.[relationName] || item?.attributes?.[relationName];

    if (Array.isArray(rel)) return rel;
    if (Array.isArray(rel?.data)) return rel.data;

    return [];
}

function getRelationObject(item, relationName) {
    const rel = item?.[relationName] || item?.attributes?.[relationName];

    if (!rel) return null;
    if (rel?.data) return rel.data;

    return rel;
}

function getProductLabel(item) {
    return (
        getField(item, "title") ||
        getField(item, "name") ||
        getField(item, "productName") ||
        getField(item, "productTitle") ||
        getField(item, "slug") ||
        `Product ${item?.id || ""}`
    );
}

function mapProductItems(items = []) {
    return (items || []).map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getProductLabel(item),
    }));
}

function productBelongsToStaticCategory(product) {
    const categories = getRelationArray(product, "product_categories");

    return categories.some((category) => {
        const slug = getField(category, "slug");
        return slug === STATIC_CATEGORY.slug;
    });
}

function productHasAnyType(product) {
    const type = getRelationObject(product, "type");
    return Boolean(type?.documentId || type?.id);
}

async function getStaticCategory() {
    const query = qs.stringify({
        status: "published",
        filters: {
            slug: {
                $eq: STATIC_CATEGORY.slug,
            },
        },
        populate: {
            types: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("product-categories", query);
    return res?.data?.[0] || null;
}

async function findTypeByTitleAndCategory(title, categoryDocumentId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            title: {
                $eqi: title,
            },
            product_category: {
                documentId: {
                    $eq: categoryDocumentId,
                },
            },
        },
        populate: {
            product_category: true,
            products: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("types", query);
    return res?.data?.[0] || null;
}

async function findOrCreateTypeByTitle(title) {
    const category = await getStaticCategory();
    const categoryDocumentId = category?.documentId || category?.id;

    if (!categoryDocumentId) {
        return {
            ok: false,
            status: 404,
            error: "Product category not found",
            details: null,
            item: null,
        };
    }

    let typeItem = await findTypeByTitleAndCategory(title, categoryDocumentId);

    if (typeItem) {
        return {
            ok: true,
            status: 200,
            item: typeItem,
        };
    }

    const createdType = await strapiPost("types?status=published", {
        data: {
            title,
            product_category: categoryDocumentId,
        },
    });

    if (!createdType.ok) {
        return {
            ok: false,
            status: createdType.status,
            error: "Failed to create Type",
            details: createdType.data,
            item: null,
        };
    }

    return {
        ok: true,
        status: 200,
        item: createdType.data?.data || null,
    };
}

async function getTypeDocumentIdFromEnumValue(typeTitle) {
    const category = await getStaticCategory();
    const categoryDocumentId = category?.documentId || category?.id;

    if (!categoryDocumentId) return null;

    const typeItem = await findTypeByTitleAndCategory(typeTitle, categoryDocumentId);

    if (!typeItem) return null;

    return typeItem?.documentId || typeItem?.id || null;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");
        const typeId = searchParams.get("typeId");

        console.log("==================================================");
        console.log("[speciality GET] mode:", mode);
        console.log("[speciality GET] typeId:", typeId);

        if (mode === "static-category") {
            const category = await getStaticCategory();

            return NextResponse.json({
                ok: true,
                item: {
                    id: category?.id,
                    documentId: category?.documentId,
                    label: getField(category, "title") || STATIC_CATEGORY.title,
                    slug: getField(category, "slug") || STATIC_CATEGORY.slug,
                },
            });
        }

        if (mode === "types") {
            return NextResponse.json({
                ok: true,
                items: enumItems(ENUMS.SpecialityType || []),
            });
        }

        if (mode === "products") {
            if (!typeId) return NextResponse.json({ ok: true, items: [] });

            const typeDocumentId = await getTypeDocumentIdFromEnumValue(typeId);

            if (!typeDocumentId) {
                return NextResponse.json({ ok: true, items: [] });
            }

            const query = qs.stringify({
                status: "published",
                filters: {
                    product_categories: {
                        slug: {
                            $eq: STATIC_CATEGORY.slug,
                        },
                    },
                    type: {
                        documentId: {
                            $eq: typeDocumentId,
                        },
                    },
                },
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    type: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const products = (res?.data || []).filter((product) =>
                productBelongsToStaticCategory(product)
            );

            return NextResponse.json({
                ok: true,
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
            if (!typeId) return NextResponse.json({ ok: true, items: [] });

            const query = qs.stringify({
                status: "published",
                filters: {
                    product_categories: {
                        slug: {
                            $eq: STATIC_CATEGORY.slug,
                        },
                    },
                },
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    type: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const categoryProducts = (res?.data || []).filter((product) =>
                productBelongsToStaticCategory(product)
            );

            const availableProducts = categoryProducts.filter((product) => {
                return !productHasAnyType(product);
            });

            return NextResponse.json({
                ok: true,
                items: mapProductItems(availableProducts),
            });
        }

        return NextResponse.json(
            { ok: false, error: "Invalid mode" },
            { status: 400 }
        );
    } catch (err) {
        console.log("[speciality GET ERROR]", err);

        return NextResponse.json(
            {
                ok: false,
                error: err.message || "Server error",
            },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        const {
            type,
            typeId,
            productId,
        } = body;

        console.log("==================================================");
        console.log("[speciality POST] body:", body);

        if (!type) {
            return NextResponse.json(
                { ok: false, error: "type is missing" },
                { status: 400 }
            );
        }

        if (type === "product") {
            if (!typeId || !productId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "typeId or productId missing",
                    },
                    { status: 400 }
                );
            }

            const typeResult = await findOrCreateTypeByTitle(typeId);

            if (!typeResult.ok || !typeResult.item) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: typeResult.error || "Failed to find/create Type",
                        details: typeResult.details || null,
                    },
                    { status: typeResult.status || 500 }
                );
            }

            const typeItem = typeResult.item;
            const typeDocumentId = typeItem?.documentId || typeItem?.id;

            if (!typeDocumentId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Type documentId not found",
                    },
                    { status: 500 }
                );
            }

            const checkProductQuery = qs.stringify({
                status: "published",
                filters: {
                    documentId: {
                        $eq: productId,
                    },
                    product_categories: {
                        slug: {
                            $eq: STATIC_CATEGORY.slug,
                        },
                    },
                },
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    type: true,
                },
                pagination: {
                    pageSize: 1,
                },
            });

            const checkProductRes = await fetchData("products", checkProductQuery);
            const product = checkProductRes?.data?.[0] || null;

            if (!product) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Product not found in published Speciality Chemicals category",
                    },
                    { status: 404 }
                );
            }

            if (!productBelongsToStaticCategory(product)) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Product does not belong to Speciality Chemicals category",
                    },
                    { status: 400 }
                );
            }

            if (productHasAnyType(product)) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Product already has Type",
                    },
                    { status: 409 }
                );
            }

            const updated = await strapiPut(`products/${productId}?status=published`, {
                data: {
                    type: typeDocumentId,
                },
            });

            if (!updated.ok) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Failed to connect Product with Type",
                        details: updated.data,
                    },
                    { status: updated.status }
                );
            }

            return NextResponse.json({
                ok: true,
                item: updated.data?.data || null,
            });
        }

        return NextResponse.json(
            { ok: false, error: "Invalid type" },
            { status: 400 }
        );
    } catch (err) {
        console.log("[speciality POST ERROR]", err);

        return NextResponse.json(
            { ok: false, error: err.message || "Server error" },
            { status: 500 }
        );
    }
}