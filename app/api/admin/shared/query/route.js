import { NextResponse } from "next/server";
import qs from "qs";

export const runtime = "nodejs";

const CATEGORY_CONFIG = {
    "pcmo-gasoline": {
        title: "Gasoline/PCMO",
        slug: "pcmo-gasoline",
        flow: ["api", "saeGrade"],
        refine: ["acea", "ilsac", "oem"],
    },
    "heavy-duty-hddeo": {
        title: "Heavy Duty/HDDEO",
        slug: "heavy-duty-hddeo",
        flow: ["api", "saeGrade"],
        refine: ["acea", "oem"],
    },
    "motorcycle-oil-additive": {
        title: "Motorcycle",
        slug: "motorcycle-oil-additive",
        flow: ["api", "saeGrade"],
        refine: ["jaso"],
    },
    "driveline-additives": {
        title: "Driveline",
        slug: "driveline-additives",
        flow: ["type", "api"],
        refine: ["oem"],
    },
    "viscosity-index-improvers": {
        title: "Viscosity",
        slug: "viscosity-index-improvers",
        flow: ["type"],
        refine: ["ssi"],
    },
    "industrial-additives": {
        title: "Industrial",
        slug: "industrial-additives",
        flow: ["type"],
        refine: ["oem"],
    },
    "marine-additives": {
        title: "Marine",
        slug: "marine-additives",
        flow: ["type"],
        refine: ["oem"],
    },
    "lubricant-components": {
        title: "Lubricant Components",
        slug: "lubricant-components",
        flow: ["type"],
        refine: [],
    },
    "grease-additives": {
        title: "Grease",
        slug: "grease-additives",
        flow: ["type"],
        refine: [],
    },
    "synthetic-oils": {
        title: "Synthetic",
        slug: "synthetic-oils",
        flow: ["type"],
        refine: [],
    },
    "speciality-chemicals": {
        title: "Speciality",
        slug: "speciality-chemicals",
        flow: ["type"],
        refine: [],
    },
};

const TYPE_FIRST_CATEGORY_SLUGS = new Set([
    "driveline-additives",
    "viscosity-index-improvers",
    "industrial-additives",
    "marine-additives",
    "lubricant-components",
    "grease-additives",
    "synthetic-oils",
    "speciality-chemicals",
]);

const FIELD_LABELS = {
    api: "API",
    saeGrade: "SAE Grade",
    type: "Type",
    acea: "ACEA",
    ilsac: "ILSAC",
    oem: "OEM",
    jaso: "JASO",
    ssi: "SSI",
};

const PRODUCT_RELATION_FIELDS = {
    acea: ["sys_aceas", "aceas", "acea"],
    ilsac: ["sys_ilsacs", "ilsacs", "ilsac"],
    oem: ["sys_oems", "oems", "oem"],
    jaso: ["sys_jasos", "jasos", "jaso"],
    ssi: ["ssis", "ssi"],
};

const SAE_RELATION_FIELDS = {
    acea: ["aceas"],
    ilsac: ["ilsacs"],
    oem: ["oems"],
    jaso: ["jasos"],
};

const TYPE_RELATION_FIELDS = {
    api: ["apis", "api"],
    product: ["products", "product"],
    oem: ["oems", "oem"],
    ssi: ["ssis", "ssi"],
};

const PRODUCT_POPULATE = {
    product_categories: true,
    product_category: true,
    api: true,
    apis: true,
    sae_grade: true,
    sae_grades: true,
    saeGrade: true,
    saeGrades: true,
    type: true,
    types: true,
    sys_aceas: true,
    sys_ilsacs: true,
    sys_oems: true,
    sys_jasos: true,
    aceas: true,
    ilsacs: true,
    oems: true,
    jasos: true,
    ssis: true,
    productImage: true,
    image: true,
    thumbnail: true,
};

const SAE_GRADE_POPULATE = {
    api: true,
    apis: true,
    products: {
        populate: PRODUCT_POPULATE,
    },
    product: {
        populate: PRODUCT_POPULATE,
    },
    aceas: true,
    ilsacs: true,
    oems: true,
    jasos: true,
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
    console.log("[shared query] URL:", url);

    try {
        const res = await fetch(url, {
            headers: {
                "Strapi-Response-Format": "v4",
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            cache: "no-store",
        });

        const parsed = await parseResponse(res);

        console.log("[shared query] status:", parsed.status);
        console.log(
            "[shared query] first 1200 chars:",
            JSON.stringify(parsed.data).slice(0, 1200)
        );

        return parsed.data;
    } catch (err) {
        console.log("[shared query] fetch error:", endpoint, err);
        return null;
    }
}

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

function getLabel(item) {
    return (
        getField(item, "title") ||
        getField(item, "name") ||
        getField(item, "label") ||
        getField(item, "grade") ||
        getField(item, "slug") ||
        `Item ${item?.id || ""}`
    );
}

function getProductTitle(product) {
    return (
        getField(product, "title") ||
        getField(product, "name") ||
        getField(product, "productName") ||
        getField(product, "productTitle") ||
        getField(product, "slug") ||
        `Product ${product?.id || ""}`
    );
}

function getId(item) {
    return String(item?.documentId || item?.id || "");
}

function sameId(item, selectedId) {
    if (!item || !selectedId) return false;

    const selected = String(selectedId);

    return (
        String(item?.documentId || "") === selected ||
        String(item?.id || "") === selected
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

function getRelationsByNames(item, names = []) {
    const found = [];

    names.forEach((name) => {
        getRelationArray(item, name).forEach((rel) => {
            if (rel && (rel.id || rel.documentId)) {
                found.push(rel);
            }
        });

        const obj = getRelationObject(item, name);

        if (obj && (obj.id || obj.documentId)) {
            found.push(obj);
        }
    });

    return uniqueRelationObjects(found);
}

function uniqueRelationObjects(items = []) {
    const map = new Map();

    items.forEach((item) => {
        const key = getId(item);

        if (!key) return;

        if (!map.has(key)) {
            map.set(key, item);
        }
    });

    return Array.from(map.values());
}

function optionFromRelation(rel) {
    return {
        id: rel?.id,
        documentId: rel?.documentId || rel?.id,
        label: getLabel(rel),
    };
}

function uniqueOptions(options = []) {
    const map = new Map();

    options.forEach((item) => {
        const key = String(item.documentId || item.id || item.label || "");

        if (!key) return;

        if (!map.has(key)) {
            map.set(key, item);
        }
    });

    return Array.from(map.values()).sort((a, b) =>
        String(a.label || "").localeCompare(String(b.label || ""))
    );
}

function categoryMatches(category, categorySlug) {
    if (!category) return false;

    return (
        getField(category, "slug") === categorySlug ||
        sameText(getField(category, "title"), categorySlug)
    );
}

function productBelongsToCategory(product, categorySlug) {
    const categories = [
        ...getRelationArray(product, "product_categories"),
        ...getRelationArray(product, "product_category"),
    ];

    return categories.some((category) => categoryMatches(category, categorySlug));
}

function relationHasCategory(item, categorySlug) {
    const single = getRelationObject(item, "product_category");

    if (single && categoryMatches(single, categorySlug)) {
        return true;
    }

    const many = [
        ...getRelationArray(item, "product_categories"),
        ...getRelationArray(item, "product_category"),
    ];

    return many.some((cat) => categoryMatches(cat, categorySlug));
}

function hasRelationByNames(item, names = [], selectedId) {
    if (!selectedId) return true;

    return getRelationsByNames(item, names).some((rel) => sameId(rel, selectedId));
}

function productHasApi(product, apiId) {
    return hasRelationByNames(product, ["api", "apis"], apiId);
}

function productHasSaeGrade(product, saeGradeId) {
    return hasRelationByNames(
        product,
        ["sae_grade", "sae_grades", "saeGrade", "saeGrades"],
        saeGradeId
    );
}

function productHasType(product, typeId) {
    return hasRelationByNames(product, ["type", "types"], typeId);
}

function productHasFilterRelation(product, field, selectedId) {
    if (!selectedId) return true;

    const names = PRODUCT_RELATION_FIELDS[field] || [field];

    return hasRelationByNames(product, names, selectedId);
}

function productHasSaeGradeViaFilterRelations(product, saeGradeId) {
    if (!saeGradeId) return true;

    const filterFields = ["acea", "ilsac", "oem", "jaso"];

    return filterFields.some((field) => {
        const names = PRODUCT_RELATION_FIELDS[field] || [field];
        const rels = getRelationsByNames(product, names);

        return rels.some((rel) =>
            hasRelationByNames(
                rel,
                ["sae_grade", "sae_grades", "saeGrade", "saeGrades"],
                saeGradeId
            )
        );
    });
}

function imageUrlFromProduct(product) {
    const base =
        process.env.NEXT_PUBLIC_STRAPI_PUBLIC_URL ||
        process.env.NEXT_PUBLIC_ADMIN_BASE_URL ||
        process.env.NEXT_PUBLIC_API_BASE_URL ||
        "";

    const possibleMedia = [
        getRelationObject(product, "image"),
        getRelationObject(product, "productImage"),
        getRelationObject(product, "product_image"),
        getRelationObject(product, "thumbnail"),
    ].filter(Boolean);

    const media = possibleMedia[0];

    const url =
        getField(media, "url") ||
        media?.url ||
        media?.formats?.thumbnail?.url ||
        media?.formats?.small?.url ||
        "";

    if (!url) return "";

    if (url.startsWith("http")) return url;

    return `${String(base).replace(/\/api\/?$/, "").replace(/\/$/, "")}${url}`;
}

function productToCard(product) {
    return {
        id: product?.id,
        documentId: product?.documentId,
        title: getProductTitle(product),
        slug: getField(product, "slug"),
        image: imageUrlFromProduct(product),

        api: getRelationsByNames(product, ["api", "apis"]).map(getLabel)[0] || "",
        saeGrade:
            getRelationsByNames(product, [
                "sae_grade",
                "sae_grades",
                "saeGrade",
                "saeGrades",
            ]).map(getLabel)[0] || "",
        type: getRelationsByNames(product, ["type", "types"]).map(getLabel)[0] || "",

        aceas: getRelationsByNames(product, PRODUCT_RELATION_FIELDS.acea).map(getLabel),
        ilsacs: getRelationsByNames(product, PRODUCT_RELATION_FIELDS.ilsac).map(getLabel),
        oems: getRelationsByNames(product, PRODUCT_RELATION_FIELDS.oem).map(getLabel),
        jasos: getRelationsByNames(product, PRODUCT_RELATION_FIELDS.jaso).map(getLabel),
        ssis: getRelationsByNames(product, PRODUCT_RELATION_FIELDS.ssi).map(getLabel),
    };
}

/* ---------------- PRODUCT DOSAGE ---------------- */

function getProductKeys(product) {
    const keys = [];

    if (product?.documentId) keys.push(String(product.documentId));
    if (product?.id) keys.push(String(product.id));

    return keys;
}

function getDosageProductKeys(dosage) {
    const product = getRelationObject(dosage, "product");
    const keys = [];

    if (product?.documentId) keys.push(String(product.documentId));
    if (product?.id) keys.push(String(product.id));

    return keys;
}

async function loadProductDosageMap() {
    const query = qs.stringify(
        {
            status: "published",
            populate: {
                product: true,
            },
            pagination: {
                pageSize: 1000,
            },
            sort: ["title:asc"],
        },
        { encodeValuesOnly: true }
    );

    const res = await fetchData("product-dosages", query);
    const dosages = res?.data || [];

    const map = new Map();

    dosages.forEach((dosage) => {
        const title = getField(dosage, "title");

        if (!title) return;

        const productKeys = getDosageProductKeys(dosage);

        productKeys.forEach((key) => {
            if (!key) return;

            const existing = map.get(key);

            if (existing) {
                map.set(key, `${existing}, ${title}`);
            } else {
                map.set(key, title);
            }
        });
    });

    return map;
}

function productToCardWithDosage(product, dosageMap) {
    const card = productToCard(product);

    let dosage = "";

    for (const key of getProductKeys(product)) {
        if (dosageMap.has(key)) {
            dosage = dosageMap.get(key);
            break;
        }
    }

    return {
        ...card,
        dosage,
    };
}

function getSelectedFilters(searchParams) {
    return {
        api: searchParams.get("api") || "",
        saeGrade: searchParams.get("saeGrade") || "",
        type: searchParams.get("type") || "",
        acea: searchParams.get("acea") || "",
        ilsac: searchParams.get("ilsac") || "",
        oem: searchParams.get("oem") || "",
        jaso: searchParams.get("jaso") || "",
        ssi: searchParams.get("ssi") || "",
    };
}

async function loadCollectionItems(endpoint, extraQuery = {}) {
    const query = qs.stringify(
        {
            status: "published",
            populate: "*",
            pagination: {
                pageSize: 1000,
            },
            sort: ["name:asc", "title:asc"],
            ...extraQuery,
        },
        { encodeValuesOnly: true }
    );

    const res = await fetchData(endpoint, query);
    return res?.data || [];
}

async function loadProductsFromStrapi() {
    return loadCollectionItems("products", {
        sort: ["title:asc"],
    });
}

async function getByAnyIdFromCollection(endpoint, selectedId) {
    if (!selectedId) return null;

    const wanted = String(selectedId);

    const directQuery = qs.stringify(
        {
            status: "published",
            populate: "*",
        },
        { encodeValuesOnly: true }
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
            populate: "*",
            pagination: {
                pageSize: 1,
            },
        },
        { encodeValuesOnly: true }
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
            populate: "*",
            pagination: {
                pageSize: 1,
            },
        },
        { encodeValuesOnly: true }
    );

    const idRes = await fetchData(endpoint, idQuery);

    if (idRes?.data?.[0]) {
        return idRes.data[0];
    }

    const allItems = await loadCollectionItems(endpoint);

    return allItems.find((item) => sameId(item, wanted)) || null;
}

async function getProductCategory(categorySlug) {
    const query = qs.stringify(
        {
            status: "published",
            filters: {
                slug: {
                    $eq: categorySlug,
                },
            },
            populate: "*",
            pagination: {
                pageSize: 1,
            },
        },
        { encodeValuesOnly: true }
    );

    const res = await fetchData("product-categories", query);
    return res?.data?.[0] || null;
}

/* ---------------- API / SAE FLOW ---------------- */

async function getApiOptions(categorySlug) {
    const category = await getProductCategory(categorySlug);
    const fromCategory = getRelationsByNames(category, ["apis", "api"]).map(optionFromRelation);

    if (fromCategory.length) {
        return uniqueOptions(fromCategory);
    }

    const apis = await loadCollectionItems("apis");

    const filtered = apis.filter((api) => relationHasCategory(api, categorySlug));

    return uniqueOptions(filtered.map(optionFromRelation));
}

async function getSaeGradeOptionsFromApi(apiId) {
    if (!apiId) return [];

    const api = await getByAnyIdFromCollection("apis", apiId);

    const items = [];

    if (api) {
        getRelationsByNames(api, ["sae_grades", "saeGrades", "sae_grades"]).forEach((grade) => {
            items.push(optionFromRelation(grade));
        });
    }

    if (!items.length) {
        const grades = await loadCollectionItems("sae-grades");

        grades.forEach((grade) => {
            if (hasRelationByNames(grade, ["api", "apis"], apiId)) {
                items.push(optionFromRelation(grade));
            }
        });
    }

    return uniqueOptions(items);
}

async function getSaeGradeBySelectedFilter(saeGradeId) {
    if (!saeGradeId) return null;

    const wanted = String(saeGradeId);

    const directQuery = qs.stringify(
        {
            status: "published",
            populate: SAE_GRADE_POPULATE,
        },
        { encodeValuesOnly: true }
    );

    const directRes = await fetchData(`sae-grades/${wanted}`, directQuery);

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
            populate: SAE_GRADE_POPULATE,
            pagination: {
                pageSize: 1,
            },
        },
        { encodeValuesOnly: true }
    );

    const documentIdRes = await fetchData("sae-grades", documentIdQuery);

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
            populate: SAE_GRADE_POPULATE,
            pagination: {
                pageSize: 1,
            },
        },
        { encodeValuesOnly: true }
    );

    const idRes = await fetchData("sae-grades", idQuery);

    if (idRes?.data?.[0]) {
        return idRes.data[0];
    }

    return getByAnyIdFromCollection("sae-grades", saeGradeId);
}

function getOptionsFromSaeGradeRecord(saeGrade, field) {
    if (!saeGrade) return [];

    const names = SAE_RELATION_FIELDS[field] || [];

    const rels = getRelationsByNames(saeGrade, names);

    return uniqueOptions(rels.map(optionFromRelation));
}

function getProductsFromSaeGradeRecord(saeGrade) {
    if (!saeGrade) return [];

    return getRelationsByNames(saeGrade, ["products", "product"]);
}

async function getProductsBySaeGradeFallback(saeGradeId) {
    if (!saeGradeId) return [];

    const byDocumentIdQuery = qs.stringify(
        {
            status: "published",
            filters: {
                sae_grade: {
                    documentId: {
                        $eq: String(saeGradeId),
                    },
                },
            },
            populate: PRODUCT_POPULATE,
            pagination: {
                pageSize: 1000,
            },
            sort: ["title:asc"],
        },
        { encodeValuesOnly: true }
    );

    const byDocumentIdRes = await fetchData("products", byDocumentIdQuery);

    if (byDocumentIdRes?.data?.length) {
        return byDocumentIdRes.data;
    }

    const byIdQuery = qs.stringify(
        {
            status: "published",
            filters: {
                sae_grade: {
                    id: {
                        $eq: String(saeGradeId),
                    },
                },
            },
            populate: PRODUCT_POPULATE,
            pagination: {
                pageSize: 1000,
            },
            sort: ["title:asc"],
        },
        { encodeValuesOnly: true }
    );

    const byIdRes = await fetchData("products", byIdQuery);

    return byIdRes?.data || [];
}

/* ---------------- TYPE FLOW ---------------- */

async function getTypeOptions(categorySlug) {
    const directQuery = qs.stringify(
        {
            status: "published",
            filters: {
                product_category: {
                    slug: {
                        $eq: categorySlug,
                    },
                },
            },
            populate: "*",
            pagination: {
                pageSize: 1000,
            },
            sort: ["title:asc", "name:asc"],
        },
        { encodeValuesOnly: true }
    );

    const directRes = await fetchData("types", directQuery);
    const directItems = directRes?.data || [];

    if (directItems.length) {
        return uniqueOptions(directItems.map(optionFromRelation));
    }

    const allTypes = await loadCollectionItems("types");

    const filteredTypes = allTypes.filter((type) => relationHasCategory(type, categorySlug));

    if (filteredTypes.length) {
        return uniqueOptions(filteredTypes.map(optionFromRelation));
    }

    const category = await getProductCategory(categorySlug);

    const typesFromCategory = getRelationsByNames(category, ["types", "type"]);

    return uniqueOptions(typesFromCategory.map(optionFromRelation));
}

async function getSelectedType(typeId) {
    if (!typeId) return null;

    return getByAnyIdFromCollection("types", typeId);
}

function getTypeRelationOptions(typeItem, field) {
    if (!typeItem) return [];

    const names = TYPE_RELATION_FIELDS[field] || [];

    const rels = getRelationsByNames(typeItem, names);

    return uniqueOptions(rels.map(optionFromRelation));
}

function getProductsFromTypeRecord(typeItem) {
    if (!typeItem) return [];

    return getRelationsByNames(typeItem, TYPE_RELATION_FIELDS.product);
}

function getOemOptionsFromTypeRecord(typeItem) {
    return getTypeRelationOptions(typeItem, "oem");
}

function getSsiOptionsFromTypeRecord(typeItem) {
    return getTypeRelationOptions(typeItem, "ssi");
}

function getApiOptionsFromTypeRecord(typeItem) {
    return getTypeRelationOptions(typeItem, "api");
}

/* ---------------- PRODUCT FILTERING ---------------- */

function makeProductIdSet(products = []) {
    const set = new Set();

    products.forEach((product) => {
        if (product?.documentId) set.add(String(product.documentId));
        if (product?.id) set.add(String(product.id));
    });

    return set;
}

function productIdInSet(product, set) {
    if (!product || !set?.size) return false;

    return (
        set.has(String(product.documentId || "")) ||
        set.has(String(product.id || ""))
    );
}

function mergeProducts(allProducts = [], relationProducts = []) {
    const map = new Map();

    relationProducts.forEach((product) => {
        const key = getId(product);

        if (key) {
            map.set(key, product);
        }
    });

    allProducts.forEach((product) => {
        const key = getId(product);

        if (key) {
            map.set(key, product);
        }
    });

    return Array.from(map.values());
}

async function filterProductsBySelectedRelations({
    products,
    categorySlug,
    filters,
    saeGrade,
    typeItem,
}) {
    let saeGradeProducts = getProductsFromSaeGradeRecord(saeGrade);

    if (filters.saeGrade && !saeGradeProducts.length) {
        saeGradeProducts = await getProductsBySaeGradeFallback(filters.saeGrade);
    }

    const saeGradeProductIds = makeProductIdSet(saeGradeProducts);

    const typeProducts = getProductsFromTypeRecord(typeItem);
    const typeProductIds = makeProductIdSet(typeProducts);

    const relationProducts = [
        ...(filters.saeGrade ? saeGradeProducts : []),
        ...(filters.type ? typeProducts : []),
    ];

    const mergedProducts =
        filters.saeGrade || filters.type
            ? mergeProducts(products, relationProducts)
            : products;

    return mergedProducts
        .filter((product) => {
            if (filters.saeGrade && productIdInSet(product, saeGradeProductIds)) {
                return true;
            }

            if (filters.type && productIdInSet(product, typeProductIds)) {
                return true;
            }

            return productBelongsToCategory(product, categorySlug);
        })
        .filter((product) => {
            if (filters.saeGrade && productIdInSet(product, saeGradeProductIds)) {
                return true;
            }

            if (!filters.api) return true;

            return productHasApi(product, filters.api);
        })
        .filter((product) => {
            if (!filters.saeGrade) return true;

            return (
                productIdInSet(product, saeGradeProductIds) ||
                productHasSaeGrade(product, filters.saeGrade) ||
                productHasSaeGradeViaFilterRelations(product, filters.saeGrade)
            );
        })
        .filter((product) => {
            if (!filters.type) return true;

            return (
                productIdInSet(product, typeProductIds) ||
                productHasType(product, filters.type)
            );
        })
        .filter((product) => productHasFilterRelation(product, "acea", filters.acea))
        .filter((product) => productHasFilterRelation(product, "ilsac", filters.ilsac))
        .filter((product) => productHasFilterRelation(product, "oem", filters.oem))
        .filter((product) => productHasFilterRelation(product, "jaso", filters.jaso))
        .filter((product) => productHasFilterRelation(product, "ssi", filters.ssi));
}

function filtersBeforeField(category, filters, field) {
    const ordered = [...category.flow, ...category.refine];
    const index = ordered.indexOf(field);

    const next = {};

    ordered.forEach((item, i) => {
        if (i < index && filters[item]) {
            next[item] = filters[item];
        }
    });

    return next;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");
        const field = searchParams.get("field");
        const categorySlug = searchParams.get("categorySlug");

        if (!mode) {
            return errorJson("mode is missing", 400);
        }

        if (!categorySlug || !CATEGORY_CONFIG[categorySlug]) {
            return errorJson("Invalid or missing categorySlug", 400);
        }

        const category = CATEGORY_CONFIG[categorySlug];
        const filters = getSelectedFilters(searchParams);

        if (mode === "options") {
            if (!field) {
                return errorJson("field is missing", 400);
            }

            if (field === "type" && TYPE_FIRST_CATEGORY_SLUGS.has(categorySlug)) {
                const typeOptions = await getTypeOptions(categorySlug);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: typeOptions,
                });
            }

            if (field === "api" && category.flow.includes("api") && !filters.type) {
                const apiOptions = await getApiOptions(categorySlug);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: apiOptions,
                });
            }

            if (field === "api" && categorySlug === "driveline-additives" && filters.type) {
                const typeItem = await getSelectedType(filters.type);
                const apiOptions = getApiOptionsFromTypeRecord(typeItem);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: apiOptions,
                });
            }

            if (field === "saeGrade") {
                const saeGradeOptions = await getSaeGradeOptionsFromApi(filters.api);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: saeGradeOptions,
                });
            }

            if (["acea", "ilsac", "oem", "jaso"].includes(field) && filters.saeGrade) {
                const saeGrade = await getSaeGradeBySelectedFilter(filters.saeGrade);

                const relationOptions = getOptionsFromSaeGradeRecord(saeGrade, field);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: relationOptions,
                });
            }

            if (field === "ssi" && filters.type) {
                const typeItem = await getSelectedType(filters.type);
                const ssiOptions = getSsiOptionsFromTypeRecord(typeItem);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: ssiOptions,
                });
            }

            if (
                field === "oem" &&
                filters.type &&
                ["industrial-additives", "marine-additives"].includes(categorySlug)
            ) {
                const typeItem = await getSelectedType(filters.type);
                const oemOptions = getOemOptionsFromTypeRecord(typeItem);

                return okJson({
                    label: FIELD_LABELS[field] || field,
                    items: oemOptions,
                });
            }

            const allProducts = await loadProductsFromStrapi();
            const previousFilters = filtersBeforeField(category, filters, field);
            const saeGrade = await getSaeGradeBySelectedFilter(previousFilters.saeGrade);
            const typeItem = await getSelectedType(previousFilters.type);

            const filteredProducts = await filterProductsBySelectedRelations({
                products: allProducts,
                categorySlug,
                filters: previousFilters,
                saeGrade,
                typeItem,
            });

            const relationNames =
                PRODUCT_RELATION_FIELDS[field] ||
                (field === "api" ? ["api", "apis"] : []) ||
                (field === "type" ? ["type", "types"] : []);

            const options = [];

            filteredProducts.forEach((product) => {
                getRelationsByNames(product, relationNames).forEach((rel) => {
                    options.push(optionFromRelation(rel));
                });
            });

            return okJson({
                label: FIELD_LABELS[field] || field,
                items: uniqueOptions(options),
            });
        }

        if (mode === "products") {
            const allProducts = await loadProductsFromStrapi();
            const saeGrade = await getSaeGradeBySelectedFilter(filters.saeGrade);
            const typeItem = await getSelectedType(filters.type);

            const products = await filterProductsBySelectedRelations({
                products: allProducts,
                categorySlug,
                filters,
                saeGrade,
                typeItem,
            });

            const dosageMap = await loadProductDosageMap();

            return okJson({
                category,
                items: products.map((product) => productToCardWithDosage(product, dosageMap)),
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[shared query GET ERROR]", err);

        return errorJson(err.message || "Server error", 500);
    }
}