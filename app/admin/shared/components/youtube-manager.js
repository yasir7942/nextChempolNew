"use client";
import {
    CircleAlert,
    CircleCheck,
    CloudDownload,
    ExternalLink,
    EyeOff,
    Eye,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
    X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { getFileUrl } from "@/libs/helper";

const API = "/api/admin/youtube";
const PAGE_SIZE = 20;

const FILTERS = [
    { id: "all", label: "All videos", match: () => true },
    { id: "live", label: "On the site", match: (video) => !video.hidden },
    { id: "hidden", label: "Hidden", match: (video) => video.hidden },
    { id: "unplayable", label: "Not playable on YouTube", match: (video) => !video.playable },
    { id: "noThumbnail", label: "No thumbnail", match: (video) => !video.image },
];

const EMPTY_FORM = { videoId: "", title: "", description: "", fullDate: "", publishedDate: "", refreshThumbnail: false };

// youtubeFullDate is stored as UTC "YYYY-MM-DDTHH:mm:ssZ"; the date-time input shows the same UTC value
const fullDateToInput = (value) => (value ? value.replace(/Z$/, "") : "");
const inputToFullDate = (value) => {
    if (!value) return "";
    const withSeconds = value.length === 16 ? `${value}:00` : value.slice(0, 19);
    return `${withSeconds}Z`;
};
const showFullDate = (value) => (value ? `${value.replace("T", " ").replace("Z", "")} UTC` : "—");

const thumbnailOf = (video) => (video.image?.url ? getFileUrl(video.image.url) : `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`);

const decode = (text) => {
    if (typeof window === "undefined" || !text) return text || "";
    const element = document.createElement("textarea");
    element.innerHTML = text;
    return element.value;
};

async function request(url, options = {}) {
    const response = await fetch(url, {
        cache: "no-store",
        ...options,
        headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
    });
    const json = await response.json().catch(() => null);

    if (response.status === 401) {
        window.location.href = "/admin/login/";
        throw new Error("Your session has expired. Please log in again.");
    }
    if (!response.ok || !json?.success) throw new Error(json?.message || `Request failed (${response.status}).`);

    return json;
}

const StatCard = ({ label, value, tone = "default", active, onClick }) => {
    const tones = {
        default: "border-gray-200 text-gray-900",
        warning: value > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-900",
        error: value > 0 ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 text-gray-900",
        valid: "border-emerald-200 text-emerald-700",
    };

    return (
        <button
            type="button"
            onClick={onClick}
            className={`rounded-lg border bg-white p-4 text-left transition hover:shadow-md ${tones[tone]} ${active ? "ring-2 ring-gray-900" : ""}`}
        >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
        </button>
    );
};

const Badge = ({ tone, children }) => {
    const tones = {
        live: "bg-emerald-100 text-emerald-800",
        hidden: "bg-gray-200 text-gray-700",
        error: "bg-red-100 text-red-800",
        warning: "bg-amber-100 text-amber-900",
    };
    return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
};

const StatusBadges = ({ video }) => (
    <div className="flex flex-wrap gap-1">
        {video.hidden ? <Badge tone="hidden">Hidden</Badge> : <Badge tone="live">On the site</Badge>}
        {!video.playable && <Badge tone="error">Not playable on YouTube</Badge>}
        {!video.image && <Badge tone="warning">No thumbnail</Badge>}
    </div>
);

const Toasts = ({ toasts, onClose }) => (
    <div className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
            <div
                key={toast.id}
                role="status"
                className={`flex items-start gap-2 rounded-lg border p-3 text-sm shadow-lg ${toast.type === "error" ? "border-red-300 bg-red-50 text-red-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}
            >
                {toast.type === "error" ? <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleCheck className="mt-0.5 h-4 w-4 shrink-0" />}
                <p className="flex-1">{toast.message}</p>
                <button type="button" onClick={() => onClose(toast.id)} aria-label="Close" className="shrink-0 opacity-70 hover:opacity-100">
                    <X className="h-4 w-4" />
                </button>
            </div>
        ))}
    </div>
);

const Modal = ({ title, onClose, children, busy }) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
        <div className="max-h-[95vh] w-full overflow-y-auto rounded-t-xl bg-white p-5 shadow-xl sm:max-w-2xl sm:rounded-xl">
            <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-md p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-40">
                    <X className="h-5 w-5" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

const Field = ({ label, hint, children }) => (
    <label className="block">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="mt-1">{children}</div>
        {hint && <span className="mt-1 block text-xs text-gray-500">{hint}</span>}
    </label>
);

const INPUT = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 disabled:bg-gray-100";

const VideoForm = ({ video, onCancel, onSaved, notify }) => {
    const editing = Boolean(video);
    const original = useMemo(
        () => (video
            ? {
                videoId: video.videoId,
                // Shown decoded ("Chempol's", not "Chempol&#39;s"); only saved if edited
                title: decode(video.title),
                description: decode(video.description),
                fullDate: fullDateToInput(video.youtubeFullDate),
                publishedDate: video.youtubePublishedAt || "",
                refreshThumbnail: false,
            }
            : EMPTY_FORM),
        [video]
    );

    const [form, setForm] = useState(original);
    const [saving, setSaving] = useState(false);
    const [looking, setLooking] = useState(false);
    const [error, setError] = useState("");
    const [lookupNote, setLookupNote] = useState("");

    const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.type === "checkbox" ? event.target.checked : event.target.value }));

    const fullDateDay = inputToFullDate(form.fullDate).slice(0, 10);
    const daysDiffer = form.fullDate && form.publishedDate && fullDateDay !== form.publishedDate;

    const fillFromYouTube = async () => {
        if (!form.videoId.trim() || looking) return;
        setLooking(true);
        setError("");
        setLookupNote("");
        try {
            const { video: found } = await request(`${API}/lookup/?video=${encodeURIComponent(form.videoId.trim())}`);
            setForm((current) => ({
                ...current,
                videoId: found.videoId,
                title: found.title,
                description: found.description,
                fullDate: fullDateToInput(found.youtubeFullDate),
                publishedDate: found.youtubePublishedAt,
            }));
            setLookupNote(
                found.alreadySaved && !(editing && found.videoId === video.videoId)
                    ? "Filled from YouTube. Note: this video is already saved in Strapi, so it can't be added again."
                    : "Filled from YouTube. Check the details, then save."
            );
        } catch (lookupError) {
            setError(lookupError.message);
        } finally {
            setLooking(false);
        }
    };

    const submit = async (event) => {
        event.preventDefault();
        if (saving) return;
        setError("");

        // Only fields that changed are sent, so untouched dates are never rewritten
        const values = {
            videoId: form.videoId.trim(),
            title: form.title.trim(),
            description: form.description.trim(),
            youtubeFullDate: inputToFullDate(form.fullDate),
            youtubePublishedAt: form.publishedDate,
        };
        const before = {
            videoId: original.videoId,
            title: original.title.trim(),
            description: original.description.trim(),
            youtubeFullDate: inputToFullDate(original.fullDate),
            youtubePublishedAt: original.publishedDate,
        };
        const body = editing
            ? Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== before[key]))
            : values;
        if (editing && form.refreshThumbnail) body.refreshThumbnail = true;

        if (editing && !Object.keys(body).length) {
            setError("Nothing changed.");
            return;
        }

        setSaving(true);
        try {
            const result = await request(editing ? `${API}/${video.documentId}/` : `${API}/`, {
                method: editing ? "PUT" : "POST",
                body: JSON.stringify(body),
            });
            notify(
                `${editing ? "Saved" : "Added"} "${decode(result.video.title)}".${result.thumbnailSaved === false ? " The thumbnail could not be downloaded; the site shows YouTube's own thumbnail." : ""}`
            );
            onSaved();
        } catch (saveError) {
            setError(saveError.message);
            setSaving(false);
        }
    };

    const busy = saving || looking;

    return (
        <Modal title={editing ? "Edit video" : "Add video"} onClose={onCancel} busy={saving}>
            <form onSubmit={submit} className="space-y-4">
                <Field label="YouTube link or video ID" hint="Paste the video link or its 11-character ID, then fill the details from YouTube.">
                    <div className="flex flex-col gap-2 sm:flex-row">
                        <input className={INPUT} value={form.videoId} onChange={set("videoId")} disabled={busy} required placeholder="https://www.youtube.com/watch?v=…" />
                        <button
                            type="button"
                            onClick={fillFromYouTube}
                            disabled={busy || !form.videoId.trim()}
                            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            <CloudDownload className={`h-4 w-4 ${looking ? "animate-pulse" : ""}`} /> {looking ? "Looking up…" : "Fill from YouTube"}
                        </button>
                    </div>
                </Field>
                {lookupNote && <p className="rounded-md bg-sky-50 px-3 py-2 text-sm text-sky-800">{lookupNote}</p>}

                <Field label="Title">
                    <input className={INPUT} value={form.title} onChange={set("title")} disabled={busy} required maxLength={255} />
                </Field>

                <Field label="Description">
                    <textarea className={`${INPUT} min-h-28`} value={form.description} onChange={set("description")} disabled={busy} maxLength={5000} />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Full date and time (UTC)" hint="youtubeFullDate — the exact YouTube publish time, in UTC. Shown on the site.">
                        <input type="datetime-local" step="1" className={INPUT} value={form.fullDate} onChange={set("fullDate")} disabled={busy} required={!editing} />
                    </Field>
                    <Field label="Published date" hint="youtubePublishedAt — the site sorts videos by this date.">
                        <input type="date" className={INPUT} value={form.publishedDate} onChange={set("publishedDate")} disabled={busy} required={!editing} />
                    </Field>
                </div>
                {daysDiffer && (
                    <p className="flex flex-wrap items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
                        The published date is not the day of the full date ({fullDateDay}), so the sort order and the date shown may not match.
                        <button type="button" className="font-medium underline" onClick={() => setForm((current) => ({ ...current, publishedDate: fullDateDay }))}>
                            Use {fullDateDay}
                        </button>
                    </p>
                )}

                {editing && (
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={form.refreshThumbnail} onChange={set("refreshThumbnail")} disabled={busy} />
                        Download the thumbnail again from YouTube
                    </label>
                )}

                {error && (
                    <p className="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-800">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}
                    </p>
                )}

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button type="button" onClick={onCancel} disabled={saving} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                        Cancel
                    </button>
                    <button type="submit" disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60">
                        {saving && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {saving ? "Saving…" : editing ? "Save changes" : "Add video"}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

const DeleteDialog = ({ video, busy, onCancel, onHide, onDelete }) => (
    <Modal title="Delete this video?" onClose={onCancel} busy={busy}>
        <p className="text-sm text-gray-700">
            <span className="font-medium">&ldquo;{decode(video.title)}&rdquo;</span> will be removed from Strapi and the site. This can&apos;t be undone.
        </p>
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {video.playable
                ? "This video is still on the YouTube channel, so the next YouTube fetch adds it again."
                : "This video is no longer playable on YouTube, so the YouTube fetch won't add it again."}
            {!video.hidden && " Hiding it takes it off the site and keeps it out of future fetches."}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} disabled={busy} className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                Cancel
            </button>
            {!video.hidden && (
                <button type="button" onClick={onHide} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 disabled:opacity-50">
                    <EyeOff className="h-4 w-4" /> Hide instead
                </button>
            )}
            <button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                {busy ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Delete permanently
            </button>
        </div>
    </Modal>
);

const RowActions = ({ video, busy, onEdit, onToggle, onDelete }) => (
    <div className="flex flex-wrap gap-1">
        <button type="button" onClick={onEdit} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
        <button type="button" onClick={onToggle} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">
            {busy ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : video.hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {video.hidden ? "Show" : "Hide"}
        </button>
        <button type="button" onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
            <Trash2 className="h-3.5 w-3.5" /> Delete
        </button>
    </div>
);

const YouTubeManager = () => {
    const [videos, setVideos] = useState([]);
    const [fetchedAt, setFetchedAt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState("");

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState("all");
    const [page, setPage] = useState(1);

    const [editing, setEditing] = useState(null); // null, "new" or a video
    const [deleting, setDeleting] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState(null);
    const [toasts, setToasts] = useState([]);

    const closeToast = useCallback((id) => setToasts((current) => current.filter((toast) => toast.id !== id)), []);
    const notify = useCallback((message, type = "success") => {
        const id = Date.now() + Math.random();
        setToasts((current) => [...current, { id, message, type }]);
        setTimeout(() => closeToast(id), type === "error" ? 9000 : 5000);
    }, [closeToast]);

    const load = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const json = await request(`${API}/`);
            setVideos(json.videos);
            setFetchedAt(json.fetchedAt);
        } catch (error) {
            setLoadError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const counts = useMemo(() => Object.fromEntries(FILTERS.map(({ id, match }) => [id, videos.filter(match).length])), [videos]);

    const visible = useMemo(() => {
        const match = FILTERS.find(({ id }) => id === filter)?.match || (() => true);
        const words = query.trim().toLowerCase();

        return videos.filter((video) =>
            match(video) &&
            (!words || decode(video.title).toLowerCase().includes(words) || video.videoId.toLowerCase().includes(words))
        );
    }, [videos, filter, query]);

    const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
    const currentPage = Math.min(page, pageCount);
    const pageRows = visible.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    useEffect(() => setPage(1), [query, filter]);

    const runImport = async () => {
        if (importing) return;
        setImporting(true);
        setImportResult(null);
        try {
            const result = await request(`${API}/fetch/`, { method: "POST" });
            setImportResult(result);
            notify(
                result.added || result.updated
                    ? `YouTube fetch done: ${result.added} new, ${result.updated} updated.`
                    : "YouTube fetch done: no new videos."
            );
            await load();
        } catch (error) {
            notify(error.message, "error");
        } finally {
            setImporting(false);
        }
    };

    const toggleHidden = async (video) => {
        if (busyId) return;
        setBusyId(video.documentId);
        try {
            await request(`${API}/${video.documentId}/`, { method: "PATCH", body: JSON.stringify({ action: video.hidden ? "show" : "hide" }) });
            notify(video.hidden ? `"${decode(video.title)}" is back on the site.` : `"${decode(video.title)}" is hidden from the site.`);
            setDeleting(null);
            await load();
        } catch (error) {
            notify(error.message, "error");
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (video) => {
        if (busyId) return;
        setBusyId(video.documentId);
        try {
            await request(`${API}/${video.documentId}/`, { method: "DELETE" });
            notify(`Deleted "${decode(video.title)}".`);
            setDeleting(null);
            await load();
        } catch (error) {
            notify(error.message, "error");
        } finally {
            setBusyId(null);
        }
    };

    if (loading && !videos.length) {
        return (
            <div className="flex flex-col items-center justify-center gap-3 py-24">
                <RefreshCw className="h-8 w-8 animate-spin text-[#BE1D21]" />
                <p className="text-lg text-gray-600">Loading videos…</p>
            </div>
        );
    }

    if (loadError && !videos.length) {
        return (
            <div className="my-10 rounded-lg border border-red-300 bg-red-50 p-6 text-red-800">
                <div className="flex items-center gap-2 font-semibold">
                    <CircleAlert className="h-5 w-5" /> Could not load videos
                </div>
                <p className="mt-2 text-sm">{loadError}</p>
                <button type="button" onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">
                    <RefreshCw className="h-4 w-4" /> Try again
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 py-8">
            <Toasts toasts={toasts} onClose={closeToast} />

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-sm text-gray-500">
                    {fetchedAt && <>Loaded from Strapi at {new Date(fetchedAt).toLocaleTimeString()}</>}
                </p>
                <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button type="button" onClick={runImport} disabled={importing} className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60">
                        <CloudDownload className={`h-4 w-4 ${importing ? "animate-pulse" : ""}`} /> {importing ? "Fetching from YouTube…" : "Fetch YouTube data"}
                    </button>
                    <button type="button" onClick={() => setEditing("new")} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700">
                        <Plus className="h-4 w-4" /> Add video
                    </button>
                </div>
            </div>

            {importing && (
                <div className="flex items-center gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                    <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                    Checking the YouTube channel for new videos and saving them with their thumbnails. This can take a minute.
                </div>
            )}

            {importResult && (
                <div className={`rounded-lg border p-4 text-sm ${importResult.failed ? "border-amber-300 bg-amber-50 text-amber-900" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
                    <div className="flex items-start justify-between gap-4">
                        <p className="font-semibold">
                            YouTube fetch: {importResult.added} new, {importResult.updated} updated
                            {importResult.failed > 0 && `, ${importResult.failed} failed`}
                            {importResult.withoutThumbnail > 0 && ` (${importResult.withoutThumbnail} saved without a thumbnail)`}
                        </p>
                        <button type="button" onClick={() => setImportResult(null)} aria-label="Close" className="shrink-0 opacity-70 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="mt-1">Existing videos only get empty fields filled; edited titles and descriptions are never overwritten.</p>
                    {importResult.errors?.length > 0 && (
                        <ul className="mt-2 list-disc pl-5">
                            {importResult.errors.map((message) => <li key={message}>{message}</li>)}
                        </ul>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                <StatCard label="All videos" value={counts.all} active={filter === "all"} onClick={() => setFilter("all")} />
                <StatCard label="On the site" value={counts.live} tone="valid" active={filter === "live"} onClick={() => setFilter("live")} />
                <StatCard label="Hidden" value={counts.hidden} active={filter === "hidden"} onClick={() => setFilter("hidden")} />
                <StatCard label="Not playable on YouTube" value={counts.unplayable} tone="error" active={filter === "unplayable"} onClick={() => setFilter("unplayable")} />
                <StatCard label="No thumbnail" value={counts.noThumbnail} tone="warning" active={filter === "noThumbnail"} onClick={() => setFilter("noThumbnail")} />
            </div>
            {counts.unplayable > 0 && (
                <p className="text-sm text-gray-600">
                    Videos that are not playable (deleted, private or not embeddable on YouTube) are left out of the site automatically. Hide or delete them to tidy up.
                </p>
            )}

            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search by title or YouTube video ID"
                    className={`${INPUT} pl-9`}
                />
            </div>

            <p className="text-sm text-gray-500">
                {visible.length} {visible.length === 1 ? "video" : "videos"}
                {filter !== "all" && ` · ${FILTERS.find(({ id }) => id === filter)?.label}`}
                {query.trim() && ` · matching "${query.trim()}"`}
            </p>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto rounded-lg border border-gray-200 bg-white md:block">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                        <tr>
                            <th className="px-3 py-3">Video</th>
                            <th className="px-3 py-3">Video ID</th>
                            <th className="px-3 py-3">Full date (UTC)</th>
                            <th className="px-3 py-3">Published date</th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pageRows.map((video) => (
                            <tr key={video.documentId} className={video.hidden ? "bg-gray-50 text-gray-500" : ""}>
                                <td className="px-3 py-3">
                                    <div className="flex items-center gap-3">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={thumbnailOf(video)} alt="" loading="lazy" className="h-14 w-24 shrink-0 rounded object-cover bg-gray-100" />
                                        <p className="max-w-md font-medium text-gray-900">{decode(video.title)}</p>
                                    </div>
                                </td>
                                <td className="px-3 py-3">
                                    <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-xs text-gray-700 underline">
                                        {video.videoId} <ExternalLink className="h-3 w-3" />
                                    </a>
                                </td>
                                <td className="whitespace-nowrap px-3 py-3 tabular-nums">{showFullDate(video.youtubeFullDate)}</td>
                                <td className="whitespace-nowrap px-3 py-3 tabular-nums">{video.youtubePublishedAt || "—"}</td>
                                <td className="px-3 py-3"><StatusBadges video={video} /></td>
                                <td className="px-3 py-3">
                                    <RowActions
                                        video={video}
                                        busy={busyId === video.documentId}
                                        onEdit={() => setEditing(video)}
                                        onToggle={() => toggleHidden(video)}
                                        onDelete={() => setDeleting(video)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile: cards */}
            <div className="space-y-3 md:hidden">
                {pageRows.map((video) => (
                    <div key={video.documentId} className={`rounded-lg border border-gray-200 p-3 ${video.hidden ? "bg-gray-50" : "bg-white"}`}>
                        <div className="flex gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={thumbnailOf(video)} alt="" loading="lazy" className="h-16 w-28 shrink-0 rounded object-cover bg-gray-100" />
                            <div className="min-w-0">
                                <p className="font-medium text-gray-900">{decode(video.title)}</p>
                                <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noreferrer" className="font-mono text-xs text-gray-600 underline">
                                    {video.videoId}
                                </a>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-600 tabular-nums">
                            {showFullDate(video.youtubeFullDate)} · published {video.youtubePublishedAt || "—"}
                        </p>
                        <div className="mt-2"><StatusBadges video={video} /></div>
                        <div className="mt-3">
                            <RowActions
                                video={video}
                                busy={busyId === video.documentId}
                                onEdit={() => setEditing(video)}
                                onToggle={() => toggleHidden(video)}
                                onDelete={() => setDeleting(video)}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {!pageRows.length && <p className="rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-600">No videos match.</p>}

            {pageCount > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                        Previous
                    </button>
                    <span className="text-sm text-gray-600 tabular-nums">Page {currentPage} / {pageCount}</span>
                    <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40">
                        Next
                    </button>
                </div>
            )}

            {editing && (
                <VideoForm
                    video={editing === "new" ? null : editing}
                    notify={notify}
                    onCancel={() => setEditing(null)}
                    onSaved={() => {
                        setEditing(null);
                        load();
                    }}
                />
            )}

            {deleting && (
                <DeleteDialog
                    video={deleting}
                    busy={busyId === deleting.documentId}
                    onCancel={() => setDeleting(null)}
                    onHide={() => toggleHidden(deleting)}
                    onDelete={() => remove(deleting)}
                />
            )}
        </div>
    );
};

export default YouTubeManager;
