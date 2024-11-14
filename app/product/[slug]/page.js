import BodyDataParse from "@/app/components/elements/data-parse-content";
import GroupProducts from "@/app/components/layout/group-products";
import PaddingContainer from "@/app/components/layout/padding-container";
import ProductCategoryMenu from "@/app/components/layout/product-category-menu";
import { geAllProductsSlug, geSingleProduct } from "@/app/data/loader";
import { getFirstDescriptionText, getImageUrl } from "@/libs/helper";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import Image from "next/image";

import { cache } from 'react';
import siteConfig from "@/config/site";
import SEOSchema from "@/app/components/elements/seo-schema";


// Cache the geSingleProduct function
const cachedGeSingleProduct = cache(geSingleProduct);


export const generateStaticParams = async () => {
  try {
    const productSlugs = await geAllProductsSlug();

    const paramsSlugs = productSlugs?.data?.map((product) => {
      return {
        slug: product.slug
      };
    });

    return paramsSlugs || [];
  } catch (error) {
    console.log(error);
    throw new Error("Error Fetching generateStaticParams");
  }
}





export async function generateMetadata({ params }) {
  const productData = await geSingleProduct(params.slug);

  const metadataParams = {
    pageTitle: productData.data[0]?.title,
    pageSlug: productData.data[0]?.slug,
    pageDescription: getFirstDescriptionText(productData.data[0].description),
    seoTitle: productData.data[0].seo?.seoTitle,
    seoDescription: productData.data[0].seo?.seoDescription,
    rebotStatus: productData.data[0].seo?.preventIndexing,
    canonicalLinks: productData.data[0].seo?.canonicalLinks,
    dataPublishedTime: productData.data[0].publishedAt,
    category: productData.data[0].product_categories?.data[0]?.title,
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + productData.data[0].productImage.url,
    imageAlternativeText: productData.data[0].productImage?.alternativeText,
    imageExt: productData.data[0].productImage?.mime,
  };

  return await generatePageMetadata({ type: "product", path: "/product/", params: metadataParams });
}




const SingleProductPage = async ({ params }) => {
  const productData = await cachedGeSingleProduct(params.slug);



  //  console.log("-----------------single product data --------------");
  //    console.dir(productData, { depth:null});
  //  console.log("-----------------End------------");

  const content = productData.data[0].description;
  const productGroup = productData.data[0].related_products;
  const firstDescriptionText = getFirstDescriptionText(productData.data[0].description);
  const seoDescription = productData.data[0].seo?.seoDescription ? productData.data[0].seo?.seoDescription : firstDescriptionText;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  const category = productData.data[0].product_categories?.data[0]?.title ? productData.data[0].product_categories.data[0]?.title : "product Category";
  const categorySlug = productData.data[0].product_categories?.data[0]?.slug ? productData.data[0].product_categories.data[0]?.slug : "#";

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
      "name": "Chempol Additives & Chemical Speciality"
    },
    "sku": productData.data[0].productSchema?.sku,
    "gtin8": productData.data[0].productSchema?.gtin8,
    "mpn": productData.data[0].productSchema?.mpn,
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": averageRating,   // average rating value
      "reviewCount": productData.data[0].productSchema?.offerCount,     // total reviews
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
        "name": "Chempol Additives & Chemical Speciality"
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
        <div className="w-full h-auto flex flex-col md:flex-row topPadding">
          {/* Left Menu Column */}
          <div className="w-full md:w-3/12 lg:w-[22%]   p-6 md:pl-0 overflow-hidden">
            {/* Menu content goes here  */}
            <ProductCategoryMenu />
          </div>

          {/* Content Area */}
          <div className="w-full md:w-9/12 justify-between lg:w-[78%]  flex flex-col  pb-3">
            {/* Content area content goes here */}
            <div className="flex flex-col md:flex-row w-full h-auto p-0 lg:p-8">

              {/* image section */}
              <div className="w-full md:w-2/6 items-center ">
                <div className="w-full flex flex-col justify-center     items-center text-center">
                  <Image
                    priority
                    className="relative w-full h-auto text-center"
                    src={getImageUrl(productData.data[0].productImage.url)}
                    height={1000}
                    width={1000}
                    alt={productData.data[0]?.title}
                  />

                </div>
              </div>


              {/* text section */}
              <div className="w-full md:w-4/6 flex flex-col text-gray-800">
                <div className="capitalize font-semibold text-2xl  ">
                  {productData.data[0].title}
                </div>


                <div className="font-light text-gray-800 text-base mt-5 max-w-xl pr-5 md:pr-2 rich-text">
                  <div className="font-normal py-2">Application</div>
                  {productData.data[0].application}
                </div>


                <div>
                  {/* Check if either MSDSFile or TDSFile exists */}

                  <div className=" flex flex-col w-full h-auto space-y-2 mt-5 pr-0 md:pr-5 lg:pr-16 ">

                    {/* Check if TDSFile exists */}
                    {productData.data[0].TDSFile?.url && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${productData.data[0].TDSFile.url}`}
                        target="_blank"
                        className="w-1/2"
                        download
                      >
                        <div className="py-3 bg-white text-black border-[3px] px-4 border-textLightBlue flex  items-center  font-light text-left">
                          <div>Technical Data Sheet (TDS)
                            <span className="text-gray-500 pl-3">PDF</span></div>

                        </div>
                      </a>
                    )}

                    {/* Check if MSDSFile exists */}
                    {productData.data[0].MSDSFile?.url && (
                      <a
                        href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${productData.data[0].MSDSFile.url}`}
                        target="_blank"
                        className="w-1/2"
                        download
                      >
                        <div className="py-3  bg-white text-black border-[3px] px-4 border-textLightBlue flex  items-center  font-light text-left">
                          <div>Material Safety Data Sheet <span className="text-gray-500 pl-3">PDF</span></div>

                        </div>
                      </a>
                    )}
                  </div>
                </div>

              </div>

            </div>

            <div className="font-light text-gray-800 text-base mt-5  w-full   pr-5 md:pr-2 rich-text">
              <div className="font-normal py-2">Description</div>
              <BodyDataParse content={content} />
            </div>

            {/* Related Product section */}
            <div className="w-full flex flex-col justify-center items-center text-gray-300 mt-5  ">
              <GroupProducts productGroup={productGroup} />
            </div>
          </div>
        </div>
      </PaddingContainer>
    </div>
  );
};

export default SingleProductPage;
