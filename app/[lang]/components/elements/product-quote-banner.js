"use client";

// Navy banner above the footer of the product page: opens the Get a Quote popup for this product.

import { useState } from "react";
import dynamic from "next/dynamic";
import { MdOutlineRequestQuote, MdOutlineScience } from "react-icons/md";
import PaddingContainer from "../layout/padding-container";

const InquiryDialog = dynamic(() => import("./inquiry-dialog"), { ssr: false });

const ProductQuoteBanner = ({ locale, dictionary, product, title, text }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <section className="w-full bg-[#082653] text-white mt-14">
        <PaddingContainer>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 py-8">
            <div className="flex items-center gap-5">
              <MdOutlineScience aria-hidden="true" className="text-5xl shrink-0 text-white/90" />
              <div className="border-s border-white/30 ps-5">
                <h2 className="text-2xl font-semibold">{title}</h2>
                <p className="mt-1 font-light text-base text-white/90">{text}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex items-center justify-center gap-2 min-h-[48px] px-6 bg-textBlue text-white font-semibold rounded-md hover:bg-textLightBlue hover:text-gray-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
            >
              <MdOutlineRequestQuote aria-hidden="true" className="text-xl shrink-0" />
              {dictionary.getQuote}
            </button>
          </div>
        </PaddingContainer>
      </section>

      {open && <InquiryDialog type="quote" locale={locale} dictionary={dictionary} product={product} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ProductQuoteBanner;
