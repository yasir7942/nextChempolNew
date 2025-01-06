"use client";

import { useEffect } from "react";
import TagManager from "react-gtm-module";

export default function GTMInitializer() {
    useEffect(() => {
        const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
        if (!gtmId) {
            console.warn("Google Tag Manager ID is not provided. Set NEXT_PUBLIC_GTM_ID in your .env.local");
            return;
        }

        TagManager.initialize({
            gtmId,
        });
    }, []);

    return null; // This component doesn't render anything visible
}
