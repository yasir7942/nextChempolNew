import Script from "next/script";

// Google Tag Manager for the public site (used by app/[lang]/layout.js and app/(home)/layout.js;
// the /admin pages are not tracked). GA4 (G-NYMMEC7K6G) is configured INSIDE this container,
// so the site must not load gtag.js / GA4 on its own as well (that would count every visit twice).
// The ID is public (it appears in every page), so it is kept here rather than in .env.
export const GTM_ID = "GTM-N77NPQ39";

// Google's official GTM snippet: starts the dataLayer, records the "gtm.js" start event (needed for
// the Page View / Initialization triggers) and loads the container asynchronously.
const GTM_SNIPPET = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`;

// "afterInteractive": GTM starts right after the page becomes interactive, so it never blocks the
// first paint, and still loads early enough to record every visit. Form and WhatsApp events
// (libs/track.js) push to the same window.dataLayer.
export default function GoogleTagManager() {
    return <Script id="google-tag-manager" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: GTM_SNIPPET }} />;
}

// For visitors with JavaScript turned off: Google's <noscript> iframe, placed right after <body> opens
export function GoogleTagManagerNoScript() {
    return (
        <noscript>
            <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
            />
        </noscript>
    );
}
