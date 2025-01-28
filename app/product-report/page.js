

import Image from "next/image";
import PaddingContainer from "../components/layout/padding-container";

 
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import ReadProductReport from "../components/layout/product-report";
 



export async function generateMetadata(props) {
  const params = await props.params;

  const metadataParams = {
    pageTitle:   "Product Report",
    pageSlug: "product-report",
    pageDescription: "product Report Page",
    seoTitle: "Product Report",
    seoDescription: "Product Report",
    rebotStatus: true,
    canonicalLinks: "product-report",
    dataPublishedTime: "",
    category: "",
    image: "",
    imageAlternativeText:  "",
    imageExt:  "",
  };

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}
  

  


const ProductReport = () => {
  return (
    <div className="mt-5 bg-white w-full h-auto p-5">
  

        <PaddingContainer>
        <h1 className="text-2xl font-semibold text-center ">Product Report <span className="font-light block text-base font-serif">(Use Desktop Browser)</span></h1> 
        <h2 className="text-md font-light text-center pb-5">Product Data Analysis on one Page</h2> 

        <ReadProductReport />
        </PaddingContainer>
         
    </div>
   
             
 
  )
}

export default ProductReport
