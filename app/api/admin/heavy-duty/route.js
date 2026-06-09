import { NextResponse } from "next/server";
import qs from "qs";
import ENUMS from "../../../admin/config/enums.json";

export const runtime = "nodejs";

const STATIC_CATEGORY = {
    title: "Heavy Duty /HDDEO",
    slug: "heavy-duty-hddeo",
};

const CATEGORY_TITLE_ALIASES = [
    "Heavy Duty /HDDEO",
    "Heavy Duty/HDDEO",
    "Heavy Duty HDDEO",
    "HDDEO",
];

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
    acea: {
        endpoint: "aceas",
        field: "name",
        label: "ACEA",
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
    api: true,
    dosages: true,
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
    console.log("[heavy-duty fetchData] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[heavy-duty fetchData] status:", parsed.status);
        console.log(
            "[heavy-duty fetchData] first 1200 chars:",
            JSON.stringify(parsed.data).slice(0, 1200)
        );

        return parsed.data;
    } catch (err) {
        console.log("[heavy-duty fetchData] ERROR:", err);
        return null;
    }
}

async function strapiRequest(method, endpoint, payload = null) {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = joinUrl(baseUrl, endpoint);

    console.log("==================================================");
    console.log(`[heavy-duty ${method}] URL:`, url);

    if (payload) {
        console.log(`[heavy-duty ${method}] payload:`, JSON.stringify(payload, null, 2));
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

    console.log(`[heavy-duty ${method}] status:`, parsed.status);
    console.log(`[heavy-duty ${method}] response:`, JSON.stringify(parsed.data).slice(0, 1200));

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

function getId(item) {
    return String(item?.documentId || item?.id || "");
}

function sameId(item, selectedId) {
    if (!item || !selectedId) return false;

    return (
        String(item?.documentId || "") === String(selectedId) ||
        String(item?.id || "") === String(selectedId)
    );
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
    return uniqueByIdOrLabel(items).map((item) => ({
        id: item?.id,
        documentId: item?.documentId || item?.id,
        label: getField(item, field),
    }));
}

function mapProductItems(items = []) {
    return uniqueByIdOrLabel(items)
        .map((item) => ({
            id: item?.id,
            documentId: item?.documentId || item?.id,
            label:
                getField(item, "title") ||
                getField(item, "name") ||
                getField(item, "slug") ||
                `Product ${item?.id || ""}`,
        }))
        .filter((item) => item.label);
}

function uniqueByIdOrLabel(items = []) {
    const map = new Map();

    (Array.isArray(items) ? items : []).forEach((item) => {
        if (!item) return;

        const key =
            String(item?.documentId || "") ||
            String(item?.id || "") ||
            String(getField(item, "title") || getField(item, "name") || getField(item, "slug") || "");

        if (!key) return;

        if (!map.has(key)) {
            map.set(key, item);
        }
    });

    return Array.from(map.values());
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

function getRelationsByNames(item, names = []) {
    const found = [];

    names.forEach((name) => {
        getRelationArray(item, name).forEach((rel) => found.push(rel));

        const obj = getRelationObject(item, name);

        if (obj) found.push(obj);
    });

    return uniqueByIdOrLabel(found);
}

function categoryMatches(category) {
    if (!category) return false;

    const slug = getField(category, "slug");
    const title = getField(category, "title") || getField(category, "name");

    if (slug === STATIC_CATEGORY.slug) return true;

    if (sameText(title, STATIC_CATEGORY.title)) return true;

    return CATEGORY_TITLE_ALIASES.some((alias) => sameText(title, alias));
}

function productBelongsToStaticCategory(product) {
    const categories = [
        ...getRelationArray(product, "product_categories"),
        ...getRelationArray(product, "product_category"),
    ];

    if (!categories.length) {
        return false;
    }

    return categories.some(categoryMatches);
}

function getEnumForType(type) {
    if (type === "api") return ENUMS.API || [];
    if (type === "saeGrade") return ENUMS.SAEGrade || [];
    if (type === "acea") return ENUMS.ACEA || [];
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
                    ...CATEGORY_TITLE_ALIASES.map((title) => ({
                        title: {
                            $eqi: title,
                        },
                    })),
                ],
            },
            populate: {
                apis: true,
                products: {
                    populate: productPopulate,
                },
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

    if (directRes?.data) return directRes.data;

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

async function getByDocumentId(endpoint, documentId, populate = {}) {
    return getByAnyId(endpoint, documentId, populate);
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

async function getProductDosage({ apiId = "", saeGradeId = "", productId }) {
    if (!apiId || !saeGradeId || !productId) return null;

    /*
        Important:
        Do NOT use product.dosages[0].
        Dosage has many-to-many relation with Product.

        Correct Heavy Duty / HDDEO dosage depends on:
        Product + API + SAE Grade
    */
    const product = await findHeavyDutyProductForSave(productId);
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

async function getSaeGradeWithProducts(saeGradeId) {
    if (!saeGradeId) return null;

    return getByAnyId("sae-grades", saeGradeId, {
        api: true,
        products: {
            populate: productPopulate,
        },
        aceas: true,
        oems: true,
    });
}

function getProductsFromSaeGradeRecord(saeGrade) {
    return getRelationsByNames(saeGrade, ["products", "product"]);
}

function productHasSelectedSae(product, saeGradeId) {
    if (!saeGradeId) return true;

    const rels = getRelationsByNames(product, [
        "sae_grades",
        "sae_grade",
        "saeGrades",
        "saeGrade",
    ]);

    return rels.some((rel) => sameId(rel, saeGradeId));
}

async function loadAllHeavyDutyProducts() {
    const category = await getStaticCategory();

    const fromCategory = getRelationsByNames(category, ["products", "product"]).filter(
        productBelongsToStaticCategory
    );

    if (fromCategory.length) {

        return fromCategory;
    }

    const queries = [
        {
            label: "product_categories.slug",
            query: qs.stringify(
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
                    populate: productPopulate,
                    pagination: {
                        pageSize: 1000,
                    },
                    sort: ["title:asc"],
                },
                {
                    encodeValuesOnly: true,
                }
            ),
        },
        {
            label: "product_category.slug",
            query: qs.stringify(
                {
                    status: "published",
                    filters: {
                        product_category: {
                            slug: {
                                $eq: STATIC_CATEGORY.slug,
                            },
                        },
                    },
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
            ),
        },
    ];

    for (const item of queries) {
        const res = await fetchData("products", item.query);
        const rows = (res?.data || []).filter(productBelongsToStaticCategory);

        console.log(`[heavy-duty all-products] source: ${item.label}`, rows.length);

        if (rows.length) {
            return rows;
        }
    }

    const allQuery = qs.stringify(
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

    const allRes = await fetchData("products", allQuery);
    const allRows = allRes?.data || [];
    const filtered = allRows.filter(productBelongsToStaticCategory);

    console.log("[heavy-duty all-products] source: all-products JS filter", filtered.length);

    return filtered;
}


async function findHeavyDutyProductForSave(productId) {
    if (!productId) return null;


    const allHeavyDutyProducts = await loadAllHeavyDutyProducts();

    const fromList = allHeavyDutyProducts.find((product) => sameId(product, productId));

    if (fromList) {
        console.log("[heavy-duty save product] found from allHeavyDutyProducts:", getId(fromList));
        return fromList;
    }

    const direct = await getByAnyId("products", productId, productPopulate);

    if (direct && productBelongsToStaticCategory(direct)) {
        console.log("[heavy-duty save product] found by direct lookup:", getId(direct));
        return direct;
    }

    console.log("[heavy-duty save product] product not found for productId:", productId);
    return null;
}

async function loadProductsForSelectedSaeGrade(saeGradeId) {
    if (!saeGradeId) return [];

    const saeGrade = await getSaeGradeWithProducts(saeGradeId);

    const fromSaeGrade = getProductsFromSaeGradeRecord(saeGrade).filter((product) => {
        return productBelongsToStaticCategory(product);
    });

    if (fromSaeGrade.length) {
        console.log("[heavy-duty products] source: saeGrade.products", fromSaeGrade.length);
        return fromSaeGrade;
    }

    const allHeavyDutyProducts = await loadAllHeavyDutyProducts();

    const filtered = allHeavyDutyProducts.filter((product) => productHasSelectedSae(product, saeGradeId));

    console.log("[heavy-duty products] source: all-heavy-duty filtered by sae", filtered.length);

    return filtered;
}

async function getDeleteCheck(type, documentId) {
    if (type === "product") {
        const item = await getByDocumentId("products", documentId, {
            ...productPopulate,
            sys_aceas: {
                fields: ["name"],
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
        const oemCount = getRelationArray(item, "sys_oems").length;

        if (aceaCount || oemCount) {
            return {
                blocked: true,
                message: `This Product has relation data (${aceaCount} ACEA, ${oemCount} OEM). First remove relation data, then remove Product relation from SAE Grade.`,
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
        const oemCount = getRelationArray(item, "oems").length;

        if (productCount || aceaCount || oemCount) {
            return {
                blocked: true,
                message: `This SAE Grade has relation data (${productCount} Product, ${aceaCount} ACEA, ${oemCount} OEM). First remove relation data, then delete it.`,
            };
        }

        return {
            blocked: false,
        };
    }

    if (["acea", "oem"].includes(type)) {
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

        console.log("==================================================");
        console.log("[heavy-duty GET] mode:", mode);
        console.log("[heavy-duty GET] apiId:", apiId);
        console.log("[heavy-duty GET] saeGradeId:", saeGradeId);
        console.log("[heavy-duty GET] productId:", productId);

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
                    documentId: category?.documentId || category?.id,
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
            console.log("[heavy-duty GET dosage] fetching dosage for productId:", productId, "apiId:", apiId, "saeGradeId:", saeGradeId);
            const dosage = await getProductDosage({
                apiId,
                saeGradeId,
                productId,
            });

            console.log("[heavy-duty GET dosage] found dosage:", dosage);

            return okJson({
                item: dosage
                    ? {
                        id: dosage?.id,
                        documentId: dosage?.documentId || dosage?.id,
                        title: getField(dosage, "dosage") || getField(dosage, "title"),
                    }
                    : null,
            });
        }

        if (mode === "allapis" || mode === "apis") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId || category?.id;

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

            const products = await loadProductsForSelectedSaeGrade(saeGradeId);

            return okJson({
                items: mapProductItems(products),
            });
        }

        if (mode === "all-products") {
            const allProducts = await loadAllHeavyDutyProducts();

            return okJson({
                items: mapProductItems(allProducts),
            });
        }

        if (
            [
                "all-aceas",
                "acea",
                "aceas",
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

            const normalizedType = mode.includes("acea") ? "acea" : "oem";
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
        console.log("[heavy-duty GET ERROR]", err);
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
        console.log("[heavy-duty POST] body:", body);

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

            /*
                Important:
                Do not use direct getByDocumentId here.
                The selected product came from Add Product dropdown, so use the same
                reliable Heavy Duty product source.
            */
            const product = await findHeavyDutyProductForSave(productId);

            if (!product) {
                return errorJson(
                    "Product not found. Dosage save could not verify selected Heavy Duty product.",
                    404
                );
            }

            const productDocumentId = product?.documentId || productId;

            const dosagePayload = {
                dosage: title.trim(),
                products: [productDocumentId],
                ...(apiId ? { sys_apis: [apiId] } : {}),
                ...(saeGradeId ? { sys_sae_grades: [saeGradeId] } : {}),
            };

            // console.log("[heavy-duty POST dosage] dosagePayload:", dosagePayload);


            /*
                Important:
                First search existing dosage by relation combination:
                API + SAE Grade + Product

                This prevents creating a new Dosage row every time the user edits
                the same Heavy Duty dosage value. dosageId is only a fallback.
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

                const updated = await strapiPut(
                    `dosages/${dosageDocumentId}?status=published`,
                    {
                        data: dosagePayload,
                    }
                );

                if (!updated.ok) {
                    return errorJson("Failed to update Dosage", updated.status, updated.data);
                }

                const updatedItem = updated.data?.data || null;

                return okJson({
                    item: updatedItem
                        ? {
                            id: updatedItem?.id,
                            documentId: updatedItem?.documentId || updatedItem?.id,
                            title: getField(updatedItem, "dosage") || title.trim(),
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
                        title: getField(createdItem, "dosage") || title.trim(),
                    }
                    : null,
            });
        }

        if (type === "api") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId || category?.id;

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

            const product = await findHeavyDutyProductForSave(productId);

            if (!product) {
                return errorJson(
                    "Product not found in Heavy Duty /HDDEO category. Product is visible in dropdown but save lookup failed. Check product_categories relation and published status.",
                    404
                );
            }

            const productDocumentId = product?.documentId || productId;

            const existingSaeGradeIds = getRelationsByNames(product, [
                "sae_grades",
                "sae_grade",
                "saeGrades",
                "saeGrade",
            ])
                .map((item) => item?.documentId || item?.id)
                .filter(Boolean)
                .map(String);

            const nextSaeGradeIds = Array.from(
                new Set([...existingSaeGradeIds, String(saeGradeId)])
            );

            const updated = await strapiPut(`products/${productDocumentId}?status=published`, {
                data: {
                    api: apiId,
                    sae_grades: nextSaeGradeIds,
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
                item: updated.data?.data || product,
            });
        }

        if (["acea", "oem"].includes(type)) {
            if (!saeGradeId || !productId || !title) {
                return errorJson("saeGradeId, productId or title is missing", 400);
            }

            const cfg = TYPE_CONFIG[type];

            const product = await findHeavyDutyProductForSave(productId);

            if (!product) {
                return errorJson("Product not found", 404);
            }

            const productDocumentId = product?.documentId || productId;

            if (!productBelongsToStaticCategory(product)) {
                return errorJson("Product does not belong to Heavy Duty /HDDEO category", 400);
            }

            if (!productHasSelectedSae(product, saeGradeId)) {
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
        console.log("[heavy-duty POST ERROR]", err);
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
            const product = await getByAnyId("products", documentId, productPopulate);
            const productDocumentId = product?.documentId || documentId;

            const updated = await strapiPut(`products/${productDocumentId}?status=published`, {
                data: {
                    api: null,
                    sae_grades: [],
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
        console.log("[heavy-duty DELETE ERROR]", err);
        return errorJson(err.message || "Server error", 500);
    }
}
