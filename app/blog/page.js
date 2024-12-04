import React from 'react'
import moment from 'moment';
import { gePosts, getBlogPage } from '../data/loader';
import TopBanner from '../components/layout/top-banner';
import { PaginationComponent } from "@/app/components/elements/pagination";
import PaddingContainer from '../components/layout/padding-container';
import Image from 'next/image';
import { getImageUrl } from '@/libs/helper';
import { Suspense } from 'react'
import SearchBarForPost from '../components/layout/search-bar-post';
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from '../components/elements/seo-schema';

const cachedGetBlogPage = cache(getBlogPage);

export async function generateMetadata({ params }) {


  const pageData = await cachedGetBlogPage();

  const metadataParams = {
    pageTitle: pageData.slug,
    pageSlug: "blog",
    pageDescription: "",
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDescription,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "blog",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
    imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
    imageExt: pageData.banner?.mobileBanner?.mime,
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const numbers = Array.from({ length: 12 }, (_, index) => index + 1);

const pageSize = 9;


const Blog = async ({ searchParams }) => {


  const pageData = await cachedGetBlogPage();
  const currentPage = Number(searchParams.page) || 1;
  const postsData = await gePosts(currentPage, pageSize);
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


      <TopBanner banner="/images/blog-banner.jpg" title="Blog" title2="" />

      <div className=' -mt-44  block ' >
        <PaddingContainer  >
          {/*  Post Area   */}
          <div className=" w-full  flex flex-col mt-48 px-16       ">
            {/*   Content area content goes here  bg-[#2a3c46] */}
            {/* <SearchBar /> */}

            <SearchBarForPost />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4   gap-7   ">

              {postsData.data.map((post) => (

                <div key={post.id} className="w-full flex flex-col text-white  md:text-left pb-14   ">
                  <a href={`/blog/${post.slug}`}>
                    <Image className="w-full " src={getImageUrl(post?.featureImage.url)}
                      width={800} height={600} alt={post?.featureImage.alternativeText ?? post.title} />
                    <h2 className="text-gray-900 font-semibold  leading-6 text-lg md:text-base pt-3  text-justify">
                      {post.title}
                    </h2>
                    <p className='text-sm text-gray-700 font-light'> {moment(post.PostDate).format('MMMM D, YYYY')}</p>
                    <p className="text-lx md:text-sm text-justify text-gray-800">{post.seo?.seoDesctiption ? post.seo.seoDesctiption.split(" ").length > 30
                      ? post.seo.seoDesctiption.split(" ").slice(0, 30).join(" ") + " ..."
                      : post.seo.seoDesctiption
                      : ""}</p>
                  </a>

                </div>

              ))}

            </div>

            <Suspense fallback={<div>Loading...</div>}>
              <PaginationComponent pageCount={PostCount} totalPage={totalPosts} pageSize={pageSize} />
            </Suspense>
          </div>

        </PaddingContainer>
      </div>
    </div>
  )
}



export default Blog
