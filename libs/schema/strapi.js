import { ORGANIZATION_ID, WEBSITE_ID } from "./entity";
import { asArray, toNodes, typesOf, validateNode } from "./validate";

/*
    Strapi `seo.schema[].code` is free text pasted by editors. Most entries wrap the
    JSON in its own <script type="application/ld+json"> tag (and some contain several
    scripts, or a whole HTML page). Rendering that inside another JSON-LD script is
    what made the site's structured data invalid.

    Here the code is turned back into plain schema nodes:
    - <script> wrappers are removed and each script block is parsed on its own
    - anything that is not JSON is skipped
    - @graph documents are flattened into nodes
*/
export function parseStrapiSchemaCode(code) {
    const blocks = String(code || "")
        .split(/<\/script\s*>/i)
        .map((block) => block.replace(/<script\b[^>]*>/gi, "").trim())
        .filter((block) => block.startsWith("{") || block.startsWith("["));

    return blocks.flatMap((block) => {
        try {
            return toNodes(JSON.parse(block));
        } catch (err) {
            if (process.env.NODE_ENV !== "production") {
                console.warn(`[json-ld] Strapi schema is not valid JSON, skipped: ${err.message}`);
            }

            return [];
        }
    });
}

/*
    Types that a page outputs itself always win over Strapi. Strapi copies of the
    same entity are dropped instead of being shown twice with conflicting data.
*/
const SITE_WIDE_TYPES = ["Organization", "Corporation", "LocalBusiness", "WebSite", "Website"];

const EQUIVALENT_TYPES = {
    Article: ["Article", "BlogPosting", "NewsArticle"],
    BlogPosting: ["Article", "BlogPosting", "NewsArticle"],
    NewsArticle: ["Article", "BlogPosting", "NewsArticle"],
    Organization: ["Organization", "Corporation", "LocalBusiness"],
};

function expandTypes(types) {
    return new Set(types.flatMap((type) => EQUIVALENT_TYPES[type] || [type]));
}

const COMPANY_NAME = /chempol/i;

function isOwnCompany(node) {
    const types = typesOf(node);

    if (!types.some((type) => EQUIVALENT_TYPES.Organization.includes(type))) return false;

    return COMPANY_NAME.test(String(node.name || "")) || /#organization$/.test(String(node["@id"] || ""));
}

/*
    Inline copies of the company (each with its own name/phone variant) are replaced
    by a reference to the one canonical Organization; same for the WebSite.
*/
function linkToCanonicalEntities(value) {
    if (Array.isArray(value)) return value.map(linkToCanonicalEntities);

    if (!value || typeof value !== "object") return value;

    if (isOwnCompany(value)) return { "@id": ORGANIZATION_ID };

    if (typesOf(value).some((type) => type === "WebSite" || type === "Website") || /#website$/.test(String(value["@id"] || ""))) {
        return { "@id": WEBSITE_ID };
    }

    return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [key, linkToCanonicalEntities(child)])
    );
}

export function strapiSchemaNodes(schemaList = [], ownedTypes = []) {
    const skip = expandTypes([...SITE_WIDE_TYPES, ...ownedTypes]);

    return (Array.isArray(schemaList) ? schemaList : [])
        .flatMap((schema) => parseStrapiSchemaCode(schema?.code))
        .filter((node) => !typesOf(node).some((type) => skip.has(type)))
        .map((node) => {
            const { "@id": id, ...rest } = node;
            const linked = linkToCanonicalEntities(rest);

            return id ? { "@id": id, ...linked } : linked;
        });
}

/*
    Reviews are optional. When an editor added reviews or a rating to the product's
    Strapi schema, the valid ones are reused on the page's own Product.
*/
export function strapiProductRatings(schemaList = []) {
    const isValid = (node) => validateNode(node).valid;

    for (const node of strapiSchemaNodes(schemaList)) {
        if (!typesOf(node).includes("Product")) continue;

        const review = asArray(node.review).filter(isValid);
        const aggregateRating = node.aggregateRating && isValid(node.aggregateRating) ? node.aggregateRating : undefined;

        if (review.length || aggregateRating) {
            return { review: review.length ? review : undefined, aggregateRating };
        }
    }

    return {};
}
