// utils/metadata.js
import { getFirstDescriptionText, validateCanonicalSlug, getImageUrl } from "@/libs/helper";

export async function generateMetadata({ type, path, params }) {

  // langaue need to add in metadata

  const {
    pageTitle,
    pageSlug,
    pageDescription,
    seoTitle,
    seoDescription,
    rebotStatus,
    canonicalLinks,
    dataPublishedTime,
    category,
    image,
    imageAlternativeText,
    imageExt,

  } = params;

  const finalSeoTitle = seoTitle?.trim() ? seoTitle : pageTitle;
  const finalSeoDescription = seoDescription?.trim() ? seoDescription : pageDescription;
  const finalRebotStatus = rebotStatus !== true;  // rebotStatus ture means prevent Indexing
  const autoCanonicalSlug = path + pageSlug + "/";
  const manualCanonicalSlug = validateCanonicalSlug(canonicalLinks?.trim());
  const canonicalLink = process.env.NEXT_PUBLIC_BASE_URL + (canonicalLinks?.trim() ? manualCanonicalSlug : autoCanonicalSlug);
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
        'en': canonicalLink,
        'ar': canonicalLink,
        'es': canonicalLink,
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
      locale: 'en',
      url: process.env.NEXT_PUBLIC_BASE_URL + canonicalLink,
      type: 'website',
      publishedTime: dataPublishedTime,
    },
    other: {
      'og:type': "ImageObject",
    },
  };




}
