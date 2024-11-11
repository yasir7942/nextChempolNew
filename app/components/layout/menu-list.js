"use client";

import Link from "next/link";
import React, { useState, useEffect } from 'react';
import { FaAngleRight } from "react-icons/fa";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { Search } from "lucide-react";
import { getProductCategoryForHome } from "@/app/data/loader";








const MenuList = ({ className, title, children, ...props }, ref) => {

  const [productCategory, setProductCategory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData1 = await getProductCategoryForHome();

        //  console.log("-----------------------product category  data--------------------------------------------------");
        // console.dir(productCategory, { depth:null});
        // console.log("---------------------------End-----------------------end-----------------------");

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
    <>
      <NavigationMenu className="hidden md:block z-50">
        <NavigationMenuList>

          <NavigationMenuItem>
            <Link href={`/`} legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg `}>
                Home
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>


          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-textBlue font-normal uppercase hover:text-darkGary hover:bg-none;   " >Category</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[400px] gap-4 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px] font-light ">
                {productCategory.data?.map((component, index) => (
                  <li key={index} className="flex items-center">
                    <FaAngleRight className="pr-2 text-textBlue" />
                    <Link className="transition duration-300 ease-in-out   hover:text-textBlue"
                      key={component.id}
                      title={component.title}
                      href={`/product-category/${component.slug}`}
                    >
                      {component.title}
                    </Link> </li>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-textBlue font-normal uppercase hover:text-darkGary    ">Company</NavigationMenuTrigger>
            <NavigationMenuContent >
              <ul className="grid gap-2 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1.2fr_1fr]  ">
                <li className="row-span-3 ">
                  <NavigationMenuLink asChild>
                    <Link
                      className="flex h-full w-full select-none flex-col justify-center rounded-md bg-gradient-to-b from-muted/50 to-muted p-3 no-underline outline-none focus:shadow-md"
                      href="/"
                    >
                      { /* <Icons.logo className="h-6 w-6" /> */}

                      <div className="mb-2 mt-2 text-lg font-medium text-textBlue">
                        Chempol
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground font-light">
                        Beautifully designed components that you can copy and
                        paste into your apps. Accessible. Customizable. Open
                        Source.
                      </p>
                    </Link>
                  </NavigationMenuLink>
                </li>
                <Link href={`/about-us`} title="Introduction" className="font-light  hover:text-textBlue ml-3 ">
                  About Us
                </Link>
                <Link href={`/faq`} title="Introduction" className="font-light  hover:text-textBlue ml-3 ">
                  FAQs
                </Link>
                <Link href={'/lubricant-additives-manufacturers-in-uae'} title="Typography" className="font-light hover:text-textBlue ml-3  ">
                  Lubricant Additives Manufacturers in UAE
                </Link>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href={`/blog`} legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg `}>
                Blog
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href={`/about-us`} legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg `}>
                About
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <Link href={`/contact`} legacyBehavior passHref>
              <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg `}>
                Contact
              </NavigationMenuLink>
            </Link>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>






    </>

  )
}









export default MenuList
