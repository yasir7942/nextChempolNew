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
        className="h-9 whitespace-nowrap rounded-md bg-textBlue px-4 text-sm font-normal text-white transition-colors hover:bg-[#145f96] focus:outline-none focus-visible:ring-2 focus-visible:ring-textBlue focus-visible:ring-offset-2"
      >
        {label}
      </button>

      {open && <InquiryDialog type="quote" locale={locale} dictionary={dictionary} onClose={() => setOpen(false)} />}
    </>
  );
};

export default HeaderQuoteButton;
