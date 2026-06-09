import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Gasoline/PCMO",
    slug: "pcmo-gasoline",
};

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
    console.log("[gasoline fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[gasoline fetchData] status:", parsed.status);
        console.log(
            "[gasoline fetchData] first 900 chars:",
            JSON.stringify(parsed.data).slice(0, 900)
        );

        return parsed.data;
    } catch (err) {
        console.log("[gasoline fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log(`[gasoline ${method}] URL:`, url);

    if (payload) {
        console.log(`[gasoline ${method}] payload:`, JSON.stringify(payload, null, 2));
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

    console.log(`[gasoline ${method}] status:`, parsed.status);
    console.log(
        `[gasoline ${method}] response:`,
        JSON.stringify(parsed.data).slice(0, 1200)
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

    return rel;
}

function relationIds(items = []) {
    return (Array.isArray(items) ? items : [])
        .map((item) => item?.documentId || item?.id)
        .filter(Boolean);
}

function relationHasId(items = [], documentId) {
    return relationIds(items).some((id) => String(id) === String(documentId));
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

    if (idRes?.data?.[0]) {
        return idRes.data[0];
    }

    return null;
}

const productPopulate = {
    product_categories: true,
    sae_grades: true,
    api: true,
    dosages: true,
};

async function findGasolineProductForSave(productId, saeGradeId = "") {
    if (!productId) return null;

    /*
        First check selected SAE Grade products, because the dropdown/product section
        is based on sae_grade.products relation.
    */
    if (saeGradeId) {
        const saeGrade = await getSaeGradeWithProducts(saeGradeId);
        const saeProducts = getRelationArray(saeGrade, "products");

        const fromSaeGrade = saeProducts.find((product) => sameEntity(product, productId));

        if (fromSaeGrade) {
            return fromSaeGrade;
        }
    }

    const direct = await getByAnyId("products", productId, productPopulate);

    if (direct) {
        return direct;
    }

    const query = qs.stringify(
        {
            status: "published",
            fields: ["title", "slug"],
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


function productBelongsToStaticCategory(product) {
    return getRelationArray(product, "product_categories").some((category) => {
        return (
            getField(category, "slug") === STATIC_CATEGORY.slug ||
            sameText(getField(category, "title"), STATIC_CATEGORY.title) ||
            sameText(getField(category, "title"), "PCMO/Gasoline")
        );
    });
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
    const query = qs.stringify(
        {
            status: "published",
            filters: {
                $or: [
                    {
                        slug: {
                            $eq: STATIC_CATEGORY.slug,
                        },
                    },
                    {
                        title: {
                            $eqi: STATIC_CATEGORY.title,
                        },
                    },
                    {
                        title: {
                            $eqi: "PCMO/Gasoline",
                        },
                    },
                ],
            },
            populate: {
                apis: true,
            },
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

    const directQuery = qs.stringify(
        {
            status: "published",
            populate,
        },
        {
            encodeValuesOnly: true,
        }
    );

    const directRes = await fetchData(`${endpoint}/${documentId}`, directQuery);

    if (directRes?.data) return directRes.data;

    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData(endpoint, query);
    return res?.data?.[0] || null;
}

async function findApiByNameAndCategory(name, categoryDocumentId) {
    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("apis", query);
    return res?.data?.[0] || null;
}

async function findSaeByNameAndApi(name, apiDocumentId) {
    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData("sae-grades", query);
    return res?.data?.[0] || null;
}

async function getSaeGradeWithProducts(saeGradeId) {
    if (!saeGradeId) return null;

    return getByDocumentId("sae-grades", saeGradeId, {
        api: true,
        products: {
            fields: ["title", "slug"],
            populate: {
                product_categories: true,
                sae_grades: true,
                api: true,
                dosages: true,
            },
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
}

async function productIsInSaeGrade(saeGradeId, productId) {
    const saeGrade = await getSaeGradeWithProducts(saeGradeId);
    const products = getRelationArray(saeGrade, "products");

    return relationHasId(products, productId);
}

async function connectProductToSaeGrade(saeGradeId, productId) {
    const saeGrade = await getSaeGradeWithProducts(saeGradeId);

    if (!saeGrade) {
        return {
            ok: false,
            status: 404,
            data: {
                error: "SAE Grade not found",
            },
        };
    }

    const existingProducts = getRelationArray(saeGrade, "products");
    const existingIds = relationIds(existingProducts);

    const nextProductIds = Array.from(
        new Set([...existingIds.map(String), String(productId)])
    );

    return strapiPut(`sae-grades/${saeGradeId}?status=published`, {
        data: {
            products: nextProductIds,
        },
    });
}

async function removeProductFromSaeGrade(saeGradeId, productId) {
    const saeGrade = await getSaeGradeWithProducts(saeGradeId);

    if (!saeGrade) {
        return {
            ok: false,
            status: 404,
            data: {
                error: "SAE Grade not found",
            },
        };
    }

    const existingProducts = getRelationArray(saeGrade, "products");

    const nextProductIds = relationIds(existingProducts).filter((id) => {
        return String(id) !== String(productId);
    });

    return strapiPut(`sae-grades/${saeGradeId}?status=published`, {
        data: {
            products: nextProductIds,
        },
    });
}

async function findLeafByTitleAndSaeAndProduct({
    endpoint,
    field,
    title,
    saeGradeId,
    productId,
}) {
    const query = qs.stringify(
        {
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
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData(endpoint, query);
    return res?.data?.[0] || null;
}

async function getLeafCountBySaeAndProduct({ endpoint, saeGradeId, productId }) {
    const query = qs.stringify(
        {
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
            pagination: {
                pageSize: 500,
            },
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData(endpoint, query);
    return res?.data?.length || 0;
}

/* ---------------- DOSAGE COLLECTION ---------------- */

async function getDosageRecord({ apiId, saeGradeId, productId }) {
    if (!apiId || !saeGradeId || !productId) return null;

    const query = qs.stringify(
        {
            status: "published",
            filters: {
                sys_apis: {
                    documentId: {
                        $eq: apiId,
                    },
                },
                sys_sae_grades: {
                    documentId: {
                        $eq: saeGradeId,
                    },
                },
                products: {
                    documentId: {
                        $eq: productId,
                    },
                },
            },
            fields: ["dosage"],
            populate: {
                sys_apis: true,
                sys_sae_grades: true,
                products: true,
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

    const res = await fetchData("dosages", query);
    return res?.data?.[0] || null;
}

async function getDeleteCheck(type, documentId, saeGradeId = "") {
    if (type === "product") {
        if (!saeGradeId) {
            return {
                blocked: true,
                message: "SAE Grade is missing. Please select SAE Grade first.",
            };
        }

        const item = await getByDocumentId("products", documentId, {
            product_categories: true,
        });

        if (!item) {
            return {
                blocked: true,
                message: "Product not found",
            };
        }

        if (!productBelongsToStaticCategory(item)) {
            return {
                blocked: true,
                message: "Product does not belong to Gasoline/PCMO category.",
            };
        }

        const linkedWithSaeGrade = await productIsInSaeGrade(saeGradeId, documentId);

        if (!linkedWithSaeGrade) {
            return {
                blocked: true,
                message: "This Product is not connected with selected SAE Grade.",
            };
        }

        const aceaCount = await getLeafCountBySaeAndProduct({
            endpoint: "aceas",
            saeGradeId,
            productId: documentId,
        });

        const ilsacCount = await getLeafCountBySaeAndProduct({
            endpoint: "ilsacs",
            saeGradeId,
            productId: documentId,
        });

        const oemCount = await getLeafCountBySaeAndProduct({
            endpoint: "oems",
            saeGradeId,
            productId: documentId,
        });

        if (aceaCount || ilsacCount || oemCount) {
            return {
                blocked: true,
                message: `This Product has relation data for selected SAE Grade (${aceaCount} ACEA, ${ilsacCount} ILSAC, ${oemCount} OEM). First remove relation data, then remove Product relation from SAE Grade.`,
            };
        }

        return {
            blocked: false,
            message:
                "This will not delete Product. It only removes Product relation from selected SAE Grade.",
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
            dosages: {
                fields: ["dosage"],
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
        const dosageCount = getRelationArray(item, "dosages").length;

        if (saeCount || productCount || dosageCount) {
            return {
                blocked: true,
                message: `This API has relation data (${saeCount} SAE Grade, ${productCount} Product, ${dosageCount} Dosage). First remove relation data, then delete it.`,
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
            dosages: {
                fields: ["dosage"],
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
        const dosageCount = getRelationArray(item, "dosages").length;

        if (productCount || aceaCount || ilsacCount || oemCount || dosageCount) {
            return {
                blocked: true,
                message: `This SAE Grade has relation data (${productCount} Product, ${aceaCount} ACEA, ${ilsacCount} ILSAC, ${oemCount} OEM, ${dosageCount} Dosage). First remove relation data, then delete it.`,
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

            return okJson(await getDeleteCheck(type, documentId, saeGradeId));
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

            const dosage = await getDosageRecord({
                apiId,
                saeGradeId,
                productId: productId,
            });

            return okJson({
                item: dosage
                    ? {
                        id: dosage?.id,
                        documentId: dosage?.documentId,
                        title: getField(dosage, "dosage"),
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

            const query = qs.stringify(
                {
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
                },
                {
                    encodeValuesOnly: true,
                }
            );

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

            const query = qs.stringify(
                {
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
                },
                {
                    encodeValuesOnly: true,
                }
            );

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

            const saeGrade = await getSaeGradeWithProducts(saeGradeId);

            const products = getRelationArray(saeGrade, "products").filter(
                productBelongsToStaticCategory
            );

            return okJson({
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
            if (!saeGradeId) {
                return okJson({
                    items: [],
                });
            }

            const query = qs.stringify(
                {
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
                    },
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

            const items = (res?.data || []).filter(productBelongsToStaticCategory);

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

            const query = qs.stringify(
                {
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
                },
                {
                    encodeValuesOnly: true,
                }
            );

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
        console.log("[gasoline GET ERROR]", err);
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
            if (!apiId || !saeGradeId || !productId) {
                return errorJson("apiId, saeGradeId or productId is missing", 400);
            }

            if (!title?.trim()) {
                return errorJson("Dosage value is missing", 400);
            }

            const api = await getByDocumentId("apis", apiId, {
                product_category: true,
            });

            if (!api) {
                return errorJson("API not found", 404);
            }

            const saeGrade = await getByDocumentId("sae-grades", saeGradeId, {
                api: true,
                products: true,
            });

            if (!saeGrade) {
                return errorJson("SAE Grade not found", 404);
            }

            const product = await findGasolineProductForSave(productId, saeGradeId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Gasoline/PCMO category", 400);
            }

            const linkedWithSaeGrade = await productIsInSaeGrade(saeGradeId, productDocumentId);

            if (!linkedWithSaeGrade) {
                return errorJson("Selected product is not connected with selected SAE Grade", 400);
            }

            /*
                Important:
                First search existing dosage by relation combination:
                API + SAE Grade + Product

                This prevents creating a new Dosage row every time the user edits
                the same Gasoline/PCMO dosage value. dosageId is only a fallback.
            */
            let existingDosage = await getDosageRecord({
                apiId,
                saeGradeId,
                productId: productDocumentId,
            });

            if (!existingDosage && dosageId) {
                existingDosage = await getByDocumentId("dosages", dosageId, {
                    sys_apis: true,
                    sys_sae_grades: true,
                    products: true,
                });
            }

            if (existingDosage?.documentId) {
                const updated = await strapiPut(
                    `dosages/${existingDosage.documentId}?status=published`,
                    {
                        data: {
                            dosage: title.trim(),
                            sys_apis: [apiId],
                            sys_sae_grades: [saeGradeId],
                            products: [productDocumentId],
                        },
                    }
                );

                if (!updated.ok) {
                    return errorJson("Failed to update Dosage", updated.status, updated.data);
                }

                return okJson({
                    item: updated.data?.data || {
                        id: existingDosage?.id,
                        documentId: existingDosage?.documentId,
                        dosage: title.trim(),
                    },
                });
            }

            const created = await strapiPost("dosages?status=published", {
                data: {
                    dosage: title.trim(),
                    sys_apis: [apiId],
                    sys_sae_grades: [saeGradeId],
                    products: [productDocumentId],
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

            const product = await findGasolineProductForSave(productId, saeGradeId);

            if (!product) {
                return errorJson("Product not found in published Gasoline/PCMO category", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Gasoline/PCMO category", 400);
            }

            const alreadyLinked = await productIsInSaeGrade(saeGradeId, productDocumentId);

            if (alreadyLinked) {
                return errorJson("This Product already exists in selected SAE Grade", 409);
            }

            const updated = await connectProductToSaeGrade(saeGradeId, productDocumentId);

            if (!updated.ok) {
                return errorJson(
                    "Failed to connect Product with SAE Grade",
                    updated.status,
                    updated.data
                );
            }

            return okJson({
                item: updated.data?.data || product,
            });
        }

        if (["acea", "ilsac", "oem"].includes(type)) {
            if (!saeGradeId || !productId || !title) {
                return errorJson("saeGradeId, productId or title is missing", 400);
            }

            const cfg = TYPE_CONFIG[type];

            const product = await findGasolineProductForSave(productId, saeGradeId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Gasoline/PCMO category", 400);
            }

            const linkedWithSaeGrade = await productIsInSaeGrade(saeGradeId, productDocumentId);

            if (!linkedWithSaeGrade) {
                return errorJson("Selected product is not connected with selected SAE Grade", 400);
            }

            const duplicate = await findLeafByTitleAndSaeAndProduct({
                endpoint: cfg.endpoint,
                field: cfg.field,
                title,
                saeGradeId,
                productId: productDocumentId,
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
                    product: productDocumentId,
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
        console.log("[gasoline POST ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}

export async function DELETE(req) {
    try {
        const body = await req.json();
        const { type, documentId, saeGradeId } = body;

        if (!type || !documentId) {
            return errorJson("type or documentId is missing", 400);
        }

        if (!TYPE_CONFIG[type]) {
            return errorJson("Invalid delete type", 400);
        }

        const check = await getDeleteCheck(type, documentId, saeGradeId);

        if (check.blocked) {
            return errorJson(check.message || "This item cannot be deleted", 409);
        }

        if (type === "product") {
            if (!saeGradeId) {
                return errorJson("saeGradeId is missing for product relation remove", 400);
            }

            const updated = await removeProductFromSaeGrade(saeGradeId, documentId);

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
        console.log("[gasoline DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}