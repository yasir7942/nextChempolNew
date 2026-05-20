import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

const STATIC_CATEGORY = { title: "PCMO/Gasoline", slug: "pcmo-gasoline" };

const TYPE_CONFIG = {
    api: { endpoint: "apis", field: "name", label: "API" },
    saeGrade: { endpoint: "sae-grades", field: "name", label: "SAE Grade" },
    product: { endpoint: "products", field: "title", label: "Product" },
    acea: { endpoint: "aceas", field: "name", label: "ACEA" },
    ilsac: { endpoint: "ilsacs", field: "title", label: "ILSAC" },
    oem: { endpoint: "oems", field: "title", label: "OEM" },
};

function joinUrl(base, endpoint) {
    return `${String(base || "").trim().replace(/\/$/, "")}/${String(endpoint || "")
        .trim()
        .replace(/^\//, "")}`;
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

function productHasAnySaeGrade(product) {
    const sae = getRelationObject(product, "sae_grade");
    return Boolean(sae?.documentId || sae?.id);
}

function getEnumForType(type) {
    if (type === "api") return ENUMS.API || [];
    if (type === "saeGrade") return ENUMS.SAEGrade || [];
    if (type === "acea") return ENUMS.ACEA || [];
    if (type === "ilsac") return ENUMS.ILSAC || [];
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

async function findApiByNameAndCategory(name, categoryDocumentId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            name: {
                $eqi: name,
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

    const res = await fetchData("apis", query);
    return res?.data?.[0] || null;
}

async function findSaeByNameAndApi(name, apiDocumentId) {
    const query = qs.stringify({
        status: "published",
        filters: {
            name: {
                $eqi: name,
            },
            api: {
                documentId: {
                    $eq: apiDocumentId,
                },
            },
        },
        populate: {
            api: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData("sae-grades", query);
    return res?.data?.[0] || null;
}

async function findLeafByTitleAndSaeAndProduct({
    endpoint,
    field,
    title,
    saeGradeId,
    productId,
}) {
    const query = qs.stringify({
        status: "published",
        filters: {
            [field]: {
                $eqi: title,
            },
            sae_grade: {
                documentId: {
                    $eq: saeGradeId,
                },
            },
            product: {
                documentId: {
                    $eq: productId,
                },
            },
        },
        populate: {
            sae_grade: true,
            product: true,
        },
        pagination: {
            pageSize: 1,
        },
    });

    const res = await fetchData(endpoint, query);
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
            api: true,
            sae_grade: true,
            product_dosages: {
                fields: ["title"],
            },
            sys_aceas: {
                fields: ["name"],
            },
            sys_ilsacs: {
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

        const aceaCount = getRelationArray(item, "sys_aceas").length;
        const ilsacCount = getRelationArray(item, "sys_ilsacs").length;
        const oemCount = getRelationArray(item, "sys_oems").length;

        if (aceaCount || ilsacCount || oemCount) {
            return {
                blocked: true,
                message: `This Product has relation data (${aceaCount} ACEA, ${ilsacCount} ILSAC, ${oemCount} OEM). First remove relation data, then remove Product relation from SAE Grade.`,
            };
        }

        return {
            blocked: false,
            message:
                "This will not delete Product. It only removes API and SAE Grade relation from Product.",
        };
    }

    if (!TYPE_CONFIG[type]) {
        return {
            blocked: true,
            message: "Invalid delete type",
        };
    }

    if (type === "api") {
        const item = await getByDocumentId("apis", documentId, {
            sae_grades: {
                fields: ["name"],
            },
            products: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: "API not found",
            };
        }

        const saeCount = getRelationArray(item, "sae_grades").length;
        const productCount = getRelationArray(item, "products").length;

        if (saeCount || productCount) {
            return {
                blocked: true,
                message: `This API has relation data (${saeCount} SAE Grade, ${productCount} Product). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "saeGrade") {
        const item = await getByDocumentId("sae-grades", documentId, {
            products: {
                fields: ["title"],
            },
            aceas: {
                fields: ["name"],
            },
            ilsacs: {
                fields: ["title"],
            },
            oems: {
                fields: ["title"],
            },
        });

        if (!item) {
            return {
                blocked: true,
                message: "SAE Grade not found",
            };
        }

        const productCount = getRelationArray(item, "products").length;
        const aceaCount = getRelationArray(item, "aceas").length;
        const ilsacCount = getRelationArray(item, "ilsacs").length;
        const oemCount = getRelationArray(item, "oems").length;

        if (productCount || aceaCount || ilsacCount || oemCount) {
            return {
                blocked: true,
                message: `This SAE Grade has relation data (${productCount} Product, ${aceaCount} ACEA, ${ilsacCount} ILSAC, ${oemCount} OEM). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (["acea", "ilsac", "oem"].includes(type)) {
        const cfg = TYPE_CONFIG[type];

        const item = await getByDocumentId(cfg.endpoint, documentId, {
            sae_grade: true,
            product: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: `${cfg.label} not found`,
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
        const apiId = searchParams.get("apiId");
        const saeGradeId = searchParams.get("saeGradeId");
        const productId = searchParams.get("productId");
        const type = searchParams.get("type");
        const documentId = searchParams.get("documentId");

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
                    label: getField(category, "title"),
                    slug: getField(category, "slug"),
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

        if (mode === "allapis" || mode === "apis") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId;

            if (!categoryDocumentId) {
                return okJson({
                    items: mode === "allapis" ? enumItems(ENUMS.API || []) : [],
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
                fields: ["name"],
                populate: {
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
                    mode === "allapis"
                        ? filterEnumByExisting(ENUMS.API || [], items, "name")
                        : mapItems(items, "name"),
            });
        }

        if (mode === "all-sae-grades" || mode === "sae-grades") {
            if (!apiId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                filters: {
                    api: {
                        documentId: {
                            $eq: apiId,
                        },
                    },
                },
                fields: ["name"],
                populate: {
                    api: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: ["name:asc"],
            });

            const res = await fetchData("sae-grades", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-sae-grades"
                        ? filterEnumByExisting(ENUMS.SAEGrade || [], items, "name")
                        : mapItems(items, "name"),
            });
        }

        if (mode === "products") {
            if (!saeGradeId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify({
                status: "published",
                filters: {
                    product_categories: {
                        slug: {
                            $eq: STATIC_CATEGORY.slug,
                        },
                    },
                    sae_grade: {
                        documentId: {
                            $eq: saeGradeId,
                        },
                    },
                },
                fields: ["title", "slug"],
                populate: {
                    product_categories: true,
                    sae_grade: true,
                    api: true,
                    product_dosages: true,
                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            return okJson({
                items: mapProductItems((res?.data || []).filter(productBelongsToStaticCategory)),
            });
        }

        if (mode === "all-products") {
            if (!saeGradeId) {
                return okJson({
                    items: [],
                });
            }

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
                    sae_grade: true,
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
            //.filter((product) => !productHasAnySaeGrade(product));

            return okJson({
                items: mapProductItems(items),
            });
        }

        if (
            [
                "all-aceas",
                "acea",
                "aceas",
                "all-ilsacs",
                "ilsac",
                "ilsacs",
                "all-oems",
                "oem",
                "oems",
            ].includes(mode)
        ) {
            if (!saeGradeId || !productId) {
                return okJson({
                    items: [],
                });
            }

            const normalizedType = mode.includes("acea")
                ? "acea"
                : mode.includes("ilsac")
                    ? "ilsac"
                    : "oem";

            const isAll = mode.startsWith("all-");
            const cfg = TYPE_CONFIG[normalizedType];

            const query = qs.stringify({
                status: "published",
                filters: {
                    sae_grade: {
                        documentId: {
                            $eq: saeGradeId,
                        },
                    },
                    product: {
                        documentId: {
                            $eq: productId,
                        },
                    },
                },
                fields: [cfg.field],
                populate: {
                    sae_grade: true,
                    product: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: [`${cfg.field}:asc`],
            });

            const res = await fetchData(cfg.endpoint, query);
            const items = res?.data || [];

            return okJson({
                items: isAll
                    ? filterEnumByExisting(getEnumForType(normalizedType), items, cfg.field)
                    : mapItems(items, cfg.field),
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

        const {
            type,
            title,
            apiId,
            saeGradeId,
            productId,
            dosageId,
        } = body;

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
                return errorJson("Product does not belong to PCMO/Gasoline category", 400);
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

        if (type === "api") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId;

            if (!categoryDocumentId) {
                return errorJson("Product category not found", 404);
            }

            if (await findApiByNameAndCategory(title, categoryDocumentId)) {
                return errorJson("This API already exists for this category", 409);
            }

            const created = await strapiPost("apis?status=published", {
                data: {
                    name: title,
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

        if (type === "saeGrade") {
            if (!apiId || !title) {
                return errorJson("apiId or title is missing", 400);
            }

            if (await findSaeByNameAndApi(title, apiId)) {
                return errorJson("This SAE Grade already exists for this API", 409);
            }

            const created = await strapiPost("sae-grades?status=published", {
                data: {
                    name: title,
                    api: apiId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create SAE Grade", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        if (type === "product") {
            if (!apiId || !saeGradeId || !productId) {
                return errorJson("apiId, saeGradeId or productId missing", 400);
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                sae_grade: true,
                api: true,
            });

            if (!product) {
                return errorJson("Product not found in published PCMO/Gasoline category", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to PCMO/Gasoline category", 400);
            }

            /* if (productHasAnySaeGrade(product)) {
                 return errorJson("Product already has SAE Grade", 409);
                 
             }*/

            const updated = await strapiPut(`products/${productId}?status=published`, {
                data: {
                    api: apiId,
                    sae_grade: saeGradeId,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to connect Product with API and SAE Grade",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || null,
            });
        }

        if (["acea", "ilsac", "oem"].includes(type)) {
            if (!saeGradeId || !productId || !title) {
                return errorJson("saeGradeId, productId or title is missing", 400);
            }

            const cfg = TYPE_CONFIG[type];

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
                sae_grade: true,
            });

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to PCMO/Gasoline category", 400);
            }

            const productSae = getRelationObject(product, "sae_grade");
            const productSaeDocumentId = productSae?.documentId || productSae?.id;

            if (String(productSaeDocumentId) !== String(saeGradeId)) {
                return errorJson("Selected product is not connected with selected SAE Grade", 400);
            }

            const duplicate = await findLeafByTitleAndSaeAndProduct({
                endpoint: cfg.endpoint,
                field: cfg.field,
                title,
                saeGradeId,
                productId,
            });

            if (duplicate) {
                return errorJson(
                    `This ${cfg.label} already exists for this SAE Grade and Product`,
                    409
                );
            }

            const created = await strapiPost(`${cfg.endpoint}?status=published`, {
                data: {
                    [cfg.field]: title,
                    sae_grade: saeGradeId,
                    product: productId,
                },
            });

            if (!created.ok) {
                return errorJson(`Failed to create ${cfg.label}`, created.status, created.data);
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
                    api: null,
                    sae_grade: null,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to remove Product relation from SAE Grade",
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
