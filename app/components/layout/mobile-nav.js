"use client";

import { useState } from 'react';
import { IoMdMenu } from "react-icons/io";


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



const MobileNavigation = () => {

  const [openSheet, setOpenSheet] = useState(false);



  return (
    <div>
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetTrigger asChild><a href="#" className='flex flex-row items-center justify-start'>Menu <IoMdMenu aria-label={`Mobile Menu`} size={32} /> </a></SheetTrigger>
        <SheetContent className="w-72">
          <SheetHeader>

            <SheetDescription >

              <div className="flex flex-col w-full h-full justify-between items-center py-6 px-4 relative     ">

                <a href="/" className="w-[80%]">
                  <Image
                    src="/images/logo-332x88.png"
                    width={332}
                    height={88}
                    alt="Chempol Addtives and Chemical logo" />
                </a>


                <ul className="flex flex-col text-gray-200 mt-10 space-y-3 text-center  text-lg  font-light capitalize tracking-wider ">
                  <li><Link href={`/`} onClick={() => { setOpenSheet(false) }} > Home</Link></li>
                  <li><Link href={`/about-us`} onClick={() => { setOpenSheet(false) }} > About Us</Link></li>
                  <li> <Link href={`/products`} onClick={() => { setOpenSheet(false) }} > Product </Link></li>
                  <li><Link href={`/blog`} onClick={() => { setOpenSheet(false) }} > Blog </Link></li>
                  <li><Link href={`/contact`} onClick={() => { setOpenSheet(false) }}  >Contact Us</Link></li>
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
        </SheetContent>
      </Sheet>

    </div>
  )
}

export default MobileNavigation
