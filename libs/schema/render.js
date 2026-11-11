import { toNodes, validateNode } from "./validate";

const SCHEMA_CONTEXT = "https://schema.org";

// U+2028 / U+2029 are valid in JSON but end a line in JavaScript.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), "g");
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), "g");

/*
    JSON.stringify does not escape "<", so a value containing "</script>" would close
    the JSON-LD tag early and break the page's structured data. Escape the characters
    that are unsafe inside an HTML <script> element.
*/
export function serializeJsonLd(data) {
    return JSON.stringify(data)
        .replace(/</g, "\\u003c")
        .replace(/>/g, "\\u003e")
        .replace(/&/g, "\\u0026")
        .replace(LINE_SEPARATOR, "\\u2028")
        .replace(PARAGRAPH_SEPARATOR, "\\u2029");
}

function logInvalid(label, node, errors) {
    if (process.env.NODE_ENV === "production") return;

    console.warn(
        `[json-ld] ${label} "${node?.["@type"]}" not rendered:\n  - ${errors.slice(0, 8).join("\n  - ")}`
    );
}

// Returns only the nodes that pass validation.
export function filterValidNodes(data, label = "schema") {
    return toNodes(data).filter((node) => {
        const { valid, errors } = validateNode(node);

        if (!valid) logInvalid(label, node, errors);

        return valid;
    });
}

/*
    Validates and wraps nodes into one JSON-LD document.
    Returns null when nothing valid is left, so nothing is rendered.
*/
export function prepareJsonLd(data, label) {
    const nodes = filterValidNodes(data, label);

    if (!nodes.length) return null;

    if (nodes.length === 1) {
        return {
            "@context": SCHEMA_CONTEXT,
            ...nodes[0],
        };
    }

    return {
        "@context": SCHEMA_CONTEXT,
        "@graph": nodes,
    };
}
