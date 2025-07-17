"use client";




import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Image from "next/image";

import { Rings } from "react-loader-spinner";
import React from "react";

function Slider({ locale, diction }) {


  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  );

  // 🔄 Wait until dictionary is loaded
  // if (!dictionary) return null; // Or you can return a loader here

  if (!diction) return (
    <div className="w-full flex items-center justify-center mt-10 pb-16 "  >
      <Rings
        visible={true}
        height="160"
        width="160"
        ariaLabel="rings-loading"
        wrapperStyle={{}}
        wrapperClass=""
        color="#1976bc"
      />
    </div>
  );


  return (
    <Carousel
      className="hidden md:block"
      opts={{
        align: "start",
        loop: true,
        direction: locale === "ar" ? "rtl" : "ltr",
      }}
      plugins={[plugin.current]}
    >
      <CarouselContent className="xl:h-[480px] 2xl:h-[590px]">
        {/* First Slide */}
        <CarouselItem>
          <div className="relative w-full h-[400px] xl:h-[480px] 2xl:h-[590px] flex items-center justify-center">
            <Image
              src={locale === 'ar' ? "/images/banner-1-ar.jpg" : "/images/banner-1.jpg"}
              alt="Our Viscosity Index Improvers"
              fill
              quality={100}
              className="z-0 object-cover object-center bg-cover bg-center"
            />
            <div className="flex w-full z-10  justify-start pl-16 items-start    text-4xl font-bold ">
              <div className="text-white text-left rtl:text-right w-[44%] rtl:w-[53%] rtl:pr-32 ">
                <div className="text-sm font-light">{diction.slider.slider1.title1}</div>
                <div className="text-textLightBlue text-3xl uppercase py-2">{diction.slider.slider1.title2}</div>
                <div
                  className="text-base font-light"
                  dangerouslySetInnerHTML={{ __html: diction.slider.slider1.title3 }}
                ></div>
              </div>
              <div></div>
            </div>
          </div>
        </CarouselItem>

        {/* Second Slide */}
        <CarouselItem className="hidden md:block">
          <div className="relative w-full h-[400px] xl:h-[480px] 2xl:h-[590px] flex items-center justify-center">
            <Image
              src="/images/banner-2.jpg"
              alt="Best Chemical Speciality Providers"
              fill
              quality={100}
              className="z-0 object-cover object-center bg-cover bg-center"
            />
            <div className="flex flex-col w-full z-10 justify-center items-center text-4xl font-bold">
              <div className="text-white text-center w-[35%]">
                <div className="text-sm font-light">{diction.slider.slider2.title1}</div>
                <div className="text-textLightBlue text-3xl uppercase py-2" dangerouslySetInnerHTML={{ __html: diction.slider.slider2.title2 }} >


                </div>
                <div className="text-base font-light" dangerouslySetInnerHTML={{ __html: diction.slider.slider2.title3 }} >

                </div>
              </div>

              <div className="flex mt-6 text-white items-center justify-center space-x-4 rtl:gap-4">
                <div>
                  <a
                    href="#our-products"
                    className="bg-textLightBlue border border-textLightBlue hover:bg-[#001a35] hover:text-textLightBlue text-[#001a35] uppercase px-5 py-2 font-semibold text-sm rounded-md transition duration-300 ease-in-out  "
                  >
                    {diction.slider.button.ourProduct}
                  </a>
                </div>
                <div>
                  <a
                    href="/contact/"
                    className="bg-[#001a35] border border-textLightBlue hover:bg-textLightBlue hover:text-[#001a35] text-textLightBlue uppercase px-5 py-2   font-semibold text-sm rounded-md transition duration-300 ease-in-out"
                  >
                    {diction.slider.button.getInTouch}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </CarouselItem>
      </CarouselContent>
      <CarouselPrevious className="absolute left-4 border-0 text-textBlue" />
      <CarouselNext className="absolute right-4 border-0 text-textBlue" />
    </Carousel>
  );
}

export default Slider;
