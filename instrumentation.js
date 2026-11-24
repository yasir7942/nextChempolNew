export async function register() {
    // Node.js server only, and not while `next build` prerenders pages
    if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;

    const { startRedirectScheduler } = await import("./libs/redirects/scheduler");
    startRedirectScheduler();

    // resends Atlantic Inquiry Manager copies that are still pending (libs/inquiry-forward.js)
    const { startInquiryOutboxScheduler } = await import("./libs/inquiry-outbox-scheduler");
    startInquiryOutboxScheduler();
}
