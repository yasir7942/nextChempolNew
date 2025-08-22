
const SpeakableSchema = ({ pageTitle, pageUrl, locale = "en" }) => {

    const jsonLdSpeakable =
    {
        "@context": "https://schema.org/",
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
        "url": `${process.env.NEXT_PUBLIC_BASE_URL}/${locale}/${pageUrl}`
    };





    return (
        <div>
            {/*  JSON-LD of Page */}
            <script type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSpeakable) }} />
        </div>
    )
}

export default SpeakableSchema


