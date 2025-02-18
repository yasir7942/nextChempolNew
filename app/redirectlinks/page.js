


import PaddingContainer from "../components/layout/padding-container";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import RedirectLinkReport from "../components/layout/redirect-links";





export async function generateMetadata(props) {
    const params = await props.params;

    const metadataParams = {
        pageTitle: "Redirect Links",
        pageSlug: "redirect-links",
        pageDescription: "Redirect Links Page",
        seoTitle: "Redirect Links",
        seoDescription: "Redirect Links",
        rebotStatus: true,
        canonicalLinks: "redirect-links",
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
        <div className="mt-5 bg-white w-full h-auto p-5">


            <PaddingContainer>
                <h1 className="text-2xl font-semibold text-center ">Redirect Links </h1>


                <RedirectLinkReport />
            </PaddingContainer>

        </div>



    )
}

export default ProductReport
