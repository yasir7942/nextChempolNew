
import Link from 'next/link'
import Image from 'next/image'
import { Search, Mail } from 'lucide-react'
import { TfiHeadphoneAlt } from "react-icons/tfi";

import MobileNavigation from './mobile-nav';
import PaddingContainer from '../layout/padding-container';
import SearchBar from '../layout/search-bar';
import HomneCategoryMenuWrapper from '../layout/HomeCategoryMenuWrapper';
import { getDictionary } from '@/libs/getDictionary';
import LangSwitcher from './lang-switcher';
import HeaderQuoteButton from '../elements/header-quote-button';






const Topbar = async ({ locale }) => {

  const dictionary = await getDictionary(locale);
  return (
    <div className='flex flex-col w-full   '>

      {/* <!--top bar--> */}
      <section className="w-full bg-[#F1F6FA]">
        {/* same side padding as the logo / navigation row below, without its stacking layer so the suggestions overlay it */}
        <div className="px-4 md:px-6 lg:px-16 2xl:px-60">
          <div className="flex flex-col gap-3 py-3 md:flex-row md:items-center md:justify-between md:gap-6 md:h-16 md:py-0">

            {/* search: own full-width row on mobile, about 42% on desktop */}
            <div className="w-full md:w-[42%]">
              <SearchBar locale={locale} dictionary={dictionary} dataType="products" topBar={true} />
            </div>

            <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-3 md:w-auto md:flex-nowrap md:justify-end md:gap-5">
              <div className="flex items-center gap-3">
                <TfiHeadphoneAlt aria-hidden="true" size="24" className="shrink-0 text-textBlue" />
                <div className="text-sm leading-tight font-light text-[#0F2A4A]">
                  {dictionary.topbar.customerSupport.title}<br />
                  <Link className="font-normal text-textBlue hover:underline" href="mailto:info@chempol.co.uk">info@chempol.co.uk</Link>
                </div>
              </div>

              <div className="flex items-center gap-3 md:gap-4 md:border-s md:border-[#CFDCE8] md:ps-5">
                <LangSwitcher Locale={locale} />
                <HeaderQuoteButton locale={locale} dictionary={dictionary.inquiry} label={dictionary.topbar.customerSupport.button.getQuote} />
              </div>
            </div>

          </div>
        </div>

      </section>
      {/* <!--End top bar--> */}



      {/* <!--logo container --> */}
      <PaddingContainer >
        <section className="  flex flex-col md:flex-row w-full   h-auto justify-between items-center space-y-5 md:space-y-0 py-3 md:py-4 px-4 md:px-2 ">

          <Link href={`/${locale}/`} className="    ">

            <Image className='w-72 md:w-72'
              src={locale === 'ar' ? "/images/chempol-ar.png" : "/images/chempol.png"}
              width={350}
              height={150}
              priority
              sizes="288px"
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
