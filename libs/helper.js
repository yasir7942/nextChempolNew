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


// Strapi file (TDS, MSDS...) as a full URL; relative /uploads paths are served by Strapi
export const getFileUrl = (url) => {
  if (!url) return "";
  if (/^https?:\/\//i.test(url) || url.startsWith("//")) return url;

  const base = (process.env.NEXT_PUBLIC_ADMIN_BASE_URL || "").replace(/\/+$/, "");
  return `${base}${url.startsWith("/") ? "" : "/"}${url}`;
}


export const getBaseUrl = () => {

  if (process.env.NEXT_PUBLIC_MODE == "dev") {

    return process.env.NEXT_PUBLIC_BASE_DEV_URL;
  }
  else {

    return process.env.NEXT_PUBLIC_BASE_URL;
  }
}



/*
  tel: link from a display number such as "+971 (04) 5878 423" → "tel:+97145878423".
  The bracketed trunk 0 is dropped (it is not dialled after the country code).
*/
export const telHref = (phone) => {
  const number = String(phone || "")
    .trim()
    .replace(/\(0+(\d)/g, "($1")
    .replace(/(?!^\+)[^\d]/g, "");

  return number.replace(/\D/g, "").length >= 6 ? `tel:${number}` : "";
}


// mailto: link, or "" when the address is missing or not an email.
export const mailtoHref = (email) => {
  const address = String(email || "").trim();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address) ? `mailto:${address}` : "";
}


// Office map link from Strapi; falls back to a Google Maps search for the address.
export const mapHref = (mapUrl, address) => {
  const url = String(mapUrl || "").trim();

  if (/^https?:\/\//i.test(url)) return url;

  const query = String(address || "").trim();

  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
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


export function localizeNumber(lang, number) {
  if (lang === 'ar') {
    // Convert to Arabic-Indic numerals
    return number
      .toString()
      .replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
  }

  // For English, Spanish, or any other Latin-based languages
  return number.toString();
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

