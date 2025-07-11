


import PaddingContainer from "../components/layout/padding-container";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import FretchVideos from "../components/layout/FretchVideos";
import TopBanner from "../components/layout/top-banner";





export async function generateMetadata(props) {
    const params = await props.params;

    const metadataParams = {
        pageTitle: "Chempol Videos",
        pageSlug: "videos",
        pageDescription: "Youtube Chempol podcasts",
        seoTitle: "Latest Videos and Podcasts",
        seoDescription: "Take a look at some of our exclusive videos and podcasts regarding the latest news and events in lubricant industry",
        rebotStatus: true,
        canonicalLinks: "videos",
        dataPublishedTime: "",
        category: "",
        image: "",
        imageAlternativeText: "",
        imageExt: "",
    };

    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}





const ProductReport = () => {
    return (
        <div>
            <TopBanner banner="/images/product-banner.jpg" title="Latest Videos and Podcasts" />

            <div className="mt-5 bg-white w-full h-auto p-5">


                <PaddingContainer>

                    <h3 className="*:first-letter: text-2xl md:text-3xl text-center font-semibold text-textBlue capitalize r -mt-3 ml-5 z-20" >New Releases and Events</h3>


                    <FretchVideos />
                </PaddingContainer>

            </div>
        </div>


    )
}

export default ProductReport
