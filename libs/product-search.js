// Product search across every language (server only).
//
// All published products of every locale are loaded once into memory and grouped by
// Strapi documentId (the en/ar/es versions of a product share it). A query is matched
// against the titles, categories, SEO titles and descriptions of all languages, and the
// matching products are returned in the visitor's language: an English query on /ar/
// shows the Arabic products, an Arabic query on /en/ shows the English ones.
//
// The Strapi reads are cached for 1 hour (tag PRODUCT_SEARCH_TAG) and the built index for
// 10 minutes; the Strapi webhook (app/api/revalidate) clears both when a product changes.
import qs from "qs";
import { i18n } from "@/i18n.config";

export const PRODUCT_SEARCH_TAG = "product-search";

const STRAPI_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/?$/, "/");
const INDEX_TTL = 10 * 60 * 1000;
const STRAPI_PAGE_SIZE = 100;

// Points per matched query word, by where it matched
const WEIGHT = { title: 10, category: 4, seo: 3, body: 1 };

// On globalThis because Next.js can load this module once per route bundle, and the
// webhook route must clear the same index the search route reads
const state = (globalThis.__chempolProductSearch ||= {
    index: null, // { builtAt, products }
    building: null, // the build in progress, shared by concurrent requests
});

// Lowercase, without accents, Arabic diacritics or letter variants, punctuation as spaces:
// "Aditivo Lubricante" = "aditivo lubricante", "الإضافات" = "الاضافات", "5746-ii" = "5746 ii"
export function normalizeSearchText(value) {
    return String(value || "")
        .toLowerCase()
        .normalize("NFKD")
        .replace(/\p{M}/gu, "") // accents, Arabic harakat and the hamza on أ إ آ ؤ ئ
        .replace(/ٱ/g, "ا")
        .replace(/ة/g, "ه")
        .replace(/ى/g, "ي")
        .replace(/ـ/g, "") // tatweel
        .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
        .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
        .replace(/[^\p{L}\p{N}]+/gu, " ")
        .trim();
}

// Strapi rich text (blocks) or a plain string, as plain text
function plainText(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.map(plainText).join(" ");
    if (typeof value === "object") return [value.text, plainText(value.children)].filter(Boolean).join(" ");
    return "";
}

async function fetchLocaleProducts(locale) {
    const products = [];

    for (let page = 1; ; page++) {
        const query = qs.stringify(
            {
                locale,
                fields: ["title", "slug", "description", "application"],
                populate: {
                    productImage: { fields: ["url", "formats", "alternativeText"] },
                    product_categories: { fields: ["title"] },
                    seo: { fields: ["seoTitle"] },
                },
                pagination: { page, pageSize: STRAPI_PAGE_SIZE },
            },
            { encodeValuesOnly: true }
        );

        const res = await fetch(`${STRAPI_API}products?${query}`, {
            next: { revalidate: 3600, tags: [PRODUCT_SEARCH_TAG] },
        });
        if (!res.ok) throw new Error(`Strapi products (${locale}) returned ${res.status}`);

        const json = await res.json();
        products.push(...(json?.data || []));

        if (page >= (json?.meta?.pagination?.pageCount || 1)) return products;
    }
}

// What the search bar and the search page show for one product in one language
function toResult(product) {
    const image = product.productImage;
    const thumbnail = image?.formats?.thumbnail?.url;

    return {
        id: product.id,
        documentId: product.documentId,
        title: product.title || "",
        slug: product.slug || "",
        productImage: image?.url
            ? {
                url: image.url,
                alternativeText: image.alternativeText || null,
                formats: thumbnail ? { thumbnail: { url: thumbnail } } : {},
            }
            : null,
        product_categories: (product.product_categories || []).map((c) => ({ title: c.title || "" })),
    };
}

async function buildIndex() {
    const lists = await Promise.all(i18n.locales.map(fetchLocaleProducts));
    const byDocument = new Map();

    i18n.locales.forEach((locale, i) => {
        for (const product of lists[i]) {
            // no category = the product page is a 404 (app/[lang]/product/[slug]/page.js)
            if (!product?.documentId || !product.slug || !product.product_categories?.length) continue;

            let entry = byDocument.get(product.documentId);
            if (!entry) {
                entry = { locales: {}, title: [], category: [], seo: [], body: [] };
                byDocument.set(product.documentId, entry);
            }

            entry.locales[locale] = toResult(product);
            entry.title.push(product.title);
            entry.category.push(...(product.product_categories || []).map((c) => c.title));
            entry.seo.push(product.seo?.seoTitle);
            entry.body.push(plainText(product.description), product.application);
        }
    });

    const products = [...byDocument.values()].map((entry) => {
        const text = (list) => ` ${normalizeSearchText(list.filter(Boolean).join(" | "))} `;
        const titles = Object.fromEntries(
            Object.entries(entry.locales).map(([loc, p]) => [loc, normalizeSearchText(p.title)])
        );

        return {
            locales: entry.locales,
            titles,
            title: text(entry.title),
            category: text(entry.category),
            seo: text(entry.seo),
            body: text(entry.body),
            compactTitle: text(entry.title).replace(/ /g, ""),
        };
    });

    return { builtAt: Date.now(), products };
}

async function getIndex() {
    if (state.index && Date.now() - state.index.builtAt < INDEX_TTL) return state.index;

    if (!state.building) {
        state.building = buildIndex()
            .then((built) => (state.index = built))
            .finally(() => (state.building = null));
    }

    try {
        return await state.building;
    } catch (error) {
        // Strapi is down: keep answering from the last index if there is one
        if (state.index) {
            console.error("Product search index rebuild failed, using the previous one:", error.message);
            return state.index;
        }
        throw error;
    }
}

// Builds the index in the background (the search box asks for this when it gets focus)
export function warmProductSearch() {
    getIndex().catch((error) => console.error("Product search index build failed:", error.message));
}

// Checks product slugs from a form against the real catalogue (a visitor can send anything).
// Returns only the products that exist in `locale`, with their English title for the team's email.
export async function lookupProducts(locale, slugs) {
    const { products } = await getIndex();

    return slugs
        .map((slug) => products.find((product) => product.locales[locale]?.slug === slug))
        .filter(Boolean)
        .map((product) => ({
            slug: product.locales[locale].slug,
            title: product.locales.en?.title || product.locales[locale].title,
        }));
}

// Called by the Strapi webhook after a product or category change
export function clearProductSearchIndex() {
    state.index = null;
}

// Points for one query word in one field: more when it starts a word
function fieldScore(field, word, weight) {
    const at = field.indexOf(word);
    if (at < 0) return 0;
    return field[at - 1] === " " ? weight * 1.5 : weight;
}

function scoreProduct(product, words, phrase, locale) {
    let score = 0;

    for (const word of words) {
        const best = Math.max(
            fieldScore(product.title, word, WEIGHT.title),
            fieldScore(product.category, word, WEIGHT.category),
            fieldScore(product.seo, word, WEIGHT.seo),
            fieldScore(product.body, word, WEIGHT.body)
        );
        if (!best) return 0; // every word must match somewhere
        score += best;
    }

    const ownTitle = product.titles[locale] || "";
    if (product.title.includes(` ${phrase}`)) score += 20;
    if (ownTitle.startsWith(phrase)) score += 10;
    if (words.every((word) => ownTitle.includes(word))) score += 5; // prefer matches in the page language

    return score;
}

// Products matching the query, in the given language, best match first
export async function searchProducts(locale, query, { limit = 10 } = {}) {
    const phrase = normalizeSearchText(query);
    if (!phrase) return { data: [], total: 0 };

    const words = [...new Set(phrase.split(" "))];
    const compactPhrase = phrase.replace(/ /g, "");
    const { products } = await getIndex();
    const matches = [];

    for (const product of products) {
        const result = product.locales[locale];
        if (!result) continue; // no version in this language

        let score = scoreProduct(product, words, phrase, locale);
        // "chempol5746" finds "CHEMPOL 5746"
        if (!score && compactPhrase.length > 3 && product.compactTitle.includes(compactPhrase)) score = WEIGHT.title;
        if (score) matches.push({ score, result });
    }

    matches.sort((a, b) => b.score - a.score || a.result.title.localeCompare(b.result.title));

    return { data: matches.slice(0, limit).map((m) => m.result), total: matches.length };
}
