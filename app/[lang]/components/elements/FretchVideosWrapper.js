import { getVideosLimitedData } from "../../data/loader";
import DisaplyFrontVideos from "../layout/DisaplyFrontVideos";
import PaddingContainer from "../layout/padding-container";
import { decodeEntities, isAvailableOnYouTube } from "@/libs/youtube/videos";

// Videos shown on the home page
const SHOW_COUNT = 4;
// Extra videos read from Strapi, so 4 can still be shown when some were removed from YouTube
const CANDIDATE_COUNT = 12;

// "Latest media update" section: only videos that still play on YouTube; nothing at all when there are none
const FretchVideosWrapper = async ({ title, langText, locale = "en" }) => {

    const videoData = await getVideosLimitedData(CANDIDATE_COUNT);

    const candidates = (videoData?.data || []).filter((video) => video.videoId && video.image?.url);
    const available = await Promise.all(candidates.map((video) => isAvailableOnYouTube(video.videoId)));
    const videos = candidates
        .filter((_, index) => available[index])
        .slice(0, SHOW_COUNT)
        .map((video) => ({ ...video, title: decodeEntities(video.title) }));

    if (videos.length === 0) return null;

    return (
        <div className="bg-[#F2F2F2] w-full h-auto pt-14 pb-10" dir="ltr">

            <PaddingContainer className=" ">
                <h3 className=" text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize r   ml-5 z-20" >{title} </h3>
                <DisaplyFrontVideos VideoData={{ data: videos }} latestRelasetext={langText} locale={locale} />
            </PaddingContainer>

        </div>
    );
};

export default FretchVideosWrapper;
