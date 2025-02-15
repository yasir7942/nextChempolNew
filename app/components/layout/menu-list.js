"use client";

import Link from "next/link";
import { FaAngleRight } from "react-icons/fa";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

import siteConfig from "@/config/site";

export default function MenuList({ productCategory }) {
  return (
    <NavigationMenu className="hidden md:block z-50">
      <NavigationMenuList>
        <NavigationMenuItem>
          <Link href={`/`} legacyBehavior passHref>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}>
              Home
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        {/* Category Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-textBlue font-normal uppercase hover:text-darkGary">
            Category
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-4 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px] font-light">
              {productCategory?.data?.map((component, index) => (
                <li key={index} className="flex items-center">
                  <FaAngleRight className="pr-2 text-textBlue" />
                  <Link className="transition duration-300 ease-in-out hover:text-textBlue" href={`/product-category/${component.slug}`}>
                    {component.title}
                  </Link>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Company Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-textBlue font-normal uppercase hover:text-darkGary">
            Company
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1.2fr_1fr]">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <Link className="flex h-full w-full select-none flex-col justify-center rounded-md bg-blue-50 p-3 no-underline outline-none focus:shadow-md" href="/">
                    <div className="mb-2 mt-2 text-lg font-medium text-textBlue">Chempol</div>
                    <p className="text-sm leading-tight text-muted-foreground text-gray-800 font-light">
                      {siteConfig.description}
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              <Link href={`/about-us`} className="font-light hover:text-textBlue ml-3">
                About Us
              </Link>
              <Link href={`/faq`} className="font-light hover:text-textBlue ml-3">
                FAQs
              </Link>
              <Link href={`/lubricant-additives-manufacturers-in-uae`} className="font-light hover:text-textBlue ml-3">
                Lubricant Additives Manufacturers in UAE
              </Link>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Other Links */}
        <NavigationMenuItem>
          <Link href={`/blog`} legacyBehavior passHref>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}>
              Blog
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href={`/about-us`} legacyBehavior passHref>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}>
              About
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <Link href={`/contact`} legacyBehavior passHref>
            <NavigationMenuLink className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}>
              Contact
            </NavigationMenuLink>
          </Link>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
