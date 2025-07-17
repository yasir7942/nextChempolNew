
import TopBanner from "../components/layout/top-banner";
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from "../components/elements/seo-schema";
import SpeakableSchema from "../components/elements/speakable-schema";
import { getFaqPage } from "../data/loader";
import FAQs from "../components/layout/Faqs";
import PaddingContainer from "../components/layout/padding-container";
import siteConfig from "@/config/site";
import { getDictionary } from "@/libs/getDictionary";


const cachedGetFAQPage = cache(getFaqPage);
export async function generateMetadata(props) {
    const params = await props.params;
    const locale = params?.lang || 'en';


    const pageData = await cachedGetFAQPage(locale);

    const metadataParams = {
        pageTitle: pageData.seo?.seoTitle ? pageData.seo?.seoTitle : pageData?.title,
        pageSlug: "faq",
        pageDescription: pageData.seo?.seoDesctiption,
        seoTitle: pageData.seo?.seoTitle,
        seoDescription: pageData.seo?.seoDesctiption,
        rebotStatus: pageData.seo?.preventIndexing,
        canonicalLinks: pageData.seo?.canonicalLinks ?? "faq",
        dataPublishedTime: pageData.publishedAt,
        category: "",
        image: siteConfig.ogImage,
        imageAlternativeText: "",
        imageExt: siteConfig.ogImageExt,
    };



    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const FAQPage = async ({ params }) => {
    const { lang } = await params || {};
    const dictionary = await getDictionary(lang);
    const pageData = await cachedGetFAQPage(lang);



    //  console.log("-----------------------faq   page--------------------------------------------------");
    //  console.dir(pageData, { depth: null });
    //    console.log("---------------------------End-----faq ------------------end-----------------------");

    return (
        <div>
            <SpeakableSchema pageTitle={pageData.title} pageUrl={pageData.seo?.canonicalLinks ?? "/faq"} />
            <SEOSchema schemaList={pageData.seo?.schema} />

            <TopBanner banner="/images/chempol-banner.jpg" title={pageData?.title} title2="" />

            <PaddingContainer>
                <FAQs dictionary={dictionary} faqList={pageData.faq} heading={pageData.heading} text={pageData.text} />
            </PaddingContainer>


        </div >
    )
}

export default FAQPage
