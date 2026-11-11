"use client"

import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import Image from "next/image";



const BodyDataParse = ({ content }) => {

   //data parse of  rich-text 

   if (!content) return null;

   return <BlocksRenderer content={content} blocks={{
      // Each page has exactly one <h1> of its own. Heading-1 blocks from Strapi render
      // as <h2>, styled like the old <h1> (see .content-h1 in globals.css).
      heading: ({ children, level }) => {
         if (level === 1) return <h2 className="content-h1">{children}</h2>;

         const Heading = `h${level}`;
         return <Heading>{children}</Heading>;
      },
      image: ({ image }) => {
         // console.log(image);
         return (
            <Image className="object-cover object-center my-3 w-full" quality={100} src={image.url} width={image.width} height={image.height}
               alt={image.alternativeText || ""} />
         )
      }
   }} />


}

export default BodyDataParse





