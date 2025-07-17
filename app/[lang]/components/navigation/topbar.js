
import Link from 'next/link'
import Image from 'next/image'
import { Search, Mail } from 'lucide-react'
import { TfiHeadphoneAlt } from "react-icons/tfi";

import MobileNavigation from './mobile-nav';
import PaddingContainer from '../layout/padding-container';
import SearchBar from '../layout/search-bar';
import HomneCategoryMenuWrapper from '../layout/HomeCategoryMenuWrapper';
import { getDictionary } from '@/libs/getDictionary';






const Topbar = async ({ locale }) => {

  const dictionary = await getDictionary(locale);
  return (
    <div className='flex flex-col w-full   '>

      {/* <!--top bar--> */}
      <section className="  w-full  h-32 md:h-12   px-4 md:px-20  bg-[#f2f2f2] ">


        <div className="flex flex-col md:flex-row justify-center md:justify-end h-full   ">


          <div className="w-full md:w-1/2 h-full  flex space-x-3 items-center  justify-center md:justify-end ">
            <SearchBar locale={locale} dictionary={dictionary} dataType="products" topBar={true} />
          </div>

          <div className="w-full md:w-1/2 h-full  flex space-x-6 rtl:space-x-5   items-center  justify-center md:justify-end mb-3 md:mb-0   first-letter: ">

            <Link href={`/contact`} className=" border border-textBlue rounded-sm text-sm px-3 py-1 text-textBlue hover:text-lightColorHover     " > {dictionary.topbar.customerSupport.button.getQuote}</Link>


            <div className='flex flex-row    '>
              <div className="flex items-center justify-center pr-3 rtl:pl-3   ">
                <TfiHeadphoneAlt size="25" className='text-textBlue' />
              </div>
              <div className='text-sm font-light'>
                {dictionary.topbar.customerSupport.title}<br />
                <Link className='font-normal text-textBlue' href='mailto:info@chemol.co.uk'>info@chempol.co.uk</Link>
              </div>
            </div>

          </div>
        </div>

      </section>
      {/* <!--End top bar--> */}



      {/* <!--logo container --> */}
      <PaddingContainer >
        <section className="  flex flex-col md:flex-row w-full   h-auto justify-between items-center space-y-5 md:space-y-0 py-3 md:py-4 px-4 md:px-2 ">

          <Link href={`/${locale}`} className="    ">

            <Image className='w-72 md:w-72'
              src={locale === 'ar' ? "/images/chempol-ar.png" : "/images/chempol.png"}
              width={350}
              height={150}
              priority
              alt="Chempol A Leading Manufacturer of Lubricant Additives and Specialty Chemicals in UAE"
            />
          </Link>

          <HomneCategoryMenuWrapper locale={locale} />

          <div className="flex justify-center md:hidden w-full      py-2 text-black text-4xl">
            <MobileNavigation locale={locale} />
          </div>


          <div className="text-gray-800 text-base cursor-pointer transition duration-500 hover:text-lightColorHover hidden   ">

            <Search className=' text-gray-500 hover:text-lightColorHover' size={28} strokeWidth={2} />

          </div>

        </section>

      </PaddingContainer>
      {/* <!--End logo container--> */}


    </div>
  )

}

export default Topbar
