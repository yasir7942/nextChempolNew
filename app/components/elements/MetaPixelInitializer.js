"use client";

import { useEffect } from "react";
import { initializeMetaPixel } from "./metaPixel";

export default function MetaPixelInitializer() {
    useEffect(() => {
        initializeMetaPixel();
    }, []);

    return null; // This component doesn't render anything visible
}
