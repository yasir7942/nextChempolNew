//import { Inter } from "next/font/google";
import "./globals.css";
import { Poppins } from "next/font/google"
import Footer from "./components/layout/footer";
import siteConfig from "@/config/site";
import Topbar from "./components/navigation/topbar";





//const inter = Inter({ subsets: ["latin"] });

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['200', '500', '600', '700']
})


export const metadata = {
  title: siteConfig.homeTitle,
  description: siteConfig.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL,
    languages: {
      'en-US': process.env.NEXT_PUBLIC_BASE_URL,
      'en-UK': process.env.NEXT_PUBLIC_BASE_URL,
      'ar-AR': process.env.NEXT_PUBLIC_BASE_URL,
      'fr-FR': process.env.NEXT_PUBLIC_BASE_URL,
      'es-ES': process.env.NEXT_PUBLIC_BASE_URL,
    },
  },
  openGraph: {
    images: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + '/opengraph-image.jpg',
    locale: 'en_US',
    type: 'website',
  },

};

export default function RootLayout({ children }) {


  const jsonLdBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "image": [
      siteConfig.logoImage,
      siteConfig.mobileLogo
    ],
    "name": siteConfig.organizatioName,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteConfig.streetAddress,
      "addressLocality": siteConfig.addressLocality,
      "addressRegion": "SH",
      "postalCode": siteConfig.postalCode,
      "addressCountry": "AE"
    },
    "review": {
      "@type": "Review",
      "reviewRating": {
        "@type": "Rating",
        "ratingValue": siteConfig.ratingValue,
        "bestRating": "5"
      },
      "author": {
        "@type": "Person",
        "name": siteConfig.authorName,
      }
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": siteConfig.latitude,
      "longitude": siteConfig.longitude
    },
    "url": siteConfig.googleUrl,
    "telephone": siteConfig.telephone,
    "servesCuisine": "Middle Eastern",
    "priceRange": "AED 150-300",
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Firday",
          "Saturday"
        ],
        "opens": "8:30",
        "closes": "17:00"
      },
    ],

  };

  const jsonLdOrganization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "image": siteConfig.ogImage,
    "url": siteConfig.baseUrl,
    "sameAs": [siteConfig.socialMedia.facebook, siteConfig.socialMedia.twitter, siteConfig.socialMedia.linkedin, siteConfig.socialMedia.instagram, siteConfig.socialMedia.youtube],
    "logo": siteConfig.logoImage,
    "name": siteConfig.organizatioName,
    "description": siteConfig.description,
    "email": siteConfig.email,
    "telephone": siteConfig.telephone,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteConfig.streetAddress,
      "addressLocality": siteConfig.addressLocality,
      "addressCountry": "AE",
      "addressRegion": "SH",
      "postalCode": siteConfig.postalCode,
      "vatID": siteConfig.vatId,
      "iso6523Code": siteConfig.iso6523Code
    }
  };

  const jsonLdSearchBox = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": siteConfig.baseUrl,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": siteConfig.baseUrl + "/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };




  return (
    <html lang="en"  >


      {/*  Google tag (gtag.js)    */}
      {/*   <Script 
      strategy="afterInteractive" 
      src="https://www.googletagmanager.com/gtag/js?id=AW-11316755137" 
      async 
       />
      <Script 
      id="google-analytics" 
      strategy="afterInteractive" 
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-11316755137');
        `
      }} 
    />
    
*/}

      <body className={poppins.className} >

        {/*  JSON-LD of Page */}
        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBusiness) }} />

        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }} />

        <script type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSearchBox) }} />



        <Topbar />





        {children}

        <Footer />
      </body>
    </html>
  );
}
