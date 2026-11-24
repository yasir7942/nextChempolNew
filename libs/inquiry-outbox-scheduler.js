// Retry timer of the Atlantic Inquiry Manager outbox: every minute, resends the copies that are due
// (libs/inquiry-forward.js). Started from instrumentation.js, like the redirect sync.
// Runs in production; in development only with INQUIRY_OUTBOX_IN_DEV=on.

import { processDueOutbox } from "./inquiry-forward.js";

const INTERVAL_MS = 60_000;

export function startInquiryOutboxScheduler() {
    const enabled = process.env.NODE_ENV === "production" || process.env.INQUIRY_OUTBOX_IN_DEV === "on";
    if (!enabled || globalThis.__inquiryOutboxSchedulerStarted) return;
    globalThis.__inquiryOutboxSchedulerStarted = true;

    let running = false;
    const run = async () => {
        if (running) return; // the previous run is still sending
        running = true;
        try {
            await processDueOutbox();
        } catch (error) {
            console.error("Inquiry Manager: retry timer error", error?.code || error?.name || "error");
        } finally {
            running = false;
        }
    };

    setTimeout(run, 15_000).unref();
    setInterval(run, INTERVAL_MS).unref();
}
