import BodyDataParse from "../../components/elements/data-parse-content";
import SEOSchema from "../../components/elements/seo-schema";
import BlogContainer from "../../components/layout/blog-container";
import PaddingContainer from "../../components/layout/padding-container";
import { geSinglePost, getAllPostSlug } from "../../data/loader";
import siteConfig from "@/config/site";
import { getBaseUrl, getFirstDescriptionText, getImageUrl, validateCanonicalSlug } from "@/libs/helper";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import Image from "next/image";
import { cache } from 'react';
import { notFound } from "next/navigation";
import Breadcrumbs from "../../components/elements/breadcrumbs";
import { getDictionary } from "@/libs/getDictionary";
import { i18n } from "@/i18n.config";
import { cookies } from "next/headers";
import FAQs from "../../components/layout/Faqs";
import SingleTab from "../../components/layout/SingleTab";

// Cache the geSinglePost function
const cachedGeSinglePost = cache(geSinglePost);

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang || 'en';
  const postData = await cachedGeSinglePost(lang, params.slug);



  if (!postData || !postData.data[0]) {
    notFound();

  }

  const metadataParams = {
    pageTitle: postData.data[0].title,
    pageSlug: postData.data[0].slug,
    seoDescription: getFirstDescriptionText(postData.data[0].description),
    seoTitle: postData.data[0].seo?.seoTitle,
    seoDescription: postData.data[0]?.seo?.seoDesctiption ?? "",
    rebotStatus: postData.data[0].seo?.preventIndexing,
    canonicalLinks: postData.data[0].seo?.canonicalLinks,
    dataPublishedTime: postData.data[0].publishedAt,
    category: postData.data[0]?.post_categories[0]?.title,
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + postData.data[0].featureImage.url,
    imageAlternativeText: postData.data[0].featureImage?.alternativeText,
    imageExt: postData.data[0].featureImage?.mime,
  };


  const metaData = await generatePageMetadata({ type: "blog", path: "/blog/", params: metadataParams, lang: lang });


  return metaData;
}


// app/[lang]/blog/[slug]/page.js

export async function generateStaticParams() {

  try {
    const locales = i18n.locales;   // ["en","ar","es"]
    const params = [];

    for (const locale of locales) {
      //console.log(`→ fetching slugs for locale="${locale}"`);
      const response = await getAllPostSlug(locale);
      const posts = response.data || [];
      // console.log(`   ↳ got ${posts.length} posts for ${locale}`);

      for (const post of posts) {
        params.push({ lang: locale, slug: post.slug });
      }
    }

    // console.log(`✅ generateStaticParams done, total pages: ${params.length}`);
    return params;
  } catch (err) {
    console.error("❌ Error in generateStaticParams:", err);
    return [];
  }
}


const SingleBlogPage = async props => {
  const params = await props.params;
  const { lang } = await params || {};
  const dictionary = await getDictionary(lang);



  const postData = await cachedGeSinglePost(lang, params.slug);
  const faq = postData.data[0]?.faq ? postData.data[0]?.faq : [];



  if (!postData || !postData.data[0]) {
    notFound();
  }



  const breadcrumbsData = [
    { title: dictionary.navigation.home, url: "/" },
    { title: dictionary.navigation.blog, url: `${getBaseUrl()}/${lang}/blog` },
    { title: `${postData.data[0]?.title}` }
  ];

  /*
    console.log("-----------------------single post page--------------------------------------------------");
    console.dir(postData, { depth: null });
    console.log("---------------------------End-----single post------------------end-----------------------");
  */
  const firstDescriptionText = getFirstDescriptionText(postData.data[0].description);
  const seoDesctiption = postData.data[0]?.seo?.seoDesctiption?.trim() ? postData.data[0]?.seo?.seoDesctiption?.trim() : firstDescriptionText;

  const jsonLd =
  {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": postData.data[0].title,
    "description": seoDesctiption,
    "image": [
      getImageUrl(postData.data[0].featureImage?.formats.thumbnail.url),
      getImageUrl(postData.data[0].featureImage?.url)
    ],
    "datePublished": postData.data[0].publishedAt,
    "dateModified": postData.data[0].updatedAt,
    "author": [{
      "@type": "Organization",
      "name": siteConfig.postAuthor,
    }]
  };

  // BreadcrumbList
  const jsonLd2 = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [{
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": getBaseUrl(),
    }, {
      "@type": "ListItem",
      "position": 2,
      "name": "Blog",
      "item": getBaseUrl() + '/' + "blog"
    }, {
      "@type": "ListItem",
      "position": 3,
      "name": postData.data[0]?.title,
    }]
  };


  return (



    <div className="relative z-10">

      {/*  JSON-LD of Page */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd2) }} />

      <SEOSchema schemaList={postData.data[0].seo?.schema} />


      <div className="w-full  mt-5 h-[1px] bg-textBlue"></div>

      <PaddingContainer>

        <Breadcrumbs breadcrumbs={breadcrumbsData} />

        {/*  Post Area   2xl:w-3/4  */}
        <div className=" w-full  flex flex-col mt-20  justify-center  md:p-10 pt-0 space-y-7   ">

          <div className="W-full h-auto   " >
            <Image className="w-full h-auto " quality={100} src={getImageUrl(postData.data[0].featureImage.url)} height={1400} width={1400} alt={postData.data[0].title} />
          </div>
          <h1 className="   text-2xl md:text-3xl text-gray-900 " >{postData.data[0].title}</h1>
          <div className="text-gray-800 font-light text-base mt-5   pr-5 md:pr-2 rich-text" >

            <BodyDataParse content={postData.data[0].description} />

          </div>




          {!!faq?.length && <SingleTab heading={dictionary.navigation.faq} faqList={faq} />}


        </div>
      </PaddingContainer>

      <BlogContainer locale={lang} />

    </div>
  );
}

export default SingleBlogPage
