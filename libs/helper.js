import { BlocksRenderer } from "@strapi/blocks-react-renderer";
import { Replace } from "lucide-react";
import Image from "next/image";


export const getImageUrl = (path) => {

  if (process.env.NEXT_PUBLIC_MODE == "dev") {
    if (path)
      return process.env.NEXT_PUBLIC_LOCAL_BASE_IMAGE_URL + path;
  }
  else {
    if (path)
      return process.env.NEXT_PUBLIC_ADMIN_BASE_URL + path;
  }
}


export const getBaseUrl = () => {

  if (process.env.NEXT_PUBLIC_MODE == "dev") {

    return process.env.NEXT_PUBLIC_BASE_DEV_URL;
  }
  else {

    return process.env.NEXT_PUBLIC_BASE_URL;
  }
}



export const getFirstDescriptionText = (descriptionArray) => {
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


export function convertToLocalizedDate(pdate, lang) {
  // Ensure it's a Date object, even if input is ISO string from Strapi
  const date = new Date(pdate);

  const localeMap = {
    ar: 'ar',
    es: 'es',
    en: 'en',
  };

  const locale = localeMap[lang] || 'en';

  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}


/*

export const  addMonths=(date, months) => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  console.log(newDate);
  return newDate.toISOString().split('T')[0];
}
*/

export const fetchRedirects = () => {
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

