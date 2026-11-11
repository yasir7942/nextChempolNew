"use client";
import { RULES, toApacheLine, toCsv } from "@/libs/redirect-validator";
import {
    ArrowRight,
    Check,
    CircleAlert,
    CircleCheck,
    Copy,
    Download,
    ExternalLink,
    Info,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    TriangleAlert,
} from "lucide-react";
import moment from "moment";
import RedirectEditor from "./redirect-editor";

import React, { useEffect, useMemo, useState } from 'react';

const STATUS_STYLES = {
    error: {
        row: "bg-red-50 border-l-4 border-l-red-600",
        text: "text-red-700",
        badge: "bg-red-600 text-white",
        chip: "bg-red-100 text-red-800 border-red-200",
        label: "Invalid",
        Icon: CircleAlert,
    },
    warning: {
        row: "bg-amber-50 border-l-4 border-l-amber-500",
        text: "text-gray-900",
        badge: "bg-amber-500 text-white",
        chip: "bg-amber-100 text-amber-900 border-amber-200",
        label: "Warning",
        Icon: TriangleAlert,
    },
    notice: {
        chip: "bg-sky-50 text-sky-800 border-sky-200",
        Icon: Info,
    },
    valid: {
        row: "border-l-4 border-l-transparent",
        text: "text-gray-900",
        badge: "bg-emerald-600 text-white",
        label: "Valid",
        Icon: CircleCheck,
    },
};

const FILTERS = [
    { id: "all", label: "All" },
    { id: "skipped", label: "Skipped" },
    { id: "broken", label: "Destination problems" },
    { id: "warning", label: "Warnings" },
    { id: "live", label: "Live" },
];

const matchesFilter = (row, filter) =>
    filter === "all" ||
    (filter === "skipped" && !row.live) ||
    (filter === "broken" && row.live && row.status === "error") ||
    (filter === "live" && row.live) ||
    (filter === "warning" && row.status === "warning");

const EMPTY_SUMMARY = { total: 0, live: 0, skipped: 0, destinationProblems: 0, valid: 0, errors: 0, warnings: 0, notices: 0, internal: 0, external: 0, issueBreakdown: [], lastUpdated: null };

const CHECK_LABELS = {
    ok: "Opens",
    redirected: "Opens after more redirects",
    not_found: "Not found",
    loop: "Loops",
    broken: "Does not load",
    unverified: "Not verified",
};

const hostOf = (url) => {
    try {
        return new URL(url).host;
    } catch {
        return url;
    }
};

// Where an applied destination opens: internal paths on the checked website
const destinationHref = (row, checkBaseUrl) => {
    const destination = row.appliedDestination || row.destination.trim();
    if (/^https?:\/\//i.test(destination)) return destination;
    return checkBaseUrl && destination.startsWith("/") ? new URL(destination, checkBaseUrl).href : null;
};

// Makes copy-pasted spaces visible in invalid values
const VisibleText = ({ value, highlightSpaces }) => {
    if (!value) return <span className="italic text-red-600">(empty)</span>;
    if (!highlightSpaces) return value;

    return value.split(/(\s+)/).map((part, i) =>
        /^\s+$/.test(part)
            ? <span key={i} className="rounded bg-red-200 px-0.5 text-red-800" title="space">{"␣".repeat(part.length)}</span>
            : <React.Fragment key={i}>{part}</React.Fragment>
    );
};

const StatCard = ({ label, value, sub, tone = "default", active, onClick }) => {
    const tones = {
        default: "border-gray-200 text-gray-900",
        error: value > 0 ? "border-red-300 bg-red-50 text-red-700" : "border-gray-200 text-gray-900",
        warning: value > 0 ? "border-amber-300 bg-amber-50 text-amber-800" : "border-gray-200 text-gray-900",
        valid: "border-emerald-200 text-emerald-700",
    };
    const Tag = onClick ? "button" : "div";

    return (
        <Tag
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`rounded-lg border bg-white p-4 text-left transition ${tones[tone]} ${onClick ? "hover:shadow-md cursor-pointer" : ""} ${active ? "ring-2 ring-gray-900" : ""}`}
        >
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums">{value}</p>
            {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
        </Tag>
    );
};

const RedirectLinkReport = () => {
    const [report, setReport] = useState(null);
    const [pending, setPending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [statusFilter, setStatusFilter] = useState("all");
    const [issueFilter, setIssueFilter] = useState(null);
    const [query, setQuery] = useState("");
    const [view, setView] = useState("table");
    const [copied, setCopied] = useState(false);
    const [reloadKey, setReloadKey] = useState(0);
    // null: closed, {}: add popup, {row}: edit popup
    const [editor, setEditor] = useState(null);
    const [notice, setNotice] = useState("");

    useEffect(() => {
        let cancelled = false;

        // The report of the last sync, i.e. exactly what the live site redirects
        const fetchData = async () => {
            try {
                const res = await fetch("/api/redirects/", { cache: "no-store" });
                const json = await res.json().catch(() => null);
                if (cancelled) return;

                if (res.status === 503 && json?.pending) {
                    setPending(true);
                    setReport(null);
                    return;
                }
                if (!res.ok || !json?.success) throw new Error(json?.message || `Could not load the redirect report (HTTP ${res.status}).`);

                setPending(false);
                setReport(json);
            } catch (e) {
                if (cancelled) return;
                setError(e);
                console.error('An error occurred while fetching the data: ', e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchData();
        return () => { cancelled = true; };
    }, [reloadKey]);

    const saved = (warning) => {
        setEditor(null);
        setNotice(warning || "Saved. The redirect list is updated.");
        recheck();
    };

    const recheck = () => {
        setLoading(true);
        setError(null);
        setReloadKey((key) => key + 1);
    };

    const rows = useMemo(() => report?.rows || [], [report]);
    const summary = report?.summary || EMPTY_SUMMARY;

    const filteredRows = useMemo(() => {
        const q = query.trim().toLowerCase();
        return rows.filter((row) => {
            if (!matchesFilter(row, statusFilter)) return false;
            if (issueFilter && !row.issues.some((issue) => issue.code === issueFilter)) return false;
            if (q && !`${row.source} ${row.destination} ${row.id ?? ""}`.toLowerCase().includes(q)) return false;
            return true;
        });
    }, [rows, statusFilter, issueFilter, query]);

    // Exactly what middleware.js applies (.redirects/redirects.json)
    const liveRedirects = useMemo(() => report?.liveRedirects || [], [report]);
    const site = report?.site || null;
    const checkBaseUrl = site?.checkBaseUrl || null;

    const apacheEntries = useMemo(() => {
        const ids = new Set(filteredRows.map((row) => row.id));
        return liveRedirects.filter((entry) => ids.has(entry.id));
    }, [liveRedirects, filteredRows]);

    const copyHtaccess = async () => {
        const text = [
            `# Live redirects exported ${moment().format("YYYY-MM-DD HH:mm")} — ${liveRedirects.length} rules (same as the site applies)`,
            summary.skipped ? `# ${summary.skipped} redirect(s) skipped as invalid, see /admin/redirectlinks/` : null,
            ...liveRedirects.map(toApacheLine),
        ].filter(Boolean).join("\n");

        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    const downloadCsv = () => {
        const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `redirect-report-${moment().format("YYYY-MM-DD")}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const selectStatus = (status) => {
        setStatusFilter(status);
        setIssueFilter(null);
    };

    if (loading && !report && !pending) return (
        <div className="flex flex-col items-center justify-center gap-3 py-24">
            <RefreshCw className="h-8 w-8 animate-spin text-[#BE1D21]" />
            <p className="text-lg text-gray-600">Loading the redirect report…</p>
        </div>
    );

    if (pending) return (
        <div className="my-10 rounded-lg border border-amber-300 bg-amber-50 p-6 text-amber-900">
            <div className="flex items-center gap-2 font-semibold">
                <TriangleAlert className="h-5 w-5" /> Redirects have not been synced yet
            </div>
            <p className="mt-2 text-sm">
                The live redirects are built from Strapi when a redirect is saved (webhook), shortly after the server starts, and every hour.
                To run it now, open <code className="rounded bg-white px-1">/api/revalidate/?model=redirection-url&amp;token=…</code> with the admin token.
            </p>
            <button
                type="button"
                onClick={recheck}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700"
            >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
        </div>
    );

    if (error) return (
        <div className="my-10 rounded-lg border border-red-300 bg-red-50 p-6 text-red-800">
            <div className="flex items-center gap-2 font-semibold">
                <CircleAlert className="h-5 w-5" /> Could not load redirects
            </div>
            <p className="mt-2 text-sm">{error.message}</p>
            <button
                type="button"
                onClick={recheck}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
                <RefreshCw className="h-4 w-4" /> Try again
            </button>
        </div>
    );

    const destinationProblems = summary.destinationProblems ?? 0;
    const liveWithWarnings = rows.filter((row) => row.live && row.status === "warning").length;
    const liveOk = summary.live - liveWithWarnings - destinationProblems;
    const healthPercent = summary.total ? Math.round((liveOk / summary.total) * 100) : 100;
    const segment = (count) => `${summary.total ? (count / summary.total) * 100 : 0}%`;

    return (
        <div className="space-y-8 py-8">

            {/* Toolbar */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-gray-500">
                    <p>
                        {report?.syncedAt && <>Synced {moment(report.syncedAt).format("DD MMM YYYY, h:mm a")} ({report.trigger})</>}
                        {summary.lastUpdated && <> · Last change in Strapi {moment(summary.lastUpdated).fromNow()}</>}
                    </p>
                    {checkBaseUrl && (
                        <p>
                            Destinations checked on <a href={checkBaseUrl} target="_blank" rel="noreferrer" className="font-medium text-gray-700 underline">{hostOf(checkBaseUrl)}</a>
                            {site?.siteUrl && site.siteUrl !== checkBaseUrl && <> (site: {hostOf(site.siteUrl)})</>}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setEditor({})}
                        className="inline-flex items-center gap-2 rounded-md bg-[#BE1D21] px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
                    >
                        <Plus className="h-4 w-4" /> Add redirect
                    </button>
                    <button
                        type="button"
                        onClick={recheck}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    <button
                        type="button"
                        onClick={copyHtaccess}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        title={summary.skipped ? `${summary.skipped} skipped redirect(s) are left out` : undefined}
                    >
                        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy .htaccess"}
                    </button>
                    <button
                        type="button"
                        onClick={downloadCsv}
                        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                    >
                        <Download className="h-4 w-4" /> Download report (CSV)
                    </button>
                </div>
            </div>

            {notice && (
                <div role="status" className="flex items-start justify-between gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">
                    <p>{notice}</p>
                    <button type="button" onClick={() => setNotice("")} className="font-medium underline">Dismiss</button>
                </div>
            )}

            {/* Last sync failed: the site keeps the redirects shown below */}
            {report?.lastError && report.lastError.at > report.syncedAt && (
                <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">The last sync failed {moment(report.lastError.at).fromNow()}</p>
                        <p className="text-sm">{report.lastError.message} — the site keeps using the redirects from the last successful sync.</p>
                    </div>
                </div>
            )}

            {/* Site URL misconfigured: destinations were not checked */}
            {site?.error && (
                <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div>
                        <p className="font-semibold">Destinations were not checked</p>
                        <p className="text-sm">{site.error} Set it to the website address (e.g. https://chempol.co.uk) in .env and restart.</p>
                    </div>
                </div>
            )}

            {/* Overall status */}
            {summary.skipped > 0 || destinationProblems > 0 ? (
                <div className="flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-4 text-red-800">
                    <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
                    <div className="space-y-1">
                        {summary.skipped > 0 && (
                            <p>
                                <span className="font-semibold">
                                    {summary.skipped} of {summary.total} redirect{summary.total === 1 ? "" : "s"} {summary.skipped === 1 ? "is" : "are"} invalid and not used on the site.
                                </span>
                                {" "}<button type="button" className="text-sm font-medium underline" onClick={() => selectStatus("skipped")}>Show skipped</button>
                            </p>
                        )}
                        {destinationProblems > 0 && (
                            <p>
                                <span className="font-semibold">
                                    {destinationProblems} live redirect{destinationProblems === 1 ? "" : "s"} land{destinationProblems === 1 ? "s" : ""} on a broken page
                                    {checkBaseUrl && <> on {hostOf(checkBaseUrl)}</>}.
                                </span>
                                {" "}<button type="button" className="text-sm font-medium underline" onClick={() => selectStatus("broken")}>Show them</button>
                            </p>
                        )}
                        <p className="text-sm">Each one is marked in red below with the reason. Fix them in Strapi; the site updates automatically when you save.</p>
                    </div>
                </div>
            ) : (
                <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-emerald-800">
                    <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" />
                    <p className="font-semibold">
                        All {summary.total} redirects are live
                        {summary.warnings > 0 && <span className="font-normal"> · {summary.warnings} with warnings worth a look</span>}
                    </p>
                </div>
            )}

            {/* Report */}
            <section>
                <h2 className="mb-3 text-lg font-semibold text-gray-900">Report</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                    <StatCard label="Total" value={summary.total} active={statusFilter === "all" && !issueFilter} onClick={() => selectStatus("all")} />
                    <StatCard label="Live" value={summary.live} sub="301 on the site" tone="valid" active={statusFilter === "live"} onClick={() => selectStatus("live")} />
                    <StatCard label="Skipped" value={summary.skipped} sub="invalid, not used" tone="error" active={statusFilter === "skipped"} onClick={() => selectStatus("skipped")} />
                    <StatCard label="Broken destination" value={destinationProblems} sub="live, lands on an error" tone="error" active={statusFilter === "broken"} onClick={() => selectStatus("broken")} />
                    <StatCard label="Warnings" value={summary.warnings} tone="warning" active={statusFilter === "warning"} onClick={() => selectStatus("warning")} />
                    <StatCard label="External" value={summary.external} sub="to other domains" />
                </div>

                <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4">
                    <div className="flex items-baseline justify-between">
                        <p className="text-sm font-medium text-gray-700">Redirect health</p>
                        <p className="text-sm tabular-nums text-gray-500"><span className="text-lg font-semibold text-gray-900">{healthPercent}%</span> working</p>
                    </div>
                    <div className="mt-2 flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-gray-100">
                        <div className="bg-emerald-500" style={{ width: segment(liveOk) }} />
                        <div className="bg-amber-400" style={{ width: segment(liveWithWarnings) }} />
                        <div className="bg-red-400" style={{ width: segment(destinationProblems) }} />
                        <div className="bg-red-700" style={{ width: segment(summary.skipped) }} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" />Working {liveOk}</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" />Live with warnings {liveWithWarnings}</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" />Broken destination {destinationProblems}</span>
                        <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-700" />Skipped {summary.skipped}</span>
                    </div>
                </div>

                {summary.issueBreakdown.length > 0 && (
                    <div className="mt-5 overflow-hidden rounded-lg border border-gray-200 bg-white">
                        <p className="border-b border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">Problems found <span className="font-normal text-gray-400">— click one to filter the list</span></p>
                        <ul className="divide-y divide-gray-100">
                            {summary.issueBreakdown.map((issue) => {
                                const { Icon, chip } = STATUS_STYLES[issue.severity];
                                const active = issueFilter === issue.code;
                                return (
                                    <li key={issue.code}>
                                        <button
                                            type="button"
                                            onClick={() => { setIssueFilter(active ? null : issue.code); setStatusFilter("all"); }}
                                            className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 ${active ? "bg-gray-100" : ""}`}
                                        >
                                            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${issue.severity === "error" ? "text-red-600" : issue.severity === "warning" ? "text-amber-500" : "text-sky-600"}`} />
                                            <span className="flex-1">
                                                <span className={`block text-sm font-medium ${issue.severity === "error" ? "text-red-700" : "text-gray-900"}`}>{issue.label}</span>
                                                <span className="block text-xs text-gray-500">{issue.hint}</span>
                                            </span>
                                            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold tabular-nums ${chip}`}>{issue.count}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </section>

            {/* Redirect list */}
            <section>
                <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="mr-2 text-lg font-semibold text-gray-900">Redirects</h2>
                        {FILTERS.map((filter) => {
                            const count = { all: summary.total, skipped: summary.skipped, broken: destinationProblems, warning: summary.warnings, live: summary.live }[filter.id];
                            const active = statusFilter === filter.id;
                            const red = filter.id === "skipped" || filter.id === "broken";
                            return (
                                <button
                                    key={filter.id}
                                    type="button"
                                    onClick={() => setStatusFilter(filter.id)}
                                    className={`rounded-full px-3 py-1 text-sm font-medium transition ${active
                                        ? red ? "bg-red-600 text-white" : "bg-gray-900 text-white"
                                        : red && count > 0 ? "bg-red-50 text-red-700 hover:bg-red-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                                >
                                    {filter.label} <span className="tabular-nums opacity-80">{count}</span>
                                </button>
                            );
                        })}
                        {issueFilter && (
                            <button
                                type="button"
                                onClick={() => setIssueFilter(null)}
                                className="rounded-full border border-gray-300 bg-white px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                {RULES[issueFilter].label} ✕
                            </button>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <label className="relative flex-1 lg:w-72">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search source, destination or ID"
                                className="w-full rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-gray-900 focus:outline-none"
                            />
                        </label>
                        <div className="flex overflow-hidden rounded-md border border-gray-300 text-sm">
                            {["table", "apache"].map((mode) => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setView(mode)}
                                    className={`px-3 py-2 font-medium ${view === mode ? "bg-gray-900 text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                                >
                                    {mode === "table" ? "Table" : "Apache"}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {filteredRows.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
                        No redirects match this filter.
                    </p>
                ) : view === "table" ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                        <table className="w-full min-w-[860px] text-sm">
                            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                                <tr>
                                    <th className="px-4 py-3 font-medium">#</th>
                                    <th className="px-4 py-3 font-medium">Source</th>
                                    <th className="px-2 py-3" aria-label="redirects to" />
                                    <th className="px-4 py-3 font-medium">Destination</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredRows.map((row) => {
                                    const style = STATUS_STYLES[row.status];
                                    const StatusIcon = style.Icon;
                                    const sourceSpaces = row.issues.some((issue) => issue.code === "SOURCE_WHITESPACE");
                                    const destSpaces = row.issues.some((issue) => issue.code === "DEST_WHITESPACE");
                                    return (
                                        <tr key={row.key} className={`align-top ${style.row}`}>
                                            <td className="px-4 py-3 tabular-nums text-gray-400">
                                                {row.index}
                                                {row.id != null && <span className="block text-[11px]">ID {row.id}</span>}
                                            </td>
                                            <td className={`max-w-xs break-all px-4 py-3 font-mono ${style.text}`}>
                                                <VisibleText value={row.source} highlightSpaces={sourceSpaces} />
                                            </td>
                                            <td className="px-2 py-3 text-gray-400"><ArrowRight className="h-4 w-4" /></td>
                                            <td className={`max-w-xs break-all px-4 py-3 font-mono ${style.text}`}>
                                                <VisibleText value={row.destination} highlightSpaces={destSpaces} />
                                                {row.destinationType === "external" && (
                                                    <span className="ml-1.5 inline-flex items-center gap-0.5 rounded bg-gray-100 px-1.5 py-0.5 align-middle font-sans text-[11px] text-gray-600">
                                                        <ExternalLink className="h-3 w-3" /> external
                                                    </span>
                                                )}
                                                {row.live && row.appliedDestination !== row.destination.trim() && (
                                                    <span className="mt-1 block font-sans text-[11px] text-emerald-700">
                                                        Live: <span className="font-mono">{row.appliedDestination}</span>
                                                    </span>
                                                )}
                                                {row.live && (() => {
                                                    const href = destinationHref(row, checkBaseUrl);
                                                    const result = row.check?.result;
                                                    const tone = !result ? "text-gray-500"
                                                        : result === "ok" ? "text-emerald-700"
                                                            : ["redirected", "unverified"].includes(result) ? "text-amber-700" : "text-red-700";
                                                    return (
                                                        <span className={`mt-1 flex flex-wrap items-center gap-x-1 font-sans text-[11px] ${tone}`}>
                                                            {result ? CHECK_LABELS[result] : "Not checked"}
                                                            {row.check?.status && <span className="tabular-nums">(HTTP {row.check.status})</span>}
                                                            {href && (
                                                                <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-gray-500 underline hover:text-gray-900">
                                                                    open on {hostOf(href)} <ExternalLink className="h-3 w-3" />
                                                                </a>
                                                            )}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${style.badge}`}>
                                                    <StatusIcon className="h-3.5 w-3.5" /> {row.live ? "Live" : "Skipped"}
                                                </span>
                                                {row.issues.length > 0 && (
                                                    <ul className="mt-2 space-y-1.5">
                                                        {row.issues.map((issue, i) => (
                                                            <li key={i} className={`rounded border px-2 py-1 text-xs ${STATUS_STYLES[issue.severity].chip}`} title={issue.hint}>
                                                                <span className="font-semibold">{issue.label}</span>
                                                                {issue.detail && <span className="block break-all opacity-90">{issue.detail}</span>}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                {row.id != null && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setEditor({ row })}
                                                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                                                        aria-label={`Edit redirect ${row.source?.trim()}`}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : apacheEntries.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-gray-300 bg-white py-12 text-center text-gray-500">
                        None of these redirects are live, so there are no Apache lines for them.
                    </p>
                ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-800 bg-gray-950 p-4 font-mono text-[13px] leading-6">
                        <div className="whitespace-pre text-gray-500"># Built from the live redirects: same exact-path matching as the site</div>
                        {apacheEntries.map((entry) => (
                            <div key={entry.source} className="whitespace-pre text-gray-100">{toApacheLine(entry)}</div>
                        ))}
                    </div>
                )}

                <p className="mt-2 text-xs text-gray-500">
                    Showing {view === "apache" ? `${apacheEntries.length} live rule${apacheEntries.length === 1 ? "" : "s"} for ${filteredRows.length}` : filteredRows.length} of {summary.total}.
                    {summary.notices > 0 && <> {summary.notices} redirect{summary.notices === 1 ? "" : "s"} have small notices (blue) that don&apos;t affect the status.</>}
                </p>
            </section>

            {editor && <RedirectEditor row={editor.row} onClose={() => setEditor(null)} onSaved={saved} />}
        </div>
    );
};

export default RedirectLinkReport;
