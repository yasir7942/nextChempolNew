import siteConfig from "@/config/site";

/*
    One canonical company entity for the whole site.

    Every page outputs the same Organization (same @id, name, phone, address), and
    every other schema points to it with { "@id": ORGANIZATION_ID } instead of
    repeating its own copy. Consistent data with one @id is what lets search
    engines treat "Chempol", "Chempol Additives", ... as one company.
*/

export function getSiteUrl() {
    return String(siteConfig.baseUrl || "https://chempol.co.uk").trim().replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
    if (/^https?:\/\//i.test(String(path))) return path;

    const clean = `/${String(path || "").replace(/^\/+/, "")}`;

    return `${getSiteUrl()}${clean}`;
}

// Matches next.config.mjs trailingSlash: true
export function pageUrl(lang, ...segments) {
    const parts = [lang, ...segments].filter(Boolean).map((part) => String(part).replace(/^\/+|\/+$/g, ""));

    return `${getSiteUrl()}/${parts.filter(Boolean).join("/")}/`;
}

export const ORGANIZATION_ID = `${getSiteUrl()}/#organization`;
export const WEBSITE_ID = `${getSiteUrl()}/#website`;
export const LOGO_ID = `${getSiteUrl()}/#logo`;

export const organizationReference = { "@id": ORGANIZATION_ID };
export const websiteReference = { "@id": WEBSITE_ID };

const COUNTRY_CODES = {
    "united arab emirates": "AE",
    uae: "AE",
    "united kingdom": "GB",
    uk: "GB",
    pakistan: "PK",
    "saudi arabia": "SA",
    ksa: "SA",
};

const LANGUAGE_NAMES = ["English", "Arabic", "Spanish"];

function countryCode(name) {
    return COUNTRY_CODES[String(name || "").trim().toLowerCase()] || "";
}

function compact(object) {
    return Object.fromEntries(
        Object.entries(object).filter(([, value]) => {
            if (value === undefined || value === null || value === "") return false;
            if (Array.isArray(value) && value.length === 0) return false;

            return true;
        })
    );
}

/*
    `offices` is the Contact page addressBook from Strapi, so the schema lists the
    same offices and phone numbers the site shows.
*/
export function buildOrganization({ offices = [] } = {}) {
    const sameAs = [
        ...Object.values(siteConfig.socialMedia || {}),
        siteConfig.googleBusinessProfileUrl,
    ].filter((url) => /^https?:\/\//i.test(String(url || "")));

    const branchOffices = offices
        .filter((office) => office?.address)
        .map((office) =>
            compact({
                "@type": "Place",
                name: `${siteConfig.organizationName} – ${office.company}`,
                address: compact({
                    "@type": "PostalAddress",
                    streetAddress: String(office.address).trim(),
                    addressCountry: countryCode(office.company),
                }),
                telephone: String(office.phone || "").trim(),
                hasMap: /^https?:\/\//i.test(String(office.mapUrl || "")) ? office.mapUrl : "",
            })
        );

    const contactPoints = [
        compact({
            "@type": "ContactPoint",
            contactType: "sales",
            telephone: siteConfig.telephone,
            email: siteConfig.email,
            areaServed: "Worldwide",
            availableLanguage: LANGUAGE_NAMES,
        }),
        ...offices
            .filter((office) => String(office?.phone || "").trim())
            .map((office) =>
                compact({
                    "@type": "ContactPoint",
                    contactType: "sales",
                    telephone: String(office.phone).trim(),
                    email: String(office.email || "").trim(),
                    areaServed: countryCode(office.company),
                })
            ),
    ];

    return compact({
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: siteConfig.organizationName,
        alternateName: siteConfig.alternateNames,
        url: `${getSiteUrl()}/`,
        logo: {
            "@type": "ImageObject",
            "@id": LOGO_ID,
            url: siteConfig.logoImage,
            contentUrl: siteConfig.logoImage,
            caption: siteConfig.organizationName,
            license: siteConfig.imageObject?.license,
            acquireLicensePage: siteConfig.imageObject?.acquireLicensePage,
            creditText: siteConfig.imageObject?.creditText || siteConfig.organizationName,
            copyrightNotice: siteConfig.imageObject?.copyrightNoticeLogo,
        },
        image: { "@id": LOGO_ID },
        description: siteConfig.description,
        email: siteConfig.email,
        telephone: siteConfig.telephone,
        vatID: siteConfig.vatId,
        address: compact({
            "@type": "PostalAddress",
            streetAddress: siteConfig.streetAddress,
            addressLocality: siteConfig.addressLocality,
            addressRegion: siteConfig.addressRegion,
            postalCode: siteConfig.postalCode,
            addressCountry: siteConfig.addressCountry,
        }),
        contactPoint: contactPoints,
        location: branchOffices,
        sameAs,
    });
}

export function buildWebSite(lang = "en") {
    return {
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        url: `${getSiteUrl()}/`,
        name: siteConfig.brandName,
        alternateName: [siteConfig.organizationName, ...siteConfig.alternateNames.filter((name) => name !== siteConfig.brandName)],
        inLanguage: lang,
        publisher: organizationReference,
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${pageUrl(lang, "search")}?s={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };
}

/*
    items: [{ name, url }] — the last item is the current page and may omit url.
*/
export function buildBreadcrumbList(items = []) {
    const clean = items.filter((item) => item?.name);

    return {
        "@type": "BreadcrumbList",
        itemListElement: clean.map((item, index) =>
            compact({
                "@type": "ListItem",
                position: index + 1,
                name: String(item.name).trim(),
                item: item.url ? absoluteUrl(item.url) : "",
            })
        ),
    };
}

function cleanText(value, max = 5000) {
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

/*
    Price depends on order quantity, so every product offers the configured price
    range (siteConfig.productPrice) as an AggregateOffer.
*/
function buildPriceRange(url) {
    const price = siteConfig.productPrice || {};

    if (!price.currency || !(Number(price.lowPrice) > 0)) return undefined;

    return compact({
        "@type": "AggregateOffer",
        url,
        priceCurrency: price.currency,
        lowPrice: Number(price.lowPrice),
        highPrice: Number(price.highPrice) || undefined,
        availability: price.availability,
        seller: organizationReference,
    });
}

/*
    Product with the configured price range. Reviews are optional: they come from
    Strapi productSchema.reviews, or from a valid Product schema in Strapi seo.schema
    (`strapiRatings`). There is no default or placeholder rating.
*/
export function buildProduct({ product, lang, description, images = [], categoryTitle, strapiRatings = {} }) {
    if (!product?.title || !product?.slug) return null;

    const url = pageUrl(lang, "product", product.slug);
    const productSchema = product.productSchema || {};

    const reviews = (productSchema.reviews || [])
        .filter((review) => review?.author && Number(review?.bestRating) > 0)
        .map((review) =>
            compact({
                "@type": "Review",
                name: cleanText(review.title, 200),
                reviewBody: cleanText(review.reviewBody),
                datePublished: review.datePublished,
                author: { "@type": "Person", name: cleanText(review.author, 200) },
                reviewRating: {
                    "@type": "Rating",
                    ratingValue: Number(review.bestRating),
                    bestRating: 5,
                    worstRating: 1,
                },
            })
        );

    const ratingTotal = reviews.reduce((sum, review) => sum + review.reviewRating.ratingValue, 0);

    const ownRating = reviews.length
        ? {
            "@type": "AggregateRating",
            ratingValue: Number((ratingTotal / reviews.length).toFixed(1)),
            reviewCount: reviews.length,
            bestRating: 5,
            worstRating: 1,
        }
        : undefined;

    return compact({
        "@type": "Product",
        "@id": `${url}#product`,
        name: cleanText(product.title, 300),
        url,
        description: cleanText(description),
        image: images.filter((image) => /^https?:\/\//i.test(String(image || ""))),
        category: cleanText(categoryTitle, 200),
        brand: { "@type": "Brand", name: siteConfig.brandName },
        manufacturer: organizationReference,
        sku: cleanText(productSchema.sku, 100),
        mpn: cleanText(productSchema.mpn, 100),
        gtin8: cleanText(productSchema.gtin8, 8),
        offers: buildPriceRange(url),
        review: reviews.length ? reviews : strapiRatings.review,
        aggregateRating: ownRating || strapiRatings.aggregateRating,
    });
}

/*
    faqs: Strapi faq component rows [{ question, answer }].
    Built on the server so it is in the HTML even when the FAQ accordion is closed.
*/
export function buildFaqPage(faqs = []) {
    const questions = (Array.isArray(faqs) ? faqs : [])
        .filter((faq) => cleanText(faq?.question) && cleanText(faq?.answer))
        .map((faq) => ({
            "@type": "Question",
            name: cleanText(faq.question),
            acceptedAnswer: {
                "@type": "Answer",
                text: cleanText(faq.answer),
            },
        }));

    if (!questions.length) return null;

    return {
        "@type": "FAQPage",
        mainEntity: questions,
    };
}

/*
    Product category page: a CollectionPage whose main entity is the list of
    products shown on the current page. `startPosition` keeps positions correct on
    paginated pages.
*/
export function buildCollectionPage({ lang, slug, name, description, image, products = [], startPosition = 1 }) {
    if (!name || !slug) return null;

    const url = pageUrl(lang, "product-category", slug);

    const items = products
        .filter((product) => product?.slug && product?.title)
        .map((product, index) => ({
            "@type": "ListItem",
            position: startPosition + index,
            url: pageUrl(lang, "product", product.slug),
            name: cleanText(product.title, 300),
        }));

    return compact({
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: cleanText(name, 300),
        description: cleanText(description),
        inLanguage: lang,
        isPartOf: websiteReference,
        publisher: organizationReference,
        primaryImageOfPage: /^https?:\/\//i.test(String(image || "")) ? image : "",
        mainEntity: items.length
            ? { "@type": "ItemList", numberOfItems: items.length, itemListElement: items }
            : undefined,
    });
}

/*
    Main menu as SiteNavigationElement items.
    items: [{ name, url }] in menu order; duplicates by url are dropped.
*/
export function buildSiteNavigation({ lang, items = [] }) {
    const seen = new Set();

    const links = items
        .filter((item) => cleanText(item?.name) && item?.url)
        .map((item) => ({ name: cleanText(item.name, 200), url: absoluteUrl(item.url) }))
        .filter((item) => !seen.has(item.url) && seen.add(item.url));

    if (!links.length) return null;

    return {
        "@type": "ItemList",
        "@id": `${pageUrl(lang)}#main-menu`,
        name: "Main menu",
        itemListElement: links.map((link, index) => ({
            "@type": "SiteNavigationElement",
            position: index + 1,
            name: link.name,
            url: link.url,
        })),
    };
}

export function buildBlogPosting({ post, lang, description, images = [] }) {
    if (!post?.title || !post?.slug) return null;

    const url = pageUrl(lang, "blog", post.slug);

    return compact({
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: cleanText(post.title, 110),
        description: cleanText(description),
        image: images.filter((image) => /^https?:\/\//i.test(String(image || ""))),
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        inLanguage: lang,
        mainEntityOfPage: url,
        author: siteConfig.postAuthor
            ? { "@type": "Person", name: siteConfig.postAuthor }
            : organizationReference,
        publisher: organizationReference,
        isPartOf: websiteReference,
    });
}

/*
    ImageObject with licensing info. The creator is the canonical Organization.
*/
export function buildImageObject({ url, creditText, copyrightNotice }) {
    if (!/^https?:\/\//i.test(String(url || ""))) return null;

    return compact({
        "@type": "ImageObject",
        contentUrl: url,
        license: siteConfig.imageObject?.license,
        acquireLicensePage: siteConfig.imageObject?.acquireLicensePage,
        creditText: creditText || siteConfig.organizationName,
        creator: organizationReference,
        copyrightHolder: organizationReference,
        copyrightNotice,
    });
}

/*
    Videos page: a CollectionPage whose main entity lists the videos shown on the
    current page as VideoObjects (YouTube embeds). `url` is the page's own URL
    (with ?page=N after page 1); `startPosition` keeps positions correct across pages.
    videos: [{ name, description, thumbnailUrl, uploadDate, embedUrl, url }]
*/
export function buildVideoGallery({ lang, url, name, description, videos = [], startPosition = 1 }) {
    const items = videos
        .filter((video) => video?.name && video?.uploadDate && /^https?:\/\//i.test(String(video.thumbnailUrl || "")))
        .map((video, index) => ({
            "@type": "ListItem",
            position: startPosition + index,
            item: compact({
                "@type": "VideoObject",
                name: cleanText(video.name, 300),
                description: cleanText(video.description || video.name, 2048),
                thumbnailUrl: video.thumbnailUrl,
                uploadDate: video.uploadDate,
                embedUrl: video.embedUrl,
                url: video.url,
                inLanguage: "en",
                publisher: organizationReference,
            }),
        }));

    if (!items.length) return null;

    return compact({
        "@type": "CollectionPage",
        "@id": `${url}#webpage`,
        url,
        name: cleanText(name, 300),
        description: cleanText(description),
        inLanguage: lang,
        isPartOf: websiteReference,
        publisher: organizationReference,
        mainEntity: { "@type": "ItemList", numberOfItems: items.length, itemListElement: items },
    });
}
