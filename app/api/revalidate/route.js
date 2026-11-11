import { writeFile, appendFile } from "fs/promises";
import { join } from "path";
import fs from "fs";
import path from "path";
import { NextResponse, after } from "next/server";
import { flattenAttributes } from "@/libs/data-utils";
import { syncRedirects } from "@/libs/redirects/sync";
import { revalidateBoth, revalidateLocales, revalidateSite, revalidateVideoPages } from "@/libs/revalidate-pages";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL + ""; // direct strapi api call
const VALID_TOKEN = process.env.ADMIN_TOKEN;

const logFilePath = join(process.cwd(), "strapi-webhooks.log");

const locales = ["en", "ar", "es"];

const REDIRECT_MODELS = ["redirection-url", "redirection-urls", "redirects"];
// Content whose pages can be redirect destinations
const DESTINATION_MODELS = ["post", "product", "product-category"];

// Shown in the header menu or footer of every page (categories, office addresses)
const SITE_WIDE_MODELS = ["all", "product-category", "contact", "contact-us"];

// Strapi single types (no slug) and the page they feed: "" is the home page
const SINGLE_TYPE_PAGES = {
    "home-page": "",
    "about-us": "about-us",
    "faq-page": "faq",
    "blog-page": "blog",
    "search-page": "search",
    "lubricant-additives-uae": "lubricant-additives-manufacturers-in-uae",
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


function getTokenFromReq(req) {
    const url = new URL(req.url);

    const queryToken = url.searchParams.get("token") || "";
    const authHeader = req.headers.get("authorization") || "";

    const bearerToken = authHeader.toLowerCase().startsWith("bearer ")
        ? authHeader.slice(7).trim()
        : "";

    return queryToken || bearerToken;
}

// ?token=... or "Authorization: Bearer ..." must equal ADMIN_TOKEN
function verifyToken(req) {
    const token = getTokenFromReq(req);

    if (!VALID_TOKEN) {
        return {
            ok: false,
            response: NextResponse.json(
                { success: false, error: "ADMIN_TOKEN is missing in Next.js .env" },
                { status: 401, headers: corsHeaders }
            ),
        };
    }

    if (!token || token !== VALID_TOKEN) {
        return {
            ok: false,
            response: NextResponse.json(
                { success: false, error: "Unauthorized: Invalid token" },
                { status: 401, headers: corsHeaders }
            ),
        };
    }

    return { ok: true };
}

// Any add / update / delete of a redirect: rebuild the live redirects after responding
function scheduleRedirectSync(model, { force = false } = {}) {
    after(() => syncRedirects({ trigger: `webhook:${model}`, force }));
    return NextResponse.json(
        { success: true, model, redirects: "sync scheduled", now: Date.now() },
        { status: 202, headers: corsHeaders }
    );
}





// Function to log requests
async function logRequest(message) {
    try {
        await appendFile(logFilePath, message, "utf8");
    } catch (error) {
        console.error("Error writing to log file:", error);
        await writeFile(logFilePath, message, "utf8");
    }
}


async function getProductCategoryBySlug(locale, slug) {
    try {
        // Fetch product data by slug (populate category relation)
        /*  const response = await fetch(`${STRAPI_API_URL}/api/products?filters[slug][$eq]=${slug}&populate=product_categories`, {
              headers: { "Content-Type": "application/json" },
              cache: "no-store", // Ensure fresh data
          });  */

        const url = `${STRAPI_API_URL}/api/products` +
            `?filters[slug][$eq]=${encodeURIComponent(slug)}` +
            `&locale=${encodeURIComponent(locale)}` +
            `&populate[product_categories][fields][0]=slug`;

        console.log("Fetching product category by slug:", url);



        const res = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to fetch product");

        const { data } = await res.json();
        if (!data?.length) throw new Error("Product not found");

        // If you use flattenAttributes:
        const prod = flattenAttributes(data)[0];

        // prod.product_categories.data[0] -> { attributes.slug } when not flattened
        // With flattenAttributes, you likely have slug on the object already:
        return prod.product_categories.data?.[0]?.slug ?? null;
    } catch (e) {
        console.error(e);
        return null;
    }
}


// Function to log requests
async function revalidate(req, model, slug) {

    try {

        // The token is checked by GET/POST (verifyToken) before this runs

        // Enable CORS
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (req.method === "OPTIONS") {
            return new NextResponse(null, { headers });
        }

        if (SITE_WIDE_MODELS.includes(model)) {
            // header menu / footer content is on every page
            revalidateSite();
        }
        else if (model == 'post') {
            console.log("revalidate post");
            revalidateLocales(""); // for homepage
            revalidateLocales("blog");
            if (slug) revalidateLocales(`blog/${slug}`);
        }
        else if (model == 'product') {
            for (const loc of locales) {
                if (slug) revalidateBoth(`/${loc}/product/${slug}/`);
                let categorySlug = slug ? await getProductCategoryBySlug(loc, slug) : null;
                if (categorySlug) revalidateBoth(`/${loc}/product-category/${categorySlug}/`);
            }
        }
        else if (model == 'video') {
            console.log("revalidate video");
            revalidateVideoPages(); // home pages, videos pages and sitemaps
        }
        else if (SINGLE_TYPE_PAGES[model] !== undefined) {
            // single types (home-page, about-us...) have no slug: refresh the page they feed
            revalidateLocales(SINGLE_TYPE_PAGES[model]);
            if (model == 'home-page') revalidateBoth("/");
        }
        else if (slug) {
            revalidateLocales(slug);
        }
        else {
            // unknown content without a slug: refresh everything rather than nothing
            revalidateSite();
        }





        return NextResponse.json(
            {
                success: true, revalidated: true,
                now: Date.now(), message: "Revalidated All Data'"
            },
            { headers }
        );
    } catch (error) {
        console.error("Error Revalidate:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ✅ Handle CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ✅ Handle OPTIONS request (Prevents 405 Error)
export async function OPTIONS() {
    return new Response(null, { status: 204, headers: corsHeaders });
}

// ✅ Handle GET request
export async function GET(req) {
    const auth = verifyToken(req);
    if (!auth.ok) return auth.response;

    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token") || "No token provided";
        const model = searchParams.get("model") || "all";

        // ?model=redirection-url[&force=1]: rebuild the live redirects (force re-checks every destination)
        if (REDIRECT_MODELS.includes(model)) {
            await logRequest(`[${new Date().toISOString()}] Revalidate Manual - redirects sync (${model})  \n`);
            return scheduleRedirectSync(model, { force: searchParams.get("force") === "1" });
        }

        const logMessage = `[${new Date().toISOString()}] Revalidate Manual - All Revalidate Done  \n`;



        await revalidate(req, "all", "");

        await logRequest(logMessage);


        return new Response(JSON.stringify({ message: "GET request received", token }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        console.error("Error handling GET request:", error);
        return new Response(JSON.stringify({ error: "Error handling GET request" }), {
            status: 500,
            headers: corsHeaders,
        });
    }
}

// ✅ Handle POST request
export async function POST(req) {
    const auth = verifyToken(req);
    if (!auth.ok) return auth.response;

    try {

        const body = await req.json();
        const model = body?.model || body?.event || "";
        const slug = body?.entry?.slug ?? body?.data?.slug ?? body?.slug ?? "";

        if (REDIRECT_MODELS.includes(model)) {
            await logRequest(`[${new Date().toISOString()}] Revalidate Auto -  redirects sync (${model}) \n`);
            return scheduleRedirectSync(model);
        }


        /* if (body) {
             return NextResponse.json(
                 { Er: "Do not Call Direct Trigger", success: false },
                 { status: 306 }
             );
         }
 */
        const logMessage = `[${new Date().toISOString()}] Revalidate Auto -  Revalidate: ${model} : ${slug} \n`;
        console.log(logMessage);


        await revalidate(req, model, slug);

        // A page was added or removed: redirects pointing to it may become valid or broken
        if (slug && DESTINATION_MODELS.includes(model)) {
            after(() => syncRedirects({ trigger: `webhook:${model}`, recheck: slug }));
        }


        await logRequest(logMessage);




        return new Response(JSON.stringify({ message: "POST request received", data: body }), {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
        });
    } catch (error) {
        console.error("Error handling POST request:", error);
        return new Response(JSON.stringify({ error: "Error handling POST request" }), {
            status: 500,
            headers: corsHeaders,
        });
    }
}
