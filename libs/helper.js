import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { Replace } from "lucide-react";
import Image from "next/image";


export const  getImageUrl = (path)=> {

 if( process.env.NEXT_PUBLIC_MODE == "dev" ){
            if (path)
            return process.env.NEXT_PUBLIC_LOCAL_BASE_IMAGE_URL + path;
   }
   else{
        if (path)
          return process.env.NEXT_PUBLIC_ADMIN_BASE_URL +path;
   }
}


export const  getFirstDescriptionText=(descriptionArray) => {
  if (!Array.isArray(descriptionArray) || descriptionArray.length === 0) return "";
  return (descriptionArray[0].children.map(child => child.text).join('')).slice(0, 160);
}


export const validateCanonicalSlug = (link) => {
  if (!link || link === null || link === "") return "";

  let ConLink = link;
  if (!ConLink.startsWith('/')) {
    ConLink = '/' + ConLink;
  }
  if (!ConLink.endsWith('/')) {
    ConLink = ConLink + '/';
  }

  return ConLink;
}


/*

export const  addMonths=(date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  console.log(newDate);
  return newDate.toISOString().split('T')[0];
}
*/

export const  fetchRedirects=() => {
  return [
    {
      source: '/contact-us', // automatically becomes /docs/with-basePath
      destination: '/contact', // automatically becomes /docs/another
      permanent: true,
    },
    {
      // does not add /docs since basePath: false is set
      source: '/about',
      destination: '/about-us',
      permanent: true,
    },
  ]
  
}
 
   