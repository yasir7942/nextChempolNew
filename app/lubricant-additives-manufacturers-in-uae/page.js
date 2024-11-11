import Image from "next/image";
import PaddingContainer from "../components/layout/padding-container";
import TopBanner from "../components/layout/top-banner";

import BodyDataParse from "../components/elements/data-parse-content";
import { getImageUrl } from "@/libs/helper";
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from "../components/elements/seo-schema";
import SpeakableSchema from "../components/elements/speakable-schema";
import { getLubricantAddtives } from "../data/loader";
import { FaPhone } from "react-icons/fa6";
import { MdEmail } from "react-icons/md";
import { SlNotebook } from "react-icons/sl";
import ProductCategoryGrid from "../components/layout/product-category-grid";
import { MdVerifiedUser } from "react-icons/md";
import * as Icons from 'react-icons/md';
import * as Icons2 from "react-icons/fa6";
import FAQs from "../components/layout/Faqs";





const cachedGetLubricantAddtives = cache(getLubricantAddtives);
export async function generateMetadata({ params }) {


    const pageData = await cachedGetLubricantAddtives();

    const metadataParams = {
        pageTitle: "Lubricant Additives Manufacturers in UAE",
        pageSlug: "lubricant-additives-manufacturers-in-uae",
        pageDescription: pageData.seo?.seoDescription,
        seoTitle: pageData.seo?.seoTitle,
        seoDescription: pageData.seo?.seoDescription,
        rebotStatus: pageData.seo?.preventIndexing,
        canonicalLinks: pageData.seo?.canonicalLinks ?? "lubricant-additives-manufacturers-in-uae",
        dataPublishedTime: pageData.publishedAt,
        category: "",
        image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
        imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
        imageExt: pageData.banner?.mobileBanner?.mime,
    };

    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const Company = async () => {

    const pageData = await cachedGetLubricantAddtives();

    console.log("-----------------------lubricant   page--------------------------------------------------");
    console.dir(pageData, { depth: null });
    console.log("---------------------------End-----lubricant ------------------end-----------------------");



    return (
        <div>
            <SpeakableSchema pageTitle={pageData.title} pageUrl={pageData.seo?.canonicalLinks ?? "/lubricant-additives-manufacturers-in-uae"} />
            <SEOSchema schemaList={pageData.seo?.schema} />


            <TopBanner banner="/images/product-banner.jpg" title="Road Map For Additive Solutions." title2="Partner with us for reliable solutions to your unique special additives. Our extensive research of Lubricant Additives manufacturing, coupled with top-notch services and local stockholding, guarantees satisfaction." />


            <div className="  w-full h-auto py-10 bg-gray-200">
                <PaddingContainer>
                    <div className="flex flex-col md:flex-row w-full items-center justify-center ">
                        <div className=" w-full md:w-[80%] ">
                            <h1 className="w-full text-textBlue text-xl font-semibold ">Your Problems And Our Solutions</h1>
                            <p className="font-light font-xl md:max-w-[90%]">We are dedicated to providing premium quality Chemical additives that enhance the performance of your equipment,
                                ensuring longer lubricant life and maximum efficiency.</p>

                        </div>
                        <div className="w-full mt-5 md:mt-0 md:w-[20%]  "><a href={`/contact-us`}
                            className="px-4 py-3 transition duration-300 ease-in-out hover:bg-textLightBlue bg-textBlue text-white">Enquire Now</a> </div>
                    </div>
                </PaddingContainer>
            </div>

            <PaddingContainer>

                <div>

                    <h2 className="w-full text-textBlue mt-10 text-xl font-semibold ">{pageData.text1?.title}</h2>
                    <div className="text-black font-light py-0 summary text-lg  rich-text">
                        <BodyDataParse content={pageData.text1?.description} />
                    </div>
                </div>

                <div className="flex flex-col-reverse   md:mt-10   md:flex-row  items-center w-full justify-center  ">

                    <div className="w-full md: w-40%  flex flex-col items-center space-y-3   ">

                        {/** block start */}
                        <div className="flex flex-row w-96 items-center rounded-md p-5 mt-5 md:mt-0  justify-start bg-textBlue">
                            <div> <FaPhone className="text-white border-4 text-6xl rounded-full p-2 border-white " /></div>
                            <div className="text-white pl-4 text-left flex flex-col items-left justify-start">
                                <div className="font-light">To find out more, call us today on</div>
                                <div className="font-semibold text-textLightBlue">+447548378089</div>
                            </div>
                        </div>
                        {/** end block */}

                        {/** block start */}
                        <div className="flex flex-row w-96 items-center rounded-md  p-5 mt-5 md:mt-0  justify-start bg-textBlue">
                            <div> <MdEmail className="text-white border-4 text-6xl rounded-full p-2 border-white " /></div>
                            <div className="text-white pl-4 text-left flex flex-col items-left justify-start">
                                <div className="font-light">Send us an email.</div>
                                <div className="font-semibold">
                                    <a href="mailto:info@chempol.co.uk" className=" font-semibold text-textLightBlue hover:text-white hover-animation" >info@chempol.co.uk</a>
                                </div>
                            </div>
                        </div>
                        {/** end block */}


                        {/** block start */}
                        <div className="flex flex-row w-96 items-center rounded-md  p-5 mt-5 md:mt-0  justify-start bg-textBlue">
                            <div> <SlNotebook className="text-white border-4 text-6xl rounded-full p-2 border-white " /></div>
                            <div className="text-white pl-4 text-left flex flex-col items-left justify-start">
                                <div className="font-semibold">Product catalog.</div>
                                <div className="font-light text-white ">Explore our comprehensive collection of exceptional products and  <a href={`/`} className=" font-semibold text-textLightBlue hover:text-white hover-animation" >download the catalog </a> to discover your perfect fit.</div>
                            </div>
                        </div>
                        {/** end block */}


                    </div>
                    <div className="w-full md: w-60% ">
                        <h2 className="w-full text-textBlue mt-10 text-xl font-semibold ">{pageData.text2?.title}</h2>
                        <div className="text-black font-light py-0 summary text-lg  rich-text">
                            <BodyDataParse content={pageData.text2?.description} />
                        </div>
                    </div>
                </div>
            </PaddingContainer>

            <div className="w-full h-auto bg-gray-100">
                <ProductCategoryGrid />
            </div>


            {/* Benifit of Lubricant Additivies */}


            <div className="w-full mt-10   ">

                <PaddingContainer >
                    <h3 className="w-full text-textBlue text-left md:text-center text-xl font-semibold"  >{pageData.textimage1.title}</h3>

                    <div className="w-full h-auto flex mt-8 flex-col md:flex-row justify-evenly items-center  ">
                        <div className="text-black w-5/6 font-light py-0 summary text-lg rich-text pr-5 md:pr-0 text-left  ">
                            <BodyDataParse content={pageData.textimage1?.description} />
                        </div>
                        <div className="w-1/3 md:w-1/4">
                            <Image
                                className="rounded-xl"
                                src={getImageUrl(pageData.textimage1?.image.url)}
                                width={740}
                                height={544}
                                alt={pageData.textimage1?.title}
                            />
                        </div>
                    </div>

                </PaddingContainer>
            </div >

            {/** Why Choose Our Additives? */}
            <div className="w-full mt-10 text-center h-auto">
                <PaddingContainer>
                    <h4 className="w-full text-textBlue text-left md:text-center text-xl font-semibold"  >Why choose our additives?</h4>
                    <p className="text-gray-800 text-left md:text-center font-light py-0 summary text-base md:text-lg ">There are many reasons why you should select a manufacturer in UAE for chemicals.</p>
                    {pageData.whyUs.map((why) => {
                        const IconComponent = (Icons[why.icon] || Icons2[why.icon]) || MdVerifiedUser;
                        return (
                            <div key={why.id} className="w-full h-auto mt-5">
                                <div className="flex flex-row justify-start items-center">
                                    <IconComponent className="text-textBlue text-6xl pr-2" />
                                    <h5 className="w-full text-black text-left  text-xl font-medium"  >{why.title}</h5>
                                </div>
                                <div className="text-gray-800 text-left   font-light py-0 summary text-base md:text-base rich-text ">
                                    <BodyDataParse content={why.description} />
                                </div>

                            </div>)
                    })}
                </PaddingContainer>
            </div>

            <FAQs faqList={pageData.faq} heading="FAQ" text="There are many reasons why you should select a manufacturer in UAE for chemicals." />






            <div className="relative w-full h-[200px] md:h-[300px] xl:h-[400px] mt-12 mb-10   overflow-hidden">
                <div className="absolute inset-0 md:-top-44 w-full  pb-[56.25%] h-full">
                    <iframe className="video-bg absolute inset-0 w-full h-full"
                        src="https://www.youtube.com/embed/lMJXxhRFO1k?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&modestbranding=0&iv_load_policy=3&rel=0&playlist=lMJXxhRFO1k&t=16"
                        allow="autoplay; encrypted-media"
                        frameBorder="0"
                        allowFullScreen>
                    </iframe>
                    <div className="absolute inset-0 bg-black opacity-50"></div>
                </div>

                <div className="absolute w-full z-10 flex flex-col text-white items-left md:text-center justify-center h-full px-6 ">
                    <PaddingContainer>
                        <h4 className="text-white   text-xl md:text-2xl xl:text-4xl font-semibold">CHEMPOL-Additives & Chemical Specialty</h4>
                        <p className="text-sm md:text-base xl:text-xl xl:mt-2 font-light ">Driven by the powerful blend of technology knowledge, innovation, and partnership we do in advance and look at future challenges and developments.</p>
                    </PaddingContainer>
                </div>
            </div>






        </div >
    )
}

export default Company
