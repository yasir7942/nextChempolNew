import Image from "next/image"

import { convertToLocalizedDate, getImageUrl } from "@/libs/helper"
import PaddingContainer from "./padding-container";
import { getPostLimitedData } from "../../data/loader";
import { getDictionary } from "@/libs/getDictionary";
import Link from "next/link";



const BlogContainer = async ({ locale }) => {

  const dictionary = await getDictionary(locale);

  const postData = await getPostLimitedData(locale);



  return (
    <div className="bg-[#F2F2F2]    pt-16 w-full h-auto">


      <PaddingContainer>

        {/* <!--Latest News --> */}
        <section className="flex flex-col pb-5  md:p-0   " >

          {/* <!--heading--> */}
          <div className="flex flex-col">
            <h3 className="*:first-letter: text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize r -mt-3 ml-5 z-20" >{dictionary.homePage.latestInsights}</h3>
          </div>
          {/* <!--news blocks--> */}
          <div className=" w-full flex flex-col md:flex-row pt-10 md:p-0 md:py-10 lg:py-12 justify-between md:space-x-5 space-y-6 md:space-y-0  ">
            {/* <!--new block--> */}

            {
              postData.data.map(post => (

                <div key={post.id} className="w-full flex flex-col text-white  md:text-left  ">
                  <Link href={`/${locale}/blog/${post.slug}`} >
                    <Image className="w-full rounded-lg " src={getImageUrl(post.featureImage.url)} width={500} height={350} alt={post.title} />
                    <h4 className="text-textBlue font-semibold  leading-6 text-base md:text-base pt-3  text-justify headline rtl:text-right">
                      {post.title}
                    </h4>
                    <p className='text-sm text-gray-800 font-light  rtl:text-right'> {convertToLocalizedDate(post.PostDate, locale)}</p>
                    <p className="text-base md:text-sm    text-darkGary summary  rtl:text-right">{post.seo?.seoDesctiption ? post.seo.seoDesctiption.split(" ").length > 25
                      ? post.seo.seoDesctiption.split(" ").slice(0, 25).join(" ") + "..."
                      : post.seo.seoDesctiption
                      : ""}</p>
                  </Link>

                </div>

              ))}



          </div>
        </section>
        {/* <!--End Latest News --> */}

      </PaddingContainer>

    </div>
  )
}

export default BlogContainer
