import { NextResponse } from "next/server";

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const maxResult = searchParams.get("maxResults") || 8;
        const nextPageToken = searchParams.get("pageToken") || "";

        const apiKey = process.env.YOUTUBE_API_KEY;
        const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&channelId=UCa16oZVYnwixGIPVAZ9l5rw&maxResults=${maxResult}&order=date&key=${apiKey}&pageToken=${nextPageToken}`;
        console.log(url)
        const response = await fetch(url, {
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        });

        if (!response.ok) throw new Error(`YouTube API Error: ${response.statusText}`);

        const data = await response.json();

        return NextResponse.json(data);
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
