// /<lang>/videos/ (?page=N): Chempol's YouTube videos, rendered on the server.
// The videos are English only, so the page text is English in every language.
import { notFound } from "next/navigation";
import PaddingContainer from "../components/layout/padding-container";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import TopBanner from "../components/layout/top-banner";
import SEOSchema from "../components/elements/seo-schema";
import VideoPlayButton from "../components/elements/video-play-button";
import LinkPagination from "../components/elements/link-pagination";
import { getDictionary } from "@/libs/getDictionary";
import { getFileUrl, getImageUrl } from "@/libs/helper";
import { absoluteUrl, buildBreadcrumbList, buildVideoGallery, pageUrl } from "@/libs/schema/entity";
import siteConfig from "@/config/site";
import {
    VIDEOS_PAGE_SIZE,
    decodeEntities,
    getPlayableVideos,
    youtubeEmbedUrl,
    youtubeThumbnail,
    youtubeWatchUrl,
} from "@/libs/youtube/videos";

const TITLE = "Latest Videos and Podcasts";
const DESCRIPTION =
    "Watch Chempol's latest videos and podcasts on lubricant additives, product launches and news and events from the lubricant industry.";

// Video structured data only on the English pages, so each video is described once
const VIDEO_SCHEMA_LOCALE = "en";

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

const pageNumber = (searchParams) => {
    const page = Number(searchParams?.page);
    return Number.isInteger(page) && page > 1 ? page : 1;
};

const videosPath = (lang, page) => `/${lang}/videos/${page > 1 ? `?page=${page}` : ""}`;

const pageTitle = (page) => (page > 1 ? `${TITLE} – Page ${page}` : TITLE);

const shorten = (text, words = 30) => {
    const parts = String(text || "").split(/\s+/).filter(Boolean);
    return parts.length > words ? `${parts.slice(0, words).join(" ")} ...` : parts.join(" ");
};

const toCard = (video) => {
    const uploadDate = video.youtubeFullDate || video.youtubePublishedAt || "";
    const time = Date.parse(uploadDate);

    return {
        key: video.documentId || video.videoId,
        videoId: video.videoId,
        title: decodeEntities(video.title),
        description: decodeEntities(video.description),
        uploadDate,
        date: Number.isNaN(time) ? "" : DATE_FORMAT.format(time),
        thumbnail: getImageUrl(video.image?.url) || youtubeThumbnail(video.videoId),
        publicThumbnail: video.image?.url ? getFileUrl(video.image.url) : youtubeThumbnail(video.videoId),
    };
};

// null when Strapi can't be read, so the page says so instead of showing "no videos"
async function loadVideos() {
    try {
        return await getPlayableVideos();
    } catch (error) {
        console.error("Videos page: could not read videos from Strapi:", error.message);
        return null;
    }
}

export async function generateMetadata(props) {
    const { lang = "en" } = (await props.params) || {};
    const page = pageNumber(await props.searchParams);
    const title = pageTitle(page);

    const metadata = await generatePageMetadata({
        type: "page",
        path: "",
        lang,
        params: {
            pageTitle: title,
            pageSlug: "videos",
            pageDescription: DESCRIPTION,
            seoTitle: title,
            seoDescription: DESCRIPTION,
            rebotStatus: false,
            canonicalLinks: "videos",
            dataPublishedTime: "",
            category: "",
            image: siteConfig.ogImage,
            imageAlternativeText: TITLE,
            imageExt: siteConfig.ogImageExt,
        },
    });

    // Every page after the first is its own canonical URL (/videos/?page=N)
    const withPage = (url) => (page > 1 ? `${url}?page=${page}` : url);
    const canonical = withPage(metadata.alternates.canonical);

    return {
        ...metadata,
        alternates: {
            canonical,
            languages: Object.fromEntries(Object.entries(metadata.alternates.languages).map(([key, url]) => [key, withPage(url)])),
        },
        openGraph: { ...metadata.openGraph, title, description: DESCRIPTION, url: canonical },
        twitter: { card: "summary_large_image", title, description: DESCRIPTION, images: [siteConfig.ogImage] },
    };
}

const Videos = async ({ params, searchParams }) => {
    const { lang = "en" } = (await params) || {};
    const page = pageNumber(await searchParams);
    const dictionary = await getDictionary(lang);

    const videos = await loadVideos();
    const pageCount = Math.max(1, Math.ceil((videos?.length || 0) / VIDEOS_PAGE_SIZE));
    if (videos && page > pageCount) notFound();

    const start = (page - 1) * VIDEOS_PAGE_SIZE;
    const cards = (videos || []).slice(start, start + VIDEOS_PAGE_SIZE).map(toCard);

    const schemaNodes = [
        lang === VIDEO_SCHEMA_LOCALE
            ? buildVideoGallery({
                lang,
                url: absoluteUrl(videosPath(lang, page)),
                name: pageTitle(page),
                description: DESCRIPTION,
                startPosition: start + 1,
                videos: cards.map((card) => ({
                    name: card.title,
                    description: card.description,
                    thumbnailUrl: card.publicThumbnail,
                    uploadDate: card.uploadDate,
                    embedUrl: youtubeEmbedUrl(card.videoId),
                    url: youtubeWatchUrl(card.videoId),
                })),
            })
            : null,
        buildBreadcrumbList([{ name: dictionary.navigation.home, url: pageUrl(lang) }, { name: TITLE }]),
    ];

    return (
        <div>
            <SEOSchema nodes={schemaNodes} />
            <TopBanner banner="/images/product-banner.jpg" title={TITLE} dictionary={dictionary} />
            <div className="mt-5 bg-white w-full h-auto p-5" dir="ltr">
                <PaddingContainer>
                    <h2 className="text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize -mt-3 ml-5 z-20">New Releases and Events</h2>

                    {videos === null && (
                        <p className="mt-10 pb-16 text-center text-gray-700">Videos can&apos;t be loaded right now. Please try again later.</p>
                    )}
                    {videos?.length === 0 && <p className="mt-10 pb-16 text-center text-gray-700">No videos yet.</p>}

                    <div className="overflow-x-auto font-serif">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-7 mt-6">
                            {cards.map((card) => (
                                <article key={card.key} className="w-full flex flex-col text-white md:text-left pb-14">
                                    <VideoPlayButton videoId={card.videoId} title={card.title} thumbnail={card.thumbnail} />

                                    <h3 className="text-gray-900 font-semibold leading-6 text-lg md:text-base pt-3">{card.title}</h3>

                                    {card.date && (
                                        <p className="text-sm text-gray-700 font-light">
                                            <time dateTime={card.uploadDate}>{card.date}</time>
                                        </p>
                                    )}

                                    <p className="text-lx md:text-sm text-justify text-gray-800">{shorten(card.description)}</p>
                                </article>
                            ))}
                        </div>
                    </div>

                    <LinkPagination
                        page={page}
                        pageCount={pageCount}
                        hrefFor={(number) => videosPath(lang, number)}
                        locale={lang}
                        label={dictionary.navigation.page}
                    />
                </PaddingContainer>
            </div>
        </div>
    );
};

export default Videos;
