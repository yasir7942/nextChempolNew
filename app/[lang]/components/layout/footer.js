import Image from "next/image";
import PaddingContainer from "./padding-container";

import siteConfig from "@/config/site";
import SocialIcons from "../elements/social-icons";
import { MdEmail } from "react-icons/md";
import { FaAngleLeft, FaPhoneAlt } from "react-icons/fa";

import { FaAngleRight } from "react-icons/fa";
import WhatsAppButton from "../elements/WhatsAppButton";
import FooterAddressList from "./footerAddressList";
import Link from "next/link";
import { getProductCategoryForHome } from "../../data/loader";
import { getDictionary } from "@/libs/getDictionary";


//import MenuFooterList from "./menu-footer-list";
//import MenuFooterPcategory from "./menu-footer-product-category";

const Footer = async ({ locale }) => {


  const dictionary = await getDictionary(locale);

  const categoryData = await getProductCategoryForHome(locale);
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

            <Link href={`/${locale}/`} className="w-64">
              <Image
                src={locale === 'ar' ? "/images/chempol-ar.png" : "/images/chempol.png"}
                width={350}
                height={150}
                alt="Chempol Additives and chemical specialty"
              />

            </Link>
            <p className="text-base pt-3 text-gray-300 font-light max-w-sm md:max-w-60 lg:max-w-80">
              {dictionary.footer.description}
            </p>

            <Link href={`/${locale}/privacy-policy/`} className=" text-gray-300 font-light transition duration-300 ease-in-out hover:underline  hover:text-textBlue"   >{dictionary.footer.privacyPolicy}</Link>




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
            <div className="capitalize text-textBlue font-medium py-4 text-xl  rtl:pr-4">{dictionary.footer.categories}</div>
            {/* <MenuFooterList /> */}

            <ul className="text-gray-300  space-y-1 font-light">

              {categoryData.data.map(cat => (

                <li key={cat.id} className="flex  items-center">
                  <FaAngleRight className="pr-2 text-textBlue rtl:hidden " />
                  <FaAngleLeft className="pl-2 text-textBlue ltr:hidden   " />
                  <Link href={`/${locale}/product-category/${cat.slug}/`} className="transition duration-300 ease-in-out hover:underline  hover:text-textBlue"   >{cat.title}</Link>
                </li>
              ))}


            </ul>

          </div>

          {/* Categories */}
          <div className="flex flex-col space-y-1   ">
            <div className="capitalize text-textBlue font-medium py-4 text-xl">{dictionary.footer.contactInfo}</div>
            <p className="text-base text-gray-300 font-light max-w-60">{dictionary.footer.contactDescription}</p>
            <p className="text-base text-gray-300 font-light max-w-60 flex  items-center "><FaPhoneAlt className="text-textBlue mr-2 rtl:ml-2 text-right " /> +971-(06)-5264688</p>
            <p className="text-base text-gray-300 font-light max-w-60 flex  items-center transition duration-300 ease-in-out hover:underline  hover:text-textBlue">
              <MdEmail className="text-textBlue mr-2 rtl:ml-2 " /> <Link href="mailto:info@chempol.co.uk">info@chempol.co.uk</Link>
            </p>


            <FooterAddressList />



          </div>

          {/* Get in Touch */}
          <div className="flex flex-col space-y-1 ">
            <div className="capitalize text-textBlue font-medium py-4 text-xl">{dictionary.footer.companySupport}</div>
            <Image
              src="/images/map.png"
              width={280}
              height={150}
              quality={75}
              alt="world map"
            />
            <p className="text-sm text-gray-300 font-light pt-10 max-w-60"> <span className="text-textBlue font-normal">{dictionary.footer.open}:</span> {dictionary.footer.days}</p>
            <p className="text-sm text-gray-300 font-light max-w-60">
              <span className="text-textBlue font-normal">{dictionary.footer.time}:</span>  {dictionary.footer.clock}
            </p>

            <p className="text-sm text-gray-300 font-light max-w-60">
              <span className="text-textBlue font-normal">{dictionary.footer.closed}:</span> {dictionary.footer.sunday}
            </p>


          </div>
        </div>
      </PaddingContainer>

      <div className="w-full mt-10 pt-5 border-0 border-t-[1px] border-textBlue font-light text-sm  text-white   bg-[#2D2D2D] text-center">
        {dictionary.footer.allCopyRights} <Link href={`${locale}/`} className="text-textBlue text-base rtl:pr-2" >chempol.co.uk</Link>
      </div>
    </footer>

  );
}

export default Footer;
