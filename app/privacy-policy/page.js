
import PaddingContainer from "../components/layout/padding-container";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import siteConfig from "@/config/site";


export async function generateMetadata({ params }) {


    const metadataParams = {
        pageTitle: "Privacy Policy",
        pageSlug: "privacy-policy",
        pageDescription: "Privacy Policy This Privacy Policy describes how “Chempol” collects, uses, and discloses your Personal Information when you visit or interact with our website. Collecting Personal Information When you visit our website, we may collect certain information about your device, your interaction with the website, and the information necessary to provide you with",
        seoTitle: "Chempol Privacy Policy",
        seoDescription: "Privacy Policy This Privacy Policy describes how “Chempol” collects, uses, and discloses your Personal Information when you visit or interact with our website. Collecting Personal Information When you visit our website, we may collect certain information about your device, your interaction with the website, and the information necessary to provide you with",
        rebotStatus: false,
        canonicalLinks: "privacy-policy",
        dataPublishedTime: "15-8-2024",
        category: "",
        image: siteConfig.logoImage,
        imageAlternativeText: "Chempol logo",
        imageExt: ".png",
    };

    return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}


const PolicyPage = () => {

    return (
        <div>

            <PaddingContainer className="flex flex-col text-white " >

                <h1 className="text-white pt-32 font-medium text-3xl ">Privacy Policy</h1>
                <p className="text-white pt-3 font-light text-lg tracking-wider pb-10 ">
                    This Privacy Policy describes how “Chempol” collects, uses, and discloses your Personal Information when you visit or interact with our website.

                    <strong className="block pt-3">Collecting Personal Information</strong>
                    When you visit our website, we may collect certain information about your device, your interaction with the website, and the information necessary to provide you with our services. We may also collect additional information if you contact us for customer support. In this Privacy Policy, we refer to any information about an identifiable individual (including the information below) as “Personal Information”. See the list below for more information about what Personal Information we collect and why.

                    <strong className="block pt-3">Sharing Personal Information</strong>
                    We may share your Personal Information with service providers to help us provide our services and fulfill our contracts with you, as described above. For example, we may use third-party software to process payments or to help us analyze website traffic. We may also share your Personal Information to comply with applicable laws and regulations, to respond to a subpoena, search warrant, or other lawful requests for information we receive, or to otherwise protect our rights.

                    <strong className="block pt-3">Using Personal Information</strong>
                    We use your personal information to provide our services to you, which include: offering products or services for sale, processing payments, shipping and fulfillment of your order, and keeping you up to date on new products, services, and offers.

                    <strong className="block pt-3"> Cookies</strong>
                    A cookie is a small amount of your information that will be downloaded to your device when you visit our website. We use a number of different cookies, including functional, performance, advertising, and social media or content cookies. Cookies make your browsing experience better by allowing the website to remember your actions and preferences (such as login and region selection). This means you don’t have to re-enter this information each time you return to the site or browse from one page to another. Cookies also provide information on how people use the website, for instance, whether it’s their first time visiting or if they are frequent visitors.

                    <strong className="block pt-3">Contact</strong>
                    After reviewing this policy, if you have additional questions, want more information about our privacy policy, or would like to make a complaint, please contact us by e-mail at info@chempol.co.uk
                </p>

            </PaddingContainer>


        </div>
    )
}

export default PolicyPage
