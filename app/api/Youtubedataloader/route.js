import { NextResponse } from "next/server";
import fs from "fs/promises"; // File system for reading/writing
import path from "path";

const FILE_PATH = path.join(process.cwd(), "public/youtubeData.json"); // Save JSON in public folder
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = "UCa16oZVYnwixGIPVAZ9l5rw"; // Your YouTube channel ID

// 🔥 Fetch YouTube videos (with pagination support)
async function fetchYouTubeVideos(maxResults, pageToken = "") {
    const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${maxResults}&order=date&key=${API_KEY}&pageToken=${pageToken}`;

    const response = await fetch(url, { headers: { "Content-Type": "application/json" }, cache: "no-store" });

    if (!response.ok) throw new Error(`YouTube API Error: ${response.statusText}`);

    return response.json();
}

// 🔹 Load existing data from JSON file
async function loadExistingData() {
    try {
        const fileContent = await fs.readFile(FILE_PATH, "utf-8");
        return JSON.parse(fileContent);
    } catch (err) {
        console.warn("youtubeData.json not found. Fetching all videos...");
        return []; // If file does not exist, return empty array
    }
}

// 🔥 Fetch all videos if JSON file is missing
async function fetchAllVideos() {
    let allVideos = [];
    let pageToken = "";
    let totalFetched = 0;

    do {
        const data = await fetchYouTubeVideos(50, pageToken); // Fetch 50 videos per request
        const newVideos = data.items.filter(video => video.id.videoId); // Filter valid videos

        allVideos = [...allVideos, ...newVideos]; // Append new videos
        totalFetched += newVideos.length;
        pageToken = data.nextPageToken || null; // Update page token for next fetch
    } while (pageToken && totalFetched < data.pageInfo.totalResults); // Continue until all videos are fetched

    // Save all videos to JSON file
    await fs.writeFile(FILE_PATH, JSON.stringify(allVideos, null, 2), "utf-8");
    console.log(`✅ Saved ${allVideos.length} videos to youtubeData.json`);

    return allVideos;
}

// 🔹 Incremental update: Fetch only new videos (max 8)
async function fetchNewVideos(existingVideos) {
    const data = await fetchYouTubeVideos(8); // Fetch 8 new videos
    const existingVideoIds = new Set(existingVideos.map(video => video.id.videoId));
    const newVideos = data.items.filter(video => video.id.videoId && !existingVideoIds.has(video.id.videoId)); // Remove duplicates

    if (newVideos.length > 0) {
        const updatedData = [...newVideos, ...existingVideos]; // Merge new + old
        await fs.writeFile(FILE_PATH, JSON.stringify(updatedData, null, 2), "utf-8");
        console.log(`✅ Added ${newVideos.length} new videos.`);
    } else {
        console.log("✅ No new videos found.");
    }

    return newVideos;
}

// ✅ API Route (Handles both First-Time Fetch and Incremental Updates)
export async function GET() {
    try {
        let existingVideos = await loadExistingData();

        if (existingVideos.length === 0) {
            // First-time fetch (get all videos)
            existingVideos = await fetchAllVideos();
        } else {
            // Incremental update (fetch 8 and append if new)
            await fetchNewVideos(existingVideos);
        }

        return NextResponse.json({ message: "Data updated", total: existingVideos.length });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
