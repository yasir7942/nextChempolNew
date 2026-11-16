// Pushes an event to Google Tag Manager's dataLayer (browser only).
// It is a plain array push: no script is loaded, nothing waits for it, and it can never throw,
// so tracking can't slow a page down or break a form. Safe to call before GTM has loaded.
export function trackEvent(event, details = {}) {
    try {
        if (typeof window === "undefined") return;
        window.dataLayer = window.dataLayer || [];
        window.dataLayer.push({ event, ...details });
    } catch {
        // tracking must never affect the page
    }
}

// Form events, sent only after the server accepted the form
const FORM_EVENTS = {
    contact: ["contact_form_submission", "Contact Form"],
    quote: ["quote_form_submission", "Get a Quote Form"],
    sample: ["sample_form_submission", "Request a Sample Form"],
};

export function trackFormSubmission(form) {
    const entry = FORM_EVENTS[form];
    if (entry) trackEvent(entry[0], { form_name: entry[1], page_url: window.location.href });
}

export const trackWhatsappClick = () => trackEvent("whatsapp_click", { button_location: window.location.href });
