import Image from "next/image";
import PaddingContainer from "../components/layout/padding-container";
import TopBanner from "../components/layout/top-banner";
import { getAboutPage } from "../data/loader";
import BodyDataParse from "../components/elements/data-parse-content";
import { getImageUrl } from "@/libs/helper";
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from "../components/elements/seo-schema";
import SpeakableSchema from "../components/elements/speakable-schema";

const cachedGetAboutPage = cache(getAboutPage);
export async function generateMetadata({ params }) {


    const pageData = await cachedGetAboutPage();

    const metadataParams = {
        pageTitle: "About Us",
        pageSlug: "about-us",
        pageDescription: pageData.seo?.seoDescription,
        seoTitle: pageData.seo?.seoTitle,
        seoDescription: pageData.seo?.seoDescription,
        rebotStatus: pageData.seo?.preventIndexing,
        canonicalLinks: pageData.seo?.canonicalLinks ?? "about-us",
        dataPublishedTime: pageData.publishedAt,
        category: "",
        image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
        imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
        imageExt: pageData.banner?.mobileBanner?.mime,
    };

    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const AboutUsPage = async () => {

    const pageData = await cachedGetAboutPage();




    return (
        <div>
            <SpeakableSchema pageTitle={pageData.title} pageUrl={pageData.seo?.canonicalLinks ?? "/about-us"} />
            <SEOSchema schemaList={pageData.seo?.schema} />


            <TopBanner banner="/images/product-banner.jpg" title="About Us" />


            <PaddingContainer className="flex flex-col   " >


                <div className="text-gray-700 font-light py-10 summary text-lg descriptionSpace"><BodyDataParse content={pageData.aboutus.description} /></div>



            </PaddingContainer>

            <div className=" w-full py-5 bg-gray-200">
                <PaddingContainer>
                    <div className="flex flex-col md:flex-row    justify-center  h-auto   md:space-x-3 lg:space-x-3 mt-3 bg-gray-200">
                        {/* First Section */}
                        <div className="flex flex-col  p-5  xl:p-10 md:w-1/3 h-full  border items-center   text-black text-lg tracking-wider font-light flex-grow justify-center">
                            <div className="max-w-sm md:max-w-lg  overflow-hidden rounded-lg">
                                <Image className="w-full h-full object-cover" width={1000} height={1000} src={getImageUrl(pageData.coreValue.image.url)} alt={pageData.coreValue.image.alternativeText} />
                            </div>
                            <h1 className="text-xl mt-5 text-left   capitalize font-normal text-textBlue">{pageData.coreValue.title}</h1>
                            <div className="text-black md:text-justify summary 2xl:w-[80%] ">
                                <BodyDataParse content={pageData.coreValue.description} />
                            </div>
                            <a href="#" className=" hidden text-left w-full text-base  2xl:w-[80%]  text-textBlue ">Read more...</a>
                        </div>

                        {/* Second Section */}
                        <div className="flex flex-col  p-5  xl:p-10 mt-10 md:mt-0  md:w-1/3 h-full border  items-center text-black text-lg tracking-wider font-light flex-grow justify-center">
                            <div className="max-w-sm md:max-w-lg   overflow-hidden rounded-lg">
                                <Image className="w-full h-full object-cover" width={1000} height={1000} src={getImageUrl(pageData.ourMission.image.url)} alt={pageData.ourMission.image.alternativeText} />
                            </div>
                            <h1 className="text-xl mt-5 text-left capitalize font-normal text-textBlue">{pageData.ourMission.title}</h1>
                            <div className="text-black md:text-justify summary  2xl:w-[80%]  ">
                                <BodyDataParse content={pageData.ourMission.description} />
                            </div>
                        </div>

                        {/* Third Section */}
                        <div className="flex flex-col  p-5  xl:p-10  md:w-1/3 h-full mt-10 md:mt-0  items-center border  text-black text-lg tracking-wider font-light flex-grow justify-center">
                            <div className="max-w-sm md:max-w-lg  overflow-hidden rounded-lg">
                                <Image className="w-full h-full object-cover" width={1000} height={1000} src={getImageUrl(pageData.overVisson.image.url)} alt={pageData.overVisson.image.alternativeText} />
                            </div>
                            <h1 className="text-xl mt-5 text-left capitalize font-normal text-textBlue">{pageData.overVisson.title}</h1>
                            <div className="text-black md:text-justify summary  2xl:w-[80%] ">
                                <BodyDataParse content={pageData.overVisson.description} />
                            </div>
                        </div>
                    </div>


                </PaddingContainer>
            </div>



            <PaddingContainer>

                <div className="flex flex-wrap mt-10">

                    {pageData.qualities.map((val) => (


                        <div key={val.id} className=" w-full md:w-1/2 mt-6 space-y-0 space-x-0 ">
                            <div className="flex flex-col px-14 py-0    items-start   text-black text-lg tracking-wider font-light flex-grow justify-start  ">
                                <div className="w-full   overflow-hidden rounded-lg before:">
                                    <Image className="w-full 2xl:w-[80%]  h-auto object-cover" width={1000} height={1000} src={getImageUrl(val.image.url)} alt={val.image?.alternativeText} />
                                </div>
                                <h1 className="text-xl mt-5 text-left w-full    items-start capitalize font-normal text-textBlue">{val.title}</h1>
                                <div className="text-black md:text-justify items-start text-base 2xl:text-left w-full 2xl:w-[80%]   ">
                                    <BodyDataParse content={val.description} />
                                </div>
                            </div>
                        </div>

                    ))}


                </div>


            </PaddingContainer>





            {/*****
     *  <div className="relative w-full h-[200px] md:h-[300px] xl:h-[400px] mt-12 mb-10   overflow-hidden">
     * 
     */}

            <div className="relative w-full h-[200px] md:h-[300px] xl:h-[400px] 2xl:[700px]     mt-12 mb-10   overflow-hidden bg-red-500">
                <div className="absolute inset-0 md:-top-44 w-full  pb-[56.25%] h-full 2xl:-top-55 2xl:pb-[50]  ">
                    <iframe className="video-bg absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/lMJXxhRFO1k?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=0&iv_load_policy=3&rel=0&playlist=lMJXxhRFO1k&t=16"
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                        allowFullScreen>
                    </iframe>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>

                <div className="absolute w-full z-10 flex flex-col text-white items-left md:text-center justify-center h-full px-6 ">
                    <h4 className="text-white   text-xl md:text-2xl xl:text-4xl font-semibold">CHEMPOL-Additives & Chemical Specialty</h4>
                    <p className="text-sm md:text-base xl:text-xl xl:mt-2 font-light ">Driven by the powerful blend of technology knowledge, innovation, and partnership we do in advance and look at future challenges and developments.</p>
                </div>
            </div>













        </div>
    )
}

export default AboutUsPage
