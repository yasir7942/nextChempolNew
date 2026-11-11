// Syncs redirects once the server is up, then on an interval as a safety net
// in case a Strapi webhook was missed. Started from instrumentation.js.
import { syncRedirects, waitForServer } from "./sync";

const INTERVAL_MS = Math.max(5, Number(process.env.REDIRECT_SYNC_INTERVAL_MINUTES) || 60) * 60 * 1000;

export function startRedirectScheduler() {
    const enabled = process.env.NODE_ENV === "production" || process.env.REDIRECT_SYNC_IN_DEV === "on";
    if (!enabled || process.env.REDIRECT_SYNC === "off" || globalThis.__redirectSchedulerStarted) return;
    globalThis.__redirectSchedulerStarted = true;

    const run = (trigger) => syncRedirects({ trigger }).catch(() => { /* logged inside syncRedirects */ });

    setTimeout(async () => {
        await waitForServer();
        await run("startup");
        setInterval(() => run("schedule"), INTERVAL_MS).unref();
    }, 1000).unref();
}
