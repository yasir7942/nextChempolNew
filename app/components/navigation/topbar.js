
import Link from 'next/link'
import Image from 'next/image'
import { Search, Mail } from 'lucide-react'
import { TfiHeadphoneAlt } from "react-icons/tfi";
import MenuList from '../layout/menu-list';
import MobileNavigation from '../layout/mobile-nav';
import PaddingContainer from '../layout/padding-container';





const Topbar = () => {
  return (
    <div className='flex flex-col w-full   '>

      {/* <!--top bar--> */}
      <section className="  w-full  h-12 px-4 md:px-20  bg-[#f2f2f2] ">


        <div className="flex justify-center md:justify-end h-full  ">
          <div className="w-full md:w-1/2 h-full  flex space-x-6 items-center  justify-center md:justify-end ">

            <Link href={`/contact`} className=" border border-textBlue rounded-sm text-sm px-3 py-1 text-textBlue hover:text-lightColorHover" >Get a Qoute</Link>


            <div className='flex flex-row'>
              <div className="flex items-center justify-center pr-3 ">
                <TfiHeadphoneAlt size="25" className='text-textBlue' />
              </div>
              <div className='text-sm font-light'>
                Customer Support & Sales <br />
                <a className='font-normal text-textBlue' href='mailto:info@chemol.co.uk'>info@chempol.co.uk</a>
              </div>
            </div>

          </div>
        </div>

      </section>
      {/* <!--End top bar--> */}



      {/* <!--logo container --> */}
      <PaddingContainer >
        <section className="  flex flex-col md:flex-row w-full   h-auto justify-between items-center space-y-5 md:space-y-0 py-3 md:py-4 px-4 md:px-2 ">

          <a href="/" className="    ">

            <Image className='w-72 md:w-72'
              src="/images/chempol.png"
              width={350}
              height={200}
              alt="Chempol A Leading Manufacturer of Lubricant Additives and Specialty Chemicals in UAE"
            />
          </a>

          <MenuList />

          <div className="md:hidden text-black text-4xl">
            <MobileNavigation />
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
