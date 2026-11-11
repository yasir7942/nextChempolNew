
import { FaMapMarkerAlt } from "react-icons/fa";
import { getContactUsPageData } from "../../data/loader";
import { mapHref } from "@/libs/helper";



const FooterAddressList = async ({ locale = "en" }) => {

    const contactData = await getContactUsPageData(locale);


    return (
        <div>
            {contactData?.addressBook?.map((contact) => (



                <p key={contact.id} className="text-sm text-gray-300 font-light w-72  md:w-96 overflow-hidden  ">
                    {/* office map link from Strapi; falls back to a Google Maps search for the address */}
                    <a href={mapHref(contact.mapUrl, contact.address) || undefined} target="_blank" rel="noopener noreferrer" className="flex transition duration-300 ease-in-out hover:underline  hover:text-textBlue">
                        <FaMapMarkerAlt className="text-textBlue mr-3 mt-1 text-base max-w-40 rtl:ml-2 " />  {contact.address}
                    </a>
                </p>


            ))}






        </div>
    )
}

export default FooterAddressList
