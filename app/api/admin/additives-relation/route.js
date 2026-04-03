import { NextResponse } from "next/server";
import qs from "qs";

const STATIC_CATEGORY = {
    title: "PCMO/Gasoline",
    slug: "pcmo-gasoline",
};

async function fetchData(endpoint, query = "") {
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    const token = process.env.API_TOKEN;

    const url = `${baseUrl}${endpoint}?${query}`;

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

        const text = await res.text();

        console.log("[fetchData] status:", res.status);
        console.log("[fetchData] first 800 chars:", text.slice(0, 800));

        const data = JSON.parse(text);
        return data;
    } catch (err) {
        console.log("[fetchData] ERROR:", err);
        return null;
    }
}

function getField(item, field) {
    if (!item) return "";
    if (item[field] !== undefined) return item[field];
    if (item?.attributes?.[field] !== undefined) return item.attributes[field];
    return "";
}

function mapItems(items, field = "name") {
    return (items || []).map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getField(item, field),
    }));
}

async function getStaticCategory() {
    const query = qs.stringify({
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
    const item = res?.data?.[0];

    console.log("[getStaticCategory] result:", item);

    return item || null;
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);

        const mode = searchParams.get("mode");
        const apiId = searchParams.get("apiId");
        const saeGradeId = searchParams.get("saeGradeId");

        console.log("==================================================");
        console.log("[GET] mode:", mode);
        console.log("[GET] apiId:", apiId);
        console.log("[GET] saeGradeId:", saeGradeId);

        if (mode === "static-category") {
            const category = await getStaticCategory();

            return NextResponse.json({
                ok: true,
                item: {
                    id: category?.id,
                    documentId: category?.documentId,
                    label: getField(category, "title"),
                    slug: getField(category, "slug"),
                },
            });
        }

        if (mode === "allapis") {
            const category = await getStaticCategory();

            const existingApis =
                category?.attributes?.apis?.data ||
                category?.data?.attributes?.apis?.data ||
                category?.apis?.data ||
                category?.apis ||
                [];

            const existingApiIds = new Set(
                existingApis
                    .map((api) => api?.documentId || api?.id)
                    .filter(Boolean)
            );

            const query = qs.stringify({
                pagination: { pageSize: 500 },
                sort: ["name:asc"],
            });

            const res = await fetchData("apis", query);
            const allApis = res?.data || [];

            const filteredApis = allApis.filter((api) => {
                const currentId = api?.documentId || api?.id;
                return !existingApiIds.has(currentId);
            });

            return NextResponse.json({
                ok: true,
                items: mapItems(filteredApis, "name"),
            });
        }

        if (mode === "apis") {
            const category = await getStaticCategory();

            if (!category?.id) {
                return NextResponse.json({ ok: true, items: [] });
            }

            const query = qs.stringify({
                filters: {
                    product_category: {
                        id: {
                            $eq: Number(category.id),
                        },
                    },
                },
                populate: {
                    product_category: true,
                },
                pagination: {
                    pageSize: 500,
                },
                sort: ["name:asc"],
            });

            const res = await fetchData("apis", query);
            const apis = res?.data || [];

            return NextResponse.json({
                ok: true,
                items: mapItems(apis, "name"),
            });
        }

        if (mode === "all-sae-grades") {
            if (!apiId) return NextResponse.json({ ok: true, items: [] });

            const selectedApiQuery = qs.stringify({
                filters: {
                    documentId: {
                        $eq: apiId,
                    },
                },
                populate: {
                    sae_grades: true,
                },
                pagination: { pageSize: 1 },
            });

            const apiRes = await fetchData("apis", selectedApiQuery);
            const apiItem = apiRes?.data?.[0];

            const existingSaeGrades =
                apiItem?.attributes?.sae_grades?.data ||
                apiItem?.sae_grades?.data ||
                apiItem?.sae_grades ||
                [];

            const existingSaeIds = new Set(
                existingSaeGrades
                    .map((item) => item?.documentId || item?.id)
                    .filter(Boolean)
            );

            const allSaeQuery = qs.stringify({
                fields: ["name"],
                pagination: { pageSize: 500 },
                sort: ["name:asc"],
            });

            const allSaeRes = await fetchData("sae-grades", allSaeQuery);
            const allSaeGrades = allSaeRes?.data || [];

            const filteredSaeGrades = allSaeGrades.filter((item) => {
                const currentId = item?.documentId || item?.id;
                return !existingSaeIds.has(currentId);
            });

            return NextResponse.json({
                ok: true,
                items: mapItems(filteredSaeGrades, "name"),
            });
        }

        if (mode === "sae-grades") {
            if (!apiId) return NextResponse.json({ ok: true, items: [] });

            const query = qs.stringify({
                filters: {
                    api: {
                        documentId: {
                            $eq: apiId,
                        },
                    },
                },
                fields: ["name"],
                pagination: { pageSize: 500 },
                sort: ["name:asc"],
            });

            const res = await fetchData("sae-grades", query);

            return NextResponse.json({
                ok: true,
                items: mapItems(res?.data, "name"),
            });
        }

        if (mode === "all-aceas") {
            if (!saeGradeId) return NextResponse.json({ ok: true, items: [] });

            const selectedSaeQuery = qs.stringify({
                filters: {
                    documentId: {
                        $eq: saeGradeId,
                    },
                },
                populate: {
                    aceas: true,
                },
                pagination: { pageSize: 1 },
            });

            const saeRes = await fetchData("sae-grades", selectedSaeQuery);
            const saeItem = saeRes?.data?.[0];

            const existingAceas =
                saeItem?.attributes?.aceas?.data ||
                saeItem?.aceas?.data ||
                saeItem?.aceas ||
                [];

            const existingAceaIds = new Set(
                existingAceas
                    .map((item) => item?.documentId || item?.id)
                    .filter(Boolean)
            );

            const allAceaQuery = qs.stringify({
                fields: ["name"],
                pagination: { pageSize: 500 },
                sort: ["name:asc"],
            });

            const allAceaRes = await fetchData("aceas", allAceaQuery);
            const allAceas = allAceaRes?.data || [];

            const filteredAceas = allAceas.filter((item) => {
                const currentId = item?.documentId || item?.id;
                return !existingAceaIds.has(currentId);
            });

            return NextResponse.json({
                ok: true,
                items: mapItems(filteredAceas, "name"),
            });
        }

        if (mode === "aceas") {
            if (!saeGradeId) return NextResponse.json({ ok: true, items: [] });

            const query = qs.stringify({
                filters: {
                    sae_grade: {
                        documentId: {
                            $eq: saeGradeId,
                        },
                    },
                },
                fields: ["name"],
                pagination: { pageSize: 500 },
                sort: ["name:asc"],
            });

            const res = await fetchData("aceas", query);

            return NextResponse.json({
                ok: true,
                items: mapItems(res?.data, "name"),
            });
        }

        return NextResponse.json(
            { ok: false, error: "Invalid mode" },
            { status: 400 }
        );
    } catch (err) {
        console.log("[GET ERROR]", err);

        return NextResponse.json(
            {
                ok: false,
                error: err.message || "Server error",
            },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { type, title, apiId, saeGradeId, aceaId } = body;

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = process.env.API_TOKEN;

        console.log("==================================================");
        console.log("[POST] body:", body);

        if (type === "api") {
            const category = await getStaticCategory();
            const categoryDocumentId = category?.documentId || category?.data?.documentId;

            if (!apiId || !categoryDocumentId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "apiId or categoryDocumentId missing",
                    },
                    { status: 400 }
                );
            }

            const updateCategoryRes = await fetch(
                `${baseUrl}product-categories/${categoryDocumentId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        data: {
                            apis: {
                                connect: [apiId],
                            },
                        },
                    }),
                }
            );

            const updatedCategory = await updateCategoryRes.json();

            if (!updateCategoryRes.ok) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Failed to connect api with category",
                        details: updatedCategory,
                    },
                    { status: updateCategoryRes.status }
                );
            }

            return NextResponse.json({
                ok: true,
                item: updatedCategory?.data || null,
            });
        }

        if (type === "saeGrade") {
            if (!apiId || !saeGradeId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "apiId or saeGradeId missing",
                    },
                    { status: 400 }
                );
            }

            const updateApiRes = await fetch(`${baseUrl}apis/${apiId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        sae_grades: {
                            connect: [saeGradeId],
                        },
                    },
                }),
            });

            const updatedApi = await updateApiRes.json();

            if (!updateApiRes.ok) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Failed to connect SAE Grade with API",
                        details: updatedApi,
                    },
                    { status: updateApiRes.status }
                );
            }

            return NextResponse.json({
                ok: true,
                item: updatedApi?.data || null,
            });
        }

        if (type === "acea") {
            if (!saeGradeId || !aceaId) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "saeGradeId or aceaId missing",
                    },
                    { status: 400 }
                );
            }

            const updateSaeRes = await fetch(`${baseUrl}sae-grades/${saeGradeId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        aceas: {
                            connect: [aceaId],
                        },
                    },
                }),
            });

            const updatedSae = await updateSaeRes.json();

            if (!updateSaeRes.ok) {
                return NextResponse.json(
                    {
                        ok: false,
                        error: "Failed to connect ACEA with SAE Grade",
                        details: updatedSae,
                    },
                    { status: updateSaeRes.status }
                );
            }

            return NextResponse.json({
                ok: true,
                item: updatedSae?.data || null,
            });
        }

        return NextResponse.json(
            { ok: false, error: "Invalid type" },
            { status: 400 }
        );
    } catch (err) {
        console.log("[POST ERROR]", err);

        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}