import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Viscosity Index Improvers",
    slug: "viscosity-index-improvers",
};

const SSI_FIELD = "title";

const TYPE_CONFIG = {
    type: {
        endpoint: "types",
        field: "title",
        label: "Type",
    },
    product: {
        endpoint: "products",
        field: "title",
        label: "Product",
    },
    ssi: {
        endpoint: "ssis",
        field: SSI_FIELD,
        label: "SSI",
    },
};

function getViTypeEnum() {
    return ENUMS.ViscosityType || [];
}

function getSsiEnum() {
    return ENUMS.ViscositySSI || [];
}

function joinUrl(base, endpoint) {
    const cleanBase = String(base || "").trim().replace(/\/$/, "");
    const cleanEndpoint = String(endpoint || "").trim().replace(/^\//, "");
    return `${cleanBase}/${cleanEndpoint}`;
}

async function parseResponse(res) {
    const text = await res.text();

    let data = null;

    try {
        data = JSON.parse(text);
    } catch {
        data = { raw: text };
    }

    return {
        ok: res.ok,
        status: res.status,
        data,
    };
}

async function fetchData(endpoint, query = "") {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = `${joinUrl(baseUrl, endpoint)}${query ? `?${query}` : ""}`;

    console.log("==================================================");
    console.log("[vi fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[vi fetchData] status:", parsed.status);
        console.log(
            "[vi fetchData] first 1000 chars:",
            JSON.stringify(parsed.data).slice(0, 1000)
        );

        return parsed.data;
    } catch (err) {
        console.log("[vi fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log(`[vi ${method}] URL:`, url);

    if (payload) {
        console.log(`[vi ${method}] payload:`, JSON.stringify(payload, null, 2));
    }

    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
            "Strapi-Response-Format": "v4",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        cache: "no-store",
    });

    const parsed = await parseResponse(res);

    console.log(`[vi ${method}] status:`, parsed.status);
    console.log(`[vi ${method}] response:`, JSON.stringify(parsed.data, null, 2));

    return parsed;
}

const strapiPost = (endpoint, payload) => strapiRequest("POST", endpoint, payload);
const strapiPut = (endpoint, payload) => strapiRequest("PUT", endpoint, payload);
const strapiDelete = (endpoint) => strapiRequest("DELETE", endpoint);

function okJson(data = {}) {
    return NextResponse.json({
        ok: true,
        ...data,
    });
}

function errorJson(error, status = 400, details = null) {
    return NextResponse.json(
        {
            ok: false,
            error,
            ...(details ? { details } : {}),
        },
        { status }
    );
}

function getField(item, field) {
    if (!item) return "";
    if (item[field] !== undefined) return item[field];
    if (item?.attributes?.[field] !== undefined) return item.attributes[field];
    return "";
}

function sameText(a, b) {
    return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase();
}

function enumItems(values = []) {
    return values.map((value) => ({
        id: value,
        documentId: value,
        value,
        label: value,
    }));
}

function mapItems(items = [], field = "title") {
    return items.map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getField(item, field) || getField(item, "name") || `Item ${item?.id || ""}`,
    }));
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
    return items.map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getProductLabel(item),
    }));
}

function filterEnumByExisting(enumValues = [], existingItems = [], field = "title") {
    return enumItems(
        enumValues.filter((value) => {
            return !existingItems.some((item) => {
                return (
                    sameText(getField(item, field), value) ||
                    sameText(getField(item, "name"), value)
                );
            });
        })
    );
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

function relationId(item) {
    return String(item?.documentId || item?.id || "");
}

function productBelongsToStaticCategory(product) {
    return getRelationArray(product, "product_categories").some((category) => {
        return getField(category, "slug") === STATIC_CATEGORY.slug;
    });
}

function typeBelongsToStaticCategory(typeItem) {
    const category = getRelationObject(typeItem, "product_category");

    return getField(category, "slug") === STATIC_CATEGORY.slug;
}

function productTypeId(product) {
    const type = getRelationObject(product, "type");
    return relationId(type);
}

async function getStaticCategory() {
    const query = qs.stringify({
        status: "published",
        filters: {
            slug: {
                $eq: STATIC_CATEGORY.slug,
            },
        },
        fields: ["title", "slug"],
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("product-categories", query);
    return res?.data?.[0] || null;
}

async function getByDocumentId(endpoint, documentId, populate = {}) {
    if (!documentId) return null;

    const directQuery = qs.stringify({
        status: "published",
        populate,
    });

    const directRes = await fetchData(`${endpoint}/${documentId}`, directQuery);

    if (directRes?.data) {
        return directRes.data;
    }

    const query = qs.stringify({
        status: "published",
        filters: {
            documentId: {
                $eq: documentId,
            },
        },
        populate,
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData(endpoint, query);

    if (!res?.data?.[0]) {
        console.log("[getByDocumentId] not found or failed:", {
            endpoint,
            documentId,
            response: res,
        });
    }

    return res?.data?.[0] || null;
}

async function findTypeByTitleAndCategory(title, categorySlug) {
    const query = qs.stringify({
        status: "published",
        filters: {
            title: {
                $eqi: title,
            },
        },
        fields: ["title"],
        populate: {
            product_category: true,
        },
        pagination: {
            pageSize: 500,
        },
        sort: ["title:asc"],
    });

    const res = await fetchData("types", query);
    const items = res?.data || [];

    return (
        items.find((item) => {
            return sameText(getField(item, "title"), title) && typeBelongsToStaticCategory(item);
        }) || null
    );
}

async function findSsiByTitleAndTypeAndProduct({ title, typeId, productId }) {
    const query = qs.stringify({
        status: "published",
        filters: {
            [SSI_FIELD]: {
                $eqi: title,
            },
            type: {
                documentId: {
                    $eq: typeId,
                },
            },
            product: {
                documentId: {
                    $eq: productId,
                },
            },
        },
        populate: {
            type: true,
            product: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("ssis", query);
    return res?.data?.[0] || null;
}

async function getSsiCountForType(typeId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            type: {
                documentId: {
                    $eq: typeId,
                },
            },
        },
        fields: [SSI_FIELD],
        pagination: {
            pageSize: 500,
        },
    });

    const res = await fetchData("ssis", query);
    return res?.data?.length || 0;
}

async function getSsiCountForProduct(productId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            product: {
                documentId: {
                    $eq: productId,
                },
            },
        },
        fields: [SSI_FIELD],
        pagination: {
            pageSize: 500,
        },
    });

    const res = await fetchData("ssis", query);
    return res?.data?.length || 0;
}

async function getProductDosage(productId) {
    if (!productId) return null;

    const query = qs.stringify({
        status: "published",
        filters: {
            product: {
                documentId: {
                    $eq: productId,
                },
            },
        },
        fields: ["title"],
        populate: {
            product: true,
        },
        pagination: {
            pageSize: 1,
        },
        sort: ["createdAt:asc"],
    });

    const res = await fetchData("product-dosages", query);
    return res?.data?.[0] || null;
}

async function getDeleteCheck(type, documentId) {
    if (type === "product") {
        const product = await getByDocumentId("products", documentId, {
            product_categories: true,
            type: true,
            product_dosages: {
                fields: ["title"],
            },
            ssis: {
                fields: ["title"],
            },
        });

        if (!product) {
            return {
                blocked: true,
                message: "Product not found.",
            };
        }

        if (!productBelongsToStaticCategory(product)) {
            return {
                blocked: true,
                message: "Product does not belong to Viscosity Index Improvers category.",
            };
        }

        const currentTypeId = productTypeId(product);

        if (!currentTypeId) {
            return {
                blocked: true,
                message: "This Product is not connected with any Type.",
            };
        }

        const ssiCount = getRelationArray(product, "ssis").length || (await getSsiCountForProduct(documentId));

        if (ssiCount) {
            return {
                blocked: true,
                message:
                    "This Product has SSI relation data. First delete SSI relation data, then remove Product from Type.",
            };
        }

        return {
            blocked: false,
            message:
                "This will remove Type relation from Product only. Product collection record will not be deleted.",
        };
    }

    if (!TYPE_CONFIG[type]) {
        return {
            blocked: true,
            message: "Invalid delete type",
        };
    }

    if (type === "type") {
        const item = await getByDocumentId("types", documentId, {
            product_category: true,
            products: {
                fields: ["title"],
            },
            ssis: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: "Type not found",
            };
        }

        const productCount = getRelationArray(item, "products").length;
        const ssiCount = getRelationArray(item, "ssis").length || (await getSsiCountForType(documentId));

        if (productCount || ssiCount) {
            return {
                blocked: true,
                message: `This Type has relation data (${productCount} Product, ${ssiCount} SSI). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "ssi") {
        const item = await getByDocumentId("ssis", documentId, {
            type: true,
            product: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: "SSI not found",
            };
        }

        return {
            blocked: false,
        };
    }

    return {
        blocked: true,
        message: "Delete not allowed for this item",
    };
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");
        const typeId = searchParams.get("typeId");
        const productId = searchParams.get("productId");
        const type = searchParams.get("type");
        const documentId = searchParams.get("documentId");

        console.log("==================================================");
        console.log("[vi GET] mode:", mode);
        console.log("[vi GET] typeId:", typeId);
        console.log("[vi GET] productId:", productId);

        if (mode === "delete-check") {
            if (!type || !documentId) {
                return errorJson("type or documentId is missing", 400);
            }

            return okJson(await getDeleteCheck(type, documentId));
        }

        if (mode === "static-category") {
            const category = await getStaticCategory();

            return okJson({
                item: {
                    id: category?.id,
                    documentId: category?.documentId,
                    label: getField(category, "title") || STATIC_CATEGORY.title,
                    slug: getField(category, "slug") || STATIC_CATEGORY.slug,
                },
            });
        }

        if (mode === "dosage") {
            if (!productId) {
                return okJson({
                    item: null,
                });
            }

            const dosage = await getProductDosage(productId);

            return okJson({
                item: dosage
                    ? {
                        id: dosage?.id,
                        documentId: dosage?.documentId,
                        title: getField(dosage, "title"),
                    }
                    : null,
            });
        }

        if (mode === "all-types" || mode === "types") {
            const query = qs.stringify({
                status: "published",
                fields: ["title"],
                populate: {
                    product_category: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("types", query);

            const existingTypes = (res?.data || []).filter(typeBelongsToStaticCategory);

            if (mode === "all-types") {
                return okJson({
                    items: filterEnumByExisting(
                        getViTypeEnum(),
                        existingTypes,
                        "title"
                    ),
                });
            }

            return okJson({
                items: mapItems(existingTypes, "title"),
            });
        }

        if (mode === "products") {
            if (!typeId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    type: true,
                    product_dosages: true,
                    ssis: {
                        fields: ["title"],
                    },
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const products = (res?.data || [])
                .filter(productBelongsToStaticCategory)
                .filter((product) => {
                    return productTypeId(product) === String(typeId);
                });

            return okJson({
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
            const query = qs.stringify({
                status: "published",
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    type: true,
                    product_dosages: true,
                    ssis: {
                        fields: ["title"],
                    },
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const items = (res?.data || [])
                .filter(productBelongsToStaticCategory);

            return okJson({
                items: mapProductItems(items),
            });
        }

        if (mode === "all-ssis" || mode === "ssis") {
            if (!typeId || !productId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                filters: {
                    type: {
                        documentId: {
                            $eq: typeId,
                        },
                    },
                    product: {
                        documentId: {
                            $eq: productId,
                        },
                    },
                },
                fields: [SSI_FIELD],
                populate: {
                    type: true,
                    product: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: [`${SSI_FIELD}:asc`],
            });

            const res = await fetchData("ssis", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-ssis"
                        ? filterEnumByExisting(getSsiEnum(), items, SSI_FIELD)
                        : mapItems(items, SSI_FIELD),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[vi GET ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        const { type, title, typeId, productId, dosageId } = body;

        console.log("==================================================");
        console.log("[vi POST] body:", body);

        if (!type) {
            return errorJson("type is missing", 400);
        }

        if (!title && type !== "product") {
            return errorJson("title is missing", 400);
        }

        if (type === "dosage") {
            if (!productId) {
                return errorJson("productId is missing", 400);
            }

            if (!title?.trim()) {
                return errorJson("Dosage title is missing", 400);
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                product_dosages: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Viscosity Index Improvers category",
                    400
                );
            }

            let existingDosage = null;

            if (dosageId) {
                existingDosage = await getByDocumentId("product-dosages", dosageId, {
                    product: true,
                });
            }

            if (!existingDosage) {
                existingDosage = await getProductDosage(productId);
            }

            if (existingDosage?.documentId) {
                const updated = await strapiPut(
                    `product-dosages/${existingDosage.documentId}?status=published`,
                    {
                        data: {
                            title: title.trim(),
                            product: productId,
                        },
                    }
                );

                if (!updated.ok) {
                    return errorJson("Failed to update Dosage", updated.status, updated.data);
                }

                return okJson({
                    item: updated.data?.data || null,
                });
            }

            const created = await strapiPost("product-dosages?status=published", {
                data: {
                    title: title.trim(),
                    product: productId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create Dosage", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        if (type === "type") {
            if (!title) {
                return errorJson("title is missing", 400);
            }

            if (await findTypeByTitleAndCategory(title, STATIC_CATEGORY.slug)) {
                return errorJson("This Type already exists for this category", 409);
            }

            const category = await getStaticCategory();

            if (!category?.documentId) {
                return errorJson("Product category not found", 404);
            }

            const created = await strapiPost("types?status=published", {
                data: {
                    title,
                    product_category: category.documentId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create Type", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        if (type === "product") {
            if (!typeId || !productId) {
                return errorJson("typeId or productId missing", 400);
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                type: true,
            });

            if (!product) {
                return errorJson(
                    "Product not found in published Viscosity Index Improvers category",
                    404
                );
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Viscosity Index Improvers category",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            /*  if (currentTypeId && String(currentTypeId) === String(typeId)) {
                  return errorJson("This Product already exists in selected Type", 409);
              }  */

            /* if (currentTypeId && String(currentTypeId) !== String(typeId)) {
                 return errorJson("This Product already has another Type", 409);
                 
             } */

            const updated = await strapiPut(`products/${productId}?status=published`, {
                data: {
                    type: typeId,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to connect Product with Type",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || null,
            });
        }

        if (type === "ssi") {
            if (!typeId || !productId || !title) {
                return errorJson("typeId, productId or title is missing", 400);
            }

            const typeItem = await getByDocumentId("types", typeId, {
                product_category: true,
            });

            if (!typeItem) {
                return errorJson("Type not found", 404);
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                type: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Viscosity Index Improvers category",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (String(currentTypeId) !== String(typeId)) {
                return errorJson(
                    "Selected Product is not connected with selected Type",
                    400
                );
            }

            const duplicate = await findSsiByTitleAndTypeAndProduct({
                title,
                typeId,
                productId,
            });

            if (duplicate) {
                return errorJson(
                    "This SSI already exists for this Type and Product",
                    409
                );
            }

            const created = await strapiPost("ssis?status=published", {
                data: {
                    [SSI_FIELD]: title,
                    type: typeId,
                    product: productId,
                },
            });

            if (!created.ok) {
                return errorJson(
                    "Failed to create SSI. Check SSI schema has field title and relation fields: type and product.",
                    created.status,
                    created.data
                );
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        return errorJson("Invalid type", 400);
    } catch (err) {
        console.log("[vi POST ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();

        const { type, documentId } = body;

        if (!type || !documentId) {
            return errorJson("type or documentId is missing", 400);
        }

        if (!TYPE_CONFIG[type]) {
            return errorJson("Invalid delete type", 400);
        }

        const check = await getDeleteCheck(type, documentId);

        if (check.blocked) {
            return errorJson(check.message || "This item cannot be deleted", 409);
        }

        if (type === "product") {
            const product = await getByDocumentId("products", documentId, {
                product_categories: true,
                type: true,
                ssis: {
                    fields: ["title"],
                },
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Viscosity Index Improvers category.",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (!currentTypeId) {
                return errorJson("This Product is not connected with any Type.", 400);
            }

            const ssiCount = getRelationArray(product, "ssis").length || (await getSsiCountForProduct(documentId));

            if (ssiCount) {
                return errorJson(
                    "This Product has SSI relation data. First delete SSI relation data, then remove Product from Type.",
                    409
                );
            }

            const updated = await strapiPut(`products/${documentId}?status=published`, {
                data: {
                    type: null,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to remove Product relation from Type",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || null,
            });
        }

        if (type === "ssi") {
            const deleted = await strapiDelete(`ssis/${documentId}`);

            if (!deleted.ok) {
                return errorJson("Failed to delete SSI", deleted.status, deleted.data);
            }

            return okJson({
                item: deleted.data?.data || null,
            });
        }

        const cfg = TYPE_CONFIG[type];

        const deleted = await strapiDelete(`${cfg.endpoint}/${documentId}`);

        if (!deleted.ok) {
            return errorJson(`Failed to delete ${cfg.label}`, deleted.status, deleted.data);
        }

        return okJson({
            item: deleted.data?.data || null,
        });
    } catch (err) {
        console.log("[vi DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}