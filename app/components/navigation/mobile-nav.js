"use client";

import { IoMdMenu } from "react-icons/io";
import React, { useState, useEffect } from 'react';
import { MdChevronRight } from "react-icons/md";




import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import Link from "next/link";
import SocialIcons from '../elements/social-icons';
import siteConfig from '@/config/site';
import Image from 'next/image';
import { getProductCategoryForHome } from '@/app/data/loader';



const MobileNavigation = () => {

  const [openSheet, setOpenSheet] = useState(false);
  const [productCategory, setProductCategory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData1 = await getProductCategoryForHome();

        /*  console.log("-----------------------product category  data--------------------------------------------------");
          console.dir(productCategory, { depth: null });
          console.log("---------------------------End-----------------------end-----------------------");
  */
        setProductCategory(categoryData1);



      } catch (e) {
        setError(e);
        console.error('An error occurred while fetching the data: ', e);
      } finally {

      }
    };

    fetchData();
  }, []);



  return (
    <div >
      <Sheet open={openSheet} onOpenChange={setOpenSheet}   >
        <SheetTrigger asChild><a href="#" className='   flex   flex-row text-textBlue text-xl items-center justify-start  '>Menu <IoMdMenu aria-label={`Mobile Menu`} size={20} /> </a></SheetTrigger>
        <SheetContent className="w-96  border-l-4 border-textBlue bg-blue-50 ">
          <SheetHeader>

            <SheetDescription   >

              <div className="flex flex-col w-full h-full justify-between items-left py-4 px-2 relative    ">



                <a href="/" className="w-[80%]">
                  <Image
                    src="/images/chempol.png"
                    width={332}
                    height={88}
                    alt="Chempol Addtives and Chemical logo" />
                </a>


                <ul className="flex flex-col   mt-10 space-y-2   text-lg text-textBlue font-normal capitalize  text-left   ">
                  <li><Link href={`/`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > Home</Link></li>
                  <li><Link href={`/about-us`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > About Us</Link></li>

                  <li className=" " ><Link href="#" className="font-normal hover:text-textLightBlue  animation">Product Category  </Link>

                    <ul className="    space-y-1 pl-3   font-light ">
                      {productCategory.data?.map((component, index) => (

                        <li key={index} className="flex items-center " > <MdChevronRight /> <Link className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} key={component.id}
                          title={component.title} href={`/product-category/${component.slug}`} >  {component.title} </Link></li>

                      ))}
                    </ul>
                  </li>


                  <li> <Link href={'/lubricant-additives-manufacturers-in-uae'} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > Lubricant Additives Manufacturers in UAE </Link></li>
                  <li> <Link href={`/faq`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > FAQs </Link></li>
                  <li> <Link href={`/about-us`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > About Us </Link></li>
                  <li><Link href={`/blog`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }} > Blog </Link></li>
                  <li><Link href={`/contact`} className="  hover:text-textLightBlue  animation" onClick={() => { setOpenSheet(false) }}  >Contact Us</Link></li>
                </ul>




                <ul className="flex text-white space-x-7 mt-10 ">
                  <li><SocialIcons plateform="facebook" link={siteConfig.socialMedia.facebook} /></li>
                  <li><SocialIcons plateform="instagram" link={siteConfig.socialMedia.instagram} /></li>
                  <li><SocialIcons plateform="twitter" link={siteConfig.socialMedia.twitter} /></li>
                  <li><SocialIcons plateform="youtube" link={siteConfig.socialMedia.youtube} /></li>
                </ul>
              </div>


            </SheetDescription>
          </SheetHeader>
        </SheetContent >
      </Sheet >

    </div >
  )
}

export default MobileNavigation
