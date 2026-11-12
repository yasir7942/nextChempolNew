"use client";

// "Need formulation support?" card of the product page: opens the same Get a Quote popup,
// with this product already in the list.

import { useState } from "react";
import dynamic from "next/dynamic";
import { MdOutlineScience } from "react-icons/md";

const InquiryDialog = dynamic(() => import("./inquiry-dialog"), { ssr: false });

const ProductSupportCard = ({ locale, dictionary, product, title, text, buttonLabel }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-md bg-sky-50 border border-sky-100 p-5">
        <div className="flex items-center gap-3 text-textBlue">
          <MdOutlineScience aria-hidden="true" className="text-3xl shrink-0" />
          <h2 className="text-xl font-semibold text-darkBlue">{title}</h2>
        </div>
        <p className="mt-3 text-gray-800 font-light text-base">{text}</p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full py-2.5 px-4 bg-textBlue text-white text-base font-medium border-[3px] border-textBlue hover:bg-textLightBlue hover:border-textLightBlue hover:text-gray-900 transition-colors"
        >
          {buttonLabel || dictionary.getQuote}
        </button>
      </div>

      {open && <InquiryDialog type="support" locale={locale} dictionary={dictionary} product={product} onClose={() => setOpen(false)} />}
    </>
  );
};

export default ProductSupportCard;
