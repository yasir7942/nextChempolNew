"use client";

import { useEffect } from "react";

export const initializeMetaPixel = () => {
    const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

    if (typeof window === "undefined" || !pixelId) {
        console.warn("Meta Pixel ID is not provided or running on the server.");
        return;
    }

    if (!window.fbq) {
        // Load the Meta Pixel script
        window.fbq = function () {
            window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
        };
        window.fbq.queue = [];
        window.fbq.version = "2.0";
        window.fbq.loaded = true;
        window.fbq.push = window.fbq;
        window.fbq("init", pixelId);
    }

    window.fbq("track", "PageView"); // Track the initial page view
};
