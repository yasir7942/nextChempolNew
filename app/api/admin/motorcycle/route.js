import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Motorcycle Oil Additive",
    slug: "motorcycle-oil-additive",
};

const TYPE_CONFIG = {
    api: {
        endpoint: "apis",
        field: "name",
        label: "API",
    },
    saeGrade: {
        endpoint: "sae-grades",
        field: "name",
        label: "SAE Grade",
    },
    product: {
        endpoint: "products",
        field: "title",
        label: "Product",
    },
    jaso: {
        endpoint: "jasos",
        field: "title",
        label: "JASO",
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
    console.log("[motorcycle fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[motorcycle fetchData] status:", parsed.status);
        console.log(
            "[motorcycle fetchData] first 1000 chars:",
            JSON.stringify(parsed.data).slice(0, 1000)
        );

        return parsed.data;
    } catch (err) {
        console.log("[motorcycle fetchData] ERROR:", err);
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
        {
            status,
        }
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

function getProductLabel(item) {
    return (
        getField(item, "title") ||
        getField(item, "name") ||
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

function relationId(item) {
    return String(item?.documentId || item?.id || "");
}

function productBelongsToStaticCategory(product) {
    return getRelationArray(product, "product_categories").some((category) => {
        return getField(category, "slug") === STATIC_CATEGORY.slug;
    });
}

function getEnumForType(type) {
    if (type === "api") return ENUMS.API || [];
    if (type === "saeGrade") return ENUMS.SAEGrade || [];
    if (type === "jaso") return ENUMS.JASO || [];
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

    if (!res?.data?.[0]) {
        console.log("[getByDocumentId] not found or failed:", {
            endpoint,
            documentId,
            response: res,
        });
    }

    return res?.data?.[0] || null;
}

async function getSaeGradeByDocumentId(saeGradeId) {
    return getByDocumentId("sae-grades", saeGradeId, {
        api: true,
        products: {
            fields: ["title", "slug"],
            populate: {
                product_categories: true,
                dosages: true,
            },
        },
        jasos: {
            fields: ["title"],
        },
    });
}

function saeGradeHasProduct(saeGrade, productDocumentId) {
    const products = getRelationArray(saeGrade, "products");

    return products.some((product) => {
        return relationId(product) === String(productDocumentId);
    });
}

function getSaeGradeProductIds(saeGrade) {
    return getRelationArray(saeGrade, "products")
        .map((product) => relationId(product))
        .filter(Boolean);
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

async function findJasoByTitleAndSaeAndProduct({
    title,
    saeGradeId,
    productId,
}) {
    const query = qs.stringify({
        status: "published",
        filters: {
            title: {
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

    const res = await fetchData("jasos", query);
    return res?.data?.[0] || null;
}

async function getJasoCountForSaeAndProduct({
    saeGradeId,
    productId,
}) {
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
        fields: ["title"],
        pagination: {
            pageSize: 100,
        },
    });

    const res = await fetchData("jasos", query);
    return res?.data?.length || 0;
}

async function getProductDosage({ apiId = "", saeGradeId = "", productId }) {
    if (!apiId || !saeGradeId || !productId) return null;

    /*
        Important:
        Do NOT use product.dosages[0].

        Motorcycle dosage depends on:
        Product + API + SAE Grade

        Dosage relation fields:
        - products
        - sys_apis
        - sys_sae_grades
    */
    const product = await findProductForSave(productId);
    const productDocumentId = product?.documentId || productId;

    const filters = {
        products: {
            documentId: {
                $eq: productDocumentId,
            },
        },
    };

    if (apiId) {
        filters.sys_apis = {
            documentId: {
                $eq: apiId,
            },
        };
    }

    if (saeGradeId) {
        filters.sys_sae_grades = {
            documentId: {
                $eq: saeGradeId,
            },
        };
    }

    const query = qs.stringify(
        {
            status: "published",
            filters,
            fields: ["dosage"],
            populate: {
                products: true,
                sys_apis: true,
                sys_sae_grades: true,
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
async function getDeleteCheck(type, documentId, extra = {}) {
    if (type === "product") {
        const saeGradeId = extra?.saeGradeId;

        if (!saeGradeId) {
            return {
                blocked: true,
                message: "SAE Grade is missing. Please select SAE Grade first.",
            };
        }

        const saeGrade = await getSaeGradeByDocumentId(saeGradeId);

        if (!saeGrade) {
            return {
                blocked: true,
                message: "SAE Grade not found.",
            };
        }

        const existsInSae = saeGradeHasProduct(saeGrade, documentId);

        if (!existsInSae) {
            return {
                blocked: true,
                message: "This Product is not connected with selected SAE Grade.",
            };
        }

        const jasoCount = await getJasoCountForSaeAndProduct({
            saeGradeId,
            productId: documentId,
        });

        if (jasoCount) {
            return {
                blocked: true,
                message: `This Product has relation data (${jasoCount} JASO) under selected SAE Grade. First delete JASO relation data, then remove Product from SAE Grade.`,
            };
        }

        return {
            blocked: false,
            message:
                "This will remove Product from selected SAE Grade only. Product collection record will not be deleted.",
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
            jasos: {
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
        const jasoCount = getRelationArray(item, "jasos").length;

        if (productCount || jasoCount) {
            return {
                blocked: true,
                message: `This SAE Grade has relation data (${productCount} Product, ${jasoCount} JASO). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (type === "jaso") {
        const item = await getByDocumentId("jasos", documentId, {
            sae_grade: true,
            product: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: "JASO not found",
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

        console.log("==================================================");
        console.log("[motorcycle GET] mode:", mode);
        console.log("[motorcycle GET] apiId:", apiId);
        console.log("[motorcycle GET] saeGradeId:", saeGradeId);
        console.log("[motorcycle GET] productId:", productId);

        if (mode === "delete-check") {
            if (!type || !documentId) {
                return errorJson("type or documentId is missing", 400);
            }

            return okJson(
                await getDeleteCheck(type, documentId, {
                    apiId,
                    saeGradeId,
                    productId,
                })
            );
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
            if (!apiId || !saeGradeId || !productId) {
                return okJson({
                    item: null,
                });
            }

            const dosage = await getProductDosage({
                apiId,
                saeGradeId,
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

            const saeGrade = await getSaeGradeByDocumentId(saeGradeId);

            if (!saeGrade) {
                return okJson({
                    items: [],
                });
            }

            const products = getRelationArray(saeGrade, "products").filter(
                productBelongsToStaticCategory
            );

            return okJson({
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
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
                    sae_grades: true,
                    api: true,
                    dosages: true,

                },
                pagination: {
                    pageSize: 1000,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("products", query);

            const items = (res?.data || []).filter(productBelongsToStaticCategory);

            return okJson({
                items: mapProductItems(items),
            });
        }

        if (mode === "all-jasos" || mode === "jasos") {
            if (!saeGradeId || !productId) {
                return okJson({
                    items: [],
                });
            }

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
                fields: ["title"],
                populate: {
                    sae_grade: true,
                    product: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: ["title:asc"],
            });

            const res = await fetchData("jasos", query);
            const items = res?.data || [];

            return okJson({
                items:
                    mode === "all-jasos"
                        ? filterEnumByExisting(ENUMS.JASO || [], items, "title")
                        : mapItems(items, "title"),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[motorcycle GET ERROR]", err);
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

        console.log("==================================================");
        console.log("[motorcycle POST] body:", body);

        if (!type) {
            return errorJson("type is missing", 400);
        }

        if (!title && type !== "product") {
            return errorJson("title is missing", 400);
        }

        if (type === "dosage") {
            if (!apiId || !saeGradeId || !productId) {
                return errorJson("apiId, saeGradeId or productId is missing", 400);
            }

            if (!title?.trim()) {
                return errorJson("Dosage value is missing", 400);
            }

            const product = await findProductForSave(productId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Motorcycle Oil Additive category", 400);
            }

            const productDocumentId = product?.documentId || productId;

            const dosagePayload = {
                dosage: title.trim(),
                products: [productDocumentId],
                ...(apiId ? { sys_apis: [apiId] } : {}),
                ...(saeGradeId ? { sys_sae_grades: [saeGradeId] } : {}),
            };

            /*
                Important:
                First search existing dosage by relation combination:
                API + SAE Grade + Product

                This prevents creating a new Dosage row every time the user edits
                the same dosage value. dosageId is only a fallback.
            */
            let existingDosage = await getProductDosage({
                apiId,
                saeGradeId,
                productId: productDocumentId,
            });

            if (!existingDosage && dosageId) {
                existingDosage = await getByAnyId("dosages", dosageId, {
                    products: true,
                    sys_apis: true,
                    sys_sae_grades: true,
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

            const saeGrade = await getSaeGradeByDocumentId(saeGradeId);

            if (!saeGrade) {
                return errorJson("SAE Grade not found", 404);
            }

            const product = await getByDocumentId("products", productId, {
                product_categories: true,
            });

            if (!product) {
                return errorJson(
                    "Product not found in published Motorcycle Oil Additive category",
                    404
                );
            }

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Motorcycle Oil Additive category",
                    400
                );
            }

            const existingProductIds = getSaeGradeProductIds(saeGrade);

            /*  if (existingProductIds.includes(String(productId))) {
                  return errorJson(
                      "This Product already exists in selected SAE Grade",
                      409
                  );
              }   */

            const nextProductIds = [
                ...existingProductIds,
                productId,
            ];

            const updated = await strapiPut(`sae-grades/${saeGradeId}?status=published`, {
                data: {
                    products: nextProductIds,
                },
            });

            if (!updated.ok) {
                return errorJson(
                    "Failed to connect Product with SAE Grade",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: product,
            });
        }

        if (type === "jaso") {
            if (!saeGradeId || !productId || !title) {
                return errorJson("saeGradeId, productId or title is missing", 400);
            }

            const saeGrade = await getSaeGradeByDocumentId(saeGradeId);

            if (!saeGrade) {
                return errorJson("SAE Grade not found", 404);
            }

            if (!saeGradeHasProduct(saeGrade, productId)) {
                return errorJson(
                    "Selected Product is not connected with selected SAE Grade",
                    400
                );
            }

            const product = await findProductForSave(productId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson(
                    "Product does not belong to Motorcycle Oil Additive category",
                    400
                );
            }

            const duplicate = await findJasoByTitleAndSaeAndProduct({
                title,
                saeGradeId,
                productId: productDocumentId,
            });

            if (duplicate) {
                return errorJson(
                    "This JASO already exists for this SAE Grade and Product",
                    409
                );
            }

            const created = await strapiPost("jasos?status=published", {
                data: {
                    title,
                    sae_grade: saeGradeId,
                    product: productDocumentId,
                },
            });

            if (!created.ok) {
                return errorJson("Failed to create JASO", created.status, created.data);
            }

            return okJson({
                item: created.data?.data || null,
            });
        }

        return errorJson("Invalid type", 400);
    } catch (err) {
        console.log("[motorcycle POST ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();

        const {
            type,
            documentId,
            saeGradeId,
        } = body;

        if (!type || !documentId) {
            return errorJson("type or documentId is missing", 400);
        }

        if (!TYPE_CONFIG[type]) {
            return errorJson("Invalid delete type", 400);
        }

        const check = await getDeleteCheck(type, documentId, {
            saeGradeId,
        });

        if (check.blocked) {
            return errorJson(check.message || "This item cannot be deleted", 409);
        }

        if (type === "product") {
            if (!saeGradeId) {
                return errorJson("saeGradeId is missing", 400);
            }

            const saeGrade = await getSaeGradeByDocumentId(saeGradeId);

            if (!saeGrade) {
                return errorJson("SAE Grade not found", 404);
            }

            const existingProductIds = getSaeGradeProductIds(saeGrade);

            if (!existingProductIds.includes(String(documentId))) {
                return errorJson(
                    "Product is not connected with selected SAE Grade",
                    404
                );
            }

            const nextProductIds = existingProductIds.filter((id) => {
                return String(id) !== String(documentId);
            });

            const updated = await strapiPut(`sae-grades/${saeGradeId}?status=published`, {
                data: {
                    products: nextProductIds,
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
        console.log("[motorcycle DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}