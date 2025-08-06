//Home Page
import PaddingContainer from "./components/layout/padding-container";
import BlogContainer from "./components/layout/blog-container";
import SpeakableSchema from "./components/elements/speakable-schema";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { cache } from 'react';
import SEOSchema from "./components/elements/seo-schema";
import siteConfig from "@/config/site";
import CharcoalContentBox from "./components/layout/charcoal-content-box";
import ProductCategoryGrid from "./components/layout/product-category-grid";
import CTAcard from "./components/layout/cta-card";
import Slider from "./components/layout/slider";
import FretchVideosWrapper from "./components/elements/FretchVideosWrapper";
import { getHomePage } from "./data/loader";
import { getDictionary } from "@/libs/getDictionary";







const cachedGetHomePage = cache(getHomePage);

export async function generateMetadata({ params }) {
  // const lang = await props.lang;
  // const { lang } = await props.params;
  //const { lang } = await props.params || {};
  //const { lang } = props.params;

  const { lang } = await params;
  const pageData = await cachedGetHomePage(lang);

  const metadataParams = {
    pageTitle: pageData.seo?.seoTitle ? pageData.seo?.seoTitle : pageData.title,
    pageSlug: "/",
    pageDescription: pageData.seo?.seoDesctiption ? pageData.seo?.seoDesctiption : siteConfig.description,
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDesctiption ? pageData.seo?.seoDesctiption : siteConfig.description,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "/",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: siteConfig.ogImage,
    imageAlternativeText: "",
    imageExt: siteConfig.ogImageExt,
    //lang: lang,
  };

  const metaData = await generatePageMetadata({ type: "page", path: "", params: metadataParams, lang: lang });

  return metaData
}





export default async function Home({ params }) {


  const { lang } = await params || {};


  const dictionary = await getDictionary(lang);
  const homeData = await cachedGetHomePage(lang);




  return (
    <div className="bg-backgroundColor">


      <Slider locale={lang} diction={dictionary} />

      <SpeakableSchema pageTitle={homeData.title} pageUrl={homeData.seo?.canonicalLinks ?? "/"} />
      <SEOSchema schemaList={homeData.seo?.schema} />

      {/* <!--powering progress--> {`${lang === 'ar' ? 'rtl' : 'ltr'}` */}

      <div className=" flex flex-col h-auto md:flex-row  w-full md:space-x-2  px-4 md:px-20 mt-10 justify-center " >
        {/* <!--text--> */}
        <div className="flex flex-col  ">
          <h2 className=" *:first-letter: text-2xl md:text-3xl text-center font-semibold text-textBlue">{dictionary.homePage.title}</h2>
          <p className="text-darkGary mt-3 text-justify text-sm font-normal  pr-5  max-w-6xl ">{dictionary.homePage.description}</p>
        </div>

      </div>
      {/* <!--end powering progress--> */}

      {/* <!--Cards container--> */}

      <PaddingContainer  >
        <div className="flex flex-col md:flex-row  justify-center h-auto space-y-5 md:space-y-0 md:space-x-2 lg:space-x-6  md:pb-5      mt-2 md:mt-10 rtl:gap-3  rtl:md:gap-2  rtl:lg:gap-6 ">

          <CharcoalContentBox title={dictionary.homePage.aboutChempol}
            description={dictionary.homePage.aboutChempolDescription}
            image="/images/about-chempol.jpg" url="about-us" button={dictionary.homePage.readMore} />

          <CharcoalContentBox title={dictionary.homePage.realibility}
            description={dictionary.homePage.realibilityDescription}
            image="/images/relaibility.jpg" url="about-us" button={dictionary.homePage.readMore} />

          <CharcoalContentBox title={dictionary.homePage.coreValues}
            description={dictionary.homePage.coreValuesDescription}
            image="/images/caore-value.jpg" url="about-us" button={dictionary.homePage.readMore} />


        </div>
      </PaddingContainer>
      {/* <!-- end card container--> */}


      <ProductCategoryGrid locale={lang} />

      <CTAcard locale={lang} />

      <BlogContainer locale={lang} />

      <div className="bg-[#F2F2F2] w-full h-auto pt-14 pb-10" dir="ltr">

        <PaddingContainer className=" ">
          <h3 className=" text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize r   ml-5 z-20" >{dictionary.homePage.latestMediaUpdate} </h3>
          <FretchVideosWrapper langText={dictionary.homePage.latestRelease} />
        </PaddingContainer>

      </div>
    </div>

  );
}
