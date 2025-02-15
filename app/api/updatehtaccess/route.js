import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { flattenAttributes } from "@/libs/data-utils";

const STRAPI_API_URL = process.env.NEXT_PUBLIC_ADMIN_BASE_URL + "/api/redirection-urls";
const VALID_TOKEN = process.env.ADMIN_TOKEN;

export async function GET(req) {
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
