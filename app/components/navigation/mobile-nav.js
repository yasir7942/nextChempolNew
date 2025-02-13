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
import { getProductCategoryForHome } from "@/app/data/loader";

const cachedGetProductCategoryForHome = cache(getProductCategoryForHome);

const MobileNavigation = () => {
  const [openSheet, setOpenSheet] = useState(false);
  const [productCategory, setProductCategory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoryData1 = await cachedGetProductCategoryForHome();
        setProductCategory(categoryData1);
      } catch (e) {
        setError(e);
        console.error("Error fetching product categories:", e);
      }
    };

    fetchData();
  }, []);

  return (
    <div>
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetTrigger asChild>
          <Link
            href="#"
            className="flex flex-row text-textBlue text-xl items-center"
          >
            Menu <IoMdMenu aria-label="Mobile Menu" size={20} />
          </Link>
        </SheetTrigger>

        <SheetContent className="w-[85%] border-l-4 border-textBlue bg-blue-50 overflow-scroll z-[999]">
          <SheetHeader>

            <SheetTitle className="hidden">Menu</SheetTitle>
          </SheetHeader>

          <div className="flex flex-col w-full h-full py-4 px-2">
            {/* ✅ Logo */}
            <Link href="/" className="w-[80%]">
              <Image
                src="/images/chempol.png"
                width={332}
                height={88}
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
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/about-us"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    About Us
                  </Link>
                </li>

                {/* Product Categories */}
                <li>
                  <Link
                    href="#"
                    className="font-normal hover:text-textLightBlue transition"
                  >
                    Product Category
                  </Link>
                  <div className="pl-3">
                    <ul className="space-y-1 font-light">
                      {productCategory?.data?.map((component, index) => (
                        <li key={index} className="flex items-center">
                          <MdChevronRight />
                          <Link
                            className="hover:text-textLightBlue transition"
                            onClick={() => setOpenSheet(false)}
                            href={`/product-category/${component.slug}`}
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
                    href="/lubricant-additives-manufacturers-in-uae"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    Lubricant Additives Manufacturers in UAE
                  </Link>
                </li>
                <li>
                  <Link
                    href="/faq"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    FAQs
                  </Link>
                </li>
                <li>
                  <Link
                    href="/blog"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    Blog
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-textLightBlue transition"
                    onClick={() => setOpenSheet(false)}
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Social Icons */}
            <div className="mt-10 flex space-x-7">
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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNavigation;
