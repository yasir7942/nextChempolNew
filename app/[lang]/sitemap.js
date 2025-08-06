// sitemap.js



import {
  geProductCategoryLeftMenu,
  getAllProductsSlug,
  getAllPostSlug,
} from "./data/loader";


export default async function sitemap() {
  const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
  const locales = ["en", "ar", "es"];
  const defaultLocale = "en";
  const links = [];

  for (const lang of locales) {
    // omit '/en' prefix for default
    const prefix = `/${lang}`;

    // ── STATIC ROUTES ─────────────────────────────────────────
    links.push(
      { url: `${baseURL}${prefix}`, changeFrequency: "weekly", priority: 1 },
      { url: `${baseURL}${prefix}/blog`, changeFrequency: "weekly", priority: 0.8 },

      { url: `${baseURL}${prefix}/contact`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${baseURL}${prefix}/faq`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${baseURL}${prefix}/about-us`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${baseURL}${prefix}/videos`, changeFrequency: "weekly", priority: 0.5 },
      { url: `${baseURL}${prefix}/lubricant-additives-manufacturers-in-uae`, changeFrequency: "weekly", priority: 0.9 }
    );

    // ── PRODUCT CATEGORIES ────────────────────────────────────────
    const catRes = await geProductCategoryLeftMenu(lang);
    catRes?.data?.forEach((category) => {
      links.push({
        url: `${baseURL}${prefix}/product-category/${category.slug}`,
        lastModified: new Date(category.updatedAt),
        priority: 0.9,
        changeFrequency: "weekly",
      });
    });

    // ── PRODUCTS ───────────────────────────────────────────────────
    const prodRes = await getAllProductsSlug(lang);
    prodRes?.data?.forEach((product) => {
      links.push({
        url: `${baseURL}${prefix}/product/${product.slug}`,
        lastModified: new Date(product.updatedAt),
        priority: 0.7,
        changeFrequency: "weekly",
      });
    });

    // ── BLOG POSTS ────────────────────────────────────────────────
    const blogRes = await getAllPostSlug(lang);
    blogRes?.data?.forEach((post) => {
      links.push({
        url: `${baseURL}${prefix}/blog/${post.slug}`,
        lastModified: new Date(post.updatedAt),
        priority: 0.5,
        changeFrequency: "weekly",
      });
    });
  }

  return links;
}
