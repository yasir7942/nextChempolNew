import { writeFile, appendFile } from "fs/promises";
import { join } from "path";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { flattenAttributes } from "@/libs/data-utils";
import { revalidatePath } from "next/cache";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL + ""; // direct strapi api call
const VALID_TOKEN = process.env.ADMIN_TOKEN;

const logFilePath = join(process.cwd(), "strapi-webhooks.log");

const locales = ["en", "ar", "es"];





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

        const url = new URL(req.url);
        const token = url.searchParams.get("token"); // Extract token from URL

        // Validate token
        if (!token || token !== VALID_TOKEN) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }

        // Enable CORS
        const headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        };

        if (req.method === "OPTIONS") {
            return new NextResponse(null, { headers });
        }

        if (model == 'all') {
            // revalidatePath('/', 'layout');
            for (const loc of locales) revalidatePath(`/${loc}`, 'layout');

        }
        else if (model == 'post') {
            console.log("revalidate post");
            for (const loc of locales) {
                revalidatePath(`/${loc}`); // for homepage
                revalidatePath(`/${loc}/blog/`);
                revalidatePath(`/${loc}/blog/${slug}/`);
            }
        }
        else if (model == 'product') {
            for (const loc of locales) {
                revalidatePath(`/${loc}/product/${slug}/`);
                let categorySlug = await getProductCategoryBySlug(loc, slug);
                revalidatePath(`/${loc}/product-category/${categorySlug?.toString()}`);
            }
        }
        else if (model == 'video') {
            console.log("revalidate video");
            for (const loc of locales) {
                revalidatePath(`/${loc}`); // for homepage
                revalidatePath(`/${loc}/videos/`);
            }

        }

        else if (model == 'product-category') {



            for (const loc of locales) {
                revalidatePath(`/${loc}`); // for homepage
                revalidatePath(`/${loc}/product-category/${slug}/`);
            }


        }
        else {

            for (const loc of locales) {
                revalidatePath(`/loc/${slug}/`);
            }
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
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token") || "No token provided";
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
    try {

        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token") || "No token provided";

        const body = await req.json();



        /* if (body) {
             return NextResponse.json(
                 { Er: "Do not Call Direct Trigger", success: false },
                 { status: 306 }
             );
         }
 */
        const logMessage = `[${new Date().toISOString()}] Revalidate Auto -  Revalidate: ${body.model} : ${body.entry.slug} \n`;
        console.log(logMessage);


        await revalidate(req, body.model, body.entry.slug);


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
