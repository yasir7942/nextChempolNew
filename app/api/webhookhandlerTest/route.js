// this code is  for testing purpose
//*** */

import { writeFile, appendFile } from "fs/promises";
import { join } from "path";

const logFilePath = join(process.cwd(), "request.log");

// Function to log requests
async function logRequest(message) {
  try {
    await appendFile(logFilePath, message, "utf8");
  } catch (error) {
    console.error("Error writing to log file:", error);
    await writeFile(logFilePath, message, "utf8");
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
    const logMessage = `[${new Date().toISOString()}] GET Request - Token: ${token}\n`;

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
    const body = await req.json();
    const logMessage = `[${new Date().toISOString()}] POST Request - Data: ${JSON.stringify(body)}\n`;
    console.log(body)
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
