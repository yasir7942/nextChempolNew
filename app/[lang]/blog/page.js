import React from 'react'
import moment from 'moment';
import { getBlogPage, getPosts } from '../data/loader';
import TopBanner from '../components/layout/top-banner';
import { PaginationComponent } from "../components/elements/pagination";

import PaddingContainer from '../components/layout/padding-container';
import Image from 'next/image';
import { convertToLocalizedDate, getImageUrl } from '@/libs/helper';
import { Suspense } from 'react'

import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from '../components/elements/seo-schema';
import siteConfig from '@/config/site';
import SearchBarForPost from '../components/layout/search-bar-post';
import { getDictionary } from '@/libs/getDictionary';
import Link from 'next/link';


const cachedGetBlogPage = cache(getBlogPage);

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang || 'en';


  const pageData = await cachedGetBlogPage(lang);

  const metadataParams = {
    pageTitle: pageData.seo?.seoTitle ? pageData.seo?.seoTitle : pageData.title,
    pageSlug: "blog",
    pageDescription: pageData.seo?.seoDesctiption,
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDesctiption,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "blog",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: siteConfig.ogImage,
    imageAlternativeText: "",
    imageExt: siteConfig.ogImageExt,
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams, lang: lang });
}


const numbers = Array.from({ length: 12 }, (_, index) => index + 1);

const pageSize = 9;


const Blog = async props => {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { lang } = await params || {};
  const dictionary = await getDictionary(lang);

  const pageData = await cachedGetBlogPage(lang);
  const currentPage = Number(searchParams.page) || 1;
  const postsData = await getPosts(lang, currentPage, pageSize);
  const PostCount = postsData.meta.pagination.pageCount;
  const totalPosts = postsData.meta.pagination.total;


  // console.log("-----------------------blog page--------------------------------------------------");
  //console.dir(postsData, { depth: null });
  // console.log("---------------------------End-------- Blog---------------end-----------------------");
  //  console.log(productData.data);
  // if(productData.data.length === 0)  return  <NotFound />

  //console.dir(productData.data.title, { depth:null});
  // console.log(currentPage + "---" + pageSize);

  return (
    <div>

      <SEOSchema schemaList={pageData.seo?.schema} />


      <TopBanner banner="/images/blog-banner.jpg" title={dictionary.navigation.blogs} title2="" dictionary={dictionary} />

      <div className=' -mt-44  block  ' >
        <PaddingContainer  >
          {/*  Post Area   */}
          <div className=" w-full  flex flex-col mt-48 md:px-16        ">
            {/*   Content area content goes here  bg-[#2a3c46] */}
            {/* <SearchBar /> */}

            <SearchBarForPost locale={lang} dictionary={dictionary} />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-3   gap-7 mt-6   ">

              {postsData.data.map((post) => (

                <div key={post.id} className="w-full flex flex-col text-white  md:text-left pb-14   ">
                  <Link href={`/${lang}/blog/${post.slug}`}>
                    <Image className="w-full " src={getImageUrl(post?.featureImage.url)}
                      width={800} height={600} alt={post?.featureImage.alternativeText ?? post.title} />
                    <h2 className="text-darkBlue font-semibold  leading-6 text-lg md:text-base pt-3  ">
                      {post.title}
                    </h2>
                    <p className='text-sm text-gray-700 font-light'> {convertToLocalizedDate(post.PostDate, lang)}</p>
                    <p className="text-lx md:text-sm text-justify text-gray-800">{post.seo?.seoDesctiption ? post.seo.seoDesctiption.split(" ").length > 30
                      ? post.seo.seoDesctiption.split(" ").slice(0, 30).join(" ") + " ..."
                      : post.seo.seoDesctiption
                      : ""}</p>
                  </Link>

                </div>

              ))}

            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <PaginationComponent locale={lang} dictionary={dictionary} pageCount={PostCount} totalPage={totalPosts} pageSize={pageSize} />
            </Suspense>
          </div>

        </PaddingContainer>
      </div>
    </div>
  )
}



export default Blog
