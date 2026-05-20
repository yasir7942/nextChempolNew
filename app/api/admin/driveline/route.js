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
    const type = getRelationObject(product, "type");
    const currentTypeId = type?.documentId || type?.id;

    return String(currentTypeId || "") === String(typeId || "");
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
        const item = await getByDocumentId("products", documentId, {
            product_categories: true,
            type: true,
            api: true,
            product_dosages: {
                fields: ["title"],
            },
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
                    type: true,
                    api: true,
                    product_dosages: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const items = (res?.data || [])
                .filter(productBelongsToStaticCategory)
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
                    type: true,
                    api: true,
                    product_dosages: true,
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
                return errorJson("Product does not belong to Driveline Additives category", 400);
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
                const updated = await strapiPut(`product-dosages/${existingDosage.documentId}?status=published`, {
                    data: {
                        title: title.trim(),
                        product: productId,
                    },
                });

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
                    type: typeId,
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

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                type: true,
                api: true,
            });

            if (!product) {
                return errorJson("Product not found in published Driveline Additives category", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Driveline Additives category", 400);
            }

            /*  if (productHasAnyApi(product)) {
                  return errorJson("Product already has API", 409);
              }  */

            const updated = await strapiPut(`products/${productId}?status=published`, {
                data: {
                    type: typeId,
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

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                type: true,
                api: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Driveline Additives category", 400);
            }

            const duplicate = await findOemByTitleAndProduct(title, productId);

            if (duplicate) {
                return errorJson("This OEM already exists for this Product", 409);
            }

            const created = await strapiPost("oems?status=published", {
                data: {
                    title,
                    product: productId,
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
                    type: null,
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