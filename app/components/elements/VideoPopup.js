import React, { useEffect, useRef } from 'react';

const VideoPopup = ({ videoId, onClose }) => {
    const popupRef = useRef(null);

    // Close the popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose(); // Close when clicking outside
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [onClose]);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-75 z-50">
            <div ref={popupRef} className="relative w-full  max-w-[90%] lg:max-w-[70%] 2xl:max-w-[60%] bg-white p-4">
                <button
                    className="absolute px-4 py-2 bg-white top-0 right-0 animate-colorChange"
                    onClick={onClose}
                >
                    Close X
                </button>

                <iframe
                    width="100%"
                    height="400"
                    className="mt-1 h-[350] md:h-[450] lg:h-[500] 2xl:h-[600]"
                    src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="YouTube video player"
                ></iframe>
            </div>
        </div>
    );
};

export default VideoPopup;
