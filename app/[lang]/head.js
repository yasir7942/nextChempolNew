// app/[lang]/head.js

import siteConfig from "@/config/site";

const jsonLdBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    image: [siteConfig.logoImage, siteConfig.mobileLogo],
    name: siteConfig.organizatioName,
    address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.streetAddress,
        addressLocality: siteConfig.addressLocality,
        addressRegion: "SH",
        postalCode: siteConfig.postalCode,
        addressCountry: "AE",
    },
    review: {
        "@type": "Review",
        reviewRating: {
            "@type": "Rating",
            ratingValue: siteConfig.ratingValue,
            bestRating: "5",
        },
        author: {
            "@type": "Person",
            name: siteConfig.authorName,
        },
    },
    geo: {
        "@type": "GeoCoordinates",
        latitude: siteConfig.latitude,
        longitude: siteConfig.longitude,
    },
    url: siteConfig.googleUrl,
    telephone: siteConfig.telephone,
    servesCuisine: "Middle Eastern",
    priceRange: "AED 150-300",
    openingHoursSpecification: [
        {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday",
            ],
            opens: "8:30",
            closes: "17:00",
        },
    ],
};

const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    image: siteConfig.ogImage,
    url: siteConfig.baseUrl,
    sameAs: [
        siteConfig.socialMedia.facebook,
        siteConfig.socialMedia.twitter,
        siteConfig.socialMedia.linkedin,
        siteConfig.socialMedia.instagram,
        siteConfig.socialMedia.youtube,
    ],
    logo: siteConfig.logoImage,
    name: siteConfig.organizatioName,
    description: siteConfig.description,
    email: siteConfig.email,
    telephone: siteConfig.telephone,
    address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.streetAddress,
        addressLocality: siteConfig.addressLocality,
        addressRegion: "SH",
        postalCode: siteConfig.postalCode,
        addressCountry: "AE",
        vatID: siteConfig.vatId,
        iso6523Code: siteConfig.iso6523Code,
    },
};

const jsonLdSearchBox = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    url: siteConfig.baseUrl,
    potentialAction: {
        "@type": "SearchAction",
        target: {
            "@type": "EntryPoint",
            urlTemplate: `${siteConfig.baseUrl}/search?s={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
    },
};

export default function Head() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSearchBox) }}
            />
        </>
    );
}
