"use client";

import { useState } from "react";
import Image from "next/image";
import moment from "moment";
import { getImageUrl } from "@/libs/helper";
import VideoPopup from "../elements/VideoPopup";


const DisaplyFrontVideos = ({ VideoData }) => {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    // Handle opening the popup when clicking on a video
    const handleOpenPopup = (videoId) => {
        setSelectedVideoId(videoId);
        setIsPopupOpen(true);
    };

    // Handle closing the popup
    const handleClosePopup = () => {
        setSelectedVideoId(null);
        setIsPopupOpen(false);
    };

    return (
        <div className="overflow-x-auto font-serif">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-7 mt-6">
                {VideoData.data.map((video) => {
                    return (
                        <div key={video.videoId} className="w-full flex flex-col text-white md:text-left pb-14">
                            <div className="relative cursor-pointer group" onClick={() => handleOpenPopup(video.videoId)}>
                                <Image
                                    className="w-full opacity-75"
                                    src={getImageUrl(video.image?.url)}
                                    width={800}
                                    height={600}
                                    alt={video.title || ""}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Image
                                        src="/images/youtube.png"
                                        width={120}
                                        height={80}
                                        alt="Play Video"
                                        className="w-20 h-12"
                                    />
                                </div>
                            </div>
                            <h2 className="text-gray-900 font-semibold leading-6 text-lg md:text-base pt-3">
                                {video.title || ""}
                            </h2>
                            <p className="text-sm text-gray-700 font-light">
                                {moment(video.youtubePublishedAt).format("MMMM D, YYYY")}
                            </p>
                            <p className="text-lx md:text-sm text-justify text-gray-800">
                                {video.description
                                    ? video.description.split(" ").length > 30
                                        ? video.description.split(" ").slice(0, 30).join(" ") + " ..."
                                        : video.description
                                    : ""}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Video Popup */}
            {isPopupOpen && selectedVideoId && <VideoPopup videoId={selectedVideoId} onClose={handleClosePopup} />}
        </div>
    );
};

export default DisaplyFrontVideos;
