import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Marine Additives",
    slug: "marine-additives",
};

const OEM_FIELD = "title";

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
    oem: {
        endpoint: "oems",
        field: OEM_FIELD,
        label: "OEM",
    },
};

function getTypeEnum() {
    return ENUMS.MarineType || [];
}

function getOemEnum() {
    return ENUMS.OEM || [];
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
    console.log("[marine fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[marine fetchData] status:", parsed.status);
        console.log(
            "[marine fetchData] first 1000 chars:",
            JSON.stringify(parsed.data).slice(0, 1000)
        );

        return parsed.data;
    } catch (err) {
        console.log("[marine fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log(`[marine ${method}] URL:`, url);

    if (payload) {
        console.log(`[marine ${method}] payload:`, JSON.stringify(payload, null, 2));
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

    console.log(`[marine ${method}] status:`, parsed.status);
    console.log(`[marine ${method}] response:`, JSON.stringify(parsed.data, null, 2));

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
    if (item[field] !== undefined) return item[field];

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

    console.log("[marine getByDocumentId] not found after all attempts:", {
        endpoint,
        documentId: wanted,
        directRes,
        docRes,
        idRes,
        allCount: allItems.length,
    });

    return null;
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

async function findOemByTitleAndTypeAndProduct({ title, typeId, productId }) {
    const query = qs.stringify(
        {
            status: "published",
            filters: {
                [OEM_FIELD]: {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("oems", query);
    return res?.data?.[0] || null;
}

async function getOemCountForType(typeId) {
    const query = qs.stringify(
        {
            status: "published",
            filters: {
                type: {
                    documentId: {
                        $eq: typeId,
                    },
                },
            },
            fields: [OEM_FIELD],
            pagination: {
                pageSize: 500,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("oems", query);
    return res?.data?.length || 0;
}

async function getOemCountForProduct(productId) {
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
            fields: [OEM_FIELD],
            pagination: {
                pageSize: 500,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("oems", query);
    return res?.data?.length || 0;
}

async function getDeleteCheck(type, documentId) {
    if (type === "product") {
        const category = await getStaticCategory();

        const product = await getByDocumentId("products", documentId, {
            product_categories: true,
            product_category: true,
            type: true,
            oems: {
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
                message: "Product does not belong to Marine Additives category.",
            };
        }

        const currentTypeId = productTypeId(product);

        if (!currentTypeId) {
            return {
                blocked: true,
                message: "This Product is not connected with any Type.",
            };
        }

        const oemCount =
            getRelationArray(product, "oems").length ||
            (await getOemCountForProduct(documentId));

        if (oemCount) {
            return {
                blocked: true,
                message:
                    "This Product has OEM relation data. First delete OEM relation data, then remove Product from Type.",
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
            oems: {
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
                message: "This Type does not belong to Marine Additives category.",
            };
        }

        const productCount = getRelationArray(item, "products").length;
        const oemCount =
            getRelationArray(item, "oems").length ||
            (await getOemCountForType(documentId));

        if (productCount || oemCount) {
            return {
                blocked: true,
                message: `This Type has relation data (${productCount} Product, ${oemCount} OEM). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "oem") {
        const item = await getByDocumentId("oems", documentId, {
            type: true,
            product: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: "OEM not found.",
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
        console.log("[marine GET] mode:", mode);
        console.log("[marine GET] typeId:", typeId);
        console.log("[marine GET] productId:", productId);

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
                items: existingTypes.map((item) => ({
                    id: item?.id,
                    documentId: item?.documentId,
                    label:
                        getField(item, "title") ||
                        getField(item, "name") ||
                        `Type ${item?.id || ""}`,
                })),
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

            const items = categoryProducts.filter((product) => {
                const currentTypeId = productTypeId(product);

                if (!currentTypeId) return true;
                if (typeId && String(currentTypeId) === String(typeId)) return true;

                return false;
            });

            return okJson({
                items: mapProductItems(items),
            });
        }

        if (mode === "all-oems" || mode === "oems") {
            if (!typeId || !productId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify(
                {
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
                    fields: [OEM_FIELD],
                    populate: {
                        type: true,
                        product: true,
                    },
                    pagination: {
                        pageSize: 500,
                    },
                    sort: [`${OEM_FIELD}:asc`],
                },
                {
                    encodeValuesOnly: true,
                }
            );

            const res = await fetchData("oems", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-oems"
                        ? filterEnumByExisting(getOemEnum(), items, OEM_FIELD)
                        : mapItems(items, OEM_FIELD),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[marine GET ERROR]", err);
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
        } = body;

        console.log("==================================================");
        console.log("[marine POST] body:", body);

        if (!type) {
            return errorJson("type is missing", 400);
        }

        if (!title && type !== "product") {
            return errorJson("title is missing", 400);
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
                    "Product not found in published Marine Additives category",
                    404
                );
            }

            const category = await getStaticCategory();

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Marine Additives category",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (currentTypeId && String(currentTypeId) === String(typeId)) {
                return okJson({
                    item: product,
                });
            }

            if (currentTypeId && String(currentTypeId) !== String(typeId)) {
                return errorJson("This Product already has another Type", 409);
            }

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

        if (type === "oem") {
            if (!typeId || !productId || !title) {
                return errorJson("typeId, productId or title is missing", 400);
            }

            const typeItem = await getByDocumentId("types", typeId, {
                product_category: true,
                product_categories: true,
            });

            if (!typeItem) {
                return errorJson("Type not found", 404);
            }

            const category = await getStaticCategory();

            if (!typeBelongsToStaticCategory(typeItem, category)) {
                return errorJson(
                    "Type does not belong to Marine Additives category",
                    400
                );
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                product_category: true,
                type: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Marine Additives category",
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

            const duplicate = await findOemByTitleAndTypeAndProduct({
                title,
                typeId,
                productId,
            });

            if (duplicate) {
                return errorJson(
                    "This OEM already exists for this Type and Product",
                    409
                );
            }

            const created = await strapiPost("oems?status=published", {
                data: {
                    [OEM_FIELD]: title,
                    type: typeId,
                    product: productId,
                },
            });

            if (!created.ok) {
                return errorJson(
                    "Failed to create OEM. Check OEM schema has field title and relation fields: type and product.",
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
        console.log("[marine POST ERROR]", err);
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
                product_category: true,
                type: true,
                oems: {
                    fields: ["title"],
                },
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const category = await getStaticCategory();

            if (!productBelongsToStaticCategory(product, category)) {
                return errorJson(
                    "Product does not belong to Marine Additives category.",
                    400
                );
            }

            const currentTypeId = productTypeId(product);

            if (!currentTypeId) {
                return errorJson("This Product is not connected with any Type.", 400);
            }

            const oemCount =
                getRelationArray(product, "oems").length ||
                (await getOemCountForProduct(documentId));

            if (oemCount) {
                return errorJson(
                    "This Product has OEM relation data. First delete OEM relation data, then remove Product from Type.",
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

        if (type === "oem") {
            const deleted = await strapiDelete(`oems/${documentId}`);

            if (!deleted.ok) {
                return errorJson("Failed to delete OEM", deleted.status, deleted.data);
            }

            return okJson({
                item: deleted.data?.data || null,
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
                oems: {
                    fields: ["title"],
                },
            });

            if (!item) {
                return errorJson(`Type not found for documentId: ${documentId}`, 404);
            }

            if (!typeBelongsToStaticCategory(item, category)) {
                return errorJson(
                    "This Type does not belong to Marine Additives category.",
                    400
                );
            }

            const productCount = getRelationArray(item, "products").length;
            const oemCount =
                getRelationArray(item, "oems").length ||
                (await getOemCountForType(documentId));

            if (productCount || oemCount) {
                return errorJson(
                    `This Type has relation data (${productCount} Product, ${oemCount} OEM). First remove relation data, then delete it.`,
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
        console.log("[marine DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}