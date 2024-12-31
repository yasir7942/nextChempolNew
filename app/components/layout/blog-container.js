import Image from "next/image"
import { getPostLimitedData } from "@/app/data/loader"
import { getImageUrl } from "@/libs/helper"
import moment from 'moment';
import PaddingContainer from "./padding-container";



const BlogContainer = async () => {

  const postData = await getPostLimitedData();

  // console.log("------------------------------Post---Data-222222---------------------------------------");
  // console.dir(postData, { depth:null});

  /*postData.data.map(post => {
    console.log(post.PostDate);
  });*/
  // console.log("---------------------------End-----------------------end-----------------------");

  return (
    <div className="bg-[#F2F2F2] pt-14 w-full h-auto">


      <PaddingContainer>

        {/* <!--Latest News --> */}
        <section className="flex flex-col pb-5  md:p-0   " >

          {/* <!--heading--> */}
          <div className="flex flex-col">
            <h3 className="*:first-letter: text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize r -mt-3 ml-5 z-20" >Latest Insights</h3>
          </div>
          {/* <!--news blocks--> */}
          <div className=" w-full flex flex-col md:flex-row pt-10 md:p-0 md:py-10 lg:py-12 justify-between md:space-x-5 space-y-6 md:space-y-0  ">
            {/* <!--new block--> */}

            {
              postData.data.map(post => (

                <div key={post.id} className="w-full flex flex-col text-white  md:text-left  ">
                  <a href={`/blog/${post.slug}`} >
                    <Image className="w-full rounded-lg " src={getImageUrl(post.featureImage.url)} width={500} height={350} alt={post.title} />
                    <h2 className="text-textBlue font-semibold  leading-6 text-base md:text-base pt-3  text-justify headline">
                      {post.title}
                    </h2>
                    <p className='text-sm text-gray-800 font-light'> {moment(post.PostDate).format('MMMM D, YYYY')}</p>
                    <p className="text-base md:text-sm  text-justify text-darkGary summary">{post.seo?.seoDesctiption ? post.seo.seoDesctiption.split(" ").length > 25
                      ? post.seo.seoDesctiption.split(" ").slice(0, 25).join(" ") + "..."
                      : post.seo.seoDesctiption
                      : ""}</p>
                  </a>

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
