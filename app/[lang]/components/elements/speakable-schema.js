import JsonLd from "./json-ld";
import { absoluteUrl, pageUrl, websiteReference } from "@/libs/schema/entity";

const SpeakableSchema = ({ pageTitle, pageUrl: path = "/", locale = "en" }) => {

    // Canonical links from Strapi may be full paths ("/en/about-us/") or relative ("about-us").
    const cleanPath = String(path || "/").replace(/^\/+|\/+$/g, "");
    const url = cleanPath.startsWith(`${locale}/`) || cleanPath === locale
        ? absoluteUrl(`/${cleanPath}/`)
        : pageUrl(locale, cleanPath);

    const jsonLdSpeakable =
    {
        "@type": "WebPage",
        "name": pageTitle,
        "speakable":
        {
            "@type": "SpeakableSpecification",
            "cssSelector": [
                ".headline",
                ".summary"
            ]
        },
        "url": url,
        "inLanguage": locale,
        "isPartOf": websiteReference,
    };





    return (
        <div>
            {/*  JSON-LD of Page */}
            <JsonLd data={jsonLdSpeakable} label="speakable schema" />
        </div>
    )
}

export default SpeakableSchema
