import Image from "next/image"
import PaddingContainer from "./padding-container"
import { getImageUrl } from "@/libs/helper";
import { buildImageObject } from "@/libs/schema/entity";
import JsonLd from "../elements/json-ld";



/*
  Page banner. `title` is the page's single <h1>, so pages using this banner must not
  add another <h1>.

  Desktop and mobile used to be two separate copies of the banner (one hidden per
  breakpoint), which put the title in the HTML twice. Now there is one banner whose
  classes switch at `md`, reproducing both previous layouts:
  - mobile:  220px high, smaller text
  - desktop: 270px high, centred text block with a max width
*/
const TopBanner = ({ banner = "", mobileBanner = "", title = "", title2 = "", dictionary = "" }) => {


  if (!banner || banner == null || banner.length == 0) return <div className=" mt-32"></div>

  // image schema for seo; the creator is the canonical Organization
  const imageSchema = buildImageObject({
    url: getImageUrl(banner),
    creditText: dictionary?.imageObject?.creditText,
    copyrightNotice: dictionary?.imageObject?.copyrightNoticeBanner,
  });





  return (
    // <!--Top Banner-->
    <>
      <JsonLd data={imageSchema} label="banner image schema" />

      <section className=" relative z-20 w-full h-[220px] md:h-[270px] " >

        <Image src={mobileBanner ? mobileBanner : banner} width={1440} height={600}
          className="   object-center object-cover w-full h-full" alt={title ? title : "Chempol Banner"} />
        <PaddingContainer>
          <div className="flex flex-col ml-0 pb-16 -mt-44 md:items-center md:justify-center text-center ">
            {title ? (
              <h1 className="text-textLightBlue capitalize font-semibold text-center text-xl md:text-2xl md:mx-auto">
                {title}
              </h1>
            ) : null}
            <div className="text-white font-light text-center md:w-full md:max-w-screen-md xl:max-w-screen-lg 2xl:max-w-screen-2xl md:text-xl md:mx-auto md:overflow-hidden">
              {title2}
            </div>
          </div>
        </PaddingContainer>

      </section>
      <div className="lg:hidden relative w-full h-1 bg-textLightBlue"></div>

    </>
  )
}

export default TopBanner
