"use client";

import Link from "next/link";
import { FaAngleLeft, FaAngleRight } from "react-icons/fa";
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

export default function MenuList({ locale, productCategory, dictionary }) {
  return (
    <NavigationMenu className="hidden md:block z-50" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <NavigationMenuList>
        {/* Home */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/${locale}`}
              className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}
            >
              {dictionary.navigation.home}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Category Dropdown */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-textBlue font-normal uppercase hover:text-darkGary ">
            {dictionary.navigation.category}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-4 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px]  font-light bg-white">
              {productCategory?.data?.map((component, index) => (
                <li key={index} className="flex items-center">
                  <FaAngleRight className="pr-2 text-textBlue rtl:hidden" />
                  <FaAngleLeft className="pl-2 text-textBlue ltr:hidden" />
                  <Link
                    className="transition duration-300 ease-in-out hover:text-textBlue capitalize"
                    href={`/${locale}/product-category/${component.slug}`}
                  >
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
            {dictionary.navigation.company}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid gap-2 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[1.2fr_1fr] bg-white">
              <li className="row-span-3">
                <NavigationMenuLink asChild>
                  <div className="flex h-full w-full select-none flex-col justify-center rounded-md bg-blue-50 p-3 focus:shadow-md">
                    <div className="mb-2 mt-2 text-lg font-medium text-textBlue">
                      {dictionary.navigation.chempol}
                    </div>
                    <p className="text-sm leading-tight text-gray-800 font-light">
                      {dictionary.navigation.chempolDescription}
                    </p>
                  </div>
                </NavigationMenuLink>
              </li>
              <Link href={`/${locale}/about-us`} className="font-light hover:text-textBlue ml-3 rtl:mr-2">
                {dictionary.navigation.about}
              </Link>
              <Link href={`/${locale}/faq`} className="font-light hover:text-textBlue ml-3 rtl:mr-2">
                {dictionary.navigation.faq}
              </Link>
              <Link href={`/${locale}/lubricant-additives-manufacturers-in-uae`} className="font-light hover:text-textBlue ml-3 rtl:mr-2">
                {dictionary.navigation.lubricantAdditives}
              </Link>
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Blog */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/${locale}/blog`}
              className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}
            >
              {dictionary.navigation.blog}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* About */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/${locale}/about-us`}
              className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}
            >
              {dictionary.navigation.about}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>

        {/* Contact */}
        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              href={`/${locale}/contact`}
              className={`${navigationMenuTriggerStyle()} text-textBlue font-normal uppercase hover:text-darkGary text-lg`}
            >
              {dictionary.navigation.contact}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
