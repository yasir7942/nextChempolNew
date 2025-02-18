import { writeFile, appendFile } from "fs/promises";
import { join } from "path";
import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { flattenAttributes } from "@/libs/data-utils";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL + "api/redirection-urls";  //get direct strapi api call
const VALID_TOKEN = process.env.ADMIN_TOKEN || "";

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



// Function to log requests
async function redirectCreator(req) {

    try {
        // Parse the URL query parameters
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

        // Define .htaccess file path
        const htaccessPath = path.join(process.cwd(), ".htaccess");

        // Fetch redirect data from Strapi
        const response = await fetch(STRAPI_API_URL, {
            headers: { "Content-Type": "application/json" },
        });

        if (!response.ok) throw new Error("Failed to fetch redirect data from Strapi");

        const { data: redirects } = await response.json();
        const flattenedData = flattenAttributes(redirects);

        // Generate redirect rules
        const redirectLines = flattenedData
            .map(({ source, destination }) => `Redirect 301 ${source} ${destination}`)
            .join("\n");

        // Default .htaccess content
        const htaccessContent = `# BEGIN Redirects\n# Auto-generated Redirection by Next.js API \n\n${redirectLines}\n\n# END Redirects`;

        // Write or create .htaccess file
        fs.writeFileSync(htaccessPath, htaccessContent, "utf8");

        return NextResponse.json(
            { success: true, message: ".htaccess updated successfully" },
            { headers }
        );
    } catch (error) {
        console.error("Error updating .htaccess:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// ✅ Handle CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*", // Allow all origins (Change if needed)
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
        const logMessage = `[${new Date().toISOString()}] Redirection Manual - Redirection make  \n`;



        await redirectCreator(req);

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
        const logMessage = `[${new Date().toISOString()}] Redirection Auto -  Redirection Model: ${body.model} \n`;


        if (body.model == "redirection-url") {
            await redirectCreator(req);
            await logRequest(logMessage);
        }


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
