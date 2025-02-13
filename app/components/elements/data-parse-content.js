"use client"

import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import Image from "next/image";



const BodyDataParse = ({ content }) => {

   //data parse of  rich-text 

   if (!content) return null;

   return <BlocksRenderer content={content} blocks={{
      image: ({ image }) => {
         // console.log(image);
         return (
            <Image className="object-cover object-center my-3" src={image.url} width={image.width} height={image.height}
               alt={image.alternativeText || ""} />
         )
      }
   }} />


}

export default BodyDataParse





