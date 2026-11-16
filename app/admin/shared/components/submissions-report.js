"use client";

import { useCallback, useEffect, useState } from "react";
import TestEmailButton from "@/app/admin/shared/components/test-email-button";

const TYPE_LABELS = { contact: "Contact", quote: "Get a Quote", sample: "Sample request", support: "Technical team" };
const PAGE_SIZES = [10, 20, 50];

// Dates are stored in UTC; the team works on UAE time (Asia/Dubai, UTC+4), shown with AM / PM
const uaeFormat = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
});
const formatDate = (iso) => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? iso : uaeFormat.format(date);
};

const StatCard = ({ title, value, note, tone = "slate" }) => {
    const tones = {
        slate: "border-slate-200 bg-white text-slate-900",
        green: "border-emerald-200 bg-emerald-50 text-emerald-900",
        red: "border-red-200 bg-red-50 text-red-900",
    };
    return (
        <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
            <p className="text-xs font-medium opacity-75">{title}</p>
            <p className="mt-0.5 text-2xl font-bold leading-tight">{value}</p>
            {note && <p className="text-[11px] leading-4 opacity-75">{note}</p>}
        </div>
    );
};

const StatusBadge = ({ row, onOpen, onResend, resending, message }) =>
    row.email_sent ? (
        <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800">&#10003; Sent</span>
            {row.email_sent_at && <div className="mt-0.5 text-[11px] text-gray-500">{formatDate(row.email_sent_at)}</div>}
        </div>
    ) : (
        <div>
            <button
                type="button"
                onClick={() => onOpen(row)}
                title={row.email_error || "Email not sent"}
                className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white hover:bg-red-500"
            >
                &#10005; Not sent
            </button>
            <button
                type="button"
                onClick={() => onResend(row)}
                disabled={resending}
                className="ms-1 inline-flex items-center rounded border border-gray-400 bg-white px-2 py-0.5 text-xs font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
            >
                {resending ? "Sending..." : "Resend email"}
            </button>
            <div className="mt-0.5 text-[11px] text-gray-500">{row.email_attempts} attempt{row.email_attempts === 1 ? "" : "s"}</div>
            {message && <div className="mt-0.5 max-w-[16rem] break-words text-[11px] font-medium text-red-700">{message}</div>}
        </div>
    );

// Everything saved for one submission
const DetailsDialog = ({ row, onClose }) => {
    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const fields = [
        ["Name", row.full_name], ["Company", row.company], ["Email", row.email], ["Phone", row.phone],
        ["Country", row.country], ["Address", row.address], ["City", row.city], ["Postcode", row.postcode],
        ["Language", row.locale], ["IP", row.ip],
    ].filter(([, value]) => value);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label="Submission details" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white p-5 text-left text-gray-900 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold">#{row.id} · {TYPE_LABELS[row.form_type] || row.form_type}</h3>
                    <button type="button" onClick={onClose} aria-label="Close" className="px-1 text-xl leading-none text-gray-500 hover:text-gray-900">&times;</button>
                </div>
                <p className="mt-1 text-xs text-gray-500">{formatDate(row.created_at)} (UAE time)</p>

                <div className={`mt-3 rounded p-2 text-sm ${row.email_sent ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
                    {row.email_sent
                        ? <>Email sent to the team{row.email_sent_at ? ` on ${formatDate(row.email_sent_at)} (UAE time)` : ""}.</>
                        : <>Email NOT sent after {row.email_attempts} attempt{row.email_attempts === 1 ? "" : "s"}.{row.email_error ? <> Reason: <span className="break-words font-mono text-xs">{row.email_error}</span></> : null}</>}
                </div>

                <dl className="mt-4 grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 text-sm">
                    {fields.map(([label, value]) => (
                        <div key={label} className="contents">
                            <dt className="font-semibold text-gray-600">{label}</dt>
                            <dd className="break-words">{value}</dd>
                        </div>
                    ))}
                </dl>

                {row.products.length > 0 && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-600">Products</p>
                        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
                            {row.products.map((product) => (
                                <li key={product.slug}>{product.title}{product.quantity ? ` · ${product.quantity}` : ""}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {row.message && (
                    <div className="mt-4">
                        <p className="text-sm font-semibold text-gray-600">Message</p>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{row.message}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// Page numbers with gaps: 1 … 4 5 [6] 7 8 … 20
const pageList = (page, pageCount) => {
    const wanted = new Set([1, pageCount, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pageCount));
    const sorted = [...wanted].sort((a, b) => a - b);
    return sorted.flatMap((n, index) => (index && n - sorted[index - 1] > 1 ? ["gap" + n, n] : [n]));
};

const SubmissionsReport = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [type, setType] = useState("");
    const [status, setStatus] = useState("");
    const [search, setSearch] = useState("");
    const [query, setQuery] = useState(""); // search text after the delay
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null); // { denied, message }
    const [loading, setLoading] = useState(true);
    const [detail, setDetail] = useState(null);
    const [resendingId, setResendingId] = useState(null);
    const [exporting, setExporting] = useState(""); // "xlsx" | "csv" while a file is being prepared
    const [exportMessage, setExportMessage] = useState("");
    const [resendMessages, setResendMessages] = useState({}); // row id -> error text of the last resend

    // wait until typing stops before searching
    useEffect(() => {
        const timer = setTimeout(() => {
            setQuery(search.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timer);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
            if (type) params.set("type", type);
            if (status) params.set("status", status);
            if (query) params.set("q", query);

            const response = await fetch(`/api/admin/submissions?${params}`, { cache: "no-store" });
            const json = await response.json().catch(() => null);

            if (!response.ok || !json?.success) {
                setError({ denied: response.status === 403, message: json?.message || "Could not load the submissions." });
                return;
            }
            setError(null);
            setResult(json);
        } catch {
            setError({ denied: false, message: "Could not load the submissions." });
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, type, status, query]);

    useEffect(() => {
        load();
    }, [load]);

    // Downloads every row that matches the current filters (not only this page) as an Excel or CSV file
    const exportFile = async (format) => {
        setExporting(format);
        setExportMessage("");
        try {
            const params = new URLSearchParams({ format });
            if (type) params.set("type", type);
            if (status) params.set("status", status);
            if (query) params.set("q", query);

            const response = await fetch(`/api/admin/submissions/export?${params}`, { cache: "no-store" });
            if (!response.ok) {
                const json = await response.json().catch(() => null);
                setExportMessage(json?.message || "Could not export the data.");
                return;
            }

            const name = /filename="([^"]+)"/.exec(response.headers.get("Content-Disposition") || "")?.[1] || `chempol-submissions.${format}`;
            const url = URL.createObjectURL(await response.blob());
            const link = document.createElement("a");
            link.href = url;
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);

            const count = response.headers.get("X-Export-Rows");
            setExportMessage(`${count} row${count === "1" ? "" : "s"} exported${response.headers.get("X-Export-Truncated") === "1" ? " (the first 50,000 only)" : ""}.`);
        } catch {
            setExportMessage("Could not export the data.");
        } finally {
            setExporting("");
        }
    };

    // Sends the team email again for a row that was not sent; the server records the result
    const resendEmail = async (row) => {
        setResendingId(row.id);
        setResendMessages((current) => ({ ...current, [row.id]: "" }));
        try {
            const response = await fetch(`/api/admin/submissions/${row.id}/resend`, { method: "POST" });
            const json = await response.json().catch(() => null);

            if (json?.data) {
                // show the new status at once (sent, or one more attempt with the new reason)
                setResult((current) => current && { ...current, data: current.data.map((item) => (item.id === json.data.id ? json.data : item)) });
                setDetail((current) => (current?.id === json.data.id ? json.data : current));
            }
            if (!json?.success) {
                setResendMessages((current) => ({ ...current, [row.id]: json?.message || "Could not send the email." }));
            }
            load(); // refresh the report figures
        } catch {
            setResendMessages((current) => ({ ...current, [row.id]: "Could not reach the server." }));
        } finally {
            setResendingId(null);
        }
    };

    const changeFilter = (setter) => (event) => {
        setter(event.target.value);
        setPage(1);
    };

    if (error?.denied) {
        return (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
                <p className="font-semibold">Access denied</p>
                <p className="mt-1 text-sm">This page shows customer data and is only available to users with the SuperAdmin role.</p>
            </div>
        );
    }

    if (!result) {
        return error ? (
            <div className="mt-8 rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">{error.message}</div>
        ) : (
            <p className="mt-8 text-sm text-gray-600">Loading submissions...</p>
        );
    }

    const { data: rows, pagination, report } = result;
    const maxDay = Math.max(1, ...report.days.map((day) => day.total));
    const first = pagination.total ? (pagination.page - 1) * pagination.pageSize + 1 : 0;
    const last = Math.min(pagination.total, pagination.page * pagination.pageSize);

    return (
        <div className="mt-6 space-y-6">
            {error && <div className="rounded border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-900">{error.message}</div>}

            {/* Report */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <StatCard title="All submissions" value={report.total} />
                <StatCard title="Email sent" value={report.sent} note="team was notified" tone="green" />
                <StatCard title="Email NOT sent" value={report.notSent} note={report.oldestUnsent ? `oldest: ${formatDate(report.oldestUnsent)} UAE` : "none waiting"} tone={report.notSent ? "red" : "green"} />
                <StatCard title="Last 14 days" value={report.days.reduce((sum, day) => sum + day.total, 0)} note={`${report.days.reduce((sum, day) => sum + day.notSent, 0)} not sent`} />
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-800">By form</p>
                    <table className="mt-2 w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-500">
                                <th className="py-1 font-medium">Form</th>
                                <th className="py-1 text-right font-medium">Total</th>
                                <th className="py-1 text-right font-medium">Sent</th>
                                <th className="py-1 text-right font-medium">Not sent</th>
                            </tr>
                        </thead>
                        <tbody>
                            {report.byType.map((row) => (
                                <tr key={row.formType} className="border-t border-gray-100">
                                    <td className="py-1">{TYPE_LABELS[row.formType]}</td>
                                    <td className="py-1 text-right">{row.total}</td>
                                    <td className="py-1 text-right text-emerald-700">{row.sent}</td>
                                    <td className={`py-1 text-right ${row.notSent ? "font-bold text-red-600" : "text-gray-400"}`}>{row.notSent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-800">Last 14 days</p>
                    <div className="mt-3 flex h-24 items-end gap-1" role="img" aria-label="Submissions per day for the last 14 days">
                        {report.days.map((day) => (
                            <div key={day.day} className="flex h-full flex-1 flex-col justify-end" title={`${day.day}: ${day.total} submission(s), ${day.notSent} not sent`}>
                                <div className="w-full rounded-t bg-textBlue" style={{ height: `${(day.total / maxDay) * 100}%`, minHeight: day.total ? 3 : 0 }}>
                                    {day.notSent > 0 && <div className="w-full rounded-t bg-red-500" style={{ height: `${(day.notSent / day.total) * 100}%` }} />}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-1 flex justify-between text-[10px] text-gray-500">
                        <span>{report.days[0].day.slice(5)}</span>
                        <span>{report.days[13].day.slice(5)}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-gray-500">Days follow UAE time. Red part = email not sent</p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-sm font-semibold text-gray-800">Top countries</p>
                    {report.countries.length ? (
                        <ul className="mt-2 space-y-1 text-sm">
                            {report.countries.map((row) => (
                                <li key={row.country} className="flex justify-between border-t border-gray-100 pt-1 first:border-t-0 first:pt-0">
                                    <span className="break-words">{row.country}</span>
                                    <span className="font-medium">{row.total}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="mt-2 text-sm text-gray-500">No data yet.</p>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-end gap-3">
                <label className="text-sm">
                    <span className="block text-xs font-medium text-gray-600">Search</span>
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        maxLength={100}
                        placeholder="Name, email, phone, message..."
                        className="mt-0.5 w-64 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm"
                    />
                </label>
                <label className="text-sm">
                    <span className="block text-xs font-medium text-gray-600">Form</span>
                    <select value={type} onChange={changeFilter(setType)} className="mt-0.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm">
                        <option value="">All forms</option>
                        {Object.entries(TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </label>
                <label className="text-sm">
                    <span className="block text-xs font-medium text-gray-600">Email status</span>
                    <select value={status} onChange={changeFilter(setStatus)} className="mt-0.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm">
                        <option value="">All</option>
                        <option value="sent">Sent</option>
                        <option value="unsent">Not sent</option>
                    </select>
                </label>
                <label className="text-sm">
                    <span className="block text-xs font-medium text-gray-600">Per page</span>
                    <select value={pageSize} onChange={changeFilter((value) => setPageSize(Number(value)))} className="mt-0.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm">
                        {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
                    </select>
                </label>
                <button type="button" onClick={load} disabled={loading} className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60">
                    {loading ? "Loading..." : "Refresh"}
                </button>
                <TestEmailButton />

                {/* Export: all rows that match the filters above */}
                <div className="ms-auto flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Export {pagination.total} row{pagination.total === 1 ? "" : "s"}:</span>
                    <button
                        type="button"
                        onClick={() => exportFile("xlsx")}
                        disabled={Boolean(exporting) || pagination.total === 0}
                        className="rounded border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                    >
                        {exporting === "xlsx" ? "Preparing..." : "Excel (.xlsx)"}
                    </button>
                    <button
                        type="button"
                        onClick={() => exportFile("csv")}
                        disabled={Boolean(exporting) || pagination.total === 0}
                        className="rounded border border-gray-400 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100 disabled:opacity-50"
                    >
                        {exporting === "csv" ? "Preparing..." : "CSV"}
                    </button>
                </div>
            </div>
            {exportMessage && <p role="status" className="-mt-3 text-end text-xs text-gray-600">{exportMessage}</p>}

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="w-full min-w-[900px] border-collapse text-sm">
                    <thead>
                        <tr className="bg-slate-50 text-left text-xs text-gray-600">
                            {["ID", "DATE (UAE time)", "Form", "Name", "Company", "Email", "Phone", "Country", "Products", "Email status", ""].map((heading) => (
                                <th key={heading} className="border-b border-gray-200 px-3 py-2 font-semibold">{heading}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr><td colSpan={11} className="px-3 py-8 text-center text-gray-500">No submissions match.</td></tr>
                        )}
                        {rows.map((row) => (
                            <tr key={row.id} className={`border-b border-gray-100 align-top ${row.email_sent ? "" : "bg-red-50/60"}`}>
                                <td className="px-3 py-2 font-semibold">{row.id}</td>
                                <td className="whitespace-nowrap px-3 py-2">{formatDate(row.created_at)}</td>
                                <td className="px-3 py-2">{TYPE_LABELS[row.form_type] || row.form_type}</td>
                                <td className="px-3 py-2">{row.full_name}</td>
                                <td className="px-3 py-2">{row.company || "-"}</td>
                                <td className="break-all px-3 py-2">{row.email}</td>
                                <td className="whitespace-nowrap px-3 py-2" dir="ltr">{row.phone}</td>
                                <td className="px-3 py-2">{row.country}</td>
                                <td className="px-3 py-2">{row.products.length ? `${row.products.length}` : "-"}</td>
                                <td className="px-3 py-2"><StatusBadge row={row} onOpen={setDetail} onResend={resendEmail} resending={resendingId === row.id} message={resendMessages[row.id]} /></td>
                                <td className="px-3 py-2">
                                    <button type="button" onClick={() => setDetail(row)} className="rounded border border-gray-300 px-2 py-0.5 text-xs font-medium hover:bg-gray-100">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                <p>{first}–{last} of {pagination.total}</p>
                <nav aria-label="Pagination" className="flex flex-wrap items-center gap-1">
                    <button type="button" disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-40">Previous</button>
                    {pageList(pagination.page, pagination.pageCount).map((item) =>
                        typeof item === "string" ? (
                            <span key={item} className="px-1">…</span>
                        ) : (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setPage(item)}
                                aria-current={item === pagination.page ? "page" : undefined}
                                className={`min-w-[2rem] rounded border px-2 py-1 ${item === pagination.page ? "border-gray-800 bg-gray-800 text-white" : "border-gray-300 bg-white hover:bg-gray-100"}`}
                            >
                                {item}
                            </button>
                        )
                    )}
                    <button type="button" disabled={pagination.page >= pagination.pageCount} onClick={() => setPage(pagination.page + 1)} className="rounded border border-gray-300 bg-white px-3 py-1 disabled:opacity-40">Next</button>
                </nav>
            </div>

            {detail && <DetailsDialog row={detail} onClose={() => setDetail(null)} />}
        </div>
    );
};

export default SubmissionsReport;
