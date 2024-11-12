import { FaCertificate } from "react-icons/fa";
import { TbCertificate } from "react-icons/tb";
import { FaRegFilePdf } from "react-icons/fa6";
import PaddingContainer from "../components/layout/padding-container";
import { getCertifcateCategories, getCertificateApprovalPage } from "../data/loader";
import { generateMetadata as generatePageMetadata } from "@/libs/metadata";
import { cache } from 'react';
import TopBanner from "../components/layout/top-banner";
import SEOSchema from "../components/elements/seo-schema";

// Cache the GetApprovalPage function
const cachedGetApprovalPage = cache(getCertificateApprovalPage);


export async function generateMetadata({ params }) {


  const pageData = await cachedGetApprovalPage();

  const metadataParams = {
    pageTitle: pageData.slug,
    pageSlug: "certificates",
    pageDescription: "",
    seoTitle: pageData.seo?.seoTitle,
    seoDescription: pageData.seo?.seoDescription,
    rebotStatus: pageData.seo?.preventIndexing,
    canonicalLinks: pageData.seo?.canonicalLinks ?? "certificates",
    dataPublishedTime: pageData.publishedAt,
    category: "",
    image: process.env.NEXT_PUBLIC_ADMIN_BASE_URL + pageData.banner?.mobileBanner?.url,
    imageAlternativeText: pageData.banner?.mobileBanner?.alternativeText ?? pageData.title,
    imageExt: pageData.banner?.mobileBanner?.mime,
  };


  //console.dir(pageData, { depth:null}); 
  //console.dir(metadataParams ); 

  return await generatePageMetadata({ type: "page", path: "", params: metadataParams });
}





const CertificatePage = async () => {


  const pageData = await cachedGetApprovalPage();
  const CertificatesData = await getCertifcateCategories();
  // console.log(pageData.title);
  //  console.log("-----------------------Certificate page--------------------------------------------------");
  //    console.dir(Certificates, { depth:null});
  //   console.log("---------------------------End-----------------------end-----------------------");


  return (



    <div className='text-white'>

      <SEOSchema schemaList={pageData.seo?.schema} />

      <TopBanner banner={pageData.banner} />

      <div className="mt-20 pb-20 topPadding">
        <PaddingContainer>

          {CertificatesData.data.map((CertiItems, parentIndex) => (
            <div key={parentIndex}>
              <h2 className='text-xl'>  <TbCertificate size={30} className="inline-block pr-1 -mt-1" />  {CertiItems.title}</h2>
              <ul className=' inline-block py-2 pl-8'>
                {CertiItems.certificates.data.map((item, itemIndex) => (
                  <li className='font-light py-1  ' key={itemIndex} >
                    <FaCertificate size={20} className="inline-block pr-2 -mt-1" />  {item.title} <a className="inline-block pl-3 align-middle" href={item.certificatePdf.url} download={item.title + ".pdf"} > <FaRegFilePdf size={18} />  </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </PaddingContainer>
      </div>
    </div>
  );
};


export default CertificatePage
