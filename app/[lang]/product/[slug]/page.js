export const dynamic = 'force-dynamic';

import BodyDataParse from "../../components/elements/data-parse-content";
import GroupProducts from "../../components/layout/group-products";
import PaddingContainer from "../../components/layout/padding-container";
import { geAllProductsSlug, getAllProductsSlug, getSingleProduct } from "../../data/loader";
import { getBaseUrl, getFirstDescriptionText, getImageUrl } from "../../../../libs/helper";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from 'react';
import siteConfig from "@/config/site";
import SEOSchema from "../../components/elements/seo-schema";
import ProductCategoryMenuWrapper from "../../components/layout/ProductCategoryMenuWrapper";
import Breadcrumbs from "../../components/elements/breadcrumbs";
import { getDictionary } from "@/libs/getDictionary";
import { i18n } from "@/i18n.config";
import FAQs from "../../components/layout/Faqs";




// Cache the getSingleProduct function
const cachedgetSingleProduct = cache(getSingleProduct);





export async function generateStaticParams() {

  try {
    const locales = i18n.locales;   // ["en","ar","es"]
    const params = [];

    for (const locale of locales) {
      // console.log(`→ fetching slugs for locale="${locale}"`);
      const response = await getAllProductsSlug(locale);
      const products = response.data || [];

      // console.log("product list", products);
      //  console.log(`   ↳ got ${products.length} products for ${locale}`);

      for (const product of products) {
        params.push({ lang: locale, slug: product.slug });
      }
    }

    //console.log(`✅ generateStaticParams done, total pages: ${params.length}`);
    return params;
  } catch (err) {
    console.error("❌ Error in generateStaticParams:", err);
    return [];
  }
}


export async function generateMetadata(props) {
  //const params = await props.params;
  //const locale = params?.lang || 'en';

  const params = await Promise.resolve(props.params);
  const locale = params?.lang || 'en';
  const slug = params?.slug;


  const productData = await getSingleProduct(locale, slug);

  if (!productData || !productData.data[0]) {
    notFound();
  }


  const metadataParams = {
    pageTitle: productData.data[0]?.title,
    pageSlug: productData.data[0]?.slug,
    pageDescription: getFirstDescriptionText(productData.data[0].description),
    seoTitle: productData.data[0].seo?.seoTitle,
    seoDescription: productData.data[0].seo?.seoDesctiption,
    rebotStatus: productData.data[0].seo?.preventIndexing,
    canonicalLinks: productData.data[0].seo?.canonicalLinks,
    dataPublishedTime: productData.data[0].publishedAt,
    category: productData.data[0].product_categories[0]?.title,
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + productData.data[0].productImage.url,
    imageAlternativeText: productData.data[0].productImage?.alternativeText,
    imageExt: productData.data[0].productImage?.mime,
  };


  const metaData = await generatePageMetadata({ type: "product", path: "/product/", params: metadataParams, lang: locale, });



  return metaData
}




const SingleProductPage = async (props) => {

  // const { lang, slug } = params;
  //const params = await props.params;
  //const { lang } = await params || {};
  const params = await Promise.resolve(props.params); // ✅ Safe async resolve
  const { lang, slug } = params;
  //console.log("********************SingleProductPage locale: ", lang);
  // console.log("-----------------single product data --------------");


  const dictionary = await getDictionary(lang);
  const productData = await cachedgetSingleProduct(lang, slug);

  // console.log(productData.data[0].related_products);
  // console.dir(productData.data, { depth: null });
  //console.dir(productData.data[0].product_categories, { depth: null });

  //console.log("-----------------End------------");


  if (!productData || !productData.data[0] || !productData.data[0].product_categories[0]) {
    notFound();
  }



  const content = productData.data[0].description;
  const productGroup = productData.data[0].related_products;
  const firstDescriptionText = getFirstDescriptionText(productData.data[0].description);
  const seoDescription = productData.data[0].seo?.seoDesctiption ? productData.data[0].seo?.seoDesctiption : firstDescriptionText;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const category = productData.data[0].product_categories[0]?.title ? productData.data[0].product_categories[0]?.title : dictionary.navigation.productCategory;
  const categorySlug = productData.data[0].product_categories[0].slug ? productData.data[0].product_categories[0].slug : "#";
  const faqs = productData.data[0].faq ? productData.data[0].faq : [];







  const breadcrumbsData = [
    { title: dictionary.navigation.home, url: "/" },
    { title: `${category}`, url: `${getBaseUrl()}/${lang}/product-category/${categorySlug}` },
    { title: `${productData.data[0]?.title}` }
  ];



  let ratingCounter = 0;

  const reviews = productData.data[0]?.productSchema?.reviews?.map(review => {
    ratingCounter += review.bestRating;
    return {
      "@type": "Review",
      "name": review?.title,
      "reviewBody": review.reviewBody,
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": review.bestRating,
        "bestRating": "5",
        "worstRating": "1"
      },
      "datePublished": review.datePublished,
      "author": {
        "@type": "Person",
        "name": review.author
      },
      "publisher": {
        "@type": "Organization",
        "name": "Chempol"
      }
    };
  });

  const averageRating = (ratingCounter / productData.data[0].productSchema?.reviews?.length || 0) || 4.8;

  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": productData.data[0]?.title,
    "image": getImageUrl(productData.data[0].productImage.url),
    "image": [
      getImageUrl(productData.data[0].productImage?.url),  // large
      getImageUrl(productData.data[0].productImage?.formats?.thumbnail?.url),  // medium
    ],
    "description": seoDescription,
    "brand": {
      "@type": "Brand",
      "name": dictionary.imageObject.creditText    //"creditText": "Chempol Additives & Chemical Speciality",
    },
    "sku": productData.data[0].productSchema?.sku,
    "gtin8": productData.data[0].productSchema?.gtin8,
    "mpn": productData.data[0].productSchema?.mpn,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,   // average rating value
      "reviewCount": productData.data[0].productSchema?.reviews?.length || 1,   // total reviews  set 1 if null, undefine or 0 
      "bestRating": "5",
      "worstRating": "2",
    },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "AED",
      "price": "25",
      "lowPrice": "1",
      "highPrice": "500",
      "priceValidUntil": "10-10-2040",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "http://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": dictionary.imageObject.creditText  //"creditText": "Chempol Additives & Chemical Speciality",
      }
    },
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "AE",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 15,
      "returnMethod": "https://schema.org/ReturnByMail",
      "returnFees": "https://schema.org/FreeReturn"
    },
    "review": reviews,
  };

  // BreadcrumbList
  const jsonLd2 = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": baseUrl,
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": category,
      "item": baseUrl + '/' + categorySlug
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": productData.data[0]?.title,
    }]
  };

  // image schema for seo
  const jsonLd3 = {
    "@context": "https://schema.org/",
    "@type": "ImageObject",
    "contentUrl": getImageUrl(productData.data[0].productImage.url),
    "license": siteConfig.imageObject.license,
    "acquireLicensePage": siteConfig.imageObject.acquireLicensePage,
    "creditText": siteConfig.imageObject.creditText,
    "creator": {
      "@type": "Organization",
      "name": siteConfig.imageObject.creatorName,
    },
    "copyrightNotice": siteConfig.imageObject.copyrightNoticeProduct
  };




  return (
    <div className=" z-10 relative">

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd2) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd3) }} />

      <SEOSchema schemaList={productData.data[0].seo?.schema} />

      <div className="w-full h-12 bg-textLightBlue"></div>



      <PaddingContainer>

        <Breadcrumbs breadcrumbs={breadcrumbsData} />

        <div className="w-full h-auto flex flex-col md:flex-row topPadding">
          {/* Left Menu Column */}
          <div className="w-full md:w-3/12 lg:w-[22%]   p-6 md:pl-0 overflow-hidden">
            {/* Menu content goes here  */}
            <ProductCategoryMenuWrapper locale={lang} dictionary={dictionary} />
          </div>

          {/* Content Area */}
          <div className="w-full md:w-9/12 justify-between lg:w-[78%]  flex flex-col  pb-3     ">
            {/* Content area content goes here */}
            <div className="flex flex-col md:flex-row w-full h-auto p-0 lg:p-8">

              {/* title just for mobile */}
              <h1 className="capitalize font-semibold text-2xl pb-5 md:hidden ">
                {productData.data[0].title}
              </h1>



              {/* image section */}
              <div className="w-full md:w-2/6 items-center  ">
                <div className="w-full flex flex-col justify-center  items-center text-center">
                  {productData?.data?.[0]?.productImage?.url && (
                    <Image
                      priority
                      className="relative w-[100%] h-auto text-center"
                      src={getImageUrl(productData.data[0].productImage.url)}
                      height={1000}
                      width={1000}
                      quality={100}
                      alt={productData?.data?.[0]?.title || "Product"}
                    />
                  )}


                </div>
              </div>


              {/* text section */}
              <div className="w-full md:w-4/6 flex flex-col text-gray-800 ">
                <h1 className="capitalize font-semibold text-2xl hidden md:block  ">
                  {productData.data[0].title}
                </h1>


                <div className="font-light text-black text-base mt-5 max-w-xl pr-5 md:pr-2 rich-text">
                  <div className="text-xl font-semibold py-2 hidden">{dictionary.productPage.application}</div>
                  {productData.data[0].application}
                </div>


                <div>
                  {/* Check if either MSDSFile or TDSFile exists */}

                  <div className=" flex flex-col w-full h-auto space-y-2 mt-5 pr-0 md:pr-5 lg:pr-16   ">

                    {/* Check if TDSFile exists */}
                    {productData.data[0].TDSFile?.url && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${productData.data[0].TDSFile.url}`}
                        target="_blank"
                        rel="nofollow"
                        className=" w-full md:w-3/4 2xl:w-3/6"
                        download
                      >
                        <div className="py-3 bg-white text-black border-[3px] px-4 border-textLightBlue flex  items-center  font-light text-left">
                          <div>{dictionary.productPage.tds}
                            <span className="text-gray-500 pl-3 rtl:pr-3">PDF</span></div>

                        </div>
                      </a>
                    )}

                    {/* Check if MSDSFile exists */}
                    {productData.data[0].MSDSFile?.url && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${productData.data[0].MSDSFile.url}`}
                        target="_blank"
                        rel="nofollow"
                        className=" w-full md:w-3/4 2xl:w-3/6"
                        download
                      >
                        <div className="py-3  bg-white text-black border-[3px] px-4 border-textLightBlue flex  items-center  font-light text-left">
                          <div>{dictionary.productPage.msds} <span className="text-gray-500 pl-3 rtl:pr-3">PDF</span></div>

                        </div>
                      </a>
                    )}
                  </div>
                </div>

              </div>

            </div>

            <div className="font-light text-gray-800 text-base mt-5 md:pl-8 w-full lg:w-[90%]     pr-5 md:pr-2 rich-text">
              <div className="text-xl font-semibold py-2">{dictionary.productPage.description}</div>
              <BodyDataParse content={content} />
            </div>

            {/* table of product */}
            <div className="font-light text-gray-800 text-base mt-5 md:pl-8 w-full    md:pr-2 ">

              {productData.data[0].table && productData.data[0].table.length > 0 && (

                <div className=" mt-4 ">
                  <div className="text-xl font-semibold py-2">{dictionary.productPage.table}</div>
                  <table className="w-full lg:w-[80%] xl:w-[60%] 2xl:w-[60%] text-left border-collapse rtl:text-right " >
                    {/* Table Header */}
                    <thead>
                      <tr className="bg-[#F7F7F7]">
                        <th className="p-4 font-normal border">{dictionary.productPage.property}</th>
                        <th className="p-4 font-normal border">{dictionary.productPage.method}</th>
                        <th className="p-4 font-normal border">{dictionary.productPage.value}</th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {productData.data[0].table.map((row, index) => (
                        <tr
                          key={index}
                          className={`${index % 2 === 0 ? "bg-[#FDFDFD]" : "bg-[#F7F7F7]"}`}
                        >
                          <td className="p-4 border">{row.property}</td>
                          <td className="p-4 border">{row.method}</td>
                          <td className="p-4 border">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>


            {faqs && faqs.length > 0 && <div className="p-10"><FAQs faqList={faqs} heading={dictionary.navigation.faq} text="" page="product" />
            </div>}



            {/* Related Product section */}
            <div className="w-full flex flex-col justify-center items-center text-gray-300 mt-5  ">
              <GroupProducts productGroup={productGroup} />
            </div>
          </div>
        </div>
      </PaddingContainer >
    </div >
  );
};

export default SingleProductPage;
