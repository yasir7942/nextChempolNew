"use client";
import Image from "next/image";
import { useState } from "react";
import VideoPopup from "./VideoPopup";

// Video thumbnail that opens the YouTube player in a popup (the only client-side part of a video card)
const VideoPlayButton = ({ videoId, title, thumbnail }) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={`Play video: ${title}`}
                className="relative block w-full cursor-pointer group"
            >
                <Image
                    className="w-full opacity-75 transition group-hover:opacity-90"
                    src={thumbnail}
                    width={480}
                    height={360}
                    sizes="(min-width: 1536px) 25vw, (min-width: 768px) 33vw, 100vw"
                    alt={title}
                />
                <span className="absolute inset-0 flex items-center justify-center">
                    <Image src="/images/youtube.png" width={120} height={80} alt="" className="w-20 h-12" />
                </span>
            </button>

            {open && <VideoPopup videoId={videoId} onClose={() => setOpen(false)} />}
        </>
    );
};

export default VideoPlayButton;
