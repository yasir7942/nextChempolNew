"use client";
import { useEffect, useState } from "react";
import FretchVideos from "../layout/FretchVideos";


const FretchVideosWrapper = ({ limitedVideo }) => {
    const [componentKey, setComponentKey] = useState(Math.random()); // Unique key to force re-render

    useEffect(() => {
        setComponentKey(Math.random()); // Re-render when user navigates back
    }, []);

    return <FretchVideos key={componentKey} limitedVideo={limitedVideo} />;
};

export default FretchVideosWrapper;
