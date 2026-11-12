import BodyDataParse from "../../components/elements/data-parse-content";
import GroupProducts from "../../components/layout/group-products";
import PaddingContainer from "../../components/layout/padding-container";
import { getAllProductsSlug, getSingleProduct } from "../../data/loader";
import { getFirstDescriptionText, getImageUrl } from "../../../../libs/helper";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import Image from "next/image";
import { notFound } from "next/navigation";
import { cache } from 'react';
import { buildBreadcrumbList, buildFaqPage, buildImageObject, buildProduct, pageUrl } from "@/libs/schema/entity";
import { strapiProductRatings } from "@/libs/schema/strapi";
import SEOSchema from "../../components/elements/seo-schema";
import Breadcrumbs from "../../components/elements/breadcrumbs";
import { getDictionary } from "@/libs/getDictionary";
import { i18n } from "@/i18n.config";
import { MdCheck, MdFileDownload, MdOutlineDescription, MdOutlineInventory2 } from "react-icons/md";
import ProductInquiry from "../../components/elements/product-inquiry";
import ProductQuoteBanner from "../../components/elements/product-quote-banner";
import ProductSupportCard from "../../components/elements/product-support-card";




// Cache the getSingleProduct function
const cachedgetSingleProduct = cache(getSingleProduct);





// Called once per language from the [lang] layout.
export async function generateStaticParams({ params: parentParams }) {

  try {
    const locales = parentParams?.lang ? [parentParams.lang] : i18n.locales;
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
  const category = productData.data[0].product_categories[0]?.title ? productData.data[0].product_categories[0]?.title : dictionary.navigation.productCategory;
  const categorySlug = productData.data[0].product_categories[0].slug ? productData.data[0].product_categories[0].slug : "#";
  // Only entries with both a question and an answer
  const faqs = (Array.isArray(productData.data[0].faq) ? productData.data[0].faq : []).filter(
    (item) => String(item?.question ?? "").trim() && String(item?.answer ?? "").trim()
  );







  const product = productData.data[0];
  const hasShortDescription = Array.isArray(product.shortDescription) && product.shortDescription.length > 0;
  const hasContent = Array.isArray(content) && content.length > 0;
  const applications = String(product.application ?? "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const packing = String(product.tdsPacking ?? "").trim();
  const documents = [
    { file: product.TDSFile, label: dictionary.productPage.tds },
    { file: product.MSDSFile, label: dictionary.productPage.msds },
  ].filter(({ file }) => file?.url);

  const breadcrumbsData = [
    { title: dictionary.navigation.home, url: `/${lang}/` },
    { title: `${category}`, url: `/${lang}/product-category/${categorySlug}/` },
    { title: `${productData.data[0]?.title}` }
  ];



  /*
    Product (price range from siteConfig, reviews only when Strapi has them),
    breadcrumb, image and FAQ. Strapi seo.schema is used only for types missing here
    or failing validation.
  */
  const productImageUrl = getImageUrl(product.productImage?.url);

  const schemaNodes = [
    buildProduct({
      product,
      lang,
      description: seoDescription,
      images: [productImageUrl, getImageUrl(product.productImage?.formats?.thumbnail?.url)],
      categoryTitle: category,
      strapiRatings: strapiProductRatings(product.seo?.schema),
    }),
    buildBreadcrumbList([
      { name: dictionary.navigation.home, url: pageUrl(lang) },
      { name: category, url: pageUrl(lang, "product-category", categorySlug) },
      { name: product.title },
    ]),
    buildImageObject({
      url: productImageUrl,
      creditText: dictionary.imageObject?.creditText,
      copyrightNotice: dictionary.imageObject?.copyrightNoticeProduct,
    }),
    buildFaqPage(faqs),
  ];

  return (
    <div className=" z-10 relative">

      <SEOSchema schemaList={product.seo?.schema} nodes={schemaNodes} />

      <div className="w-full h-12 bg-textLightBlue"></div>



      <PaddingContainer>

        <Breadcrumbs breadcrumbs={breadcrumbsData} />

        {/* Hero: image, category, title, short description, quote / sample buttons */}
        <div className="grid grid-cols-1 md:grid-cols-[30fr_70fr] gap-8 lg:gap-12 items-start mt-6">
          <div className="w-full rounded-md bg-[#EAF5FC] flex justify-center items-center p-5 md:p-6 aspect-square max-w-[300px] md:max-w-none">
            {product.productImage?.url && (
              <Image
                priority
                className="w-full h-full object-contain"
                src={getImageUrl(product.productImage.url)}
                height={1000}
                width={1000}
                quality={100}
                alt={product.productImage.alternativeText || product.title || "Product"}
              />
            )}
          </div>

          <div className="flex flex-col text-[#172B4D]">
            <div className="text-sm md:text-base font-bold uppercase tracking-wide text-textBlue border-s-4 border-textBlue ps-2">
              {category}
            </div>
            <h1 className="mt-3 font-bold text-[clamp(22px,2.2vw,32px)] text-[#082653] leading-[1.15]">{product.title}</h1>

            {hasShortDescription && (
              <div className="mt-4 font-light text-[17px] md:text-lg leading-relaxed rich-text">
                <BodyDataParse content={product.shortDescription} />
              </div>
            )}

            {/* Get a Quote / Request a Product Sample: popup forms with this product pre-selected */}
            <ProductInquiry
              locale={lang}
              dictionary={dictionary.inquiry}
              product={{ slug: product.slug, title: product.title }}
            />
          </div>
        </div>

        {/* Main content + sidebar. Mobile order: documents, main content, support card */}
        <div className="grid grid-cols-1 lg:grid-cols-[62fr_38fr] lg:grid-rows-[auto_1fr] gap-8 lg:gap-x-10 mt-12 items-start">
          <div className="order-2 lg:order-none lg:row-span-2 flex flex-col gap-10 min-w-0">
            {hasContent && (
              <section className="font-light text-[#172B4D] text-base leading-relaxed rich-text">
                <h2 className="text-2xl font-semibold pb-3 text-[#082653]">{dictionary.productPage.overview}</h2>
                <BodyDataParse content={content} />
              </section>
            )}

            {applications.length > 0 && (
              <section>
                <h2 className="text-2xl font-semibold pb-3 text-[#082653]">{dictionary.productPage.whereToUse}</h2>
                <ul className="flex flex-col gap-2">
                  {applications.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-base text-[#172B4D] font-light">
                      <MdCheck aria-hidden="true" className="mt-0.5 shrink-0 rounded-full bg-[#EAF5FC] p-0.5 text-2xl text-textBlue" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

                {/* Dosage Table section */}

                {Array.isArray(productData?.data?.[0]?.Dosage) &&
                  productData.data[0].Dosage.length > 0 && (
                    <div className="font-light text-[var(--primary)] text-base mt-5 w-full ">
                      <div className="mt-4">
                        <div className="text-2xl font-semibold pb-3 text-[#082653]">
                          {dictionary.productPage.dosage}
                        </div>

                        {(() => {
                          const rows = productData.data[0].Dosage || [];

                          const columns = [
                            {
                              key: "performance",
                              label: "Performance Level",
                            },
                            {
                              key: "Sae",
                              label: "Viscosity Grade",
                            },
                            {
                              key: "dosage",
                              label: "Dosage (m%)",
                            },
                          ];

                          const hasValue = (value) => {
                            return (
                              value !== null &&
                              value !== undefined &&
                              String(value).trim() !== ""
                            );
                          };

                          // Keep only columns where at least one row has value
                          const visibleColumns = columns.filter((col) =>
                            rows.some((row) => hasValue(row?.[col.key]))
                          );

                          // If all columns are empty, do not render table
                          if (visibleColumns.length === 0) return null;

                          return (
                            <table className="w-full text-left border-collapse border-black rtl:text-right">
                              <thead>
                                <tr className="bg-[var(--primary)] text-white">
                                  {visibleColumns.map((col) => (
                                    <th
                                      key={col.key}
                                      className="p-2 font-normal border capitalize"
                                    >
                                      {col.label}
                                    </th>
                                  ))}
                                </tr>
                              </thead>

                              <tbody>
                                {rows.map((row, rIdx) => (
                                  <tr
                                    key={rIdx}
                                    className={rIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                                  >
                                    {visibleColumns.map((col) => (
                                      <td key={col.key} className="p-2 border text-black">
                                        {hasValue(row?.[col.key]) ? row[col.key] : ""}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                {/* End Dosage Table section */}

            {/* Table of product  */}
            {Array.isArray(productData?.data?.[0]?.table) &&
              productData.data[0].table.length > 0 && (
                <div className="font-light text-gray-800 text-base mt-5 w-full ">
                  <div className="mt-4">
                    <div className="text-2xl font-semibold pb-3 text-[#082653]">
                      {dictionary.productPage.keyProperties}
                    </div>

                    {(() => {
                      const rows = productData.data[0].table;

                      // Turn a Strapi row into an array of up to 7 cells in order
                      const toCells = (r = {}) => [
                        r?.property ?? "",
                        r?.method ?? "",
                        r?.value ?? "",

                      ];

                      // Trim trailing empty cells ("" / null / undefined)
                      const trimTrailing = (arr) => {
                        let end = arr.length - 1;
                        while (
                          end >= 0 &&
                          (arr[end] === null ||
                            arr[end] === undefined ||
                            String(arr[end]).trim() === "")
                        ) {
                          end--;
                        }
                        return arr.slice(0, end + 1);
                      };

                      // Header from first row
                      const headerAll = toCells(rows[0]);
                      const header = trimTrailing(headerAll);
                      const colCount = Math.min(7, header.length || 0);

                      // If first row is completely empty, don't render table
                      if (colCount === 0) return null;

                      const body = rows.slice(1);

                      return (
                        <div className="overflow-x-auto"><table className="w-full text-left border-collapse rtl:text-right text-sm">
                          <thead>
                            <tr className="bg-textBlue">
                              {header.map((h, i) => (
                                <th key={i} className="p-3 font-semibold border border-textBlue text-start text-white">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>

                          <tbody>
                            {body.map((row, rIdx) => {
                              const cells = toCells(row).slice(0, colCount);
                              // pad to match header length
                              while (cells.length < colCount) cells.push("");

                              return (
                                <tr
                                  key={rIdx}
                                  className={rIdx % 2 === 0 ? "bg-white" : "bg-[#F5F8FC]"}
                                >
                                  {cells.map((c, cIdx) => (
                                    <td key={cIdx} className="p-3 border border-[#CFDCE8] text-[#172B4D]">
                                      {c}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table></div>
                      );
                    })()}
                  </div>
                </div>
              )}
            {/* End Table of product */}
          </div>

          {documents.length > 0 && (
            <div className="order-1 lg:order-none rounded-md bg-[#EAF5FC] p-5 md:p-6">
              <div className="flex items-center gap-3">
                <MdOutlineDescription aria-hidden="true" className="text-3xl shrink-0 text-textBlue" />
                <h2 className="text-xl font-semibold text-[#082653]">{dictionary.productPage.documents}</h2>
              </div>
              <ul className="mt-4 flex flex-col gap-3">
                {documents.map(({ file, label }) => (
                  <li key={label}>
                    <a
                      href={`${process.env.NEXT_PUBLIC_ADMIN_BASE_URL}${file.url}`}
                      target="_blank"
                      rel="nofollow"
                      download
                      aria-label={`${label} PDF - ${dictionary.productPage.download}`}
                      className="flex items-center gap-3 min-h-[48px] bg-white border border-[#CFDCE8] rounded-md px-3 py-2 text-sm font-semibold text-[#082653] hover:bg-white/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-textBlue transition-colors"
                    >
                      <span aria-hidden="true" className="shrink-0 rounded-sm border border-red-400 px-1 text-[10px] font-bold text-red-500">PDF</span>
                      <span className="flex-1 min-w-0">{label}</span>
                      <span className="flex items-center gap-1 shrink-0 text-textBlue font-medium">
                        <MdFileDownload aria-hidden="true" className="text-xl" />
                        {dictionary.productPage.download}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="order-3 lg:order-none">
            <ProductSupportCard
              locale={lang}
              dictionary={dictionary.inquiry}
              product={{ slug: product.slug, title: product.title }}
              title={dictionary.productPage.supportTitle}
              buttonLabel={dictionary.productPage.supportButton}
              text={dictionary.productPage.supportText.replace("{product}", product.title)}
            />
          </div>
        </div>

        {packing && (
          <section className="mt-14 -mx-4 md:-mx-6 lg:-mx-16 2xl:-mx-60 bg-[#EAF5FC] px-4 md:px-6 lg:px-16 2xl:px-60 py-10">
            <h2 className="text-2xl font-semibold pb-4 text-[#082653]">{dictionary.productPage.packagingStorage}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-md p-5 md:p-6 flex gap-4">
                <MdOutlineInventory2 aria-hidden="true" className="text-4xl shrink-0 text-textBlue" />
                <div>
                  <h3 className="text-xl font-semibold text-[#082653]">{dictionary.productPage.packaging}</h3>
                  <p className="mt-1 text-base font-light text-[#172B4D] whitespace-pre-line">{packing}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-semibold pb-4 text-[#082653]">{dictionary.productPage.faqTitle}</h2>
            <div className="flex flex-col gap-3">
              {faqs.map((item, idx) => (
                <div key={item.id ?? idx} className="rounded-md border border-[#CFDCE8] bg-white p-4 md:p-5">
                  <h3 className="text-lg font-bold text-[#082653]">{item.question}</h3>
                  <p className="mt-1 text-base font-light text-[#172B4D] whitespace-pre-line">{item.answer}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related Product section */}
        <div className="w-full flex flex-col justify-center items-center text-gray-300 mt-5">
          <GroupProducts productGroup={productGroup} locale={lang} />
        </div>
      </PaddingContainer >
      <ProductQuoteBanner
        locale={lang}
        dictionary={dictionary.inquiry}
        product={{ slug: product.slug, title: product.title }}
        title={dictionary.productPage.bannerTitle}
        text={dictionary.productPage.bannerText}
      />

    </div >
  );
};

export default SingleProductPage;
