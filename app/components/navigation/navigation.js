
import Link from 'next/link'
import {ChevronDown} from 'lucide-react'
import PaddingContainer from '../layout/padding-container'
 

const Navigation = () => {
  return (
    <div>


   {/* <!--manu container --> */}
   
   
   
    <div className="flex w-full h-20 justify-between items-center  bg-gray-800 ">
      
    <PaddingContainer>
        <ul className="hidden md:flex  space-x-6  text-base uppercase text-gray-100 ">
            <li><Link   href="#">Home</Link></li>
            <li  ><Link href="#">Categories  <span className="text-sm  inline" ><ChevronDown size="12" /></span></Link></li>
            <li><Link href="#">Company <span className="text-sm" >&#8744</span></Link></li>
            <li><Link href="#">Blog</Link></li>  
            <li><Link href="#">About Us</Link></li>   
            <li><Link href="#">Contact Us</Link></li>
        </ul>
        
       

        <div className="md:hidden w-full cursor-pointer  px-10 pt-2 py-3 pb-4 rounded font-semibold text-white text-xl justify-center text-center">
            MENU  <span className="text-3xl font-semibold" > &#8801 </span> 
           
        </div>

        </PaddingContainer>

      </div>
     {/* <!--End manu container--> */}

   

    </div>
  )
}

export default Navigation
