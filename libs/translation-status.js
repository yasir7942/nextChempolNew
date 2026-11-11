// Translation status of a localized Strapi entry compared with its English version.
//
// The fields are not listed here: every field that has text in the English entry must also have
// text in the translation. An English field that is empty is not required in the translation.
//   "none"       the entry has no translation in that language
//   "incomplete" a translation exists but some fields are empty (listed in `missing`)
//   "complete"   every field filled in English is filled in the translation
//
// Fields that are not text (numbers, booleans) and system fields are ignored. Non-localized
// fields (slug, media, relations) are shared between languages and are skipped as well.

// Not translated per language: system fields, slug, uploaded files (images, TDS, MSDS) and relations
const SKIP_KEYS = new Set([
    "id", "documentId", "createdAt", "updatedAt", "publishedAt", "locale", "localizations", "slug",
    "productImage", "TDSFile", "MSDSFile", "product_categories", "related_products",
]);

const LABELS = {
    seo: "SEO",
    seoTitle: "SEO Title",
    seoDesctiption: "SEO Description",
    seoDescription: "SEO Description",
    tdsPacking: "TDS Packing",
    faq: "FAQ",
};

// "shortDescription" -> "Short Description"
export function fieldLabel(key) {
    if (LABELS[key]) return LABELS[key];
    const spaced = String(key).replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const isObject = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
// An uploaded file (Strapi media) in any field: its name, hash, url, formats... are never translated
const isMedia = (value) => isObject(value) && "mime" in value && "url" in value;
// Rich text (Strapi blocks): an array of nodes that have `type` and `children`
const isBlocks = (value) => Array.isArray(value) && value.some((node) => isObject(node) && "children" in node);

// true when the value holds any text; null, "", whitespace, empty arrays and objects without text are empty
export function hasText(value) {
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.some(hasText);
    if (isObject(value)) {
        if ("text" in value) return hasText(value.text);
        if ("children" in value) return hasText(value.children);
        return Object.entries(value).some(([key, inner]) => !SKIP_KEYS.has(key) && hasText(inner));
    }
    return false;
}

// Names of the fields that have text in `english` but not in `translated`
export function missingFields(english, translated, prefix = "") {
    const missing = [];

    for (const [key, englishValue] of Object.entries(english || {})) {
        if (SKIP_KEYS.has(key) || isMedia(englishValue) || !hasText(englishValue)) continue;

        const label = prefix ? `${prefix} › ${fieldLabel(key)}` : fieldLabel(key);
        const translatedValue = translated?.[key];

        if (isObject(englishValue)) {
            // a single component: compare its own fields
            missing.push(...missingFields(englishValue, isObject(translatedValue) ? translatedValue : {}, label));
        } else if (Array.isArray(englishValue) && !isBlocks(englishValue)) {
            if (englishValue.every(isMedia)) continue; // a list of uploaded files
            // a repeatable component (FAQ, table rows): the translation needs as many filled entries
            const wanted = englishValue.filter(hasText).length;
            const have = Array.isArray(translatedValue) ? translatedValue.filter(hasText).length : 0;
            if (have < wanted) missing.push(have ? `${label} (${have} of ${wanted})` : label);
        } else if (!hasText(translatedValue)) {
            missing.push(label);
        }
    }

    return missing;
}

export function translationStatus(english, translated) {
    if (!translated) return { status: "none", missing: [] };
    const missing = missingFields(english, translated);
    return { status: missing.length ? "incomplete" : "complete", missing };
}
