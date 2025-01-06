

//contact us page
import PaddingContainer from "../components/layout/padding-container";
import TopBanner from "../components/layout/top-banner";
import { getContactUsPageData } from "../data/loader";
import { cache } from 'react';
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import SEOSchema from "../components/elements/seo-schema";
import ContactForm from "../components/elements/contact-form";
import { PiBuildingOfficeFill } from "react-icons/pi";
import siteConfig from "@/config/site";

const cachedGetContactPage = cache(getContactUsPageData);


export async function generateMetadata({ params }) {


  const pageData = await cachedGetContactPage();

  const metadataParams = {
    pageTitle: pageData.seo?.seoTitle ? pageData.seo?.seoTitle : "Chempol Contact Page",
    pageSlug: "contact",
    pageDescription: "",
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDesctiption,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "contact",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + siteConfig.ogImage,
    imageAlternativeText: "",
    imageExt: siteConfig.ogImageExt,
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const ContactUs = async () => {



  const contactData = await cachedGetContactPage();

  /* console.log("****************contact us***data*****************");
   console.dir(contactData, { depth: null });
 
   console.log(contactData.addressBook);
   */
  return (
    <div>

      <SEOSchema schemaList={contactData.seo?.schema} />

      <TopBanner banner="/images/contact-banner.jpg" title="Contact Us" title2="" />

      <PaddingContainer   >

        <div className="flex flex-col md:flex-row justify-center items-start md:space-x-20 2xl:space-x-28 mt-20">
          {/* contact form */}
          <div className=" w-full text-gray-800">
            <ContactForm />
          </div>

          {/* map */}
          <div className=" w-full   text-gray-800 mt-28 md:mt-10 md:mt-0   ">
            <h1 className="text-textBlue text-2xl font-semibold capitalize">Our Contact Details</h1>
            <p className="text-gray-800 font-light " >It is a long Established fact that a reader will be distract readable contect of a page</p>

            {contactData.addressBook?.map((contact) => (

              <div key={contact.id} className="w-full text-gray-800 mt-5 flex flex-col space-y-3">
                <div className="text-xl capitalize font-semibold">{contact.company}</div>
                <div className="w-full flex   justify-normal space-x-4">
                  <div><PiBuildingOfficeFill size="32" className="text-textLightBlue" /></div>
                  <div>
                    <div className="font-light text-textLightBlue text-base "><a href='mailto:{contactData.email}' >{contact.email}  </a> | {contact.phone} </div>
                    <div className="font-light text-base  max-w-96">{contact.address}</div>
                    <div className="font-light text-base  text-textLightBlue  max-w-72"> <a target="_blank" href='{contact.mapUrl}' >Open in Google Map</a></div>
                  </div>
                </div>
              </div>

            ))}



          </div>

        </div>

      </PaddingContainer>

      <iframe
        className="w-full h-96 md:h-80 lg:h-96 xl:h-112 border-0 filter  mt-14"
        src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d14451.279538782293!2d55.1785488!3d25.1079577!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6beab688b619%3A0xcf0db2c56ce4779!2sChempol%20Additives%20and%20Chemical%20Speciality%20UAE!5e0!3m2!1sen!2s!4v1730806174181!5m2!1sen!2s"
        allowFullScreen=""
        loading="lazy"
      ></iframe>

      <div className="  w-full h-auto py-10  ">
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



    </div>
  )
}

export default ContactUs
