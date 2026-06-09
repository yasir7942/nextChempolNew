import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

const STATIC_CATEGORY = {
    title: "Driveline Additives",
    slug: "driveline-additives",
};

const TYPE_CONFIG = {
    type: {
        endpoint: "types",
        field: "title",
        label: "Type",
    },
    api: {
        endpoint: "apis",
        field: "name",
        label: "API",
    },
    product: {
        endpoint: "products",
        field: "title",
        label: "Product",
    },
    oem: {
        endpoint: "oems",
        field: "title",
        label: "OEM",
    },
};


const productPopulate = {
    product_categories: true,
    sae_grades: true,
    types: true,
    api: true,
    dosages: true,
};

function entityId(item) {
    return String(item?.documentId || item?.id || "");
}

function sameEntity(item, selectedId) {
    if (!item || !selectedId) return false;

    return (
        String(item?.documentId || "") === String(selectedId) ||
        String(item?.id || "") === String(selectedId)
    );
}

async function getByAnyId(endpoint, selectedId, populate = {}) {
    if (!selectedId) return null;

    const wanted = String(selectedId);

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

    const documentIdQuery = qs.stringify(
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

    const documentIdRes = await fetchData(endpoint, documentIdQuery);

    if (documentIdRes?.data?.[0]) {
        return documentIdRes.data[0];
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

    return idRes?.data?.[0] || null;
}

async function findProductForSave(productId) {
    if (!productId) return null;

    const direct = await getByAnyId("products", productId, productPopulate);

    if (direct) {
        return direct;
    }

    const query = qs.stringify(
        {
            status: "published",
            populate: productPopulate,
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
    const products = res?.data || [];

    return products.find((product) => sameEntity(product, productId)) || null;
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
    console.log("[fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[fetchData] status:", parsed.status);
        console.log("[fetchData] first 800 chars:", JSON.stringify(parsed.data).slice(0, 800));

        return parsed.data;
    } catch (err) {
        console.log("[fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const res = await fetch(joinUrl(baseUrl, endpoint), {
        method,
        headers: {
            "Content-Type": "application/json",
            "Strapi-Response-Format": "v4",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...(payload ? { body: JSON.stringify(payload) } : {}),
        cache: "no-store",
    });

    return parseResponse(res);
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

function mapItems(items = [], field = "name") {
    return items.map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getField(item, field),
    }));
}

function mapProductItems(items = []) {
    return items.map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label:
            getField(item, "title") ||
            getField(item, "name") ||
            getField(item, "slug") ||
            `Product ${item?.id || ""}`,
    }));
}

function filterEnumByExisting(enumValues = [], existingItems = [], field = "name") {
    return enumItems(
        enumValues.filter((value) => {
            return !existingItems.some((item) => sameText(getField(item, field), value));
        })
    );
}

function getRelationArray(item, relationName) {
    const rel = item?.[relationName] || item?.attributes?.[relationName];

    if (!rel) return [];
    if (Array.isArray(rel)) return rel;
    if (Array.isArray(rel?.data)) return rel.data;
    if (rel?.data && typeof rel.data === "object") return [rel.data];

    if (rel && typeof rel === "object" && (rel.id || rel.documentId)) {
        return [rel];
    }

    return [];
}

function getRelationObject(item, relationName) {
    const rel = item?.[relationName] || item?.attributes?.[relationName];

    if (!rel) return null;
    if (rel?.data) return rel.data;
    if (Array.isArray(rel)) return rel[0] || null;
    if (rel && typeof rel === "object" && (rel.id || rel.documentId)) return rel;

    return null;
}

function productBelongsToStaticCategory(product) {
    return getRelationArray(product, "product_categories").some((category) => {
        return getField(category, "slug") === STATIC_CATEGORY.slug;
    });
}

function productHasAnyApi(product) {
    const api = getRelationObject(product, "api");
    return Boolean(api?.documentId || api?.id);
}

function productHasSelectedApi(product, apiId) {
    const api = getRelationObject(product, "api");
    const currentApiId = api?.documentId || api?.id;

    return String(currentApiId || "") === String(apiId || "");
}

function productHasSelectedType(product, typeId) {
    if (!typeId) return true;

    const types = getRelationArray(product, "types");

    return types.some((item) => {
        return String(item?.documentId || item?.id || "") === String(typeId || "");
    });
}

function getEnumForType(type) {
    if (type === "type") return ENUMS.DriveLineType || [];
    if (type === "api") return ENUMS.DriveLineAPI || [];
    if (type === "oem") return ENUMS.OEM || [];
    return [];
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
            apis: true,
        },
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
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("types", query);
    return res?.data?.[0] || null;
}

async function findApiByNameAndType(name, typeDocumentId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            name: {
                $eqi: name,
            },
            type: {
                documentId: {
                    $eq: typeDocumentId,
                },
            },
        },
        populate: {
            type: true,
            product_category: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("apis", query);
    return res?.data?.[0] || null;
}

async function findOemByTitleAndProduct(title, productId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            title: {
                $eqi: title,
            },
            product: {
                documentId: {
                    $eq: productId,
                },
            },
        },
        populate: {
            product: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("oems", query);
    return res?.data?.[0] || null;
}

async function getProductDosage({ typeId = "", apiId = "", productId }) {
    if (!typeId || !apiId || !productId) return null;

    /*
        Driveline flow:
        Type → API → Product → Dosage / OEM

        There is NO SAE Grade in Driveline.
        Correct dosage matching is:
        Type + API + Product

        Dosage relation fields:
        - sys_types
        - sys_apis
        - products
    */
    const product = await findProductForSave(productId);
    const productDocumentId = product?.documentId || productId;

    const filters = {
        products: {
            documentId: {
                $eq: productDocumentId,
            },
        },
        sys_types: {
            documentId: {
                $eq: typeId,
            },
        },
        sys_apis: {
            documentId: {
                $eq: apiId,
            },
        },
    };

    const query = qs.stringify(
        {
            status: "published",
            filters,
            fields: ["dosage"],
            populate: {
                products: true,
                sys_types: true,
                sys_apis: true,
            },
            pagination: {
                pageSize: 1,
            },
            sort: ["updatedAt:desc", "createdAt:desc"],
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("dosages", query);
    return res?.data?.[0] || null;
}
async function getDeleteCheck(type, documentId) {
    if (type === "product") {
        const item = await getByDocumentId("products", documentId, {
            product_categories: true,
            sae_grades: true,
            api: true,
            types: true,
            dosages: true,
            sys_oems: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: "Product not found",
            };
        }

        const oemCount = getRelationArray(item, "sys_oems").length;

        if (oemCount) {
            return {
                blocked: true,
                message: `This Product has relation data (${oemCount} OEM). First remove OEM relation data, then remove Product relation.`,
            };
        }

        return {
            blocked: false,
            message:
                "This will not delete Product. It only removes Type and API relation from Product.",
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
            apis: {
                fields: ["name"],
            },
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

        const apiCount = getRelationArray(item, "apis").length;
        const productCount = getRelationArray(item, "products").length;

        if (apiCount || productCount) {
            return {
                blocked: true,
                message: `This Type has relation data (${apiCount} API, ${productCount} Product). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "api") {
        const item = await getByDocumentId("apis", documentId, {
            products: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: `API not found for documentId: ${documentId}. Please refresh page and try again.`,
            };
        }

        const productCount = getRelationArray(item, "products").length;

        if (productCount) {
            return {
                blocked: true,
                message: `This API has relation data (${productCount} Product). First remove Product relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "oem") {
        const item = await getByDocumentId("oems", documentId, {
            product: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: `OEM not found for documentId: ${documentId}. Please refresh page and try again.`,
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
        const apiId = searchParams.get("apiId");
        const productId = searchParams.get("productId");
        const type = searchParams.get("type");
        const documentId = searchParams.get("documentId");

        console.log("==================================================");
        console.log("[GET] mode:", mode);
        console.log("[GET] typeId:", typeId);
        console.log("[GET] apiId:", apiId);
        console.log("[GET] productId:", productId);

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
            if (!typeId || !apiId || !productId) {
                return okJson({
                    item: null,
                });
            }

            const dosage = await getProductDosage({
                typeId,
                apiId,
                productId,
            });

            return okJson({
                item: dosage
                    ? {
                        id: dosage?.id,
                        documentId: dosage?.documentId,
                        title: getField(dosage, "dosage") || getField(dosage, "title"),
                    }
                    : null,
            });
        }

        if (mode === "all-types" || mode === "types") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId;

            if (!categoryDocumentId) {
                return okJson({
                    items: mode === "all-types" ? enumItems(ENUMS.DriveLineType || []) : [],
                });
            }

            const query = qs.stringify({
                status: "published",
                filters: {
                    product_category: {
                        documentId: {
                            $eq: categoryDocumentId,
                        },
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

            return okJson({
                items:
                    mode === "all-types"
                        ? filterEnumByExisting(ENUMS.DriveLineType || [], items, "title")
                        : mapItems(items, "title"),
            });
        }

        if (mode === "all-apis" || mode === "apis") {
            if (!typeId) {
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
                },
                fields: ["name"],
                populate: {
                    type: true,
                    product_category: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: ["name:asc"],
            });

            const res = await fetchData("apis", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-apis"
                        ? filterEnumByExisting(ENUMS.DriveLineAPI || [], items, "name")
                        : mapItems(items, "name"),
            });
        }

        if (mode === "products") {
            if (!apiId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    types: true,
                    api: true,
                    dosages: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const items = (res?.data || [])
                .filter(productBelongsToStaticCategory)
                .filter((product) => productHasSelectedType(product, typeId))
                .filter((product) => productHasSelectedApi(product, apiId));

            return okJson({
                items: mapProductItems(items),
            });
        }

        if (mode === "all-products") {
            if (!apiId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    types: true,
                    api: true,
                    dosages: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const items = (res?.data || [])
                .filter(productBelongsToStaticCategory)
            // .filter((product) => !productHasAnyApi(product));


            return okJson({
                items: mapProductItems(items),
            });
        }

        if (mode === "oems" || mode === "all-oems") {
            if (!productId) {
                return okJson({
                    items: [],
                });
            }

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
                    pageSize: 500,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("oems", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-oems"
                        ? filterEnumByExisting(ENUMS.OEM || [], items, "title")
                        : mapItems(items, "title"),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[GET ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function POST(req) {
    try {
        const body = await req.json();

        const { type, title, typeId, apiId, productId, dosageId } = body;

        console.log("==================================================");
        console.log("[POST] body:", body);

        if (!type) {
            return errorJson("type is missing", 400);
        }

        if (!title && type !== "product") {
            return errorJson("title is missing", 400);
        }

        if (type === "dosage") {
            if (!typeId || !apiId || !productId) {
                return errorJson("typeId, apiId or productId is missing", 400);
            }

            if (!title?.trim()) {
                return errorJson("Dosage value is missing", 400);
            }

            const product = await findProductForSave(productId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Driveline Additives category", 400);
            }

            const productDocumentId = product?.documentId || productId;

            const dosagePayload = {
                dosage: title.trim(),
                products: [productDocumentId],
                ...(apiId ? { sys_apis: [apiId] } : {}),
                ...(typeId ? { sys_types: [typeId] } : {}),
            };

            /*
                Important:
                First search existing dosage by relation combination:
                Type + API + Product

                This prevents creating a new Dosage row every time the user edits
                the same dosage value. dosageId is only a fallback.
            */
            let existingDosage = await getProductDosage({
                typeId,
                apiId,
                productId: productDocumentId,
            });

            if (!existingDosage && dosageId) {
                existingDosage = await getByAnyId("dosages", dosageId, {
                    products: true,
                    sys_apis: true,
                    sys_types: true,
                });
            }

            if (existingDosage?.documentId || existingDosage?.id) {
                const dosageDocumentId = existingDosage.documentId || existingDosage.id;

                const updated = await strapiPut(`dosages/${dosageDocumentId}?status=published`, {
                    data: dosagePayload,
                });

                if (!updated.ok) {
                    return errorJson("Failed to update Dosage", updated.status, updated.data);
                }

                const updatedItem = updated.data?.data || null;

                return okJson({
                    item: updatedItem
                        ? {
                            id: updatedItem?.id,
                            documentId: updatedItem?.documentId || updatedItem?.id,
                            title: getField(updatedItem, "dosage") || getField(updatedItem, "title") || title.trim(),
                        }
                        : {
                            id: dosageDocumentId,
                            documentId: dosageDocumentId,
                            title: title.trim(),
                        },
                });
            }

            const created = await strapiPost("dosages?status=published", {
                data: dosagePayload,
            });

            if (!created.ok) {
                return errorJson("Failed to create Dosage", created.status, created.data);
            }

            const createdItem = created.data?.data || null;

            return okJson({
                item: createdItem
                    ? {
                        id: createdItem?.id,
                        documentId: createdItem?.documentId || createdItem?.id,
                        title: getField(createdItem, "dosage") || getField(createdItem, "title") || title.trim(),
                    }
                    : null,
            });
        }

        if (type === "type") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId;

            if (!categoryDocumentId) {
                return errorJson("Product category not found", 404);
            }

            const duplicate = await findTypeByTitleAndCategory(title, categoryDocumentId);

            if (duplicate) {
                return errorJson("This Type already exists for this category", 409);
            }

            const created = await strapiPost("types?status=published", {
                data: {
                    title,
                    product_category: categoryDocumentId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create Type", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        if (type === "api") {
            if (!typeId || !title) {
                return errorJson("typeId or title is missing", 400);
            }

            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId;

            if (!categoryDocumentId) {
                return errorJson("Product category not found", 404);
            }

            const duplicate = await findApiByNameAndType(title, typeId);

            if (duplicate) {
                return errorJson("This API already exists for this Type", 409);
            }

            const created = await strapiPost("apis?status=published", {
                data: {
                    name: title,
                    type: [typeId],
                    product_category: categoryDocumentId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create API", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        if (type === "product") {
            if (!typeId || !apiId || !productId) {
                return errorJson("typeId, apiId or productId missing", 400);
            }

            const product = await findProductForSave(productId);

            if (!product) {
                return errorJson("Product not found in published Driveline Additives category (product not found)", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Driveline Additives category", 400);
            }

            const productDocumentId = product?.documentId || productId;

            const existingTypeIds = getRelationArray(product, "types")
                .map((item) => item?.documentId || item?.id)
                .filter(Boolean)
                .map(String);

            const nextTypeIds = Array.from(
                new Set([...existingTypeIds, String(typeId)])
            );

            const updated = await strapiPut(`products/${productDocumentId}?status=published`, {
                data: {
                    types: nextTypeIds,
                    api: apiId,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to connect Product with Type and API",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || null,
            });
        }

        if (type === "oem") {
            if (!productId || !title) {
                return errorJson("productId or title is missing", 400);
            }

            const product = await findProductForSave(productId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Driveline Additives category", 400);
            }

            const duplicate = await findOemByTitleAndProduct(title, productDocumentId);

            if (duplicate) {
                return errorJson("This OEM already exists for this Product", 409);
            }

            const created = await strapiPost("oems?status=published", {
                data: {
                    title,
                    product: productDocumentId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create OEM", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        return errorJson("Invalid type", 400);
    } catch (err) {
        console.log("[POST ERROR]", err);
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
            const updated = await strapiPut(`products/${documentId}?status=published`, {
                data: {
                    types: [],
                    api: null,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to remove Product relation",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || null,
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
        console.log("[DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}