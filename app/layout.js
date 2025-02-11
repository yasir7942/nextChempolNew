
import "./globals.css";
import { Open_Sans } from "next/font/google";
import Footer from "./components/layout/footer";
import siteConfig from "@/config/site";
import Topbar from "./components/navigation/topbar";
import Script from "next/script";





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

  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

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



      <head>
        {/* Google Tag Manager Script - Only load if GTM ID exists */}
        {gtmId && (
          <Script id="gtm-script" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${gtmId}');
            `}
          </Script>
        )}

        {/* Meta Pixel (Facebook Pixel) */}
        {metaPixelId && (
          <Script id="fb-pixel" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');

              fbq('init', '${metaPixelId}');
              fbq('track', 'PageView');
            `}
          </Script>
        )}

      </head>



      <body className={openSans.className} >


        {/* GTM NoScript Fallback */}
        {gtmId && (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
        )}

        {/* Facebook NoScript Fallback */}
        {metaPixelId && (
          <noscript>
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${metaPixelId}&ev=PageView&noscript=1`}
            />
          </noscript>
        )}


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
