


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
        seoTitle: "Chempol Videos",
        seoDescription: "Chempol Videos",
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
            <TopBanner banner="/images/product-banner.jpg" title="Youtube Chempol podcasts" />

            <div className="mt-5 bg-white w-full h-auto p-5">


                <PaddingContainer>
                    <h1 className="text-2xl font-semibold text-center ">Videos</h1>


                    <FretchVideos />
                </PaddingContainer>

            </div>
        </div>


    )
}

export default ProductReport
