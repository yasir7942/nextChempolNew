import PaddingContainer from "@/app/components/layout/padding-container"
import ProductCategoryMenu from "@/app/components/layout/product-category-menu";

import Image from "next/image";
import { geProductsBySearchAdvance, getSearchPage } from "@/app/data/loader"


import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { getImageUrl } from "@/libs/helper";
import SearchComponenet from "../components/layout/search-component";
import { cache } from 'react';
import SEOSchema from "../components/elements/seo-schema";
import siteConfig from "@/config/site";


const cachedGetSearchPage = cache(getSearchPage);

export async function generateMetadata({ params }) {


  const pageData = await cachedGetSearchPage();

  const metadataParams = {
    pageTitle: pageData.seo?.seoTitle ? pageData.seo?.seoTitle : "Chempol Search Page",
    pageSlug: "search",
    pageDescription: "",
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDesctiption,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "search",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: siteConfig.ogImage,
    imageAlternativeText: "",
    imageExt: siteConfig.ogImageExt,
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}







const searchPage = async ({ searchParams }) => {

  const pageData = await cachedGetSearchPage();

  const query = searchParams?.s ?? "";

  // product show by category

  const productData = await geProductsBySearchAdvance(query);




  console.log("-----------------------search products --------------------------------------------------");
  // console.dir(productData, { depth: null });
  // console.log("---------------------------End--------p category---------------end-----------------------");
  //console.log(productData.data);
  // if(productData.data.length === 0)  return  <NotFound />

  //console.dir(productData.data.title, { depth:null});
  // console.log();

  return (
    <div>

      <SEOSchema schemaList={pageData.seo?.schema} />
      <div className="w-full mt-5 h-[1px] bg-textBlue"></div>
      <PaddingContainer>


        <div className="w-full relative  h-auto md:min-h-[400px] lg:min-h-[600px]  flex flex-col md:flex-row mt-20   ">
          {/*  Left Menu Column  */}
          <div className="w-full md:w-3/12 lg:w-1/6  p-6 md:pl-0  overflow-hidden">
            {/* <!-- Menu content goes here   */}
            <ProductCategoryMenu />
          </div>

          {/*  Content Area   */}
          <div className=" w-full md:w-9/12 lg:w-5/6  flex flex-col  p-3 md:p-4 pb-3  relative  ">
            {/*   Content area content goes here  */}
            <SearchComponenet />


            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-3    p-3  ">

              {productData.data?.map((product) => (
                <div key={product.id} className=" pt-0 mt-10 relative text-center flex flex-col  justify-center">

                  <div className="w-full      flex justify-center  ">
                    <a href={`/product/${product.slug}/`} > <Image className="relative w-24 text-center" src={getImageUrl(product?.productImage.url)} height={500} width={500} alt={product.title} /> </a>
                  </div>
                  <div className="flex flex-col w-full h-full " >
                    <h2 className="uppercase text-sm text-textBlue mt-3 leading-1"> <a href={`/product/${product.slug}/`}  >{product.title}</a> </h2>

                  </div>

                </div>

              ))}

            </div>

          </div>


        </div>


      </PaddingContainer>


    </div>


  )
}

export default searchPage
