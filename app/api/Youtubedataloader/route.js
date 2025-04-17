/**** This GET Api have Authenticated API Key
 *  if no record found  in databsefetach 500 records and fill data 
 * when project created we have total 38 videos and threshold  of uploading videos is 3 videos per week 
 * Run Auto featch api with in 24 hours and featch only 5 records or send query to youtube have latest then this date  "publishedAfter" ( The value is an RFC 3339 formatted date-time value (1970-01-01T00:00:00Z).)
 * if have save in Strapi  with image save image in strapi
 */







import { NextResponse } from "next/server";


const STRAPI_API_URL = process.env.NEXT_PUBLIC_API_BASE_URL;;
const API_KEY = process.env.YOUTUBE_API_KEY;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID // Your YouTube channel ID
const ADMIN_PUSH_TOKEN = process.env.ADMIN_PUSH_TOKEN;
const VALID_TOKEN = process.env.ADMIN_TOKEN;

// ✅ Fetch YouTube Videos (Ensures `data` is defined)

async function fetchYouTubeVideos(maxResults, pageToken = "", PublishedAfterDate = "") {
    const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&maxResults=${maxResults}&order=date&key=${API_KEY}&pageToken=${pageToken}&publishedAfter=${PublishedAfterDate}`;

    const response = await fetch(url, { headers: { "Content-Type": "application/json" }, cache: "no-store" });

    if (!response.ok) throw new Error(`YouTube API Error: ${response.statusText}`);

    const data = await response.json();
    if (!data || !data.items) throw new Error("Invalid YouTube API response.");

    return data;
}

// ✅ Load Existing Video Data from Strapi (Ensures Array)

async function CheckDataEmpty() {
    try {
        // Fetch videos
        console.log(`${STRAPI_API_URL}videos`);
        const response = await fetch(`${STRAPI_API_URL}videos`, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store", // Ensure fresh data
        });
        if (!response.ok) throw new Error("Failed to fetch Videos  from Strapi");
        const { data } = await response.json();
        return data;
    } catch (err) {
        console.warn("Fail to fetch data form strapi");
        return []; // Return empty array if file doesn't exist or has issues
    }
}

function generateSlug(text) {
    if (typeof text !== 'string') return 'no-title';

    const cleaned = text
        .replace(/&#\d+;|&[a-z]+;/gi, '')       // Remove HTML entities like &#39; or &amp;
        .replace(/[–—|#]/g, '')                 // Remove long dash, pipe, hashtag
        .toLowerCase()                          // Convert to lowercase
        .trim()                                 // Remove leading/trailing spaces
        .replace(/[^a-z0-9\s-]/g, '')           // Remove non-alphanumeric chars except space/hyphen
        .replace(/\s+/g, '-')                   // Replace spaces with -
        .replace(/-+/g, '-');                   // Replace multiple hyphens with single hyphen

    // Trim slug to max 20 characters, avoid cutting in the middle of a word if possible
    const trimmed = cleaned.length > 25
        ? cleaned.slice(0, 25).replace(/-+$/g, '').replace(/-[^-]*$/, '')
        : cleaned;

    return trimmed;
}

// ✅ Convert to strapi json

function prepareYouTubeDataForStrapi(youtubeJson) {


    const formattedVideos = youtubeJson.map(item => {
        const snippet = item.snippet || {};
        const id = item.id || {};

        return {
            title: snippet.title || "NO Title",
            videoId: id.videoId || "", // empty if it's a playlist
            description: snippet.description || "",
            image: snippet.thumbnails?.high?.url || "",
            youtubePublishedAt: snippet.publishedAt || "",
        };
    });

    return formattedVideos;
}


// date convertor strapi date
async function toDateWithoutTimeZone(isoString) {

    const dateOnly = isoString.split("T")[0]; // Get just the "YYYY-MM-DD"
    return new Date(dateOnly); // Create Date object with only the date
}



// ✅ Save Videos to Strapi Admin            ---pending

async function uploadVideosToStrapi(rawDataFromYouTube) {
    // Prepare the YouTube data before uploading
    const preparedData = prepareYouTubeDataForStrapi(rawDataFromYouTube);



    // Function to upload image from URL (YouTube thumbnail)
    async function uploadImageFromUrl(imageUrl, title) {

        try {



            const imageRes = await fetch(imageUrl);
            const myBlob = await imageRes.blob();


            // Check if the image URL was successfully fetched
            if (!imageRes.ok) {
                console.error(`❌ Failed to fetch image from URL: ${imageUrl}`);
                return null;
            }
            const fileName = generateSlug(title)

            //const imageBuffer = await imageRes.arrayBuffer();
            const formData = new FormData();

            //formData.append("file", new Blob([imageBuffer]), fileName + ".jpg");
            formData.append('files', myBlob, `youtube-${fileName}.jpg`);
            formData.append('field', 'image');
            formData.append("field", "youtubeImage.jpg");


            console.log("---------------------filename----------------");
            console.log(`youtube-.${fileName}.jpg`);





            const res = await fetch(`${STRAPI_API_URL}upload`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${ADMIN_PUSH_TOKEN}`,
                },
                body: formData,
            });



            const result = await res.json();
            if (!res.ok || !result[0]?.id) {
                console.error("❌ Failed to upload image:", result);
                return null;
            }
            console.log(result);
            return result[0]?.id; // Return the image ID for linking in the video upload
        } catch (err) {
            console.error("Error uploading image:", err);
            return null;
        }
    }

    try {
        const responses = await Promise.all(
            preparedData.map(async (entry) => {


                const thumbnailId = await uploadImageFromUrl(entry.image, entry.title);
                console.log(thumbnailId);
                if (!thumbnailId) {
                    console.warn(`Skipping ${entry.title} due to thumbnail upload issue.`);
                    return null;
                }

                const formattedDate = await toDateWithoutTimeZone(entry.youtubePublishedAt);

                const reqData = {

                    data: {
                        title: entry.title,
                        videoId: entry.videoId,
                        youtubePublishedAt: formattedDate,
                        description: entry.description,
                        publishedAt: new Date().toISOString(), // Set the current date/time for publishing
                        image: thumbnailId, // Link to the uploaded thumbnail
                        youtubeFullDate: entry.youtubePublishedAt
                    },
                };


                const res = await fetch(`${STRAPI_API_URL}videos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${ADMIN_PUSH_TOKEN}`,
                    },
                    body: JSON.stringify(reqData),
                });

                if (!res.ok) {
                    console.error(`❌ Failed to upload video: ${entry.title}`);
                    return null;
                }

                return res.json();
            })
        );

        console.log("✅ Upload complete:", responses);
        return responses;
    } catch (err) {
        console.error("Error uploading videos:", err);
        return [];
    }
}


// ✅ Fetch All Videos (Handles `data` Correctly)
async function fetchAllVideos() {
    let allVideos = [];
    let pageToken = "";
    let totalFetched = 0;

    do {
        const data = await fetchYouTubeVideos(400, pageToken);
        if (!data.items) break; // Prevent errors if API fails

        const newVideos = data.items.filter(video => video.id && video.id.videoId); // Filter valid videos
        allVideos = [...allVideos, ...newVideos]; // Append new videos
        totalFetched += newVideos.length;
        pageToken = data.nextPageToken || null; // Update page token for next fetch
    } while (pageToken && totalFetched < (data.pageInfo?.totalResults || 0)); // Continue until all videos are fetched

    console.log(`✅ Saved ${allVideos.length} videos to strapi Admin`);

    return allVideos;
}





// ✅ featch single video form strapi           

async function fetchLatestSingleVideo() {


    try {
        // Fetch only the latest video sorted by youtubePublishedAt in descending order
        const response = await fetch(
            `${STRAPI_API_URL}videos?sort=youtubePublishedAt:desc&pagination[limit]=1`,
            {
                headers: { "Content-Type": "application/json" },
                cache: "no-store", // Ensure fresh data
            }
        );

        if (!response.ok) throw new Error("Failed to fetch the latest video from Strapi");

        const { data } = await response.json();
        return data.length > 0 ? data[0] : null; // Return the first record or null if empty
    } catch (err) {
        console.warn("Failed to fetch data from Strapi");
        return null; // Return null in case of an error
    }
}


// ✅ Fetch New Videos (get latest Publuch date and then run youtube query)
async function fetchNewVideos(existingVideos) {

    const latestVideo = await fetchLatestSingleVideo();  //froem strapi



    const data = await fetchYouTubeVideos(5, "", latestVideo.attributes.youtubeFullDate);
    if (!data.items) return [];



    const newVideos = data.items.filter(video =>
        video.id &&
        video.id.videoId &&
        video.snippet?.publishedAt !== latestVideo.attributes.youtubeFullDate
    );

    if (newVideos.length > 0) {
        // upload data to strapi
        console.log(`✅ Added ${newVideos.length} new videos.`);





    } else {
        console.log("✅ No new videos found.");
    }

    return newVideos;
}

// ✅ API Route: Fetch YouTube Data & Store in JSON
export async function GET(req) {

    try {

        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token") || "No token provided";

        console.log(token);

        // Validate token
        if (!token || token !== VALID_TOKEN) {
            return NextResponse.json(
                { success: false, error: "Unauthorized: Invalid token" },
                { status: 401 }
            );
        }


        let existingVideos = await CheckDataEmpty();

        if (existingVideos.length === 0) {
            // First-time fetch (get all videos)
            const youtubefetchedData = await fetchAllVideos();
            await uploadVideosToStrapi(youtubefetchedData)


        } else {

            console.log("featch new videos");
            // Incremental update (fetch new videos and append if available)
            const latestVideos = await fetchNewVideos(); //from youtube
            await uploadVideosToStrapi(latestVideos)
            console.log("==============youtube latest=======================");
            console.log(latestVideos);
        }



        return NextResponse.json({ message: "Data updated", total: existingVideos.length });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
