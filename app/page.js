//Home Page



import PaddingContainer from "./components/layout/padding-container";
import BlogContainer from "./components/layout/blog-container";
import { getHomePage } from "@/app/data/loader"
import SpeakableSchema from "./components/elements/speakable-schema";

import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { cache } from 'react';
import SEOSchema from "./components/elements/seo-schema";

import siteConfig from "@/config/site";

import CharcoalContentBox from "./components/layout/charcoal-content-box";

import ProductCategoryGrid from "./components/layout/product-category-grid";
import CTAcard from "./components/layout/cta-card";
import Slider from "./components/layout/slider";



const cachedGetHomePage = cache(getHomePage);
export async function generateMetadata({ params }) {


  const pageData = await cachedGetHomePage();

  const metadataParams = {
    pageTitle: pageData.title,
    pageSlug: "/",
    pageDescription: siteConfig.description,
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDescription,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "/",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
    imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
    imageExt: pageData.banner?.mobileBanner?.mime,
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}

export default async function Home() {



  const homeData = await cachedGetHomePage();

  //  console.log("-----------------------home page--------------------------------------------------");
  //  console.dir(homeData, { depth:null});
  //  console.log("---------------------------End-----------------------end-----------------------");


  return (
    <div className="bg-backgroundColor">

      <Slider />

      <SpeakableSchema pageTitle={homeData.title} pageUrl={homeData.seo?.canonicalLinks ?? "/"} />
      <SEOSchema schemaList={homeData.seo?.schema} />

      {/* <!--powering progress--> */}

      <div className=" flex flex-col h-auto md:flex-row  w-full md:space-x-2  px-4 md:px-20 mt-10 justify-center" >
        {/* <!--text--> */}
        <div className="flex flex-col text-left ">
          <h3 className=" *:first-letter: text-2xl md:text-3xl text-center font-semibold text-textBlue">Powering Progress with Innovative Chemical Solutions</h3>
          <p className="text-darkGary mt-3 text-justify text-sm font-normal  pr-5  max-w-6xl ">We are petrochemical experts specializing in the evolution and manufacturing of chemical additives for engine oils, Viscosity Index Improvers, Special Additives, Gasoline Engine Oil Additives, and Speciality Chemical Additives. Trust us for providing high-quality formulations and exceptional service.</p>
        </div>

      </div>
      {/* <!--end powering progress--> */}

      {/* <!--Cards container--> */}

      <PaddingContainer  >
        <div className="flex flex-col md:flex-row  justify-center h-auto space-y-5 md:space-y-0 md:space-x-2 lg:space-x-6  md:pb-5      mt-2 md:mt-10">

          <CharcoalContentBox title="About Chempol"
            description="Chempol is a top-tier manufacturer of Lubricant raw materials, additives, and other chemical specialities, catering to multiple industries’ needs..."
            image="/images/about-chempol.jpg" />

          <CharcoalContentBox title="Reliability Solutions"
            description="At Chempol, we’re your go-to partner for all your lubrication Polymer Applications, Polymer Additives, and speciality polymer needs. Our team..."
            image="/images/relaibility.jpg" />

          <CharcoalContentBox title="Core Values"
            description="At Chempol, we are committed to delivering exceptional results to our customters. We believe that our success is driven by our ability to inspire..."
            image="/images/caore-value.jpg" />


        </div>
      </PaddingContainer>
      {/* <!-- end card container--> */}


      <ProductCategoryGrid />

      <CTAcard />

      <BlogContainer />

    </div>

  );
}
