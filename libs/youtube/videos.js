/*
  YouTube videos in Strapi (the Video collection), server-side only.

  Used by the videos pages, the home page video section, the sitemap, the admin
  YouTube page (/admin/reports/youtube/) and the YouTube import
  (/api/youtubedataloader and the admin "Fetch YouTube data" button).

  - Reads use Strapi's public API.
  - Writes (add, edit, hide, show, delete, import) use the server-only ADMIN_PUSH_TOKEN.

  Stored formats (same as every existing record, never converted):
  - youtubeFullDate:    string, UTC "YYYY-MM-DDTHH:mm:ssZ" (YouTube's publishedAt)
  - youtubePublishedAt: Strapi date "YYYY-MM-DD" (the UTC day of youtubeFullDate)

  Hidden videos are Strapi drafts: the Content API can't unpublish, so hiding
  saves a draft copy and deletes the published document.
*/
import { VIDEOS_TAG } from "@/libs/revalidate-pages";

const STRAPI_API = (process.env.NEXT_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3";

// Strapi API token with write and upload permission on videos (server-only, never sent to the browser)
const WRITE_TOKEN = process.env.ADMIN_PUSH_TOKEN;

// Videos per page on /<lang>/videos/ (?page=N), also used by the sitemap
export const VIDEOS_PAGE_SIZE = 12;

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const FULL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Gone (deleted), private or not embeddable on YouTube
const UNAVAILABLE_STATUSES = [400, 401, 403, 404];
const QUOTA_REASONS = ["quotaExceeded", "dailyLimitExceeded", "rateLimitExceeded", "userRateLimitExceeded"];

const VIDEO_QUERY = [
    "fields[0]=title",
    "fields[1]=videoId",
    "fields[2]=description",
    "fields[3]=youtubePublishedAt",
    "fields[4]=youtubeFullDate",
    "fields[5]=publishedAt",
    "fields[6]=updatedAt",
    "populate[image][fields][0]=url",
].join("&");

// Newest first; the full date breaks ties between videos of the same day
const VIDEO_SORT = "sort[0]=youtubePublishedAt:desc&sort[1]=youtubeFullDate:desc";

// An error with the HTTP status the API routes should answer with
export class VideoError extends Error {
    constructor(message, status = 400) {
        super(message);
        this.status = status;
    }
}

/* ---------------- display helpers ---------------- */

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

// Titles imported from YouTube's search API are HTML-escaped ("Chempol&#39;s"); shown decoded
export function decodeEntities(text) {
    return String(text ?? "").replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, code) => {
        if (code[0] !== "#") return ENTITIES[code.toLowerCase()] ?? match;
        const point = code[1].toLowerCase() === "x" ? parseInt(code.slice(2), 16) : parseInt(code.slice(1), 10);
        return Number.isFinite(point) && point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : match;
    });
}

export const youtubeThumbnail = (videoId) => `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
export const youtubeWatchUrl = (videoId) => `https://www.youtube.com/watch?v=${videoId}`;
export const youtubeEmbedUrl = (videoId) => `https://www.youtube.com/embed/${videoId}`;

// Accepts the 11-character ID or any YouTube link (watch, youtu.be, shorts, embed, live)
export function extractVideoId(value) {
    const text = String(value ?? "").trim();
    if (VIDEO_ID_PATTERN.test(text)) return text;

    try {
        const url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
        const host = url.hostname.replace(/^(www|m|music)\./, "");
        const id = host === "youtu.be"
            ? url.pathname.split("/")[1]
            : url.searchParams.get("v") || url.pathname.match(/^\/(?:shorts|embed|live|v)\/([^/?#]+)/)?.[1];

        return ["youtube.com", "youtu.be", "youtube-nocookie.com"].includes(host) && VIDEO_ID_PATTERN.test(id || "") ? id : "";
    } catch {
        return "";
    }
}

/* ---------------- Strapi ---------------- */

async function strapi(path, { method = "GET", body, write = false, allowNotFound = false, cacheOptions } = {}) {
    const headers = {};
    if (body !== undefined) headers["Content-Type"] = "application/json";

    if (write) {
        if (!WRITE_TOKEN) throw new VideoError("ADMIN_PUSH_TOKEN is missing in .env, so videos can't be saved.", 500);
        headers.Authorization = `Bearer ${WRITE_TOKEN}`;
    }

    let response;
    try {
        response = await fetch(`${STRAPI_API}/${path}`, {
            method,
            headers,
            body: body === undefined ? undefined : JSON.stringify(body),
            ...(cacheOptions || { cache: "no-store" }),
        });
    } catch (error) {
        throw new VideoError(`Strapi is not reachable (${error?.cause?.code || error.message}).`, 502);
    }

    if (allowNotFound && response.status === 404) return null;
    if (response.status === 204) return {};

    const json = await response.json().catch(() => null);
    if (write && (response.status === 401 || response.status === 403)) {
        throw new VideoError(
            response.status === 401
                ? "Strapi rejected ADMIN_PUSH_TOKEN (401): the token in .env does not exist in this Strapi. Create an API token in Strapi (Settings → API Tokens) and put it in ADMIN_PUSH_TOKEN."
                : "ADMIN_PUSH_TOKEN is not allowed to change videos (403). In Strapi (Settings → API Tokens) give it create, update and delete on Video and upload on Upload.",
            502
        );
    }
    if (!response.ok) {
        const reason = json?.error?.message || response.statusText;
        throw new VideoError(`Strapi ${method} ${path.split("?")[0]} failed (${response.status}): ${reason}`, 502);
    }

    return json;
}

async function readAll(status, cacheOptions) {
    const videos = [];

    for (let page = 1; ; page++) {
        const json = await strapi(
            `videos?${VIDEO_QUERY}&${VIDEO_SORT}&status=${status}&pagination[page]=${page}&pagination[pageSize]=100`,
            { cacheOptions }
        );
        videos.push(...(json?.data || []));

        if (page >= (json?.meta?.pagination?.pageCount || 1)) return videos;
    }
}

// Published videos, newest first. Cached for an hour; revalidateVideoPages() clears it.
export function getPublishedVideos() {
    return readAll("published", { next: { revalidate: 3600, tags: [VIDEOS_TAG] } });
}

// Asks YouTube's oEmbed endpoint (no API key) whether the video can still be played.
// A network or YouTube error keeps the video, so an outage never empties a page.
export async function isAvailableOnYouTube(videoId) {
    const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(youtubeWatchUrl(videoId))}`;

    try {
        const response = await fetch(url, { next: { revalidate: 86400 } });
        return !UNAVAILABLE_STATUSES.includes(response.status);
    } catch {
        return true;
    }
}

// Published videos that still play on YouTube: the /videos/ pages and the sitemap
export async function getPlayableVideos() {
    const videos = (await getPublishedVideos()).filter((video) => VIDEO_ID_PATTERN.test(video.videoId || ""));
    const playable = await Promise.all(videos.map((video) => isAvailableOnYouTube(video.videoId)));

    return videos.filter((_, index) => playable[index]);
}

const adminVideo = (video, hidden) => ({
    documentId: video.documentId,
    title: video.title || "",
    videoId: video.videoId || "",
    description: video.description || "",
    youtubeFullDate: video.youtubeFullDate || "",
    youtubePublishedAt: video.youtubePublishedAt || "",
    image: video.image?.url ? { id: video.image.id, url: video.image.url } : null,
    hidden,
    publishedAt: video.publishedAt || null,
    updatedAt: video.updatedAt || null,
});

// Every video for the admin page, hidden (draft) ones included, with "still plays on YouTube"
export async function getAdminVideos() {
    const [published, drafts] = await Promise.all([readAll("published"), readAll("draft")]);
    const live = new Map(published.map((video) => [video.documentId, video]));

    const videos = drafts.map((draft) => {
        const publishedVersion = live.get(draft.documentId);
        return adminVideo(publishedVersion || draft, !publishedVersion);
    });

    const playable = await Promise.all(
        videos.map((video) => (VIDEO_ID_PATTERN.test(video.videoId) ? isAvailableOnYouTube(video.videoId) : false))
    );

    return videos.map((video, index) => ({ ...video, playable: playable[index] }));
}

async function getVideo(documentId) {
    const id = encodeURIComponent(documentId);
    const [published, draft] = await Promise.all([
        strapi(`videos/${id}?${VIDEO_QUERY}`, { allowNotFound: true }),
        strapi(`videos/${id}?${VIDEO_QUERY}&status=draft`, { allowNotFound: true }),
    ]);

    const video = published?.data || draft?.data;
    if (!video) throw new VideoError("This video no longer exists in Strapi. Refresh the list.", 404);

    return adminVideo(video, !published?.data);
}

async function findByVideoId(videoId) {
    const json = await strapi(
        `videos?status=draft&filters[videoId][$eq]=${encodeURIComponent(videoId)}&fields[0]=title&pagination[pageSize]=10`
    );
    return json?.data || [];
}

async function assertNewVideoId(videoId, exceptDocumentId) {
    const other = (await findByVideoId(videoId)).find((video) => video.documentId !== exceptDocumentId);
    if (other) throw new VideoError(`This YouTube video is already saved: "${decodeEntities(other.title)}".`, 409);
}

/* ---------------- validation ---------------- */

const isRealFullDate = (value) =>
    FULL_DATE_PATTERN.test(value) && new Date(value).toISOString().replace(/\.\d{3}Z$/, "Z") === value;

const isRealDate = (value) =>
    DATE_PATTERN.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

/*
  Checks admin input. With `partial`, only the fields present are checked and
  returned, so an edit sends Strapi only what changed.
*/
export function validateVideoInput(input, { partial = false } = {}) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new VideoError("Invalid request body.");

    const has = (key) => Object.prototype.hasOwnProperty.call(input, key);
    const data = {};
    const errors = [];

    if (!partial || has("title")) {
        data.title = String(input.title ?? "").trim();
        if (!data.title) errors.push("Title is required.");
        else if (data.title.length > 255) errors.push("Title must be 255 characters or fewer.");
    }

    if (!partial || has("videoId")) {
        data.videoId = extractVideoId(input.videoId);
        if (!data.videoId) errors.push("Enter a YouTube link or the 11-character video ID.");
    }

    if (has("description")) {
        data.description = String(input.description ?? "").trim();
        if (data.description.length > 5000) errors.push("Description must be 5000 characters or fewer.");
    }

    if (!partial || has("youtubeFullDate")) {
        data.youtubeFullDate = String(input.youtubeFullDate ?? "").trim();
        if (!isRealFullDate(data.youtubeFullDate)) errors.push("Full date must be a real UTC date and time (YYYY-MM-DDTHH:mm:ssZ).");
    }

    if (!partial || has("youtubePublishedAt")) {
        data.youtubePublishedAt = String(input.youtubePublishedAt ?? "").trim();
        if (!isRealDate(data.youtubePublishedAt)) errors.push("Published date must be a real date (YYYY-MM-DD).");
    }

    if (errors.length) throw new VideoError(errors.join(" "));

    return data;
}

/* ---------------- thumbnails ---------------- */

function fileSlug(text) {
    const slug = decodeEntities(text)
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .slice(0, 25)
        .replace(/-+$/g, "");

    return slug || "video";
}

// Downloads the YouTube thumbnail into the Strapi media library; returns the file id or null
async function uploadThumbnail(videoId, title, imageUrl) {
    if (!WRITE_TOKEN) return null;

    for (const source of [...new Set([imageUrl, youtubeThumbnail(videoId)].filter(Boolean))]) {
        try {
            const image = await fetch(source, { cache: "no-store" });
            if (!image.ok) continue;

            const form = new FormData();
            form.append("files", await image.blob(), `youtube-${fileSlug(title)}.jpg`);

            const response = await fetch(`${STRAPI_API}/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${WRITE_TOKEN}` },
                body: form,
            });
            const json = await response.json().catch(() => null);
            if (response.ok && json?.[0]?.id) return json[0].id;

            console.error("YouTube thumbnail upload failed:", response.status, json?.error?.message || "");
        } catch (error) {
            console.error("YouTube thumbnail upload failed:", error?.message || error);
        }
    }

    return null;
}

/* ---------------- admin writes ---------------- */

export async function createVideo(input) {
    const data = validateVideoInput(input);
    await assertNewVideoId(data.videoId);

    const image = await uploadThumbnail(data.videoId, data.title);
    const json = await strapi("videos", { method: "POST", write: true, body: { data: { ...data, ...(image ? { image } : {}) } } });

    return { video: adminVideo(json.data, false), thumbnailSaved: Boolean(image) };
}

// `refreshThumbnail` downloads the YouTube thumbnail again (also done when the video ID changes)
export async function updateVideo(documentId, input) {
    const { refreshThumbnail, ...fields } = input || {};
    const changes = validateVideoInput(fields, { partial: true });
    const current = await getVideo(documentId);

    if (changes.videoId === current.videoId) delete changes.videoId;
    if (changes.videoId) await assertNewVideoId(changes.videoId, documentId);

    let thumbnailSaved = null;
    if (changes.videoId || refreshThumbnail || !current.image) {
        const image = await uploadThumbnail(changes.videoId || current.videoId, changes.title || current.title);
        thumbnailSaved = Boolean(image);
        if (image) changes.image = image;
    }

    if (!Object.keys(changes).length) {
        throw new VideoError(thumbnailSaved === false ? "The thumbnail could not be downloaded from YouTube." : "Nothing changed.");
    }

    // Hidden videos stay drafts; published ones stay published
    const json = await strapi(`videos/${encodeURIComponent(documentId)}?status=${current.hidden ? "draft" : "published"}`, {
        method: "PUT",
        write: true,
        body: { data: changes },
    });

    return { video: adminVideo({ ...json.data, image: json.data?.image || current.image }, current.hidden), thumbnailSaved };
}

export async function deleteVideo(documentId) {
    await getVideo(documentId);
    await strapi(`videos/${encodeURIComponent(documentId)}`, { method: "DELETE", write: true });
}

const copyFields = (video) => ({
    title: video.title,
    videoId: video.videoId,
    description: video.description,
    youtubeFullDate: video.youtubeFullDate || null,
    youtubePublishedAt: video.youtubePublishedAt || null,
    ...(video.image?.id ? { image: video.image.id } : {}),
});

// Off the site but kept in Strapi, so the YouTube import never adds it again
export async function hideVideo(documentId) {
    const video = await getVideo(documentId);
    if (video.hidden) return video;

    const copy = await strapi("videos?status=draft", { method: "POST", write: true, body: { data: copyFields(video) } });

    try {
        await strapi(`videos/${encodeURIComponent(documentId)}`, { method: "DELETE", write: true });
    } catch (error) {
        // Keep exactly one copy: remove the draft again
        await strapi(`videos/${encodeURIComponent(copy.data.documentId)}`, { method: "DELETE", write: true }).catch(() => { });
        throw error;
    }

    return adminVideo({ ...copy.data, image: video.image }, true);
}

export async function showVideo(documentId) {
    const video = await getVideo(documentId);
    if (!video.hidden) return video;

    const json = await strapi(`videos/${encodeURIComponent(documentId)}?status=published`, { method: "PUT", write: true, body: { data: {} } });

    return adminVideo({ ...json.data, image: video.image }, false);
}

/* ---------------- YouTube ---------------- */

async function youtube(path, params) {
    if (!process.env.YOUTUBE_API_KEY) throw new VideoError("YOUTUBE_API_KEY is missing in .env.", 500);

    let response;
    try {
        response = await fetch(`${YOUTUBE_API}/${path}?${new URLSearchParams({ ...params, key: process.env.YOUTUBE_API_KEY })}`, {
            cache: "no-store",
        });
    } catch (error) {
        throw new VideoError(`YouTube is not reachable (${error?.cause?.code || error.message}).`, 502);
    }

    const json = await response.json().catch(() => null);

    if (!response.ok) {
        // Messages never include the request URL, which carries the API key
        const reason = json?.error?.errors?.[0]?.reason || "";
        if (QUOTA_REASONS.includes(reason)) {
            throw new VideoError("The YouTube API daily quota is used up. Try again tomorrow (it resets at midnight Pacific time).", 429);
        }
        throw new VideoError(`YouTube API error (${response.status}): ${json?.error?.message || response.statusText}`, 502);
    }

    return json;
}

const toFullDate = (value) => {
    const date = new Date(value || "");
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().replace(/\.\d{3}Z$/, "Z");
};

// Strapi fields from a YouTube videos.list item (full description, title not HTML-escaped)
function fromYouTube(item) {
    const snippet = item.snippet || {};
    const youtubeFullDate = toFullDate(snippet.publishedAt);
    const thumbnails = snippet.thumbnails || {};

    return {
        videoId: item.id,
        title: snippet.title || "",
        description: snippet.description || "",
        youtubeFullDate,
        youtubePublishedAt: youtubeFullDate.slice(0, 10),
        thumbnailUrl: (thumbnails.high || thumbnails.medium || thumbnails.default)?.url || youtubeThumbnail(item.id),
    };
}

// Full details of up to any number of videos (50 per request, 1 quota unit each)
async function getYouTubeDetails(videoIds) {
    const details = [];

    for (let i = 0; i < videoIds.length; i += 50) {
        const json = await youtube("videos", { part: "snippet", id: videoIds.slice(i, i + 50).join(",") });
        details.push(...(json.items || []).map(fromYouTube));
    }

    return details;
}

// Details for the admin "Fill from YouTube" button
export async function lookupYouTubeVideo(value) {
    const videoId = extractVideoId(value);
    if (!videoId) throw new VideoError("Enter a YouTube link or the 11-character video ID.");

    const [details] = await getYouTubeDetails([videoId]);
    if (!details) throw new VideoError("YouTube has no public video with this ID.", 404);

    const existing = await findByVideoId(videoId);

    return { ...details, alreadySaved: existing.length > 0 };
}

// Every video of the channel, from its "uploads" playlist (1 quota unit per 50 videos;
// a search would cost 100). Private and deleted videos are dropped later by videos.list.
async function getChannelVideoIds() {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) throw new VideoError("YOUTUBE_CHANNEL_ID is missing in .env.", 500);

    const playlistId = channelId.startsWith("UC")
        ? `UU${channelId.slice(2)}`
        : (await youtube("channels", { part: "contentDetails", id: channelId })).items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId) throw new VideoError("YOUTUBE_CHANNEL_ID does not match a YouTube channel.", 500);

    const ids = [];
    let pageToken = "";

    do {
        const json = await youtube("playlistItems", {
            part: "contentDetails",
            playlistId,
            maxResults: "50",
            ...(pageToken ? { pageToken } : {}),
        });

        ids.push(...(json.items || []).map((item) => item.contentDetails?.videoId).filter(Boolean));
        pageToken = json.nextPageToken || "";
    } while (pageToken);

    return [...new Set(ids)];
}

// Runs `task` over `items`, `limit` at a time
async function eachLimited(items, limit, task) {
    const queue = [...items];
    await Promise.all(Array.from({ length: Math.min(limit, queue.length) }, async () => {
        while (queue.length) await task(queue.shift());
    }));
}

let importRunning = null;

/*
  Adds every channel video that is not in Strapi yet and fills empty fields
  (thumbnail, description, dates) of existing ones. Videos are matched by YouTube
  video ID against every record, hidden ones included, so nothing is added twice,
  hidden videos stay hidden and nothing an admin edited is overwritten.
  A deleted video that is still on the channel is added again: hide it instead.
*/
export function importFromYouTube() {
    if (importRunning) throw new VideoError("A YouTube import is already running. Wait for it to finish.", 409);

    importRunning = runImport().finally(() => {
        importRunning = null;
    });

    return importRunning;
}

async function runImport() {
    const existing = await readAll("draft");
    const published = new Set((await readAll("published")).map((video) => video.documentId));
    const known = new Map(existing.map((video) => [video.videoId, video]));

    // The whole channel is compared, so videos missing from Strapi are found wherever they are
    const newIds = (await getChannelVideoIds()).filter((id) => !known.has(id));
    const incomplete = existing.filter(
        (video) => VIDEO_ID_PATTERN.test(video.videoId || "") &&
            (!video.image?.url || !video.description || !video.youtubeFullDate || !video.youtubePublishedAt)
    );

    const details = new Map(
        (await getYouTubeDetails([...newIds, ...incomplete.map((video) => video.videoId)])).map((item) => [item.videoId, item])
    );

    const result = { added: 0, updated: 0, failed: 0, withoutThumbnail: 0, total: existing.length, errors: [] };
    const fail = (message) => {
        result.failed += 1;
        if (result.errors.length < 5) result.errors.push(message);
    };

    // Oldest first, so creation order follows YouTube's
    const toAdd = newIds.map((id) => details.get(id)).filter(Boolean).reverse();

    await eachLimited(toAdd, 3, async (video) => {
        try {
            const image = await uploadThumbnail(video.videoId, video.title, video.thumbnailUrl);
            if (!image) result.withoutThumbnail += 1;

            const { thumbnailUrl, ...data } = video;
            await strapi("videos", { method: "POST", write: true, body: { data: { ...data, ...(image ? { image } : {}) } } });
            result.added += 1;
        } catch (error) {
            fail(`${video.videoId}: ${error.message}`);
        }
    });

    await eachLimited(incomplete, 3, async (video) => {
        const fresh = details.get(video.videoId);
        if (!fresh) return; // removed from YouTube or private: leave as it is

        const changes = {};
        if (!video.description && fresh.description) changes.description = fresh.description;
        if (!video.youtubeFullDate && fresh.youtubeFullDate) changes.youtubeFullDate = fresh.youtubeFullDate;
        if (!video.youtubePublishedAt && fresh.youtubePublishedAt) changes.youtubePublishedAt = fresh.youtubePublishedAt;
        if (!video.image?.url) {
            const image = await uploadThumbnail(video.videoId, video.title, fresh.thumbnailUrl);
            if (image) changes.image = image;
        }
        if (!Object.keys(changes).length) return;

        try {
            const status = published.has(video.documentId) ? "published" : "draft";
            await strapi(`videos/${encodeURIComponent(video.documentId)}?status=${status}`, { method: "PUT", write: true, body: { data: changes } });
            result.updated += 1;
        } catch (error) {
            fail(`${video.videoId}: ${error.message}`);
        }
    });

    result.total = existing.length + result.added;

    return result;
}
