"use client";

import * as React from "react"


import Autoplay from "embla-carousel-autoplay"


import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Image from "next/image"



function Slider() {

  const plugin = React.useRef(
    Autoplay({ delay: 5000, stopOnInteraction: true })
  )

  return (
    <Carousel className="hidden md:block"
      opts={{
        align: "start",
        loop: true,
      }}

      plugins={[plugin.current]}

    // onMouseEnter={plugin.current.stop}
    // onMouseLeave={plugin.current.reset}

    >
      <CarouselContent className=" xl:h-[480px] 2xl:h-[590px]   ">
        <CarouselItem >
          <div className="relative w-full h-[400px] xl:h-[480px] 2xl:h-[590px]  flex items-center justify-center">
            {/* Background Image */}
            <Image
              src="/images/banner-1.jpg"
              alt="Our Viscosity Index Improvers"
              fill
              quality={100}
              className="z-0 object-cover object-center bg-cover bg-center"
            />

            <div className="flex  w-full z-10 justify-between pl-16 items-start  text-4xl font-bold">
              <div className="text-white text-left w-[46%]   ">
                <div className="text-sm font-light">High Quality Guaranteed</div>
                <div className="text-textLightBlue text-3xl uppercase py-2 ">Our Viscosity Index Improvers</div>
                <div className="text-base font-light ">Chempol provides a wide range of Viscosity Engine Improvers
                  <strong>OCP Viscosity Index Improver </strong>, and <strong>Ethylene – Propylene – Copolymer  </strong></div>
              </div>
              <div></div>
            </div>
          </div>
        </CarouselItem>

        <CarouselItem className="hidden md:block">
          <div className="relative w-full h-[400px] xl:h-[480px] 2xl:h-[590px]   flex items-center justify-center">
            {/* Background Image */}
            <Image
              src="/images/banner-2.jpg"
              alt="Best Chemical Speciality Providers"
              fill
              quality={100}
              className="z-0 object-cover object-center bg-cover bg-center"
            />

            <div className="flex  flex-col  w-full z-10 justify-center  items-center  text-4xl font-bold">
              <div className="text-white text-center w-[35%]   ">
                <div className="text-sm font-light">High Quality Guaranteed</div>
                <div className="text-textLightBlue text-3xl uppercase py-2 ">Best Chemical <br /> Speciality Providers
                </div>
                <div className="text-base font-light ">Chempol specialize in delivering one-window chemical solutions tailored
                  to your specific needs. Our commitment to quality and innovation has
                  earned us the reputation of being the best chemical specialty providers in the industry.</div>
              </div>

              <div className="flex mt-6 text-white items-center justify-center space-x-4">
                <div> <a href="#our-products"
                  className="bg-textLightBlue border border-textLightBlue hover:bg-[#001a35] hover:text-textLightBlue text-[#001a35] uppercase px-2 py-2 font-semibold text-sm rounded-md transition duration-300 ease-in-out" >
                  Our Products </a>
                </div>

                <div> <a href={`/contact/`} className="bg-[#001a35] border border-textLightBlue hover:bg-textLightBlue hover:text-[#001a35] text-textLightBlue uppercase px-2 py-2 font-semibold text-sm rounded-md transition duration-300 ease-in-out" >
                  Get In touch  </a> </div>
              </div>

            </div>
          </div>
        </CarouselItem>

      </CarouselContent>
      <CarouselPrevious className="absolute left-4 border-0 text-textBlue" />
      <CarouselNext className="absolute right-4  border-0 text-textBlue" />
    </Carousel>

  )
}

export default Slider
