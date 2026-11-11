import PaddingContainer from "@/app/admin/shared/components/padding-container";
import YouTubeManager from "@/app/admin/shared/components/youtube-manager";
import { ADMIN_ROBOTS } from "@/app/admin/admin-pages";

export const metadata = {
    title: "YouTube Videos",
    description: "YouTube Videos",
    robots: ADMIN_ROBOTS,
};

const YouTubeVideos = () => {
    return (
        <div className="w-full h-auto bg-gray-50 pt-10 pb-16">
            <PaddingContainer>
                <div className="border-b border-gray-200 pb-6">
                    <p className="text-sm font-medium uppercase tracking-wider text-[#BE1D21]">Strapi · videos</p>
                    <h1 className="mt-1 text-3xl font-semibold text-gray-900">YouTube Videos</h1>
                    <p className="mt-2 max-w-3xl text-gray-600">
                        Every video saved in Strapi. The home page shows the newest 4 and the videos page shows all of them, 12 per page.
                        Hidden videos stay in Strapi but are not on the site, and the YouTube fetch never adds them again.
                        Every change updates the site straight away.
                    </p>
                </div>

                <YouTubeManager />
            </PaddingContainer>
        </div>
    );
};

export default YouTubeVideos;
