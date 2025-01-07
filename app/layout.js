
import "./globals.css";
import { Open_Sans } from "next/font/google";
import Footer from "./components/layout/footer";
import siteConfig from "@/config/site";
import Topbar from "./components/navigation/topbar";
import GTMInitializer from "./components/elements/gmt";
import MetaPixelInitializer from "./components/elements/MetaPixelInitializer";





//const inter = Inter({ subsets: ["latin"] });

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'], // Adjust the weights as needed
});


export const metadata = {
  title: siteConfig.homeTitle,
  description: siteConfig.description,

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
    images: siteConfig.ogImage,
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
        "urlTemplate": siteConfig.baseUrl + "/search?s={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    }
  };




  return (
    <html lang="en"  >

      <body className={openSans.className} >

        <GTMInitializer /> {/* Initialize GTM here */}
        <MetaPixelInitializer /> {/* Meta Pixel */}



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
