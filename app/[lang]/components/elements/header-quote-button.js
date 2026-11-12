"use client";

// "Get a Quote" button in the site header: opens the same quotation popup as the product page.
// No product is pre-selected; the visitor picks products in the popup.

import { useState } from "react";
import dynamic from "next/dynamic";

const InquiryDialog = dynamic(() => import("./inquiry-dialog"), { ssr: false });

const HeaderQuoteButton = ({ locale, dictionary, label }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border border-textBlue rounded-sm text-sm px-3 py-2 text-textBlue hover:text-lightColorHover hidden md:block"
      >
        {label}
      </button>

      {open && <InquiryDialog type="quote" locale={locale} dictionary={dictionary} onClose={() => setOpen(false)} />}
    </>
  );
};

export default HeaderQuoteButton;
