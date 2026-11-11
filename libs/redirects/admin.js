// Add, edit and delete redirects from /admin/redirectlinks/.
//
// Writes go to Strapi (redirection-urls) with the server-only ADMIN_PUSH_TOKEN, then the live
// redirects are rebuilt (libs/redirects/sync.js) so the report and the site match what was saved.
// Strapi stays the single source of truth: nothing is stored here.
import { syncRedirects } from "./sync";

const STRAPI_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
const WRITE_TOKEN = process.env.ADMIN_PUSH_TOKEN;
const MAX_LENGTH = 500;

export class RedirectError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

async function strapi(path, { method = "GET", body } = {}) {
    if (!WRITE_TOKEN) throw new RedirectError("ADMIN_PUSH_TOKEN is missing in .env, so redirects can't be saved.", 500);

    let response;
    try {
        response = await fetch(`${STRAPI_API}/${path}`, {
            method,
            headers: { Authorization: `Bearer ${WRITE_TOKEN}`, ...(body !== undefined ? { "Content-Type": "application/json" } : {}) },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: "no-store",
        });
    } catch (error) {
        throw new RedirectError(`Strapi is not reachable (${error?.cause?.code || error.message}).`, 502);
    }

    if (response.status === 204) return {};
    const json = await response.json().catch(() => null);

    if (response.status === 401 || response.status === 403) {
        throw new RedirectError(
            response.status === 401
                ? "Strapi rejected ADMIN_PUSH_TOKEN (401): the token in .env does not exist in this Strapi."
                : "ADMIN_PUSH_TOKEN is not allowed to change redirects (403). In Strapi (Settings → API Tokens) give it find, create, update and delete on RedirectionUrl.",
            502
        );
    }
    if (!response.ok) {
        const reason = json?.error?.message || response.statusText;
        // "This attribute must be unique": the source already exists
        if (/unique/i.test(reason)) throw new RedirectError("A redirect with this source already exists.", 409);
        throw new RedirectError(`Strapi ${method} ${path.split("?")[0]} failed (${response.status}): ${reason}`, 502);
    }
    return json;
}

// { source, destination } trimmed and checked; throws RedirectError with a message for the form
export function validateRedirectInput(input) {
    const source = String(input?.source ?? "").trim();
    const destination = String(input?.destination ?? "").trim();

    if (!source) throw new RedirectError("Source is required.");
    if (!destination) throw new RedirectError("Destination is required.");
    if (source.length > MAX_LENGTH || destination.length > MAX_LENGTH) throw new RedirectError(`Source and destination can be at most ${MAX_LENGTH} characters.`);
    if (/\s/.test(source) || /\s/.test(destination)) throw new RedirectError("Source and destination can't contain spaces.");
    if (!source.startsWith("/")) throw new RedirectError("Source must start with / (for example /old-page/).");
    if (!/^\/|^https?:\/\/[^\s/]+/i.test(destination)) throw new RedirectError("Destination must start with / or with http:// or https://.");
    if (source === destination) throw new RedirectError("Source and destination are the same, this would loop.");

    return { source, destination };
}

// Strapi 5 updates by documentId; the report only has the numeric id
async function documentIdOf(id) {
    if (!/^\d{1,12}$/.test(String(id))) throw new RedirectError("Invalid redirect.", 400);
    const json = await strapi(`redirection-urls?filters[id][$eq]=${id}&fields[0]=source&pagination[pageSize]=1`);
    const documentId = json?.data?.[0]?.documentId;
    if (!documentId) throw new RedirectError("This redirect no longer exists in Strapi. Refresh the list.", 404);
    return documentId;
}

// Waits for the rebuild so the list the admin reloads already shows the change
async function rebuild() {
    const result = await syncRedirects({ trigger: "admin" });
    return result?.error ? `Saved in Strapi, but the live redirects could not be rebuilt yet: ${result.error}` : null;
}

export async function createRedirect(input) {
    const data = validateRedirectInput(input);
    const json = await strapi("redirection-urls?status=published", { method: "POST", body: { data } });
    return { redirect: json?.data, warning: await rebuild() };
}

export async function updateRedirect(id, input) {
    const data = validateRedirectInput(input);
    const documentId = await documentIdOf(id);
    const json = await strapi(`redirection-urls/${encodeURIComponent(documentId)}?status=published`, { method: "PUT", body: { data } });
    return { redirect: json?.data, warning: await rebuild() };
}

export async function deleteRedirect(id) {
    const documentId = await documentIdOf(id);
    await strapi(`redirection-urls/${encodeURIComponent(documentId)}`, { method: "DELETE" });
    return { warning: await rebuild() };
}
