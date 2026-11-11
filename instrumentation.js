export async function register() {
    // Node.js server only, and not while `next build` prerenders pages
    if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;

    const { startRedirectScheduler } = await import("./libs/redirects/scheduler");
    startRedirectScheduler();
}
