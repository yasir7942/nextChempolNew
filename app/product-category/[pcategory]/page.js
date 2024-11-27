import PaddingContainer from "@/app/components/layout/padding-container"
import ProductCategoryMenu from "@/app/components/layout/product-category-menu";
import SearchBar from "@/app/components/layout/search-bar";
import TopBanner from "@/app/components/layout/top-banner"
import Image from "next/image";
import { geAllProductCategorySlug, geProductsByCategory, getProductCategory } from "@/app/data/loader"

import { PaginationComponent } from "@/app/components/elements/pagination";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { getFirstDescriptionText, getImageUrl } from "@/libs/helper";
import { Suspense } from "react";
import SEOSchema from "@/app/components/elements/seo-schema";
import BodyDataParse from "@/app/components/elements/data-parse-content";
import SingleTab from "@/app/components/layout/SingleTab";
import CTAcard from "@/app/components/layout/cta-card";
import BlogContainer from "@/app/components/layout/blog-container";


const pageSize = 12;

/* 
export const generateStaticParams = async () => {
 try {


   const pcategorySlugs = await geAllProductCategorySlug();
   const slugCount = pcategorySlugs?.data?.length || 0;
   let pages = Math.round(slugCount/ pageSize);
   
   if(slugCount <= pageSize)
   {
     pages = 0;
   }
   
   const paramsSlugs = pcategorySlugs?.data?.flatMap((pCat) => {
     const totalPages = pages;  

     return Array.from({ length: totalPages + 1 }, (_, i) => ({  // +1 to include the category page
       slug: pCat.slug + (i > 0 ?  "?page=" + i: ""),
      // ...(i > 0 && { page: i })   Include page only if i > 0
     }));
   });
   
 
   // console.log(paramsSlugs);
   return paramsSlugs || [];
 } catch (error) {
   console.log(error);
   throw new Error("Error Fetching generateStaticParams");
 }
}
*/





export async function generateMetadata({ params }) {

  const categoryData = await getProductCategory(params.pcategory);

  const metadataParams = {
    pageTitle: categoryData.data[0].title,
    pageSlug: categoryData.data[0].slug,
    pageDescription: getFirstDescriptionText(categoryData.data[0].description),
    seoTitle: categoryData.data[0].seo?.seoTitle,
    seoDescription: categoryData.data[0].seo?.seoDescription,
    rebotStatus: categoryData.data[0].seo?.preventIndexing,
    canonicalLinks: categoryData.data[0].seo?.canonicalLinks,
    dataPublishedTime: categoryData.data[0].publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + categoryData.data[0].banner?.mobileBanner?.url,
    imageAlternativeText: categoryData.data[0].banner?.mobileBanner?.alternativeText,
    imageExt: categoryData.data[0].banner?.mobileBanner?.mime,
  };

  // console.dir(categoryData, { depth:null}); 
  //console.dir(metadataParams ); 

  return await generatePageMetadata({ type: "category", path: "/product-category/", params: metadataParams });
}


const numbers = Array.from({ length: 12 }, (_, index) => index + 1);


const ProductCategory = async ({ params, searchParams }) => {

  const currentPage = Number(searchParams.page) || 1;

  // product show by category

  const productData = await geProductsByCategory(params.pcategory, currentPage, pageSize);
  //const productData = await cachedGetingleProductCategory(params.pcategory, currentPage, pageSize);

  const PageCount = productData.meta.pagination.pageCount;
  const totalPage = productData.meta.pagination.total;

  const content = productData?.data[0]?.product_categories.data[0]?.description;
  const middleTitle = productData?.data[0]?.product_categories.data[0]?.middleTitle;
  const middleDescrption = productData?.data[0]?.product_categories.data[0]?.middleDescription;
  const readmoreTab = productData?.data[0]?.product_categories.data[0]?.readMoreTab;
  const faqs = productData?.data[0]?.product_categories.data[0]?.faq;




  //  console.log("-----------------------products --------------------------------------------------");
  // console.dir(productData, { depth:null}); 
  // console.log("---------------------------End--------p category---------------end-----------------------");
  //  console.log(productData.data);
  // if(productData.data.length === 0)  return  <NotFound />



  return (
    <div className=" z-10">

      <SEOSchema schemaList={productData.data[0]?.seo?.schema} />

      {/* title={productData?.data[0]?.product_categories.data[0]?.title}  */}
      <TopBanner banner="/images/product-banner.jpg" title={productData?.data[0]?.product_categories.data[0]?.title} />

      <div className="w-full h-10 "></div>
      <PaddingContainer>

        <div className="text-black font-normal text-sm  pb-10 rich-text">
          <BodyDataParse content={content} />
        </div>
        <div className="w-full h-auto flex flex-col md:flex-row  ">
          {/*  Left Menu Column  */}
          <div className="w-full md:w-3/12 lg:w-[22%] p-6 md:pl-0  overflow-hidden ">
            {/* <!-- Menu content goes here   */}
            <ProductCategoryMenu />
          </div>

          {/*  Content Area   */}
          <div className=" w-full md:w-9/12 lg:w-[78%]  flex flex-col   p-3 md:p-4 pb-3 ">
            {/*   Content area content goes here  */}
            <SearchBar dataType="products" />


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 mt-3   ">

              {productData.data.map((product) => (
                <div key={product.id} className=" pt-0 mt-10 relative text-center flex flex-col  justify-center">

                  <div className="w-full flex justify-center  ">
                    <a href={`/product/${product.slug}/`} > <Image className="relative w-28 text-center" src={getImageUrl(product?.productImage.url)} priority height={400} width={400} alt={product.title} /> </a>
                  </div>
                  <div className="flex flex-col w-full h-full " >
                    <h2 className="uppercase text-base text-gray-700 mt-3 font-light "> <a href={`/product/${product.slug}/`} >
                      {product.title}</a> </h2>

                  </div>


                </div>

              ))}

            </div>
            <Suspense fallback={<div>Loading...</div>}>
              <PaginationComponent pageCount={PageCount} totalPage={totalPage} pageSize={pageSize} />
            </Suspense>
          </div>


        </div>


        <div className="flex flex-col w-full h-auto text-center my-20 2xl:px-[18%]">
          {middleTitle && <h2> {middleTitle} </h2>}
          {middleDescrption && <div className="text-black font-normal text-sm  pb-10 rich-text">
            <BodyDataParse content={middleDescrption} />
          </div>}

          {readmoreTab && <SingleTab heading="Read More" text={readmoreTab} />}

          {faqs && faqs.length > 0 && <SingleTab faqList={faqs} />}

        </div>



      </PaddingContainer>


      <CTAcard />

      <BlogContainer />


    </div>


  )
}

export default ProductCategory
