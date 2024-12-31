import { MousePointerClick } from "lucide-react"
import Image from "next/image"
import PaddingContainer from "./padding-container"


const CTAcard = () => {
  return (
    <div className="relative w-full h-auto mt-10 overflow-hidden   py-32 2xl:py-44">


      {/* overlay */}
      <div className="absolute  inset-0 z-10 bg-gray-400/10"></div>
      {/* Image */}
      <Image
        fill
        src="/images/Chempol-CTA-BANNER.webp"
        className="w-full object-cover object-center "
      />

      <PaddingContainer>
        {/* Text */}
        <div className="relative z-30 ">
          <div className="uppercase text-lg text-gray-700 font-light ">Work with Us</div>
          <h3 className="text-2xl uppercase tracking-wider text-gray-800 mt-5">WE ARE A GLOBAL <br /> NETWORK OF EXPERTS</h3>

          {/* <!--button--> */}
          <div className=" flex  items-center text-center pt-5 pl-3 w-52 md:pl-0" >
            <a className="uppercase px-6 py-3 text-white bg-gray-600  hover:bg-blue-400 hover:text-white 
            transition decoration-purple-500 ease-in-out " href={`/contact/`} >Contact us <MousePointerClick className="inline-block pl-2 " size={26} /> </a>
          </div>
        </div>

      </PaddingContainer>

    </div>
  )
}

export default CTAcard
