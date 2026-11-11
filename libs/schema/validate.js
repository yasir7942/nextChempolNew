/*
    JSON-LD validation.

    Each top-level node is checked against schema.org basics plus Google's required
    properties for the rich-result types this site uses. A node that fails is not
    rendered (see prepareJsonLd), so a broken schema never reaches the page.
*/

const BAD_STRING_VALUES = new Set(["undefined", "null", "nan", "[object object]"]);

export function asArray(value) {
    if (value === undefined || value === null) return [];

    return Array.isArray(value) ? value : [value];
}

export function typesOf(node) {
    return asArray(node?.["@type"]).filter((type) => typeof type === "string" && type.trim());
}

function isObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isText(value) {
    return typeof value === "string" && value.trim().length > 0;
}

export function isReference(value) {
    return isObject(value) && isText(value["@id"]) && Object.keys(value).length === 1;
}

function isAbsoluteUrl(value) {
    if (!isText(value)) return false;

    try {
        const url = new URL(value);

        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
}

function isIsoDate(value) {
    return isText(value) && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value));
}

function isNumberLike(value) {
    if (typeof value === "number") return Number.isFinite(value);

    return isText(value) && /^-?\d+(\.\d+)?$/.test(value.trim());
}

function hasName(value) {
    return isReference(value) || isText(value) || isText(value?.name);
}

function isImage(value) {
    return isReference(value) || isAbsoluteUrl(value) || isAbsoluteUrl(value?.url) || isAbsoluteUrl(value?.contentUrl);
}

/* ---------------- TYPE RULES ---------------- */

const ORGANIZATION_TYPES = ["Organization", "Corporation", "LocalBusiness"];
const ARTICLE_TYPES = ["Article", "BlogPosting", "NewsArticle"];
const PAGE_TYPES = ["WebPage", "CollectionPage", "AboutPage", "ContactPage", "ItemPage"];

function checkOrganization(node, error) {
    if (!isText(node.name)) error("name is required");
    if (node.url !== undefined && !isAbsoluteUrl(node.url)) error("url must be an absolute URL");
    if (node.logo !== undefined && !isImage(node.logo)) error("logo must be an absolute image URL");

    asArray(node.sameAs).forEach((url) => {
        if (!isAbsoluteUrl(url)) error(`sameAs "${url}" must be an absolute URL`);
    });
}

function checkProduct(node, error) {
    if (!isText(node.name)) error("name is required");

    if (node.offers === undefined && node.review === undefined && node.aggregateRating === undefined) {
        error("one of offers, review or aggregateRating is required");
    }

    asArray(node.image).forEach((image) => {
        if (!isImage(image)) error("image must be an absolute URL");
    });
}

function checkOffer(node, error) {
    if (!isNumberLike(node.price) && !isObject(node.priceSpecification)) {
        error("price is required");
    }

    if (!isText(node.priceCurrency) && !isObject(node.priceSpecification)) {
        error("priceCurrency is required");
    }

    if (node.priceValidUntil !== undefined && !isIsoDate(node.priceValidUntil)) {
        error("priceValidUntil must be an ISO 8601 date");
    }
}

function checkAggregateOffer(node, error) {
    if (!isNumberLike(node.lowPrice)) error("lowPrice is required");
    if (!isText(node.priceCurrency)) error("priceCurrency is required");
}

function checkAggregateRating(node, error) {
    if (!isNumberLike(node.ratingValue)) error("ratingValue must be a number");

    const count = Number(node.ratingCount ?? node.reviewCount);

    if (!(count > 0)) error("ratingCount or reviewCount must be greater than 0");
}

function checkReview(node, error) {
    if (!hasName(node.author)) error("author with a name is required");
    if (!isNumberLike(node.reviewRating?.ratingValue)) error("reviewRating.ratingValue is required");
}

function checkArticle(node, error) {
    if (!isText(node.headline)) error("headline is required");
    if (node.datePublished !== undefined && !isIsoDate(node.datePublished)) error("datePublished must be an ISO 8601 date");
    if (node.dateModified !== undefined && !isIsoDate(node.dateModified)) error("dateModified must be an ISO 8601 date");

    asArray(node.image).forEach((image) => {
        if (!isImage(image)) error("image must be an absolute URL");
    });

    asArray(node.author).forEach((author) => {
        if (!hasName(author)) error("author must have a name");
    });
}

function checkBreadcrumbList(node, error) {
    const items = asArray(node.itemListElement);

    if (!items.length) {
        error("itemListElement must not be empty");
        return;
    }

    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        const itemUrl = isObject(item?.item) ? item.item["@id"] || item.item.url : item?.item;

        if (!Number.isInteger(Number(item?.position)) || Number(item?.position) < 1) {
            error(`breadcrumb ${index + 1}: position must be a positive integer`);
        }

        if (!isText(item?.name) && !isText(item?.item?.name)) {
            error(`breadcrumb ${index + 1}: name is required`);
        }

        if (!isLast && !isAbsoluteUrl(itemUrl)) {
            error(`breadcrumb ${index + 1}: item must be an absolute URL`);
        }
    });
}

function checkItemList(node, error) {
    if (!asArray(node.itemListElement).length) error("itemListElement must not be empty");
}

// Google video rich result requirements
function checkVideoObject(node, error) {
    if (!isText(node.name)) error("name is required");
    if (!asArray(node.thumbnailUrl).some(isAbsoluteUrl)) error("thumbnailUrl must be an absolute URL");
    if (!isText(node.uploadDate) || Number.isNaN(Date.parse(node.uploadDate))) error("uploadDate must be an ISO 8601 date");
    if (!isAbsoluteUrl(node.embedUrl) && !isAbsoluteUrl(node.contentUrl)) error("embedUrl or contentUrl must be an absolute URL");
}

function checkSiteNavigationElement(node, error) {
    if (!isText(node.name)) error("name is required");
    if (!isAbsoluteUrl(node.url)) error("url must be an absolute URL");
}

function checkFaqPage(node, error) {
    const questions = asArray(node.mainEntity);

    if (!questions.length) {
        error("mainEntity must contain at least one Question");
        return;
    }

    questions.forEach((question, index) => {
        if (!isText(question?.name)) error(`question ${index + 1}: name is required`);
        if (!isText(question?.acceptedAnswer?.text)) error(`question ${index + 1}: acceptedAnswer.text is required`);
    });
}

function checkWebSite(node, error) {
    if (!isText(node.name)) error("name is required");
    if (!isAbsoluteUrl(node.url)) error("url must be an absolute URL");
}

function checkWebPage(node, error) {
    if (node.url !== undefined && !isAbsoluteUrl(node.url)) error("url must be an absolute URL");
}

function checkImageObject(node, error) {
    if (!isAbsoluteUrl(node.contentUrl) && !isAbsoluteUrl(node.url)) {
        error("contentUrl or url must be an absolute URL");
    }
}

function checkPostalAddress(node, error) {
    if (!isText(node.streetAddress) && !isText(node.addressLocality) && !isText(node.addressCountry)) {
        error("streetAddress, addressLocality or addressCountry is required");
    }
}

function checkContactPoint(node, error) {
    if (!isText(node.telephone) && !isText(node.email)) error("telephone or email is required");
}

const TYPE_RULES = [
    [ORGANIZATION_TYPES, checkOrganization],
    [["Product"], checkProduct],
    [["Offer"], checkOffer],
    [["AggregateOffer"], checkAggregateOffer],
    [["AggregateRating"], checkAggregateRating],
    [["Review"], checkReview],
    [ARTICLE_TYPES, checkArticle],
    [["BreadcrumbList"], checkBreadcrumbList],
    [["ItemList"], checkItemList],
    [["VideoObject"], checkVideoObject],
    [["SiteNavigationElement"], checkSiteNavigationElement],
    [["FAQPage"], checkFaqPage],
    [["WebSite"], checkWebSite],
    [PAGE_TYPES, checkWebPage],
    [["ImageObject"], checkImageObject],
    [["PostalAddress"], checkPostalAddress],
    [["ContactPoint"], checkContactPoint],
];

/* ---------------- WALK ---------------- */

function walk(value, path, errors, isTopLevel) {
    if (Array.isArray(value)) {
        value.forEach((item, index) => walk(item, `${path}[${index}]`, errors, false));
        return;
    }

    if (typeof value === "string") {
        if (/<\/?script/i.test(value)) errors.push(`${path}: contains a <script> tag`);
        if (BAD_STRING_VALUES.has(value.trim().toLowerCase())) errors.push(`${path}: value is "${value}"`);
        return;
    }

    if (typeof value === "number" && !Number.isFinite(value)) {
        errors.push(`${path}: value is not a finite number`);
        return;
    }

    if (!isObject(value) || isReference(value)) return;

    const types = typesOf(value);

    if (isTopLevel && !types.length) {
        errors.push(`${path}: @type is required`);
    }

    types.forEach((type) => {
        TYPE_RULES.forEach(([ruleTypes, check]) => {
            if (ruleTypes.includes(type)) {
                check(value, (message) => errors.push(`${path} (${type}): ${message}`));
            }
        });
    });

    Object.entries(value).forEach(([key, child]) => {
        if (key === "@context" || key === "@type" || key === "@id") return;

        walk(child, `${path}.${key}`, errors, false);
    });
}

export function validateNode(node) {
    const errors = [];

    if (!isObject(node)) {
        return { valid: false, errors: ["schema must be a JSON object"] };
    }

    if (node["@context"] !== undefined && !/^https?:\/\/schema\.org\/?$/.test(String(node["@context"]))) {
        errors.push(`@context must be https://schema.org (got "${node["@context"]}")`);
    }

    walk(node, typesOf(node)[0] || "node", errors, true);

    return { valid: errors.length === 0, errors };
}

/*
    Accepts a node, an array of nodes, or a { "@graph": [...] } document and
    returns its top-level nodes without @context.
*/
export function toNodes(data) {
    if (!data) return [];

    if (Array.isArray(data)) return data.flatMap(toNodes);

    if (isObject(data) && Array.isArray(data["@graph"])) {
        return data["@graph"].flatMap(toNodes);
    }

    if (isObject(data)) {
        const { "@context": _context, ...node } = data;

        return [node];
    }

    return [];
}
