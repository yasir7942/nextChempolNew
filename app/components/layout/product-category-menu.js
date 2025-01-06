"use client";

import { IoMdMenu } from "react-icons/io";
import { useState, useEffect } from "react";
import { geProductCategoryLeftMenu } from "@/app/data/loader";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import Link from "next/link";
import { cache } from 'react';
/*
const ProductCategoryMenu = async () => {
  
  const menuData = await geProductCategoryLeftMenu();
  const filteredMenuData = menuData.data.filter(
    (menu) => menu.products.data.length > 0
  );

  */

const cachedGeProductCategoryLeftMenu = cache(geProductCategoryLeftMenu);

const ProductCategoryMenu = () => {
  const [menuData, setMenuData] = useState([]);
  const [openSheet, setOpenSheet] = useState(false);

  // Fetch data on client-side when component mounts
  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        const response = await cachedGeProductCategoryLeftMenu();


        /* const filteredData = response.data.filter(
           (menu) => menu.products.data.length > 0
         );*/

        setMenuData(response.data);
      } catch (error) {
        console.error("Error fetching product categories:", error);
      }
    };

    fetchMenuData();
  }, []);

  return (
    <div>
      <div className="hidden md:flex flex-row md:flex-col space-y-0 space-x-2 md:space-y-2 md:space-x-0 text-black capitalize">
        <div className="fex fex-col space-y-3 text-base md:font-normal md:text-lg">
          <a href="#">Products Categories</a>
          <div className="w-full h-[1px] bg-[#0f0f0f]"> </div>
        </div>
        {menuData.map((menu) => (
          <div key={menu.id} className="fex fex-col space-y-3 text-base md:font-light md:text-base ">
            <Link href={`/product-category/${menu.slug}`} className=" transition duration-300 ease-in-out hover:text-textBlue">
              - {menu.title}
            </Link>

          </div>
        ))}
      </div>

      <div className="flex flex-row justify-start md:hidden text-gray-900">
        <Sheet open={openSheet} onOpenChange={setOpenSheet} >
          <SheetTrigger className="flex justify-start items-end space-x-2 ">
            <IoMdMenu size={20} />
            <div className="font-light">Product Category</div>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] ">
            <SheetHeader>
              <SheetDescription className="h-screen w-full pb-16  ">
                <div className="w-full h-full overflow-hidden py-3">
                  <div className="w-full h-full overflow-y-auto  ">
                    <div className="fex fex-col space-y-3 text-left mb-5 text-base font-normal">
                      <a href="#">Products Categories</a>
                    </div>
                    {menuData.map((menu) => (
                      <div key={"mobile-" + menu.id} className="fex fex-col text-left pl-2 space-y-3 mt-2 text-base font-light">
                        <Link href={`/product-category/${menu.slug}`} onClick={() => setOpenSheet(false)} >{menu.title}</Link>
                        <div className="w-[75%] h-[1px] bg-gray-300"> </div>
                      </div>
                    ))}
                  </div>
                </div>
              </SheetDescription>
            </SheetHeader>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default ProductCategoryMenu;
