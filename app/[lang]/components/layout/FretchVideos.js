"use client";
import Image from "next/image";
import moment from "moment";
import React, { useState, useEffect } from "react";
import VideoPopup from "../elements/VideoPopup";
import { getImageUrl } from "@/libs/helper";

const FretchVideos = ({ limitedVideo = false }) => {
    const [youtubeData, setYoutubeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);

    const fetchVideos = async () => {
        try {
            const limitParam = limitedVideo ? "&pagination[pageSize]=4" : "";
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}videos?populate=*&sort=youtubePublishedAt:desc${limitParam}`);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);


            const json = await response.json();
            const videos = json.data || [];

            setYoutubeData(videos);
        } catch (e) {
            setError(e);
            console.error("Error fetching Strapi video data:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVideos();
    }, []);

    const handleOpenPopup = (videoId) => {
        setSelectedVideoId(videoId);
        setIsPopupOpen(true);
    };

    const handleClosePopup = () => {
        setSelectedVideoId(null);
        setIsPopupOpen(false);
    };

    if (loading)
        return (
            <div className="flex items-center justify-center mt-5 pb-16">
                <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
        );

    if (error) return <p>Error: {error.message}</p>;

    return (
        <div className="overflow-x-auto font-serif">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-7 mt-6">
                {youtubeData.map((video) => {

                    console.log(video.title);
                    const videoId = video.videoId;
                    const thumbnailUrl = video.image?.url;

                    return (
                        <div key={video.id} className="w-full flex flex-col text-white md:text-left pb-14">
                            <div className="relative cursor-pointer group" onClick={() => handleOpenPopup(videoId)}>
                                <Image
                                    className="w-full opacity-75"
                                    src={getImageUrl(thumbnailUrl) || "/placeholder.jpg"}
                                    width={800}
                                    height={600}
                                    quality={100}
                                    alt={video.title || ""}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Image
                                        src="/images/youtube.png"
                                        width={120}
                                        height={80}
                                        alt="Video Play Button"
                                        className="w-20 h-12"
                                    />
                                </div>
                            </div>

                            <h2 className="text-gray-900 font-semibold leading-6 text-lg md:text-base pt-3">
                                {video.title}
                            </h2>

                            <p className="text-sm text-gray-700 font-light">
                                {moment(video.youtubeFullDate).format("MMMM D, YYYY")}
                            </p>

                            <p className="text-lx md:text-sm text-justify text-gray-800">
                                {video.description?.split(" ").length > 30
                                    ? video.description.split(" ").slice(0, 30).join(" ") + " ..."
                                    : video.description}
                            </p>
                        </div>
                    );
                })}
            </div>

            {isPopupOpen && selectedVideoId && (
                <VideoPopup videoId={selectedVideoId} onClose={handleClosePopup} />
            )}
        </div>
    );
};

export default FretchVideos;
