import {
  geProductCategoryLeftMenu,
  getAllProductsSlug,
  getAllPostSlug,
} from "@/app/[lang]/data/loader";
import { i18n } from "@/i18n.config";
import { getSiteUrl } from "@/libs/schema/entity";
import { getFileUrl } from "@/libs/helper";
import {
  VIDEOS_PAGE_SIZE,
  decodeEntities,
  getPlayableVideos,
  youtubeEmbedUrl,
  youtubeThumbnail,
} from "@/libs/youtube/videos";

const STATIC_ROUTES = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "blog/", changeFrequency: "weekly", priority: 0.8 },
  { path: "contact/", changeFrequency: "weekly", priority: 0.5 },
  { path: "faq/", changeFrequency: "weekly", priority: 0.5 },
  { path: "about-us/", changeFrequency: "weekly", priority: 0.5 },
  { path: "videos/", changeFrequency: "weekly", priority: 0.5 },
  { path: "lubricant-additives-manufacturers-in-uae/", changeFrequency: "weekly", priority: 0.9 },
];

// The videos are English: their <video:video> entries go in the English sitemap only
const VIDEO_LOCALE = "en";

function lastModified(value) {
  const date = value ? new Date(value) : null;

  return date && !Number.isNaN(date.getTime()) ? date : undefined;
}

/*
  Every language version of every page (en, ar, es), or only one language's
  pages when `onlyLocale` is given.
  Each URL lists its other language versions as hreflang alternates, plus
  x-default → the English page. Alternates only include languages where the
  page actually exists, so no alternate points to a 404.
*/
export async function buildSitemap(onlyLocale) {
  const baseURL = getSiteUrl();
  const locales = i18n.locales;
  const pages = new Map(); // path without locale → { meta, locales: Map(locale → lastModified) }

  const add = (path, locale, meta, modified) => {
    if (!pages.has(path)) pages.set(path, { meta, locales: new Map() });
    pages.get(path).locales.set(locale, modified);
  };

  // /videos/ pages (?page=N) and the videos each one shows, same order as the page
  const videoPages = await getVideoPages();

  for (const lang of locales) {
    STATIC_ROUTES.forEach(({ path, ...meta }) => add(path, lang, meta));

    videoPages.forEach(({ path, modified }, index) => {
      if (index > 0) add(path, lang, { priority: 0.4, changeFrequency: "weekly" }, modified);
    });

    const [catRes, prodRes, blogRes] = await Promise.all([
      geProductCategoryLeftMenu(lang),
      getAllProductsSlug(lang),
      getAllPostSlug(lang),
    ]);

    catRes?.data?.forEach((category) =>
      add(`product-category/${category.slug}/`, lang, { priority: 0.9, changeFrequency: "weekly" }, lastModified(category.updatedAt))
    );

    prodRes?.data?.forEach((product) =>
      add(`product/${product.slug}/`, lang, { priority: 0.7, changeFrequency: "weekly" }, lastModified(product.updatedAt))
    );

    blogRes?.data?.forEach((post) =>
      add(`blog/${post.slug}/`, lang, { priority: 0.5, changeFrequency: "weekly" }, lastModified(post.updatedAt))
    );
  }

  const links = [];

  for (const [path, { meta, locales: available }] of pages) {
    const url = (locale) => `${baseURL}/${locale}/${path}`;

    const languages = Object.fromEntries([...available.keys()].map((locale) => [locale, url(locale)]));

    if (available.has(i18n.defaultLocale)) languages["x-default"] = url(i18n.defaultLocale);

    for (const [locale, modified] of available) {
      if (onlyLocale && locale !== onlyLocale) continue;

      const videos = locale === VIDEO_LOCALE ? videoPages.find((videoPage) => videoPage.path === path)?.videos : null;

      links.push({
        url: url(locale),
        ...(modified ? { lastModified: modified } : {}),
        ...meta,
        alternates: { languages },
        ...(videos?.length ? { videos } : {}),
      });
    }
  }

  return links;
}

// Same videos and page size as /<lang>/videos/; no video entries when Strapi can't be read
async function getVideoPages() {
  let videos = [];
  try {
    videos = await getPlayableVideos();
  } catch (error) {
    console.error("Sitemap: videos skipped, Strapi could not be read:", error.message);
  }

  const pages = [];
  for (let start = 0; start < videos.length; start += VIDEOS_PAGE_SIZE) {
    const chunk = videos.slice(start, start + VIDEOS_PAGE_SIZE);
    const number = pages.length + 1;
    const newest = chunk.map((video) => lastModified(video.updatedAt)).filter(Boolean).sort((a, b) => b - a)[0];

    pages.push({
      path: number === 1 ? "videos/" : `videos/?page=${number}`,
      modified: newest,
      videos: chunk.map((video) => ({
        title: decodeEntities(video.title),
        description: decodeEntities(video.description) || decodeEntities(video.title),
        thumbnail: video.image?.url ? getFileUrl(video.image.url) : youtubeThumbnail(video.videoId),
        player: youtubeEmbedUrl(video.videoId),
        publicationDate: video.youtubeFullDate || video.youtubePublishedAt || "",
      })),
    });
  }

  return pages;
}

const escapeXml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[c]);

const xmlResponse = (body) =>
  new Response(`<?xml version="1.0" encoding="UTF-8"?>\n${body}\n`, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });

// /sitemap.xml: a sitemap index pointing to /en/sitemap.xml, /ar/sitemap.xml, /es/sitemap.xml
export function sitemapIndexResponse() {
  const baseURL = getSiteUrl();
  const entries = i18n.locales
    .map((locale) => `<sitemap>\n<loc>${escapeXml(`${baseURL}/${locale}/sitemap.xml`)}</loc>\n</sitemap>`)
    .join("\n");

  return xmlResponse(`<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>`);
}

// /<lang>/sitemap.xml: that language's pages as a URL set with hreflang alternates
export async function localeSitemapResponse(locale) {
  const links = await buildSitemap(locale);
  const entries = links
    .map(({ url, lastModified, changeFrequency, priority, alternates, videos = [] }) =>
      [
        "<url>",
        `<loc>${escapeXml(url)}</loc>`,
        ...Object.entries(alternates.languages).map(
          ([lang, href]) => `<xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />`
        ),
        lastModified ? `<lastmod>${lastModified.toISOString()}</lastmod>` : "",
        changeFrequency ? `<changefreq>${changeFrequency}</changefreq>` : "",
        priority != null ? `<priority>${priority}</priority>` : "",
        ...videos.map((video) =>
          [
            "<video:video>",
            `<video:thumbnail_loc>${escapeXml(video.thumbnail)}</video:thumbnail_loc>`,
            `<video:title>${escapeXml(video.title.slice(0, 100))}</video:title>`,
            `<video:description>${escapeXml(video.description.slice(0, 2048))}</video:description>`,
            `<video:player_loc>${escapeXml(video.player)}</video:player_loc>`,
            video.publicationDate ? `<video:publication_date>${escapeXml(video.publicationDate)}</video:publication_date>` : "",
            "</video:video>",
          ]
            .filter(Boolean)
            .join("\n")
        ),
        "</url>",
      ]
        .filter(Boolean)
        .join("\n")
    )
    .join("\n");

  return xmlResponse(
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n${entries}\n</urlset>`
  );
}
