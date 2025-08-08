import PaddingContainer from "../../components/layout/padding-container"

import SearchBar from "../../components/layout/search-bar";
import TopBanner from "../../components/layout/top-banner"
import Image from "next/image";
import { getProductCategory, getProductsByCategory } from "../../data/loader";

import { PaginationComponent } from "../../components/elements/pagination";

import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { getFirstDescriptionText, getImageUrl } from "@/libs/helper";
import { Suspense } from "react";
import SEOSchema from "../../components/elements/seo-schema";
import BodyDataParse from "../../components/elements/data-parse-content";

import SingleTab from "../../components/layout/SingleTab";
import CTAcard from "../../components/layout/cta-card";
import BlogContainer from "../../components/layout/blog-container";
import { cache } from 'react';
import ProductCategoryMenuWrapper from "../../components/layout/ProductCategoryMenuWrapper";
import { notFound } from "next/navigation";
import { getDictionary } from "@/libs/getDictionary";
import { cookies } from "next/headers";

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




const cachedGetProductCategory = cache(getProductCategory);


export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang || 'en';




  const categoryData = await cachedGetProductCategory(lang, params.pcategory);


  if (!categoryData || !categoryData.data[0]) {
    notFound();
  }

  const metadataParams = {
    pageTitle: categoryData.data[0].title,
    pageSlug: categoryData.data[0].slug,
    pageDescription: getFirstDescriptionText(categoryData.data[0].description),
    seoTitle: categoryData.data[0].seo?.seoTitle,
    seoDescription: categoryData.data[0].seo?.seoDesctiption,
    rebotStatus: categoryData.data[0].seo?.preventIndexing,
    canonicalLinks: categoryData.data[0].seo?.canonicalLinks,
    dataPublishedTime: categoryData.data[0].publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + categoryData.data[0].image?.url,
    imageAlternativeText: categoryData.data[0].image?.alternativeText,
    imageExt: categoryData.data[0].image?.mime,
  };

  const metaData = await generatePageMetadata({ type: "category", path: "/product-category/", params: metadataParams, lang: lang });

  // console.log("-------------------------Product Country--------------------------------");
  //console.log(metaData);

  return metaData;
}








const ProductCategory = async props => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { lang } = await params || {};
  const dictionary = await getDictionary(lang);




  const categoryData = await cachedGetProductCategory(lang, params.pcategory);  // use cache

  if (!categoryData || !categoryData.data[0]) {

    notFound();
  }

  const currentPage = Number(searchParams.page) || 1;
  // product show by category
  const productData = await getProductsByCategory(lang, params.pcategory, currentPage, pageSize);
  //const productData = await cachedGetingleProductCategory(params.pcategory, currentPage, pageSize);

  const PageCount = productData.meta.pagination.pageCount;
  const totalPage = productData.meta.pagination.total;

  const content = categoryData.data[0].description;
  const middleTitle = categoryData.data[0].middleTitle;

  const middleDescrption = categoryData.data[0].middleDescription;
  const readmoreTab = categoryData.data[0].readMoreTab;
  const faqs = categoryData.data[0].faq;


  /*  of product category or product in arabic is missing dont show this page just move to 404 page */
  /****issue is some time arabic category not lin with arabic product that issue  hand this issue with conditions and reoslve it ** */


  // console.log("-----------------------products category--------------------------------------------------");
  //  console.dir(productData, { depth: null });
  //console.log(productData);
  //console.log("---------------------------End--------p category---------------end-----------------------");
  // console.log(productData);
  // if(productData.data.length === 0)  return  <NotFound />



  return (
    <div className=" z-10">

      <SEOSchema schemaList={categoryData.data[0].seo?.schema} />

      {/* title={productData?.data[0]?.product_categories.data[0]?.title}  */}


      <TopBanner banner="/images/product-banner.jpg"
        title={productData?.data[0]?.product_categories[0]?.title}
        title2={categoryData.data[0]?.seo?.seoDesctiption ? categoryData.data[0]?.seo?.seoDesctiption : ""}
        dictionary={dictionary} />



      <div className="w-full h-0 md:h-10 "></div>
      <PaddingContainer>

        <div className="text-black font-normal text-sm  pb-10 rich-text">
          <BodyDataParse content={content} />
        </div>
        <div className="w-full h-auto flex flex-col md:flex-row     ">
          {/*  Left Menu Column  */}
          <div className="w-full md:w-3/12 lg:w-[22%] p-6 md:pl-0  overflow-hidden ">
            {/* <!-- Menu content goes here   */}
            <ProductCategoryMenuWrapper locale={lang} dictionary={dictionary} />

          </div>

          {/*  Content Area   */}
          <div className=" w-full md:w-9/12 lg:w-[78%]  flex flex-col   p-1 md:p-4 pb-3   ">
            {/*   Content area content goes here  */}
            <SearchBar locale={lang} dictionary={dictionary} dataType="products" />


            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-3 md:gap-4 mt-3   ">

              {productData.data.map((product) => (
                <div key={product.id} className=" pt-0 mt-10 relative text-center flex flex-col  justify-center">

                  <div className="w-full flex justify-center  ">
                    <a href={`/product/${product.slug}/`} > <Image className="relative w-28 text-center" src={getImageUrl(product?.productImage.url)} priority height={400} width={400} alt={product.title} /> </a>
                  </div>
                  <div className="flex flex-col w-full h-full " >
                    <h2 className="uppercase text-base text-gray-700 mt-3 font-light "> <a href={`/${lang}/product/${product.slug}/`} >
                      {product.title}</a> </h2>

                  </div>


                </div>

              ))}

            </div>
            <Suspense fallback={<div>Loading...</div>}>
              <PaginationComponent locale={lang} dictionary={dictionary} pageCount={PageCount} totalPage={totalPage} pageSize={pageSize} />
            </Suspense>
          </div>


        </div>


        <div className="flex flex-col w-full h-auto text-center my-20 2xl:px-[18%]">

          {middleTitle && <h1 className="text-lg"> {middleTitle} </h1>}
          {middleDescrption && <div className="text-black  pb-10 rich-text">
            <BodyDataParse content={middleDescrption} />
          </div>}

          {readmoreTab && <SingleTab heading={dictionary.navigation.readMore} text={readmoreTab} />}

          {faqs && faqs.length > 0 && <SingleTab heading={dictionary.navigation.faq} faqList={faqs} />}

        </div>

      </PaddingContainer>


      <CTAcard locale={lang} />

      <BlogContainer locale={lang} />


    </div>


  )
}

export default ProductCategory
