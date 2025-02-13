"use client";

import { IoMdMenu } from "react-icons/io";
import { useState } from "react";
import Link from "next/link";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription
} from "@/components/ui/sheet";

const ProductCategoryMenu = ({ menuData }) => {
  const [openSheet, setOpenSheet] = useState(false);

  return (
    <div>
      {/* Desktop View */}
      <div className="hidden md:flex flex-row md:flex-col space-y-0 space-x-2 md:space-y-2 md:space-x-0 text-black capitalize">
        <div className="flex flex-col space-y-3 text-base md:font-normal md:text-lg">
          <a href="#">Products Categories</a>
          <div className="w-full h-[1px] bg-[#0f0f0f]"></div>
        </div>

        {/* Category Menu */}
        {menuData.map((menu) => (
          <div key={menu.id} className="flex flex-col space-y-3 text-base md:font-light md:text-base">
            <Link href={`/product-category/${menu.slug}`} className="transition duration-300 ease-in-out hover:text-textBlue">
              - {menu.title}
            </Link>
          </div>
        ))}
      </div>

      {/* Mobile View */}
      <div className="flex flex-row justify-start md:hidden text-gray-900 ">
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger className="flex justify-start items-end space-x-2 ">
            <IoMdMenu size={20} />
            <div className="font-light">Product Category</div>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] z-[999]">
            <SheetHeader>
              {/* Added SheetTitle for accessibility */}
              <SheetTitle className="hidden">Product Categories</SheetTitle>
            </SheetHeader>
            <SheetDescription></SheetDescription>
            {/* FIX: Replacing SheetDescription with a div to avoid <p> containing <div> */}
            <div className="h-screen w-full pb-16">
              <div className="w-full h-full overflow-hidden py-3">
                <div className="w-full h-full overflow-y-auto">
                  <div className="flex flex-col space-y-3 text-left mb-5 text-base font-normal">
                    <a href="#">Products Categories</a>
                  </div>

                  {/* Category Menu */}
                  {menuData.map((menu) => (
                    <div key={"mobile-" + menu.id} className="flex flex-col text-left pl-2 space-y-3 mt-2 text-base font-light">
                      <Link href={`/product-category/${menu.slug}`} onClick={() => setOpenSheet(false)}>
                        {menu.title}
                      </Link>
                      <div className="w-[75%] h-[1px] bg-gray-300"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default ProductCategoryMenu;
