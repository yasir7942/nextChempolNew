"use client";
import Image from "next/image";
import moment from "moment";
import React, { useState, useEffect, useRef } from "react";
import VideoPopup from "../elements/VideoPopup";


const FretchVideos = ({ limitedVideo = false }) => {

    const [youtubeData, setYoutubeData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [selectedVideoId, setSelectedVideoId] = useState(null);
    const [nextPageToken, setNextPageToken] = useState(null);
    const [totalResults, setTotalResults] = useState(0);
    const [isFetchingMore, setIsFetchingMore] = useState(false);
    const observerRef = useRef(null);

    const fetchVideos = async (pageToken = "") => {
        try {
            setIsFetchingMore(true);

            const maxResults = limitedVideo ? 4 : 18; // 🔥 Load only 4 if limitedVideo is true
            const response = await fetch(`/api/youtube?maxResults=${maxResults}&pageToken=${pageToken}`);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);

            const data = await response.json();
            const newVideos = data.items?.filter(video => video.id.videoId) || [];

            // 🔥 Remove duplicates using a Set
            setYoutubeData((prevVideos) => {
                const existingVideoIds = new Set(prevVideos.map(video => video.id.videoId));
                const uniqueVideos = newVideos.filter(video => !existingVideoIds.has(video.id.videoId));
                return limitedVideo ? uniqueVideos : [...prevVideos, ...uniqueVideos]; // Only 4 if limited
            });

            setNextPageToken(limitedVideo ? null : data.nextPageToken || null); // 🔥 Stop pagination if limited
            setTotalResults(data.pageInfo?.totalResults || 0);
        } catch (e) {
            setError(e);
            console.error("Error fetching YouTube data:", e);
        } finally {
            setLoading(false);
            setIsFetchingMore(false);
        }
    };

    useEffect(() => {
        fetchVideos(); // Load initial videos
    }, []);

    useEffect(() => {
        if (limitedVideo || !nextPageToken || youtubeData.length >= totalResults) return; // 🔥 Stop observer if limited

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !isFetchingMore) {
                    fetchVideos(nextPageToken);
                }
            },
            { threshold: 1.0 }
        );

        if (observerRef.current) {
            observer.observe(observerRef.current);
        }

        return () => {
            if (observerRef.current) {
                observer.unobserve(observerRef.current);
            }
        };
    }, [nextPageToken, isFetchingMore]);

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
                    const videoKey = video.id.videoId;
                    return (
                        <div key={videoKey} className="w-full flex flex-col text-white md:text-left pb-14">
                            <div className="relative cursor-pointer group" onClick={() => handleOpenPopup(videoKey)}>
                                {/* YouTube Thumbnail */}
                                <Image
                                    className="w-full opacity-75"
                                    src={video.snippet?.thumbnails.high.url}
                                    width={800}
                                    height={600}
                                    alt={video.snippet?.title || ""}
                                />

                                {/* YouTube Play Button Overlay */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className=" ">
                                        <Image
                                            src="../images/youtube.png" // Ensure this file is in the /public folder
                                            width={120}
                                            height={80}
                                            alt="Play Video"
                                            className="w-20 h-12 "
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Video Title & Description */}
                            <h2 className="text-gray-900 font-semibold leading-6 text-lg md:text-base pt-3">
                                {video.snippet?.title || ""}
                            </h2>
                            <p className="text-sm text-gray-700 font-light">
                                {moment(video.snippet?.publishTime).format("MMMM D, YYYY")}
                            </p>
                            <p className="text-lx md:text-sm text-justify text-gray-800">
                                {video.snippet?.description
                                    ? video.snippet?.description.split(" ").length > 30
                                        ? video.snippet?.description.split(" ").slice(0, 30).join(" ") + " ..."
                                        : video.snippet?.description
                                    : ""}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Infinite Scroll Loader (🔥 Hidden if limitedVideo is true) */}
            {!limitedVideo && nextPageToken && youtubeData.length < totalResults && (
                <div ref={observerRef} className="flex justify-center py-6">
                    <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
            )}

            {/* Video Popup */}
            {isPopupOpen && selectedVideoId && (
                <VideoPopup videoId={selectedVideoId} onClose={handleClosePopup} />
            )}
        </div>
    );
};

export default FretchVideos;
