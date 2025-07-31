"use client";

import { IoMdMenu } from "react-icons/io";
import { useState, useEffect } from "react";
import { MdChevronRight } from "react-icons/md";
import { cache } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";
import Link from "next/link";
import SocialIcons from "../elements/social-icons";
import siteConfig from "@/config/site";
import Image from "next/image";
import { getProductCategoryForHome } from "../../data/loader";
import { getDictionary } from "@/libs/getDictionary";

const cachedGetProductCategoryForHome = cache(getProductCategoryForHome);

const MobileNavigation = ({ locale }) => {
  const [openSheet, setOpenSheet] = useState(false);
  const [productCategory, setProductCategory] = useState([]);
  const [error, setError] = useState(null);
  const [dictionary, setDictionary] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData1 = await cachedGetProductCategoryForHome(locale);
        setProductCategory(categoryData1);
      } catch (e) {
        setError(e);
        console.error("Error fetching product categories:", e);
      }
    };

    fetchData();
  }, [locale]);

  // Fetch dictionary data on the client side using useEffect
  useEffect(() => {
    const fetchDictionary = async () => {
      const dict = await getDictionary(locale);
      setDictionary(dict);
    };

    fetchDictionary();
  }, [locale]);


  // Ensure dictionary is loaded before rendering
  if (!dictionary) {
    return <div className="text-xs border-textBlue" > Loading...</div>;
  }



  return (
    <div>
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetTrigger asChild>
          <Link
            href="#"
            className="flex flex-row text-textBlue text-xl items-center"
          >
            {dictionary.navigation.menu} <IoMdMenu aria-label="Mobile Menu" size={20} />
          </Link>
        </SheetTrigger>

        <SheetContent className="w-[85%] border-l-4 border-textBlue bg-blue-50 overflow-scroll z-[999]">
          <SheetHeader>

            <SheetTitle className="hidden">Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col w-full h-full py-4 px-2">
            {/* ✅ Logo */}
            <Link href={`${locale}/`} className="w-[80%]">
              <Image
                src="/images/chempol.png"
                width={332}
                height={88}
                priority
                alt="Chempol Additives and Chemical logo"
              />
            </Link>
            <SheetDescription ></SheetDescription>

            <div className="mt-10">
              <ul className="flex flex-col space-y-2 text-lg text-textBlue font-normal">
                <li>
                  <Link
                    href="/"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.home}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/about-us`}
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.aboutus}
                  </Link>
                </li>

                {/* Product Categories */}
                <li>
                  <Link
                    href="#"
                    className="font-normal hover:text-textLightBlue transition"
                  >
                    {dictionary.navigation.productCategory}
                  </Link>
                  <div className="pl-3">
                    <ul className="space-y-1 font-light">
                      {productCategory?.data?.map((component, index) => (
                        <li key={index} className="flex items-center">
                          <MdChevronRight />
                          <Link
                            className="hover:text-textLightBlue transition"
                            onClick={() => setOpenSheet(false)}
                            href={`/${locale}/product-category/${component.slug}`}
                          >
                            {component.title}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>

                <li>
                  <Link
                    href={`/${locale}/lubricant-additives-manufacturers-in-uae`}
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.lubricantAdditives}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/faq`}
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.faq}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/blog`}
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.blog}
                  </Link>
                </li>
                <li>
                  <Link
                    href={`/${locale}/contact`}
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    {dictionary.navigation.contact}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Icons */}
            <div className="mt-10  flex space-x-7">
              <SocialIcons
                plateform="facebook"
                link={siteConfig.socialMedia.facebook}
              />
              <SocialIcons
                plateform="instagram"
                link={siteConfig.socialMedia.instagram}
              />
              <SocialIcons
                plateform="twitter"
                link={siteConfig.socialMedia.twitter}
              />
              <SocialIcons
                plateform="youtube"
                link={siteConfig.socialMedia.youtube}
              />
            </div>
            <div className="w-full flex  flex-row min-h-3"> </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
