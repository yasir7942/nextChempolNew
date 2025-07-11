
import { FaFacebook, FaInstagramSquare, FaLinkedin, FaPinterestSquare, FaSnapchatSquare, FaTwitterSquare, FaVimeoSquare, FaYoutube, FaYoutubeSquare } from "react-icons/fa";
import { AiFillTikTok } from "react-icons/ai";
import { PiBuildingOfficeFill } from "react-icons/pi";


const SocialIcons = ({ plateform, link, dark = false }) => {


     const getIcon = (plateform) => {
          switch (plateform) {
               case "facebook":
                    return <FaFacebook className="text-textBlue hover:text-white" size="23" />
               case "twitter":
                    return <FaTwitterSquare className="text-textBlue hover:text-white" size="23" />
               case "linkedin":
                    return <FaLinkedin className="text-textBlue hover:text-white" size="23" />
               case "instagram":
                    return <FaInstagramSquare className="text-textBlue hover:text-white" size="23" />
               case "youtube":
                    return <FaYoutubeSquare className="text-textBlue hover:text-white" size="23" />
               case "vimeo":
                    return <FaVimeoSquare className="text-textBlue hover:text-white" size="23" />
               case "tiktok":
                    return <AiFillTikTok className="text-textBlue hover:text-white" size="23" />
               case "pinterest":
                    return <FaPinterestSquare className="text-textBlue hover:text-white" size="23" />
               case "snapchat":
                    return <FaSnapchatSquare className="text-textBlue hover:text-white" size="23" />

          }
     };

     const getName = (plateform) => {
          switch (plateform) {
               case "facebook":
                    return "Facebook"
               case "twitter":
                    return "Twitter"
               case "linkedin":
                    return "Linkedin"
               case "instagram":
                    return "Instagram"
               case "youtube":
                    return "Youtube"
               case "vimeo":
                    return "Vimeo"
               case "tiktok":
                    return "Tiktok"
               case "pinterest":
                    return "Pinterest"
               case "snapchat":
                    return "Snapchat"

          }
     };


     if (dark) {
          return (

               <a href={link} target="_blank" className="text-black "
                    aria-label={`Follow us on ${getName(plateform)}`}   >

                    {getIcon(plateform)}

               </a>

          )


     } else {
          return <a href={link} target="_blank" aria-label={`Follow us on ${getName(plateform)}`}
               className="text-white hover:text-gray-200" >
               {getIcon(plateform)}
          </a>

     }


}

export default SocialIcons
