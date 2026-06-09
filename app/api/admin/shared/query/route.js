import { NextResponse } from "next/server";
import qs from "qs";

export const runtime = "nodejs";

const STRAPI_LOCALE = "en";
const SAFE_PAGE_SIZE = 200;
const MAX_PAGES = 50;

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

const SAE_FLOW_CATEGORY_SLUGS = new Set([
    "pcmo-gasoline",
    "heavy-duty-hddeo",
    "motorcycle-oil-additive",
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

const LEAF_CONFIG = {
    acea: {
        endpoint: "aceas",
        field: "name",
        label: "ACEA",
    },
    ilsac: {
        endpoint: "ilsacs",
        field: "title",
        label: "ILSAC",
    },
    oem: {
        endpoint: "oems",
        field: "title",
        label: "OEM",
    },
    jaso: {
        endpoint: "jasos",
        field: "title",
        label: "JASO",
    },
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
    api: true,
    sae_grades: true,
    types: true,
    sys_aceas: true,
    sys_ilsacs: true,
    sys_oems: true,
    sys_jasos: true,
    productImage: true,
    dosages: true,
};

const SAE_GRADE_POPULATE = {
    api: true,
    products: {
        populate: PRODUCT_POPULATE,
    },
    aceas: true,
    ilsacs: true,
    oems: true,
    jasos: true,
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

    if (item[field] !== undefined) return item[field];
    if (item?.attributes?.[field] !== undefined) return item.attributes[field];

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

function isNumericId(value) {
    return /^\d+$/.test(String(value || ""));
}

function relationFilterByAnyId(relationName, selectedId) {
    if (!relationName || !selectedId) return {};

    const value = String(selectedId);
    const checks = [
        {
            [relationName]: {
                documentId: {
                    $eq: value,
                },
            },
        },
    ];

    if (isNumericId(value)) {
        checks.push({
            [relationName]: {
                id: {
                    $eq: Number(value),
                },
            },
        });
    }

    return {
        $or: checks,
    };
}

function categoryFilterBySlug(categorySlug) {
    return {
        $or: [
            {
                product_categories: {
                    slug: {
                        $eq: categorySlug,
                    },
                },
            },
            {
                product_category: {
                    slug: {
                        $eq: categorySlug,
                    },
                },
            },
        ],
    };
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
        ["sae_grades", "sae_grade", "saeGrades", "saeGrade"],
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
                ["sae_grades", "sae_grade", "saeGrades", "saeGrade"],
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

    const media = getRelationObject(product, "productImage");

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

function getProductKeys(product) {
    const keys = [];

    if (product?.documentId) keys.push(String(product.documentId));
    if (product?.id) keys.push(String(product.id));

    return keys;
}

/* ---------------- DOSAGE COLLECTION ---------------- */

const DOSAGE_API_RELATION_FIELDS = ["sys_apis", "apis", "api"];
const DOSAGE_SAE_RELATION_FIELDS = [
    "sys_sae_grades",
    "sae_grades",
    "sae_grade",
    "saeGrades",
    "saeGrade",
];
const DOSAGE_TYPE_RELATION_FIELDS = [
    "types",
    "type",
    "sys_types",
    "product_types",
    "product_type",
];

function getDosageValue(row) {
    return (
        getField(row, "dosage") ||
        getField(row, "title") ||
        getField(row, "value") ||
        ""
    );
}

function buildProductsAnyFilter(productIds = []) {
    const ids = Array.from(new Set(productIds.map(String).filter(Boolean)));

    if (!ids.length) return null;

    return {
        $or: ids.map((id) => {
            if (isNumericId(id)) {
                return {
                    products: {
                        id: {
                            $eq: Number(id),
                        },
                    },
                };
            }

            return {
                products: {
                    documentId: {
                        $eq: id,
                    },
                },
            };
        }),
    };
}

function rowHasContextRelations(row) {
    return (
        getRelationsByNames(row, DOSAGE_API_RELATION_FIELDS).length > 0 ||
        getRelationsByNames(row, DOSAGE_SAE_RELATION_FIELDS).length > 0 ||
        getRelationsByNames(row, DOSAGE_TYPE_RELATION_FIELDS).length > 0
    );
}

function dosageRowMatchesSelectedFlow(row, filters = {}) {
    const useSaeFlow = Boolean(filters.api && filters.saeGrade);
    const useTypeFlow = Boolean(filters.type && !useSaeFlow);

    /*
        Dosage follows the current selected flow only:
        - API/SAE categories: Product + API + SAE Grade
        - Type categories: Product + Type

        Refinement filters such as ACEA, ILSAC, OEM, JASO and SSI are not part of
        dosage lookup here. They only refine products/chips.
    */

    if (useSaeFlow) {
        return (
            hasRelationByNames(row, DOSAGE_API_RELATION_FIELDS, filters.api) &&
            hasRelationByNames(row, DOSAGE_SAE_RELATION_FIELDS, filters.saeGrade)
        );
    }

    if (useTypeFlow) {
        return hasRelationByNames(row, DOSAGE_TYPE_RELATION_FIELDS, filters.type);
    }

    return true;
}

function productKeySet(product) {
    return new Set(getProductKeys(product).map(String));
}

function dosageRowBelongsToProduct(row, product) {
    const keys = productKeySet(product);

    return getRelationArray(row, "products").some((rowProduct) => {
        return getProductKeys(rowProduct).some((key) => keys.has(String(key)));
    });
}

function setDosageForRowProducts({ map, row, products, overwrite = false }) {
    const value = getDosageValue(row);

    if (!value) return;

    products.forEach((product) => {
        if (!dosageRowBelongsToProduct(row, product)) return;

        getProductKeys(product).forEach((key) => {
            if (overwrite || !map.has(String(key))) {
                map.set(String(key), value);
            }
        });
    });
}

async function loadDosageMapForContext({ filters, products = [] }) {
    const cleanProducts = uniqueRelationObjects(products);
    const productIds = cleanProducts.flatMap((product) => getProductKeys(product));
    const productFilter = buildProductsAnyFilter(productIds);

    if (!productFilter) {
        return new Map();
    }

    /*
        Fetch dosage rows by Product first, then match the selected flow in JS.
        This is more reliable than hard-filtering every context relation in qs,
        because some dosage rows use Product + API + SAE Grade while other rows use
        Product + Type, depending on category flow.
    */

    const rows = await loadCollectionItems("dosages", {
        fields: ["dosage"],
        filters: productFilter,
        populate: "*",
        sort: ["updatedAt:desc", "createdAt:desc"],
    });

    const map = new Map();

    rows.forEach((row) => {
        if (!dosageRowMatchesSelectedFlow(row, filters)) return;

        setDosageForRowProducts({
            map,
            row,
            products: cleanProducts,
        });
    });

    /*
        Optional safe fallback: if a dosage row is only linked with Product and has
        no API/SAE/Type context relations, use it as a generic product dosage.
        Exact flow rows above always win.
    */
    rows.forEach((row) => {
        if (rowHasContextRelations(row)) return;

        setDosageForRowProducts({
            map,
            row,
            products: cleanProducts,
        });
    });

    return map;
}

function getDosageForProduct(product, dosageMap) {
    for (const key of getProductKeys(product)) {
        if (dosageMap.has(String(key))) {
            return dosageMap.get(String(key));
        }
    }

    return "";
}

/* ---------------- LEAF MAP ---------------- */

async function loadLeafRowsForSae(field, saeGradeId) {
    const cfg = LEAF_CONFIG[field];

    if (!cfg || !saeGradeId) return [];

    const query = qs.stringify(
        {
            locale: STRAPI_LOCALE,
            status: "published",
            filters: relationFilterByAnyId("sae_grade", saeGradeId),
            fields: [cfg.field],
            populate: {
                sae_grade: {
                    fields: ["name"],
                },
                product: {
                    fields: ["title"],
                },
            },
            pagination: {
                pageSize: 1000,
            },
            sort: [`${cfg.field}:asc`],
        },
        {
            encodeValuesOnly: true,
        }
    );

    const res = await fetchData(cfg.endpoint, query);

    return res?.data || [];
}

async function loadLeafMapForSae(saeGradeId, fields = ["acea", "ilsac", "oem", "jaso"]) {
    const map = new Map();

    if (!saeGradeId) return map;

    const entries = await Promise.all(
        fields.map(async (field) => {
            return [field, await loadLeafRowsForSae(field, saeGradeId)];
        })
    );

    function ensureProduct(product) {
        const keys = getProductKeys(product);

        keys.forEach((key) => {
            if (!map.has(key)) {
                map.set(key, {
                    aceas: [],
                    aceaIds: [],
                    ilsacs: [],
                    ilsacIds: [],
                    oems: [],
                    oemIds: [],
                    jasos: [],
                    jasoIds: [],
                });
            }
        });

        return keys;
    }

    entries.forEach(([field, rows]) => {
        const cfg = LEAF_CONFIG[field];

        rows.forEach((row) => {
            const product = getRelationObject(row, "product");
            const label = getField(row, cfg.field);
            const rowId = row?.documentId || row?.id;

            if (!product || !label || !rowId) return;

            const keys = ensureProduct(product);

            const labelKey =
                field === "acea"
                    ? "aceas"
                    : field === "ilsac"
                        ? "ilsacs"
                        : field === "oem"
                            ? "oems"
                            : "jasos";

            const idKey =
                field === "acea"
                    ? "aceaIds"
                    : field === "ilsac"
                        ? "ilsacIds"
                        : field === "oem"
                            ? "oemIds"
                            : "jasoIds";

            keys.forEach((key) => {
                const item = map.get(key);

                if (!item[labelKey].includes(label)) {
                    item[labelKey].push(label);
                }

                if (!item[idKey].map(String).includes(String(rowId))) {
                    item[idKey].push(rowId);
                }
            });
        });
    });

    return map;
}

function getLeafForProduct(product, leafMap) {
    for (const key of getProductKeys(product)) {
        if (leafMap.has(key)) {
            return leafMap.get(key);
        }
    }

    return null;
}

function productMatchesLeafFilters(product, filters, leafMap) {
    const leaf = getLeafForProduct(product, leafMap);

    if (filters.acea && !leaf?.aceaIds?.map(String).includes(String(filters.acea))) {
        return false;
    }

    if (filters.ilsac && !leaf?.ilsacIds?.map(String).includes(String(filters.ilsac))) {
        return false;
    }

    if (filters.oem && !leaf?.oemIds?.map(String).includes(String(filters.oem))) {
        return false;
    }

    if (filters.jaso && !leaf?.jasoIds?.map(String).includes(String(filters.jaso))) {
        return false;
    }

    return true;
}

function optionFromLeaf(row, field) {
    const cfg = LEAF_CONFIG[field];

    return {
        id: row?.id,
        documentId: row?.documentId || row?.id,
        label: getField(row, cfg.field),
    };
}

async function getLeafOptionsFromCollection(field, saeGradeId) {
    const rows = await loadLeafRowsForSae(field, saeGradeId);

    return uniqueOptions(rows.map((row) => optionFromLeaf(row, field)));
}

/* ---------------- CARD MAPPING ---------------- */

function productToBaseCard(product) {
    return {
        id: product?.id,
        documentId: product?.documentId,
        title: getProductTitle(product),
        image: imageUrlFromProduct(product),

        api: "",
        saeGrade: "",
        type: "",

        aceas: [],
        ilsacs: [],
        oems: [],
        jasos: [],
        ssis: [],

        dosage: "",
    };
}

function productToContextCard({
    product,
    filters,
    apiItem,
    saeGrade,
    typeItem,
    dosageMap,
    leafMap,
    categorySlug,
}) {
    const card = productToBaseCard(product);
    const leaf = getLeafForProduct(product, leafMap);
    const isSaeFlow = Boolean(filters.api && filters.saeGrade);

    console.log(dosageMap);

    card.dosage = getDosageForProduct(product, dosageMap);

    console.log(card.dosage);

    if (isSaeFlow) {
        card.api = getLabel(apiItem);
        card.saeGrade = getLabel(saeGrade);

        card.aceas = leaf?.aceas || [];
        card.ilsacs = leaf?.ilsacs || [];
        card.oems = leaf?.oems || [];
        card.jasos = leaf?.jasos || [];

        return card;
    }

    if (filters.type) {
        card.type = getLabel(typeItem);

        const productOems = getRelationsByNames(product, PRODUCT_RELATION_FIELDS.oem).map(getLabel);
        const productSsis = getRelationsByNames(product, PRODUCT_RELATION_FIELDS.ssi).map(getLabel);
        const productApis = getRelationsByNames(product, ["api", "apis"]).map(getLabel);

        card.api =
            filters.api && categorySlug === "driveline-additives"
                ? productApis[0] || ""
                : "";

        card.oems = productOems;
        card.ssis = productSsis;

        return card;
    }

    return card;
}

/* ---------------- PARAMS ---------------- */

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

async function fetchCollectionPages(endpoint, queryObject = {}, pageSize = SAFE_PAGE_SIZE) {
    const allRows = [];
    let page = 1;
    let pageCount = 1;

    do {
        const query = qs.stringify(
            {
                locale: STRAPI_LOCALE,
                status: "published",
                ...queryObject,
                pagination: {
                    ...(queryObject.pagination || {}),
                    page,
                    pageSize,
                },
            },
            { encodeValuesOnly: true }
        );

        const res = await fetchData(endpoint, query);
        const rows = res?.data || [];
        const pagination = res?.meta?.pagination || {};

        allRows.push(...rows);

        pageCount = Number(pagination.pageCount || (rows.length < pageSize ? page : page + 1));
        page += 1;
    } while (page <= pageCount && page <= MAX_PAGES);

    return allRows;
}

async function loadCollectionItems(endpoint, extraQuery = {}) {
    return fetchCollectionPages(endpoint, {
        populate: "*",
        sort: ["name:asc", "title:asc"],
        ...extraQuery,
    });
}

async function loadProductsFromStrapi(categorySlug = "", extraAndFilters = []) {
    const andFilters = [];

    if (categorySlug) {
        andFilters.push(categoryFilterBySlug(categorySlug));
    }

    extraAndFilters.filter(Boolean).forEach((filter) => {
        andFilters.push(filter);
    });

    return loadCollectionItems("products", {
        populate: PRODUCT_POPULATE,
        ...(andFilters.length
            ? {
                filters: {
                    $and: andFilters,
                },
            }
            : {}),
        sort: ["title:asc"],
    });
}

async function getByAnyIdFromCollection(endpoint, selectedId, populate = "*") {
    if (!selectedId) return null;

    const wanted = String(selectedId);

    const directQuery = qs.stringify(
        {
            locale: STRAPI_LOCALE,
            status: "published",
            populate,
        },
        { encodeValuesOnly: true }
    );

    const directRes = await fetchData(`${endpoint}/${wanted}`, directQuery);

    if (directRes?.data) {
        return directRes.data;
    }

    const documentIdQuery = qs.stringify(
        {
            locale: STRAPI_LOCALE,
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
        { encodeValuesOnly: true }
    );

    const documentIdRes = await fetchData(endpoint, documentIdQuery);

    if (documentIdRes?.data?.[0]) {
        return documentIdRes.data[0];
    }

    const idQuery = qs.stringify(
        {
            locale: STRAPI_LOCALE,
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
        { encodeValuesOnly: true }
    );

    const idRes = await fetchData(endpoint, idQuery);

    if (idRes?.data?.[0]) {
        return idRes.data[0];
    }

    const allItems = await loadCollectionItems(endpoint, {
        populate,
    });

    return allItems.find((item) => sameId(item, wanted)) || null;
}

async function getProductCategory(categorySlug) {
    const query = qs.stringify(
        {
            locale: STRAPI_LOCALE,
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
        getRelationsByNames(api, [
            "sae_grades",
            "saeGrades",
            "sae_grade",
            "saeGrade",
        ]).forEach((grade) => {
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

    return getByAnyIdFromCollection("sae-grades", saeGradeId, SAE_GRADE_POPULATE);
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

async function getProductsBySaeGradesRelation({
    saeGradeId,
    categorySlug,
    saeGrade,
}) {
    if (!saeGradeId) return [];

    /*
        IMPORTANT for Gasoline/PCMO, Heavy Duty and Motorcycle:
        after API + SAE Grade selection, product cards must come from selected
        SAE Grade + selected category. We use Strapi category filter first so we
        do not lose products because of the default 100 record API limit.
    */

    const fromSaeGrade = getProductsFromSaeGradeRecord(saeGrade).filter((product) => {
        const categories = [
            ...getRelationArray(product, "product_categories"),
            ...getRelationArray(product, "product_category"),
        ];

        if (!categories.length) return true;

        return productBelongsToCategory(product, categorySlug);
    });

    if (fromSaeGrade.length) {
        return fromSaeGrade;
    }

    const directProducts = await loadProductsFromStrapi(categorySlug, [
        relationFilterByAnyId("sae_grades", saeGradeId),
    ]);

    if (directProducts.length) {
        return directProducts;
    }

    const categoryProducts = await loadProductsFromStrapi(categorySlug);

    return categoryProducts.filter((product) => {
        return hasRelationByNames(
            product,
            ["sae_grades", "sae_grade", "saeGrades", "saeGrade"],
            saeGradeId
        );
    });
}

/* ---------------- TYPE FLOW ---------------- */

async function getTypeOptions(categorySlug) {
    const directQuery = qs.stringify(
        {
            locale: STRAPI_LOCALE,
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

    return set.has(String(product.documentId || "")) || set.has(String(product.id || ""));
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
    const saeGradeProducts = getProductsFromSaeGradeRecord(saeGrade);
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

            if (!filters.api || filters.saeGrade) {
                return true;
            }

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

            return productIdInSet(product, typeProductIds) || productHasType(product, filters.type);
        })
        .filter((product) => {
            if (!filters.ssi) return true;

            return productHasFilterRelation(product, "ssi", filters.ssi);
        });
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
                const leafOptions = await getLeafOptionsFromCollection(field, filters.saeGrade);

                if (leafOptions.length) {
                    return okJson({
                        label: FIELD_LABELS[field] || field,
                        items: leafOptions,
                    });
                }

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

            const allProducts = await loadProductsFromStrapi(categorySlug);
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
            const apiItem = filters.api
                ? await getByAnyIdFromCollection("apis", filters.api)
                : null;


            const saeGrade = await getSaeGradeBySelectedFilter(filters.saeGrade);


            const typeItem = await getSelectedType(filters.type);


            if (SAE_FLOW_CATEGORY_SLUGS.has(categorySlug) && filters.api && filters.saeGrade) {
                const leafMap = await loadLeafMapForSae(
                    filters.saeGrade,
                    ["acea", "ilsac", "oem", "jaso"]
                );

                let products = await getProductsBySaeGradesRelation({
                    saeGradeId: filters.saeGrade,
                    categorySlug,
                    saeGrade,
                });

                products = products.filter((product) => {
                    return productMatchesLeafFilters(product, filters, leafMap);
                });

                const dosageMap = await loadDosageMapForContext({ filters, products });

                console.log(filters, dosageMap);

                const items = products.map((product) =>
                    productToContextCard({
                        product,
                        filters,
                        apiItem,
                        saeGrade,
                        typeItem,
                        dosageMap,
                        leafMap,
                        categorySlug,
                    })
                );

                return okJson({
                    category,
                    items,
                });
            }

            const allProducts = await loadProductsFromStrapi(categorySlug);

            let products = await filterProductsBySelectedRelations({
                products: allProducts,
                categorySlug,
                filters,
                saeGrade,
                typeItem,
            });

            const leafMap = filters.saeGrade
                ? await loadLeafMapForSae(filters.saeGrade, ["acea", "ilsac", "oem", "jaso"])
                : new Map();

            if (filters.saeGrade) {
                products = products.filter((product) => {
                    return productMatchesLeafFilters(product, filters, leafMap);
                });
            }

            if (filters.type && filters.oem) {
                products = products.filter((product) => {
                    return productHasFilterRelation(product, "oem", filters.oem);
                });
            }

            const dosageMap = await loadDosageMapForContext({ filters, products });

            const items = products.map((product) =>
                productToContextCard({
                    product,
                    filters,
                    apiItem,
                    saeGrade,
                    typeItem,
                    dosageMap,
                    leafMap,
                    categorySlug,
                })
            );

            return okJson({
                category,
                items,
            });
        }

        return errorJson("Invalid mode", 400);
    } catch (err) {
        console.log("[shared query GET ERROR]", err);

        return errorJson(err.message || "Server error", 500);
    }
}