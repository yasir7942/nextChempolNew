
const siteConfig = {
  homeTitle: "CHEMPOL Manufacturer of Additives, Polymers &amp; Petrochemical in UAE",
  organizatioName: "Chempol Additives & Chemical Speciality",

  /*
    Canonical company identity used by the Organization / WebSite JSON-LD on every
    page. Keep these exactly the same as the Google Business Profile and all external
    listings (LinkedIn, directories, social profiles) so search engines merge them
    into one entity.
  */
  organizationName: "Chempol Additives & Chemical Speciality",
  brandName: "Chempol",
  alternateNames: [
    "Chempol",
    "CHEMPOL",
    "Chempol Additives",
    "Chempol Additives & Chemical Specialty",
    "Chempol Additives and Chemical Speciality",
    "Chempol Lubricant Additives",
    "Chempol UK",
    "Chempol UAE",
    "Chempol Pakistan",
	"Chempol Saudia",
    "chempol.co.uk",
  ],
  googleBusinessProfileUrl: "https://share.google/wOyLVKmT3zgFwNIKM",

  /*
    Product price for the Product JSON-LD. The price depends on order quantity, so
    products show this range (AggregateOffer) instead of one fixed price.
  */
  productPrice: {
    currency: "AED",
    lowPrice: 10,
    highPrice: 100,
    availability: "https://schema.org/InStock",
  },
  description: "Choose the top-quality lubricant additives, polymers, and special chemicals for maximizing your Petrochemical performance with Chempol.co.uk",
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL,
  ogImage: `${process.env.NEXT_PUBLIC_BASE_URL}/en/opengraph-image.jpg`,
  ogImageExt: "jpg",
  logoImage: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo-486x124px.png`,
  mobileLogo: `${process.env.NEXT_PUBLIC_BASE_URL}/images/logo-332x88px.png`,
  streetAddress: "705, Sidra Tower, Al Sufouh 1, Sheikh Zayed Road E11",
  addressLocality: "Dubai",
  addressRegion: "Dubai",
  addressCountry: "AE",
  postalCode: "41583",
  ratingValue: "4.8",
  authorName: "Dr. Jawad Haroon",
  email: "info@chempol.co.uk",
  latitude: 25.1079577,
  longitude: 55.1785488,
  googleUrl: "https://maps.app.goo.gl/JvSQpS7soseoV6aK8",
  telephone: "+971 4 587 8423",
  vatId: "100312114000003",
  iso6523Code: "",
  postAuthor: "Dr. Jawad Haroon",
  privicyPolicy: "Privacy Policy This Privacy Policy describes how “Chempol” collects, uses, and discloses your Personal Information when you visit or interact with our website. Collecting Personal Information When you visit our website, we may collect certain information about your device, your interaction with the website, and the information necessary to provide you with",



  socialMedia: {
    facebook: "https://www.facebook.com/chempol.additives.chemical.specialty/",
    twitter: "https://twitter.com/chempoluk",
    linkedin: "https://www.linkedin.com/company/chempol-additives-and-petrochemicals/",
    instagram: "https://www.instagram.com/chempoladditives/",
    youtube: "https://www.youtube.com/@chempol",
    vimeo: "",
    tiktok: "",
    pinterest: "https://www.pinterest.co.uk/chempoluk/",
    snapchat: "",
  },

  imageObject:
  {
    // final URL (200, no redirect): /contact/ redirects to /en/contact/ and Search Console flagged it as an invalid license URL
    license: "https://chempol.co.uk/en/contact/",
    acquireLicensePage: "https://chempol.co.uk/en/contact/",
    creditText: "Chempol Additives & Chemical Speciality",
    creatorName: "Chempol Additives & Chemical Speciality",   //organization
    copyrightNoticeProduct: "All images of Chempol Additives & Chemical Speciality products are the exclusive property of Chempol Additives & Chemical Speciality. These images were created by our company, featuring our uniquely designed products. Any unauthorized use, reproduction, distribution, or modification of these images is strictly prohibited without the express written consent of Chempol Additives & Chemical Speciality.For inquiries regarding the use of these images, please contact us.",
    copyrightNoticeLogo: "© Chempol Additives & Chemical Speciality. The Chempol name and logo are trademarks of Chempol Additives & Chemical Speciality. Any use, reproduction or modification without our written permission is prohibited.",
    copyrightNoticeBanner: "The banners displayed on this website have been created by modifying and enhancing images sourced from the internet. While we have significantly altered these images, the original copyrights may belong to the original creators. Any unauthorized use, reproduction, distribution, or modification of these banners without the express written consent of Chempol Additives & Chemical Speciality is prohibited. For inquiries regarding the use of these banners, please contact us."
  }

}

export default siteConfig
