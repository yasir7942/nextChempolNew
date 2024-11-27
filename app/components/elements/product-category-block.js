import { getImageUrl } from "@/libs/helper"
import Image from "next/image"


const ProductCategoryBlock = ({ colorImage, grayImage, url, text }) => {
  return (


    <div className=" relative w-54 h-64   md:w-64  md:h-54 lg:w-72 lg:h-72 xl:w-72 xl:h-80  rounded-md overflow-hidden group   ">
      <a href={'/product-category/' + url} >
        <Image className="absolute inset-0 w-full h-full object-cover transition duration-300 ease-in-out" src={getImageUrl(grayImage)} width={500} height={500} alt={text} />
        <Image className="absolute inset-0 w-full h-full object-cover opacity-0 transition duration-300 ease-in-out group-hover:opacity-100" src={getImageUrl(colorImage)} width={500} height={500} alt={text} />
        <div className="text-darkYellow text-2xl   lg:text-3xl font-normal absolute bottom-4 left-3  uppercase drop-shadow-[0px_1px_18px_rgba(0,0,0,1)]" >{text}  </div>
      </a>

    </div>

  )
}

export default ProductCategoryBlock
