"use client";
import React, { useEffect, useRef } from 'react';

const VideoPopup = ({ videoId, onClose }) => {
    const popupRef = useRef(null);

    // Close the popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    // Prevent scrolling in background
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <div ref={popupRef} className="relative w-full max-w-[90%] lg:max-w-[70%] 2xl:max-w-[60%] bg-white p-4 rounded-xl">
                {/* Close button */}
                <button
                    className="absolute top-2 right-2 px-3 py-1 text-sm font-semibold bg-white rounded shadow"
                    onClick={onClose}
                >
                    ✕ Close
                </button>

                {/* YouTube Iframe */}
                <div className="relative w-full pt-[56.25%] mt-4"> {/* 16:9 aspect ratio */}
                    <iframe
                        className="absolute top-0 left-0 w-full h-full rounded"
                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        title="YouTube video"
                    ></iframe>
                </div>
            </div>
        </div>
    );
};

export default VideoPopup;
