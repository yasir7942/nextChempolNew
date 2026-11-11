import PaddingContainer from "@/app/admin/shared/components/padding-container";
import RedirectLinkReport from "@/app/admin/shared/components/redirect-links";
import { ADMIN_ROBOTS } from "@/app/admin/admin-pages";





export const metadata = {
    title: "Redirect Links",
    description: "Redirect Links",
    robots: ADMIN_ROBOTS,
};





const RedirectLinks = () => {
    return (
        <div className="w-full h-auto bg-gray-50 pt-10 pb-16">
            <PaddingContainer>
                <div className="border-b border-gray-200 pb-6">
                    <p className="text-sm font-medium uppercase tracking-wider text-[#BE1D21]">Strapi · redirection-urls</p>
                    <h1 className="mt-1 text-3xl font-semibold text-gray-900">Redirect Links</h1>
                    <p className="mt-2 max-w-2xl text-gray-600">
                        Every redirect saved in Strapi and how the live site applies it (301). Invalid redirects are skipped, and live redirects whose destination is broken are flagged; both are shown in red with the reason. Saving a redirect in Strapi updates the site automatically.
                    </p>
                </div>

                <RedirectLinkReport />
            </PaddingContainer>
        </div>



    )
}

export default RedirectLinks
