
import TopBanner from "../components/layout/top-banner";
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from "../components/elements/seo-schema";
import SpeakableSchema from "../components/elements/speakable-schema";
import { getFaqPage } from "../data/loader";
import FAQs from "../components/layout/Faqs";


const cachedGetFAQPage = cache(getFaqPage);
export async function generateMetadata({ params }) {


    const pageData = await cachedGetFAQPage();

    const metadataParams = {
        pageTitle: "FAQ Page",
        pageSlug: "faq",
        pageDescription: pageData.seo?.seoDescription,
        seoTitle: pageData.seo?.seoTitle,
        seoDescription: pageData.seo?.seoDescription,
        rebotStatus: pageData.seo?.preventIndexing,
        canonicalLinks: pageData.seo?.canonicalLinks ?? "faq",
        dataPublishedTime: pageData.publishedAt,
        category: "",
        image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
        imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
        imageExt: pageData.banner?.mobileBanner?.mime,
    };

    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const FAQPage = async () => {

    const pageData = await cachedGetFAQPage();

    //  console.log("-----------------------faq   page--------------------------------------------------");
    //  console.dir(pageData, { depth: null });
    //    console.log("---------------------------End-----faq ------------------end-----------------------");

    return (
        <div>
            <SpeakableSchema pageTitle={pageData.title} pageUrl={pageData.seo?.canonicalLinks ?? "/faq"} />
            <SEOSchema schemaList={pageData.seo?.schema} />

            <TopBanner banner="/images/chempol-banner.jpg" title="FAQ" title2="" />
            <FAQs faqList={pageData.faq} heading={pageData.heading} text={pageData.text} />


        </div >
    )
}

export default FAQPage
