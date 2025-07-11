import { Handshake } from "lucide-react"
import Image from "next/image"


const ImageIconCard = () => {
  return (
    <div>
       {/* <!--card--> */}
       
       <div  className=" flex flex-col  relative  bg-black w-full px-10 py-20   md:px-20  md:pl-10  md:py-16 ">
            
            <a href="card-link">
               
            <div className="absolute  inset-0 z-10 bg-gray-500-500/80"></div>
            <Image
            className=" z-10 absolute bottom-0 left-0 right-0 top-0 h-full w-full overflow-hidden  object-cover object-center  
            opacity-90 transition duration-300 ease-in-out hover:opacity-60 group-hover:text-white "
            src="/images/Chempol-About-us.jpg"
            width={500}
            height={300}
            alt="" />
            </a>
            
            <div className=" z-20 text-surface  text-white ">
            <Handshake size={28}  strokeWidth={2}  className="text-lightColorHover hover:text-while" />
              <div className="mb-2 pr-10 uppercase text-xl text-gray-900 ">Chempol</div>
            <div className="mb-2 uppercase text-xl text-gray-900  ">Core Values</div>
          
          <button
            type="button"
            className="text-lightColorHover mt-5 rounded bg-primary font-semibold pb-2 pt-2.5 text-xs  uppercase leading-normal  shadow-primary-3 transition duration-150 ease-in-out hover:text-white hover:shadow-primary-2 focus:bg-primary-accent-300 focus:shadow-primary-2 focus:outline-none focus:ring-0 active:bg-primary-600 active:shadow-primary-2"
            data-twe-ripple-init
            data-twe-ripple-color="light">
            Read More &#x27AA;
          </button>
        </div>
      
        </div>

          {/* <!--end card--> */}
    </div>
  )
}

export default ImageIconCard
