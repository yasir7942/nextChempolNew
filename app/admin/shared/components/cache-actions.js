"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, CloudCog, DatabaseZap, Loader2, X, XCircle } from "lucide-react";

// Admin header buttons; both call POST /api/admin/cache/ (app/api/admin/cache/route.js)
const ACTIONS = [
    {
        action: "revalidate",
        label: "Revalidate from Strapi",
        running: "Revalidating...",
        Icon: DatabaseZap,
        colors: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:ring-indigo-300",
        okTitle: "Pages revalidated",
        failTitle: "Revalidate failed",
    },
    {
        action: "cloudflare",
        label: "Clear Cloudflare cache",
        running: "Clearing...",
        Icon: CloudCog,
        colors: "bg-orange-500 text-white hover:bg-orange-600 focus-visible:ring-orange-300",
        okTitle: "Cloudflare cache cleared",
        failTitle: "Cloudflare cache not cleared",
    },
];

const BUTTON = "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-70";

// The team works on UAE time (Asia/Dubai), shown with AM / PM
const uaeTime = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dubai",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
});

async function runAction(action) {
    try {
        const response = await fetch("/api/admin/cache/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
            body: JSON.stringify({ action }),
        });
        const json = await response.json().catch(() => null);
        const fallback = `The server answered with status ${response.status}.`;

        if (typeof json?.ok !== "boolean") return { ok: false, status: response.status, error: fallback };
        return { ...json, status: response.status, error: json.error || fallback };
    } catch {
        return { ok: false, error: "Could not reach the server. Check your internet connection and try again." };
    }
}

export default function CacheActions() {
    const [running, setRunning] = useState(null);
    const [result, setResult] = useState(null);

    async function handleClick(item) {
        setRunning(item.action);
        const reply = await runAction(item.action);
        setRunning(null);
        setResult({ ...reply, item });
    }

    const at = result?.at ? new Date(result.at) : null;
    const footer = at && !Number.isNaN(at.getTime())
        ? `Done at ${uaeTime.format(at)} (UAE time)`
        : result?.status ? `Status ${result.status}` : "";

    return (
        <>
            <div className="flex flex-wrap gap-2">
                {ACTIONS.map((item) => {
                    const busy = running === item.action;
                    const Icon = busy ? Loader2 : item.Icon;

                    return (
                        <button
                            key={item.action}
                            type="button"
                            onClick={() => handleClick(item)}
                            disabled={running !== null}
                            aria-busy={busy ? "true" : undefined}
                            className={`${BUTTON} ${item.colors}`}
                        >
                            <Icon className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} aria-hidden="true" />
                            {busy ? item.running : item.label}
                        </button>
                    );
                })}
            </div>

            <Dialog.Root open={result !== null} onOpenChange={(open) => !open && setResult(null)}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-[60] w-[95vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-xl focus:outline-none">
                        {result && (
                            <>
                                <Dialog.Title className={`flex items-center gap-2 pe-8 text-lg font-semibold ${result.ok ? "text-emerald-700" : "text-red-700"}`}>
                                    {result.ok
                                        ? <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
                                        : <XCircle className="h-5 w-5 shrink-0" aria-hidden="true" />}
                                    {result.ok ? result.item.okTitle : result.item.failTitle}
                                </Dialog.Title>

                                <Dialog.Description
                                    className={result.ok
                                        ? "mt-3 text-sm text-gray-700"
                                        : "mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 whitespace-pre-wrap break-words"}
                                >
                                    {result.ok ? result.message : result.error}
                                </Dialog.Description>

                                {footer && <p className="mt-3 text-xs text-gray-500">{footer}</p>}

                                <div className="mt-5 flex justify-end">
                                    <Dialog.Close asChild>
                                        <button type="button" className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                                            OK
                                        </button>
                                    </Dialog.Close>
                                </div>

                                <Dialog.Close asChild>
                                    <button
                                        type="button"
                                        aria-label="Close"
                                        className="absolute end-3 top-3 rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
                                    >
                                        <X className="h-5 w-5" aria-hidden="true" />
                                    </button>
                                </Dialog.Close>
                            </>
                        )}
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </>
    );
}
