"use client";

// Popup to add a redirect, or to edit / delete an existing one (/admin/redirectlinks/).
// Saves through /api/admin/redirects (Strapi), then onSaved() reloads the list.

import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, X } from "lucide-react";

const inputClass =
    "mt-1 w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

const RedirectEditor = ({ row, onClose, onSaved }) => {
    const editing = Boolean(row);
    const [source, setSource] = useState(row?.source?.trim() ?? "");
    const [destination, setDestination] = useState(row?.destination?.trim() ?? "");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [confirmDelete, setConfirmDelete] = useState(false);
    const firstField = useRef(null);

    useEffect(() => {
        firstField.current?.focus();
        const onKey = (event) => {
            if (event.key !== "Escape" || busy) return;
            if (confirmDelete) setConfirmDelete(false);
            else onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [busy, confirmDelete, onClose]);

    const send = async (method, body) => {
        setBusy(true);
        setError("");
        try {
            const res = await fetch(editing ? `/api/admin/redirects/${row.id}` : "/api/admin/redirects", {
                method,
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            });
            const json = await res.json().catch(() => null);
            if (!res.ok || !json?.success) throw new Error(json?.message || `Could not save (HTTP ${res.status}).`);
            onSaved(json.warning || "");
        } catch (e) {
            setError(e.message);
            setConfirmDelete(false);
        } finally {
            setBusy(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();
        if (!busy) send(editing ? "PUT" : "POST", { source, destination });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
            <div role="dialog" aria-modal="true" aria-labelledby="redirect-editor-title" className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h2 id="redirect-editor-title" className="text-lg font-semibold text-gray-900">
                        {editing ? "Edit redirect" : "Add redirect"}
                    </h2>
                    <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded p-1 text-gray-500 hover:bg-gray-100 disabled:opacity-50">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                        Source <span className="font-normal text-gray-500">(the old address, starts with /)</span>
                        <input ref={firstField} value={source} onChange={(e) => setSource(e.target.value)} className={inputClass} placeholder="/old-page/" autoComplete="off" spellCheck={false} required maxLength={500} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Destination <span className="font-normal text-gray-500">(where it goes: /new-page/ or https://…)</span>
                        <input value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} placeholder="/en/new-page/" autoComplete="off" spellCheck={false} required maxLength={500} />
                    </label>

                    {error && <p role="alert" className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        {editing ? (
                            <button type="button" onClick={() => setConfirmDelete(true)} disabled={busy} className="inline-flex items-center gap-2 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50">
                                <Trash2 className="h-4 w-4" /> Delete
                            </button>
                        ) : <span />}
                        <div className="flex gap-2">
                            <button type="button" onClick={onClose} disabled={busy} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                            <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60">
                                {busy && !confirmDelete && <Loader2 className="h-4 w-4 animate-spin" />}
                                {editing ? "Save changes" : "Add redirect"}
                            </button>
                        </div>
                    </div>
                </form>

                {confirmDelete && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/40 p-4">
                        <div role="alertdialog" aria-modal="true" aria-labelledby="redirect-delete-title" className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
                            <h3 id="redirect-delete-title" className="text-base font-semibold text-gray-900">Are you sure you want to delete this redirect?</h3>
                            <p className="mt-2 break-all font-mono text-xs text-gray-600">{row.source?.trim()} → {row.destination?.trim()}</p>
                            <p className="mt-2 text-sm text-gray-600">It will be removed from Strapi and the site stops redirecting it.</p>
                            <div className="mt-4 flex justify-end gap-2">
                                <button type="button" onClick={() => setConfirmDelete(false)} disabled={busy} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50">No</button>
                                <button type="button" onClick={() => send("DELETE")} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60">
                                    {busy && <Loader2 className="h-4 w-4 animate-spin" />} Yes
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RedirectEditor;
