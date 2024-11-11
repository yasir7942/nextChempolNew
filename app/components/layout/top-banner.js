import Image from "next/image"
import PaddingContainer from "./padding-container"
import { getImageUrl } from "@/libs/helper";
import siteConfig from "@/config/site";


const TopBanner = ({ banner = "", mobileBanner = "", title = "", title2 = "" }) => {



  if (!banner || banner == null || banner.length == 0) return <div className=" mt-32"></div>

  // image schema for seo
  const jsonLd =
  {
    "@context": "https://schema.org/",
    "@type": "ImageObject",
    "contentUrl": getImageUrl(banner),
    "license": siteConfig.imageObject.license,
    "acquireLicensePage": siteConfig.imageObject.acquireLicensePage,
    "creditText": siteConfig.imageObject.creditText,
    "creator": {
      "@type": "Organization",
      "name": siteConfig.imageObject.creatorName,
    },
    "copyrightNotice": siteConfig.imageObject.copyrightNoticeBanner
  };





  return (
    // <!--Top Banner-->

    <>
      <script type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />



      <section className=" relative hidden md:block  z-20 w-full h-[280px]  " >

        <Image src={mobileBanner ? mobileBanner : banner} width={1440} height={600}
          className="   object-center object-cover w-full h-full" alt={title ? title : "Chempol Banner"} />
        <PaddingContainer>
          <div className="flex flex-col items-center pb-16 justify-center text-center -mt-44 md:-mt-44">
            <div className="text-textLightBlue capitalize font-semibold text-xl md:text-2xl mx-auto">
              {title}
            </div>
            <div className="w-full   text-white font-light max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-2xl text-center text-xl md:text-xl mx-auto">
              {title2}
            </div>
          </div>
        </PaddingContainer>

      </section>
      <div className="hidden lg:relative w-full h-5 bg-textLightBlue"></div>

      {/* show md to  sm */}

      <section className="  relative block  md:hidden  z-20 w-full h-[220px]   " >

        <Image src={mobileBanner ? mobileBanner : banner} width={800} height={500}
          className="   object-center object-cover w-full h-full" alt={title} />
        <PaddingContainer>
          <div className="flex flex-col   ml-0 pb-16  -mt-44 "  >
            <div className="text-textLightBlue capitalize font-semibold    text-xl md:text-2xl" >{title}</div>
            <div className="text-white  font-light      text-normal md:text-normal"  >{title2}</div>

          </div>
        </PaddingContainer>
      </section>
      <div className="lg:hidden relative w-full h-1 bg-textLightBlue"></div>

    </>
  )
}

export default TopBanner
