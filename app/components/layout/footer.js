import Image from "next/image";
import PaddingContainer from "./padding-container";
import { getProductCategoryForHome } from "@/app/data/loader";
import siteConfig from "@/config/site";
import SocialIcons from "../elements/social-icons";
import { MdEmail } from "react-icons/md";
import { FaPhoneAlt } from "react-icons/fa";
import { FaMapMarkerAlt } from "react-icons/fa";
import { FaAngleRight } from "react-icons/fa";
import WhatsAppButton from "../elements/WhatsAppButton";
import FooterAddressList from "./footerAddressList";


//import MenuFooterList from "./menu-footer-list";
//import MenuFooterPcategory from "./menu-footer-product-category";

const Footer = async () => {

  const categoryData = await getProductCategoryForHome();
  // console.log("-----------------------product category  data--------------------------------------------------");
  //    console.dir(categoryData, { depth:null});
  //  console.log("---------------------------End-----------------------end-----------------------");

  return (

    <footer className="w-full pt-16 relative z-20    pb-10 bg-[#2D2D2D]">


      <WhatsAppButton />

      <PaddingContainer>
        <div className="w-full flex flex-col md:flex-row  md:pt-25  pl-12 md:pl-0 space-y-10 md:space-y-0 justify-between">
          {/* About Company */}
          <div className="flex flex-col space-y-3">

            <a href="/" className="w-64">
              <Image
                src="/images/chempol.png"
                width={500}
                height={300}
                alt="Chempol Additives and chemical specialty"
              />
            </a>
            <p className="text-base pt-3 text-gray-300 font-light max-w-sm md:max-w-60 lg:max-w-80">
              We remain true to the principles of our company: providing superior service to our clients, creating opportunities for our people.
            </p>
            <div className="flex flex-wrap space-x-2 line pr-3">
              {/**    {Object.keys(siteConfig.socialMedia).map((platform) => (
                  <SocialIcons
                    key={platform}
                    plateform={platform}
                    dark
                    link={siteConfig.socialMedia[platform]}
                  />
                ))}
            */}


            </div>



            {<ul className="flex flex-wrap  md:w-60  lg:w-72  gap-2 line pr-3  ">
              <li><SocialIcons plateform="facebook" dark link={siteConfig.socialMedia.facebook} /></li>
              <li><SocialIcons plateform="instagram" dark link={siteConfig.socialMedia.instagram} /></li>
              <li><SocialIcons plateform="twitter" dark link={siteConfig.socialMedia.twitter} /></li>
              <li><SocialIcons plateform="linkedin" dark link={siteConfig.socialMedia.linkedin} /></li>
              <li><SocialIcons plateform="youtube" dark link={siteConfig.socialMedia.youtube} /></li>
            </ul>
            }

          </div>

          {/* Quick Links */}
          <div className="flex flex-col space-y-3">
            <div className="capitalize text-textBlue font-medium py-4 text-xl">Categories</div>
            {/* <MenuFooterList /> */}



            <ul className="text-gray-300  space-y-1 font-light">

              {categoryData.data.map(cat => (

                <li key={cat.id} className="flex  items-center">
                  <FaAngleRight className="pr-2 text-textBlue" />
                  <a href={`/product-category/${cat.slug}/`} className="transition duration-300 ease-in-out hover:underline  hover:text-textBlue"   >{cat.title}</a>
                </li>
              ))}


            </ul>

          </div>

          {/* Categories */}
          <div className="flex flex-col space-y-1   ">
            <div className="capitalize text-textBlue font-medium py-4 text-xl">Contact info</div>
            <p className="text-base text-gray-300 font-light max-w-60">You can always contact us via email or phone. Get a quote now!</p>
            <p className="text-base text-gray-300 font-light max-w-60 flex  items-center "><MdEmail className="text-textBlue mr-2" /> +971-(06)-5264688</p>
            <p className="text-base text-gray-300 font-light max-w-60 flex  items-center transition duration-300 ease-in-out hover:underline  hover:text-textBlue">
              <FaPhoneAlt className="text-textBlue mr-2" /> <a href="mailto:info@chempol.co.uk">info@chempol.co.uk</a>
            </p>


            <FooterAddressList />



          </div>

          {/* Get in Touch */}
          <div className="flex flex-col space-y-1 ">
            <div className="capitalize text-textBlue font-medium py-4 text-xl">Company support</div>
            <Image
              src="/images/map.png"
              width={280}
              height={150}
              alt="world map"
            />
            <p className="text-sm text-gray-300 font-light pt-10 max-w-60"> <span className="text-textBlue font-normal">Open:</span>  Monday - Saturday</p>
            <p className="text-sm text-gray-300 font-light max-w-60">
              <span className="text-textBlue font-normal">Time:</span>  9:00 AM - 6:00 PM
            </p>

            <p className="text-sm text-gray-300 font-light max-w-60">
              <span className="text-textBlue font-normal">Closed:</span> Sunday
            </p>


          </div>
        </div>
      </PaddingContainer>

      <div className="w-full mt-10 pt-5 border-0 border-t-[1px] border-textBlue font-light text-sm  text-white   bg-[#2D2D2D] text-center">
        All Copyrights Received By <a href="/" className="text-textBlue text-base" >chempol.co.uk</a>
      </div>
    </footer>

  );
}

export default Footer;
