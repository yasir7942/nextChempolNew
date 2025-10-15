// utils/metadata.js
import { validateCanonicalSlug } from "@/libs/helper";

export async function generateMetadata({ type, path, params, lang = "en" }) {

  // langaue need to add in metadata

  const {
    pageTitle,
    pageSlug,
    pageDescription,
    seoTitle,
    seoDesctiption,
    rebotStatus,
    canonicalLinks,
    dataPublishedTime,
    category,
    image,
    imageAlternativeText,
    imageExt,

  } = params;



  const finalSeoTitle = seoTitle?.trim() ? seoTitle : pageTitle;
  const finalSeoDescription = seoDesctiption?.trim() ? seoDesctiption : pageDescription;
  const finalRebotStatus = rebotStatus !== true;  // rebotStatus ture means prevent Indexing
  const autoCanonicalSlug = path + pageSlug + "/";
  const manualCanonicalSlug = validateCanonicalSlug(canonicalLinks?.trim());
  const canonicalLink = process.env.NEXT_PUBLIC_BASE_URL + `/${lang}` + (canonicalLinks?.trim() ? manualCanonicalSlug : autoCanonicalSlug);
  const finalImageText = imageAlternativeText ? imageAlternativeText : finalSeoTitle;




  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL),
    title: finalSeoTitle,
    description: finalSeoDescription,
    ...((type === "product" || type === "blog") ? { category } : {}),
    robots: {
      index: finalRebotStatus,
      follow: finalRebotStatus,
    },
    alternates: {
      canonical: canonicalLink,
      languages: {
        'en': process.env.NEXT_PUBLIC_BASE_URL + `/en` + (canonicalLinks?.trim() ? manualCanonicalSlug : autoCanonicalSlug),
        'ar': process.env.NEXT_PUBLIC_BASE_URL + `/ar` + (canonicalLinks?.trim() ? manualCanonicalSlug : autoCanonicalSlug),
        'es': process.env.NEXT_PUBLIC_BASE_URL + `/es` + (canonicalLinks?.trim() ? manualCanonicalSlug : autoCanonicalSlug)
      },
    },
    openGraph: {
      images: [
        {
          "url": image,
          "alt": finalImageText,
          "type": imageExt
        }
      ],
      locale: lang,
      url: canonicalLink,    //here shoud be page url
      type: type === 'blog' ? 'article' : 'website',     // for blog show  article
      publishedTime: dataPublishedTime,
    },

  };




}



