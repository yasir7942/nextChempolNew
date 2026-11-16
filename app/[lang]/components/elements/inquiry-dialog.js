"use client";

// Popup form for "Get a Quote" (type "quote"), "Request a Product Sample" (type "sample") and
// "Ask Our Technical Team" (type "support": the sample details without the product list).
// The current product (when there is one) is already in the list; other products are found with the product
// search (any language) and added. Sent to app/api/inquiry, which does the security checks.

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { MdClose, MdCheckCircle } from "react-icons/md";
import { FaWhatsapp } from "react-icons/fa";
import { trackFormSubmission, trackWhatsappClick } from "@/libs/track";

const MAX_PRODUCTS = 10;

// Same limits as app/api/inquiry/route.js
const MAX_LENGTH = { quantity: 60, fullName: 100, company: 150, country: 100, phone: 30, email: 254, address: 250, city: 100, postcode: 20, remarks: 2000 };

// Error `code` from the API → dictionary key of the message shown
const ERROR_MESSAGES = {
  captcha: "captchaRequired",
  rate_limit: "tooManyRequests",
  too_long: "tooLong",
  invalid_email: "invalidEmail",
  invalid_phone: "invalidPhone",
  url: "noLinks",
  no_products: "noProducts",
  too_many_products: "tooManyProducts",
  quantity_required: "quantityRequired",
};

const inputClass =
  "w-full border border-gray-400 rounded px-3 py-2 text-base text-gray-800 bg-white font-light focus:outline-none focus:border-textBlue focus:ring-1 focus:ring-textBlue";
const labelClass = "block text-gray-800 text-sm font-semibold mb-1";

// WhatsApp number of the site (same one as the floating WhatsApp button); wa.me wants digits only
const WHATSAPP_NUMBER = String(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, "");

const emptyFields = { fullName: "", company: "", address: "", city: "", postcode: "", country: "", phone: "", email: "", remarks: "" };

const InquiryDialog = ({ type, locale, dictionary: d, product, onClose }) => {
  const isQuote = type === "quote";
  const isSupport = type === "support";
  const [products, setProducts] = useState(product?.slug ? [{ slug: product.slug, title: product.title, quantity: "" }] : []);
  const [fields, setFields] = useState(emptyFields);
  const [website, setWebsite] = useState(""); // honeypot: hidden, only bots fill it in
  const [captcha, setCaptcha] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const panelRef = useRef(null);
  const recaptchaRef = useRef(null);
  const searchRequest = useRef(null);

  // Open: lock page scroll, close on Escape, give the popup focus; on close put focus back on the button
  useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    const onKeyDown = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      opener?.focus?.();
    };
  }, [onClose]);

  // Product search (the same API as the site search bar, matches every language)
  useEffect(() => {
    const term = query.trim();
    searchRequest.current?.abort();

    if (term.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    searchRequest.current = controller;
    setSearching(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products/search?lang=${locale}&limit=6&q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const json = await res.json();
        setResults(json?.ok && Array.isArray(json.data) ? json.data : []);
        setSearching(false);
      } catch (error) {
        if (error.name !== "AbortError") setSearching(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, locale]);

  const setField = (name) => (event) => setFields((current) => ({ ...current, [name]: event.target.value }));

  const addProduct = (result) => {
    setProducts((current) =>
      current.length >= MAX_PRODUCTS || current.some((item) => item.slug === result.slug)
        ? current
        : [...current, { slug: result.slug, title: result.title, quantity: "" }]
    );
    setQuery("");
    setResults([]);
  };

  const setQuantity = (slug, quantity) =>
    setProducts((current) => current.map((item) => (item.slug === slug ? { ...item, quantity } : item)));

  const removeProduct = (slug) => setProducts((current) => current.filter((item) => item.slug !== slug));

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isQuote && products.some((item) => !item.quantity.trim())) return setStatus(d.quantityRequired);
    if (!captcha) return setStatus(d.captchaRequired);

    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          locale,
          products: products.map(({ slug, quantity }) => ({ slug, quantity })),
          ...fields,
          website,
          isCaptchaCode: captcha,
        }),
      });

      if (response.ok) {
        setDone(true);
        trackFormSubmission(type);
      } else {
        const result = await response.json().catch(() => ({}));
        setStatus(d[ERROR_MESSAGES[result.code]] || d.failed);
      }
    } catch (error) {
      console.error(error);
      setStatus(d.failed);
    } finally {
      // a reCAPTCHA answer works once: ask for a new one after every attempt
      setCaptcha("");
      recaptchaRef.current?.reset();
      setSubmitting(false);
    }
  };

  const title = isQuote ? d.quoteTitle : isSupport ? d.technicalTitle : d.sampleTitle;
  const available = results.filter((result) => !products.some((item) => item.slug === result.slug));

  return createPortal(
    <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center bg-black/60 sm:p-4" role="presentation">
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        className="relative w-full sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-white text-gray-800 rounded-t-xl sm:rounded-lg shadow-xl outline-none"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 px-4 sm:px-6 py-3 bg-white border-b border-gray-200">
          <h2 id="inquiry-title" className="text-lg sm:text-xl font-semibold text-textBlue">{title}</h2>
          <button type="button" onClick={onClose} aria-label={d.close} className="shrink-0 p-1 text-gray-700 hover:text-black">
            <MdClose className="text-2xl" />
          </button>
        </div>

        {done ? (
          <div className="px-4 sm:px-6 py-10 text-center">
            <MdCheckCircle aria-hidden="true" className="mx-auto text-6xl text-green-600" />
            <p className="mt-3 text-lg font-semibold">{d.successTitle}</p>
            <p className="mt-2 font-light">{isQuote ? d.successQuote : isSupport ? d.successTechnical : d.successSample}</p>
            <button type="button" onClick={onClose} className="mt-6 py-2 px-10 bg-textBlue text-white font-medium hover:bg-textLightBlue hover:text-gray-900 transition-colors">
              {d.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4">
            <p className="text-sm font-light text-gray-700 mb-4">{isQuote ? d.quoteIntro : isSupport ? d.technicalIntro : d.sampleIntro}</p>

            {/* Technical team: the visitor can also chat directly instead of filling in the form */}
            {isSupport && WHATSAPP_NUMBER && (
              <div className="mb-5">
                <a
                  onClick={trackWhatsappClick}
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(product?.title ? d.whatsappMessage.replace("{product}", product.title) : d.whatsappMessageGeneral)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                >
                  <FaWhatsapp aria-hidden="true" className="text-2xl shrink-0" />
                  {d.whatsappChat}
                </a>
                <p className="mt-3 flex items-center gap-3 text-sm font-light text-gray-500">
                  <span className="h-px flex-1 bg-gray-300" />
                  {d.whatsappOr}
                  <span className="h-px flex-1 bg-gray-300" />
                </p>
              </div>
            )}

            {/* honeypot: off screen and skipped by keyboard and screen readers, so only bots fill it in */}
            <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
              <label htmlFor="inquiry-website">Website</label>
              <input id="inquiry-website" name="website" type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
            </div>

            {!isSupport && (
            <fieldset className="mb-5">
              <legend className={labelClass}>{d.products} <span className="font-light">({d.optional})</span></legend>

              <ul className="space-y-2">
                {products.map((item) => (
                  <li key={item.slug} className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 border border-gray-300 rounded bg-gray-50">
                    <span className="flex-1 text-sm font-medium break-words">{item.title}</span>
                    {/* quotation only: samples have no quantity field */}
                    {isQuote && (
                      <input
                        type="text"
                        value={item.quantity}
                        onChange={(e) => setQuantity(item.slug, e.target.value)}
                        maxLength={MAX_LENGTH.quantity}
                        required
                        aria-label={`${d.quantity}: ${item.title}`}
                        placeholder={d.quantityPlaceholder}
                        className={`${inputClass} sm:w-48`}
                      />
                    )}
                    {products.length >= 1 && (
                      <button type="button" onClick={() => removeProduct(item.slug)} className="self-end sm:self-auto text-sm text-red-700 hover:underline px-1">
                        {d.remove}
                      </button>
                    )}
                  </li>
                ))}
              </ul>

              {products.length < MAX_PRODUCTS && (
                <div className="relative mt-3">
                  <label htmlFor="inquiry-search" className="sr-only">{d.addProduct}</label>
                  <input
                    id="inquiry-search"
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    autoComplete="off"
                    placeholder={d.addProduct}
                    className={inputClass}
                  />
                  {query.trim().length >= 2 && (
                    <ul className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto bg-white border border-gray-400 rounded shadow-lg">
                      {available.map((result) => (
                        <li key={result.slug}>
                          <button type="button" onClick={() => addProduct(result)} className="w-full text-start px-3 py-2 text-sm hover:bg-gray-100">
                            {result.title}
                          </button>
                        </li>
                      ))}
                      {!available.length && (
                        <li className="px-3 py-2 text-sm text-gray-600">{searching ? "…" : d.noResults}</li>
                      )}
                    </ul>
                  )}
                </div>
              )}
            </fieldset>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass} htmlFor="inq-fullName">{d.yourName}</label>
                <input id="inq-fullName" className={inputClass} value={fields.fullName} onChange={setField("fullName")} maxLength={MAX_LENGTH.fullName} autoComplete="name" required />
              </div>
              <div>
                <label className={labelClass} htmlFor="inq-company">{d.company}</label>
                <input id="inq-company" className={inputClass} value={fields.company} onChange={setField("company")} maxLength={MAX_LENGTH.company} autoComplete="organization" required />
              </div>

              {!isQuote && (
                <>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="inq-address">{d.address}</label>
                    <input id="inq-address" className={inputClass} value={fields.address} onChange={setField("address")} maxLength={MAX_LENGTH.address} autoComplete="street-address" required />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="inq-city">{d.city}</label>
                    <input id="inq-city" className={inputClass} value={fields.city} onChange={setField("city")} maxLength={MAX_LENGTH.city} autoComplete="address-level2" required />
                  </div>
                  {!isSupport && (
                  <div>
                    <label className={labelClass} htmlFor="inq-postcode">{d.postcode} <span className="font-light">({d.optional})</span></label>
                    <input id="inq-postcode" className={inputClass} value={fields.postcode} onChange={setField("postcode")} maxLength={MAX_LENGTH.postcode} autoComplete="postal-code" />
                  </div>
                  )}
                </>
              )}

              <div>
                <label className={labelClass} htmlFor="inq-country">{d.country}</label>
                <input id="inq-country" className={inputClass} value={fields.country} onChange={setField("country")} maxLength={MAX_LENGTH.country} autoComplete="country-name" required />
              </div>
              <div>
                <label className={labelClass} htmlFor="inq-phone">{isSupport ? d.phoneWhatsapp : d.phone} <small className="font-light text-gray-500">({d.countryCodeHint})</small></label>
                <input id="inq-phone" type="tel" dir="ltr" className={`${inputClass} rtl:text-right`} value={fields.phone} onChange={setField("phone")} maxLength={MAX_LENGTH.phone} autoComplete="tel" required />
              </div>
              <div className={isSupport ? "" : "sm:col-span-2"}>
                <label className={labelClass} htmlFor="inq-email">{d.email}</label>
                <input id="inq-email" type="email" dir="ltr" className={`${inputClass} rtl:text-right`} value={fields.email} onChange={setField("email")} maxLength={MAX_LENGTH.email} autoComplete="email" required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="inq-remarks">{isSupport ? d.askQuestion : <>{d.remarks} <span className="font-light">({d.optional})</span></>}</label>
                <textarea id="inq-remarks" rows="3" className={inputClass} value={fields.remarks} onChange={setField("remarks")} maxLength={MAX_LENGTH.remarks} required={isSupport} placeholder={isSupport ? d.askQuestionPlaceholder : d.remarksPlaceholder} />
                <small className="text-gray-500 font-light">{d.noLinks}</small>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}
                onChange={(token) => setCaptcha(token || "")}
                hl={locale}
              />
            </div>

            {status && <p role="alert" className="mt-4 text-[#A81B1A]">{status}</p>}

            <div className="mt-5 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button type="button" onClick={onClose} className="py-2 px-8 border border-gray-400 text-gray-800 hover:bg-gray-100 transition-colors">
                {d.cancel}
              </button>
              <button type="submit" disabled={submitting} className="py-2 px-10 bg-textBlue text-white font-medium hover:bg-textLightBlue hover:text-gray-900 disabled:opacity-60 transition-colors">
                {submitting ? d.sending : d.send}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

export default InquiryDialog;
