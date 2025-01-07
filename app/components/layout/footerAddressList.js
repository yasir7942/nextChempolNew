import { getContactUsPageData } from "@/app/data/loader";
import { FaMapMarkerAlt } from "react-icons/fa";



const FooterAddressList = async () => {

    const contactData = await getContactUsPageData();


    return (
        <div>
            {contactData.addressBook?.map((contact) => (



                <p key={contact.id} className="text-sm text-gray-300 font-light   w-96  ">
                    <a href={contact.mapUrl} target="_blank" rel="noopener noreferrer" className="flex transition duration-300 ease-in-out hover:underline  hover:text-textBlue">
                        <FaMapMarkerAlt className="text-textBlue mr-3 mt-1 text-base max-w-40 " />  {contact.address}
                    </a>
                </p>


            ))}






        </div>
    )
}

export default FooterAddressList
