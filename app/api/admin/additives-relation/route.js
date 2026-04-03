import { NextResponse } from "next/server";
import qs from "qs";

// ---------------- CONFIG ----------------

const STATIC_CATEGORY = {
    title: "PCMO/Gasoline",
    slug: "pcmo-gasoline",
};

// ---------------- FETCH WRAPPER ----------------
// SAME STYLE AS YOUR getHomePage()

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
                ...(token && { Authorization: `Bearer ${token}` }),
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

// ---------------- HELPERS ----------------

function getField(item, field) {
    if (!item) return "";
    if (item[field] !== undefined) return item[field];
    if (item?.attributes?.[field] !== undefined) return item.attributes[field];
    return "";
}

function getRelation(item, relation) {
    if (!item) return [];

    // flat
    if (Array.isArray(item?.[relation])) return item[relation];

    // flat with data
    if (Array.isArray(item?.[relation]?.data)) return item[relation].data;

    // v4
    if (Array.isArray(item?.attributes?.[relation]?.data))
        return item.attributes[relation].data;

    return [];
}

function mapItems(items, field = "name") {
    return (items || []).map((item) => ({
        id: item?.id,
        documentId: item?.documentId,
        label: getField(item, field),
    }));
}

// ---------------- STATIC CATEGORY ----------------

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

// ---------------- GET ----------------

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

        // ---------------- STATIC CATEGORY ----------------

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


        // ----------All------ APIS ----------------
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

            console.log("existingApis:", existingApis);
            console.log("existingApiIds:", [...existingApiIds]);

            const query = qs.stringify({
                pagination: { pageSize: 500 },
                sort: ["name:desc"],
            });

            const res = await fetchData("apis", query);

            const allApis = res?.data || [];

            const filteredApis = allApis.filter((api) => {
                const apiId = api?.documentId || api?.id;
                return !existingApiIds.has(apiId);
            });

            console.log("All API:", allApis);
            console.log("Filtered API:", filteredApis);

            return NextResponse.json({
                ok: true,
                items: mapItems(filteredApis, "name"),
            });
        }


        // ----------selected------ APIS ----------------

        if (mode === "apis") {
            const category = await getStaticCategory();


            if (!category?.documentId) {
                return NextResponse.json({ ok: true, items: [] });
            };

            const query = qs.stringify({

                filters: {
                    product_category: {
                        id: {
                            $eq: [Number(category.id)],
                        },
                    },
                },
                populate: {

                    product_category: true,
                },

            });

            const res = await fetchData(
                `apis`,
                query
            );

            const apis = res?.data;

            console.log("[APIS] categoryDetail:", category.attributes.title, apis);
            //   const apis = getRelation(categoryDetail, "apis");

            return NextResponse.json({
                ok: true,
                items: mapItems(apis, "name"),
            });
        }

        // ---------------- SAE GRADES ----------------

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
            });

            const res = await fetchData("sae-grades", query);

            console.log("[SAE] raw:", res?.data);

            return NextResponse.json({
                ok: true,
                items: mapItems(res?.data, "name"),
            });
        }

        // ---------------- ACEA ----------------

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
            });

            const res = await fetchData("aceas", query);

            console.log("[ACEA] raw:", res?.data);

            return NextResponse.json({
                ok: true,
                items: mapItems(res?.data, "name"),
            });
        }

        return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });

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

// ---------------- POST -----for save Data-----------

export async function POST(req) {
    try {
        const body = await req.json();
        const { type, title, apiId, saeGradeId } = body;

        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
        const token = process.env.API_TOKEN;

        console.log("==================================================");
        console.log("[POST] body:", body);



        // ---------------- CREATE API ----------------

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

            console.log("**************************updatedCategory:", updatedCategory);

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




        // ---------------- CREATE SAE ----------------

        if (type === "saeGrade") {
            const res = await fetch(`${baseUrl}sae-grades`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        name: title,
                        api: apiId,
                    },
                }),
            });

            const data = await res.json();

            return NextResponse.json({ ok: true, item: data?.data });
        }

        // ---------------- CREATE ACEA ----------------

        if (type === "acea") {
            const res = await fetch(`${baseUrl}aceas`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    data: {
                        name: title,
                        sae_grade: saeGradeId,
                    },
                }),
            });

            const data = await res.json();

            return NextResponse.json({ ok: true, item: data?.data });
        }

        return NextResponse.json({ ok: false });

    } catch (err) {
        console.log("[POST ERROR]", err);

        return NextResponse.json(
            { ok: false, error: err.message },
            { status: 500 }
        );
    }
}