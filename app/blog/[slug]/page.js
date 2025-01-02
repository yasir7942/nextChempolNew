import BodyDataParse from "@/app/components/elements/data-parse-content";
import SEOSchema from "@/app/components/elements/seo-schema";
import BlogContainer from "@/app/components/layout/blog-container";
import PaddingContainer from "@/app/components/layout/padding-container";
import { geAllPostSlug, geSinglePost } from "@/app/data/loader";
import siteConfig from "@/config/site";
import { getFirstDescriptionText, getImageUrl, validateCanonicalSlug } from "@/libs/helper";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import Image from "next/image";
import { cache } from 'react';



// Cache the geSinglePost function
const cachedGeSinglePost = cache(geSinglePost);

export async function generateMetadata({ params }) {
  const postData = await cachedGeSinglePost(params.slug);

  const metadataParams = {
    pageTitle: postData.data[0].title,
    pageSlug: postData.data[0].slug,
    pageDescription: getFirstDescriptionText(postData.data[0].description),
    seoTitle: postData.data[0].seo?.seoTitle,
    seoDesctiption: postData.data[0]?.seo?.seoDesctiption ?? "",
    rebotStatus: postData.data[0].seo?.preventIndexing,
    canonicalLinks: postData.data[0].seo?.canonicalLinks,
    dataPublishedTime: postData.data[0].publishedAt,
    category: postData.data[0].post_categories[0].title,
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + postData.data[0].featureImage.url,
    imageAlternativeText: postData.data[0].featureImage?.alternativeText,
    imageExt: postData.data[0].featureImage?.mime,
  };




  return await generatePageMetadata({ type: "blog", path: "/blog/", params: metadataParams });
}



export const generateStaticParams = async () => {

  try {
    const postSlugs = await geAllPostSlug();
    const paramsSlugs = postSlugs?.data?.map((post) => {
      // console.log("*******Post slug: "+ post.slug);
      return {
        slug: post.slug
      };
    })
    return paramsSlugs || [];
  } catch (error) {
    console.log(error);
    throw new Error("Error Fetching generateStaticParams");
  }
}



const SingleBlogPage = async ({ params }) => {

  const postData = await cachedGeSinglePost(params.slug);


  // console.log("-----------------------single post page--------------------------------------------------");
  //  console.dir(postData, { depth: null });
  //  console.log("---------------------------End-----single post------------------end-----------------------");

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



  return (



    <div className="relative z-10">

      {/*  JSON-LD of Page */}
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <SEOSchema schemaList={postData.data[0].seo?.schema} />


      <div className="w-full mt-5 h-[1px] bg-textBlue"></div>

      <PaddingContainer>

        {/*  Post Area   */}
        <div className=" w-full  flex flex-col mt-20  justify-center  p-10 pt-0 space-y-7   ">

          <div className="W-full h-auto 2xl:w-3/4  " >
            <Image className="w-full h-auto " src={getImageUrl(postData.data[0].featureImage.url)} height={1400} width={1400} alt={postData.data[0].title} />
          </div>
          <h1 className="   text-2xl md:text-3xl text-gray-900 " >{postData.data[0].title}</h1>
          <div className="text-gray-800 font-light text-base mt-5   pr-5 md:pr-2 rich-text" >

            <BodyDataParse content={postData.data[0].description} />

          </div>

        </div>

      </PaddingContainer>

      <BlogContainer />

    </div>
  );
}

export default SingleBlogPage
