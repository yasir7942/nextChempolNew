import PaddingContainer from "@/app/components/layout/padding-container"
import ProductCategoryMenu from "@/app/components/layout/product-category-menu";

import Image from "next/image";
import { geProductsBySearchAdvance, getSearchPage } from "@/app/data/loader"


import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { getImageUrl } from "@/libs/helper";
import SearchComponenet from "../components/layout/search-component";
import { cache } from 'react';
import SEOSchema from "../components/elements/seo-schema";


const cachedGetSearchPage = cache(getSearchPage);

export async function generateMetadata({ params }) {


  const pageData = await cachedGetSearchPage();

  const metadataParams = {
    pageTitle: pageData.slug,
    pageSlug: "search",
    pageDescription: "",
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDescription,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "search",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
    imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
    imageExt: pageData.banner?.mobileBanner?.mime,
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

      <PaddingContainer>


        <div className="w-full h-auto flex flex-col md:flex-row mt-20  ">
          {/*  Left Menu Column  */}
          <div className="w-full md:w-3/12 lg:w-1/6  p-6 md:pl-0  overflow-hidden">
            {/* <!-- Menu content goes here   */}
            <ProductCategoryMenu />
          </div>

          {/*  Content Area   */}
          <div className=" w-full md:w-9/12 lg:w-5/6  flex flex-col  p-3 md:p-4 pb-3   ">
            {/*   Content area content goes here  */}
            <SearchComponenet />


            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 mt-3    p-3  ">

              {productData.data?.map((product) => (
                <div key={product.id} className=" pt-0 mt-10 relative text-center flex flex-col  justify-center">

                  <div className="w-full      flex justify-center  ">
                    <a href={`/product/${product.slug}`} > <Image className="relative w-24 text-center" src={getImageUrl(product?.productImage.url)} height={500} width={500} alt={product.title} /> </a>
                  </div>
                  <div className="flex flex-col w-full h-full " >
                    <h2 className="uppercase text-sm text-textBlue mt-3 leading-1"> <a href={`/product/${product.slug}`}  >{product.title}</a> </h2>

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
