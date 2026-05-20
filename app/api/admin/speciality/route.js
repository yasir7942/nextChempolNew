import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Speciality Chemicals",
    slug: "speciality-chemicals",
};

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
};

function getTypeEnum() {
    return ENUMS.SpecialityType || [];
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
        data = {
            raw: text,
        };
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
    console.log("[speciality fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[speciality fetchData] status:", parsed.status);
        console.log(
            "[speciality fetchData] first 1000 chars:",
            JSON.stringify(parsed.data).slice(0, 1000)
        );

        return parsed.data;
    } catch (err) {
        console.log("[speciality fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log(`[speciality ${method}] URL:`, url);

    if (payload) {
        console.log(
            `[speciality ${method}] payload:`,
            JSON.stringify(payload, null, 2)
        );
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

    console.log(`[speciality ${method}] status:`, parsed.status);
    console.log(
        `[speciality ${method}] response:`,
        JSON.stringify(parsed.data, null, 2)
    );

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
        {
            status,
        }
    );
}

function getField(item, field) {
    if (!item) return "";

    if (item[field] !== undefined) {
        return item[field];
    }

    if (item?.attributes?.[field] !== undefined) {
        return item.attributes[field];
    }

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
        label:
            getField(item, field) ||
            getField(item, "name") ||
            `Item ${item?.id || ""}`,
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
    if (Array.isArray(rel)) return rel[0] || null;

    return rel;
}

function relationId(item) {
    return String(item?.documentId || item?.id || "");
}

function categoryMatches(cat, category = null) {
    if (!cat) return false;

    const targetSlug = STATIC_CATEGORY.slug;
    const targetTitle = STATIC_CATEGORY.title;
    const targetDocumentId = String(category?.documentId || "");
    const targetId = String(category?.id || "");

    const catSlug = String(getField(cat, "slug") || "");
    const catTitle = String(getField(cat, "title") || "");
    const catDocumentId = String(cat?.documentId || "");
    const catId = String(cat?.id || "");

    if (catSlug && catSlug === targetSlug) return true;
    if (catTitle && sameText(catTitle, targetTitle)) return true;
    if (targetDocumentId && catDocumentId && catDocumentId === targetDocumentId) return true;
    if (targetId && catId && catId === targetId) return true;

    return false;
}

function productBelongsToStaticCategory(product, category = null) {
    const manyCategories = getRelationArray(product, "product_categories");

    if (manyCategories.some((cat) => categoryMatches(cat, category))) {
        return true;
    }

    const singleCategory = getRelationObject(product, "product_category");

    if (categoryMatches(singleCategory, category)) {
        return true;
    }

    return false;
}

function typeBelongsToStaticCategory(typeItem, category = null) {
    const singleCategory = getRelationObject(typeItem, "product_category");

    if (categoryMatches(singleCategory, category)) {
        return true;
    }

    const manyCategories = getRelationArray(typeItem, "product_categories");

    if (manyCategories.some((cat) => categoryMatches(cat, category))) {
        return true;
    }

    return false;
}

function productTypeId(product) {
    const type = getRelationObject(product, "type");
    return relationId(type);
}

async function getStaticCategory() {
    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("product-categories", query);
    return res?.data?.[0] || null;
}

async function getByDocumentId(endpoint, documentId, populate = {}) {
    if (!documentId) return null;

    const wanted = String(documentId);

    const directQuery = qs.stringify(
        {
            status: "published",
            populate,
        },
        {
            encodeValuesOnly: true,
        }
    );

    const directRes = await fetchData(`${endpoint}/${wanted}`, directQuery);

    if (directRes?.data) {
        return directRes.data;
    }

    const docQuery = qs.stringify(
        {
            status: "published",
            filters: {
                documentId: {
                    $eq: wanted,
                },
            },
            populate,
            pagination: {
                pageSize: 1,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const docRes = await fetchData(endpoint, docQuery);

    if (docRes?.data?.[0]) {
        return docRes.data[0];
    }

    const idQuery = qs.stringify(
        {
            status: "published",
            filters: {
                id: {
                    $eq: wanted,
                },
            },
            populate,
            pagination: {
                pageSize: 1,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const idRes = await fetchData(endpoint, idQuery);

    if (idRes?.data?.[0]) {
        return idRes.data[0];
    }

    const allQuery = qs.stringify(
        {
            status: "published",
            populate: "*",
            pagination: {
                pageSize: 1000,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const allRes = await fetchData(endpoint, allQuery);
    const allItems = allRes?.data || [];

    const found = allItems.find((item) => {
        return (
            String(item?.documentId || "") === wanted ||
            String(item?.id || "") === wanted
        );
    });

    if (found) {
        return found;
    }

    console.log("[speciality getByDocumentId] not found after all attempts:", {
        endpoint,
        documentId: wanted,
        directRes,
        docRes,
        idRes,
        allCount: allItems.length,
    });

    return null;
}

async function getProductDosage(productId) {
    if (!productId) return null;

    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("product-dosages", query);
    return res?.data?.[0] || null;
}

async function findTypeByTitleAndCategory(title) {
    const category = await getStaticCategory();

    if (!category?.documentId && !category?.id) {
        return null;
    }

    const query = qs.stringify(
        {
            status: "published",
            filters: {
                $or: [
                    {
                        title: {
                            $eqi: title,
                        },
                    },
                    {
                        name: {
                            $eqi: title,
                        },
                    },
                ],
            },
            populate: "*",
            pagination: {
                pageSize: 500,
            },
            sort: ["title:asc"],
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("types", query);
    const items = res?.data || [];

    return (
        items.find((item) => {
            const sameTitle =
                sameText(getField(item, "title"), title) ||
                sameText(getField(item, "name"), title);

            if (!sameTitle) return false;

            return typeBelongsToStaticCategory(item, category);
        }) || null
    );
}

async function createTypeWithCategory(title, categoryDocumentId) {
    const attempts = [
        {
            endpoint: "types?status=published",
            data: {
                title,
                product_category: categoryDocumentId,
            },
        },
        {
            endpoint: "types?status=published",
            data: {
                title,
                product_categories: [categoryDocumentId],
            },
        },
        {
            endpoint: "types",
            data: {
                title,
                product_category: categoryDocumentId,
            },
        },
        {
            endpoint: "types",
            data: {
                title,
                product_categories: [categoryDocumentId],
            },
        },
        {
            endpoint: "types?status=published",
            data: {
                name: title,
                product_category: categoryDocumentId,
            },
        },
        {
            endpoint: "types?status=published",
            data: {
                name: title,
                product_categories: [categoryDocumentId],
            },
        },
        {
            endpoint: "types",
            data: {
                name: title,
                product_category: categoryDocumentId,
            },
        },
        {
            endpoint: "types",
            data: {
                name: title,
                product_categories: [categoryDocumentId],
            },
        },
    ];

    let lastResult = null;

    for (const item of attempts) {
        const result = await strapiPost(item.endpoint, {
            data: item.data,
        });

        if (result.ok) {
            return result;
        }

        lastResult = result;
    }

    return lastResult;
}

async function getDeleteCheck(type, documentId) {
    if (type === "product") {
        const category = await getStaticCategory();

        const product = await getByDocumentId("products", documentId, {
            product_categories: true,
            product_category: true,
            type: true,
            product_dosages: {
                fields: ["title"],
            },
        });

        if (!product) {
            return {
                blocked: true,
                message: "Product not found.",
            };
        }

        if (!productBelongsToStaticCategory(product, category)) {
            return {
                blocked: true,
                message: "Product does not belong to Speciality Chemicals category.",
            };
        }

        const currentTypeId = productTypeId(product);

        if (!currentTypeId) {
            return {
                blocked: true,
                message: "This Product is not connected with any Type.",
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
        const category = await getStaticCategory();

        const item = await getByDocumentId("types", documentId, {
            product_category: true,
            product_categories: true,
            products: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: `Type not found for documentId: ${documentId}. Please refresh page and try again.`,
            };
        }

        if (!typeBelongsToStaticCategory(item, category)) {
            return {
                blocked: true,
                message: "This Type does not belong to Speciality Chemicals category.",
            };
        }

        const productCount = getRelationArray(item, "products").length;

        if (productCount) {
            return {
                blocked: true,
                message: `This Type has relation data (${productCount} Product). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    return {
        blocked: true,
        message: "Delete not allowed for this item.",
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
        console.log("[speciality GET] mode:", mode);
        console.log("[speciality GET] typeId:", typeId);
        console.log("[speciality GET] productId:", productId);

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
            const category = await getStaticCategory();

            if (!category?.documentId && !category?.id) {
                return okJson({
                    items: mode === "all-types" ? enumItems(getTypeEnum()) : [],
                });
            }

            const query = qs.stringify(
                {
                    status: "published",
                    populate: "*",
                    pagination: {
                        pageSize: 1000,
                    },
                    sort: ["title:asc"],
                },
                {
                    encodeValuesOnly: true,
                }
            );

            const res = await fetchData("types", query);
            const allTypes = res?.data || [];

            const existingTypes = allTypes.filter((item) => {
                return typeBelongsToStaticCategory(item, category);
            });

            if (mode === "all-types") {
                return okJson({
                    items: filterEnumByExisting(
                        getTypeEnum(),
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

            const category = await getStaticCategory();

            const query = qs.stringify(
                {
                    status: "published",
                    populate: "*",
                    pagination: {
                        pageSize: 1000,
                    },
                    sort: ["title:asc"],
                },
                {
                    encodeValuesOnly: true,
                }
            );

            const res = await fetchData("products", query);

            const products = (res?.data || [])
                .filter((product) => productBelongsToStaticCategory(product, category))
                .filter((product) => productTypeId(product) === String(typeId));

            return okJson({
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
            const category = await getStaticCategory();

            const query = qs.stringify(
                {
                    status: "published",
                    populate: "*",
                    pagination: {
                        pageSize: 1000,
                    },
                    sort: ["title:asc"],
                },
                {
                    encodeValuesOnly: true,
                }
            );

            const res = await fetchData("products", query);
            const allProducts = res?.data || [];

            const categoryProducts = allProducts.filter((product) => {
                return productBelongsToStaticCategory(product, category);
            });

            /* const items = categoryProducts.filter((product) => {
                 const currentTypeId = productTypeId(product);
 
                 if (!currentTypeId) return true;
                 if (typeId && String(currentTypeId) === String(typeId)) return true;
 
                 return false;
             });  */

            const items = categoryProducts;

            return okJson({
                items: mapProductItems(items),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[speciality GET ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        const {
            type,
            title,
            typeId,
            productId,
            dosageId,
        } = body;

        console.log("==================================================");
        console.log("[speciality POST] body:", body);

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
                product_category: true,
                product_dosages: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const category = await getStaticCategory();

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Speciality Chemicals category",
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

            if (await findTypeByTitleAndCategory(title)) {
                return errorJson("This Type already exists for this category", 409);
            }

            const category = await getStaticCategory();

            if (!category?.documentId && !category?.id) {
                return errorJson("Product category not found", 404);
            }

            const categoryDocumentId = category.documentId || category.id;

            const created = await createTypeWithCategory(title, categoryDocumentId);

            if (!created?.ok) {
                return errorJson(
                    "Failed to create Type",
                    created?.status || 500,
                    created?.data || null
                );
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
                product_category: true,
                type: true,
            });

            if (!product) {
                return errorJson(
                    "Product not found in published Speciality Chemicals category",
                    404
                );
            }

            const category = await getStaticCategory();

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Speciality Chemicals category",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (currentTypeId && String(currentTypeId) === String(typeId)) {
                return okJson({
                    item: product,
                });
            }

            /* if (currentTypeId && String(currentTypeId) !== String(typeId)) {
                 return errorJson("This Product already has another Type", 409);
             }  */


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

        return errorJson("Invalid type", 400);
    } catch (err) {
        console.log("[speciality POST ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();

        const {
            type,
            documentId,
        } = body;

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
                product_category: true,
                type: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const category = await getStaticCategory();

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Speciality Chemicals category.",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (!currentTypeId) {
                return errorJson("This Product is not connected with any Type.", 400);
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

        if (type === "type") {
            const category = await getStaticCategory();

            const item = await getByDocumentId("types", documentId, {
                product_category: true,
                product_categories: true,
                products: {
                    fields: ["title"],
                },
            });

            if (!item) {
                return errorJson(`Type not found for documentId: ${documentId}`, 404);
            }

            if (!typeBelongsToStaticCategory(item, category)) {
                return errorJson(
                    "This Type does not belong to Speciality Chemicals category.",
                    400
                );
            }

            const productCount = getRelationArray(item, "products").length;

            if (productCount) {
                return errorJson(
                    `This Type has relation data (${productCount} Product). First remove relation data, then delete it.`,
                    409
                );
            }

            const deleted = await strapiDelete(`types/${documentId}`);

            if (!deleted.ok) {
                return errorJson("Failed to delete Type", deleted.status, deleted.data);
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
        console.log("[speciality DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}