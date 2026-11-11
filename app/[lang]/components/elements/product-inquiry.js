"use client";

// "Get a Quote" and "Request a Product Sample" buttons for the product page.
// The form (inquiry-dialog.js) loads only when a button is clicked, so product pages
// do not download reCAPTCHA and the form code for visitors who never open it.

import { useState } from "react";
import dynamic from "next/dynamic";
import { MdOutlineRequestQuote, MdOutlineScience } from "react-icons/md";

const InquiryDialog = dynamic(() => import("./inquiry-dialog"), { ssr: false });

const ProductInquiry = ({ locale, dictionary, product }) => {
  const [openType, setOpenType] = useState(null); // "quote" | "sample" | null

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-3 w-full mt-5 pr-0 md:pr-5 lg:pr-16">
        <button
          type="button"
          onClick={() => setOpenType("quote")}
          className="sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-textBlue text-white text-base font-medium border-[3px] border-textBlue hover:bg-textLightBlue hover:border-textLightBlue hover:text-gray-900 transition-colors"
        >
          <MdOutlineRequestQuote aria-hidden="true" className="text-2xl shrink-0" />
          {dictionary.getQuote}
        </button>
        <button
          type="button"
          onClick={() => setOpenType("sample")}
          className="sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white text-textBlue text-base font-medium border-[3px] border-textBlue hover:bg-textBlue/10 transition-colors"
        >
          <MdOutlineScience aria-hidden="true" className="text-2xl shrink-0" />
          {dictionary.requestSample}
        </button>
      </div>

      {openType && (
        <InquiryDialog
          type={openType}
          locale={locale}
          dictionary={dictionary}
          product={product}
          onClose={() => setOpenType(null)}
        />
      )}
    </>
  );
};

export default ProductInquiry;
