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




// Function to log requests
async function logRequest(message) {
    try {
        await appendFile(logFilePath, message, "utf8");
    } catch (error) {
        console.error("Error writing to log file:", error);
        await writeFile(logFilePath, message, "utf8");
    }
}


async function getProductCategoryBySlug(slug) {
    try {
        // Fetch product data by slug (populate category relation)
        const response = await fetch(`${STRAPI_API_URL}/api/products?filters[slug][$eq]=${slug}&populate=product_categories`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store", // Ensure fresh data
        });


        if (!response.ok) throw new Error("Failed to fetch product data from Strapi");

        const { data } = await response.json();
        const flattenedData = flattenAttributes(data);

        if (data.length === 0) throw new Error("Product not found");



        return flattenedData[0].product_categories.data[0].slug;
    } catch (error) {
        console.error("Error fetching category title:", error);
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
            revalidatePath('/', 'layout');

        }
        else if (model == 'post') {
            console.log("revalidate post");
            revalidatePath(`/blog/`);
            revalidatePath(`/blog/${slug}/`);
        }
        else if (model == 'product') {

            revalidatePath(`/product/${slug}/`);
            const categorySlug = await getProductCategoryBySlug(slug);
            revalidatePath(`/product-category/${categorySlug?.toString()}`);

        }

        else if (model == 'product-category') {

            revalidatePath(`/product-category/${slug}/`);

        }
        else {
            revalidatePath(`/${slug}/`);

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
