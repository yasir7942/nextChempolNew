"use client";

// Call to action under the category table: opens the same "Get a Quote" popup as the product page.
// No product is pre-selected here; the visitor picks products in the popup.

import { useState } from "react";
import dynamic from "next/dynamic";
import { MdOutlineRequestQuote } from "react-icons/md";

const InquiryDialog = dynamic(() => import("./inquiry-dialog"), { ssr: false });

const CategoryQuoteCta = ({ locale, dictionary, text }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="w-full mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6">
        <p className="text-gray-800 font-light text-base">{text}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="shrink-0 flex items-center justify-center gap-2 py-2.5 px-5 bg-textBlue text-white text-base font-medium border-[3px] border-textBlue hover:bg-textLightBlue hover:border-textLightBlue hover:text-gray-900 transition-colors"
        >
          <MdOutlineRequestQuote aria-hidden="true" className="text-2xl shrink-0" />
          {dictionary.getQuote}
        </button>
      </div>

      {open && <InquiryDialog type="quote" locale={locale} dictionary={dictionary} onClose={() => setOpen(false)} />}
    </>
  );
};

export default CategoryQuoteCta;
