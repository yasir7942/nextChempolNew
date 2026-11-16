"use client";

import { useEffect, useState } from "react";

// "Send test email" for /admin/submissions: sends one email to the fixed test address (set in
// libs/team-mail.js) and shows a pop-up with the full technical result, pass or fail.

const STATUS_STYLE = {
    ok: "bg-emerald-100 text-emerald-800",
    missing: "bg-red-100 text-red-800",
    invalid: "bg-red-100 text-red-800",
};

const Row = ({ label, children }) => (
    <div className="contents">
        <dt className="font-semibold text-gray-600">{label}</dt>
        <dd className="break-words font-mono text-xs leading-5 text-gray-900">{children}</dd>
    </div>
);

const Section = ({ title, children }) => (
    <section className="mt-4">
        <h4 className="mb-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">{title}</h4>
        {children}
    </section>
);

function ResultDialog({ outcome, onClose }) {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const onKey = (event) => event.key === "Escape" && onClose();
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const { report, http, clientError } = outcome;
    const passed = report?.ok === true;
    // everything, as text, so it can be pasted into a message
    const fullText = JSON.stringify({ httpStatus: http, ...(report || { error: clientError }) }, null, 2);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(fullText);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
            <div role="dialog" aria-modal="true" aria-label="Test email result" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 text-left text-gray-900 shadow-xl">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-base font-semibold">Test email result</h3>
                    <button type="button" onClick={onClose} aria-label="Close" className="px-1 text-xl leading-none text-gray-500 hover:text-gray-900">&times;</button>
                </div>

                <div className={`mt-3 rounded p-3 ${passed ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-900"}`}>
                    <p className="text-lg font-bold">{passed ? "✓ TEST PASSED" : "✕ TEST FAILED"}</p>
                    <p className="mt-0.5 text-sm">
                        {passed
                            ? <>Resend accepted the email for <b>{report.recipient}</b>. Check that inbox (and its spam folder) to confirm it arrived.</>
                            : report
                                ? <>The email was not sent. See the error and the advice below.</>
                                : <>The test could not run. {clientError}</>}
                    </p>
                </div>

                {report && (
                    <>
                        <Section title="Summary">
                            <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-1 text-sm">
                                <Row label="Test sent to">{report.recipient}</Row>
                                {report.request?.from && <Row label="Sent from">{report.request.from}</Row>}
                                {report.request?.subject && <Row label="Subject">{report.request.subject}</Row>}
                                {report.resendResponse?.id && <Row label="Resend email ID">{report.resendResponse.id}</Row>}
                                <Row label="Time taken">{report.durationMs} ms</Row>
                                <Row label="Tested at (UTC)">{report.testedAt}</Row>
                                <Row label="Server">Node {report.environment?.node} · {report.environment?.nodeEnv || "no NODE_ENV"} · {report.environment?.platform}</Row>
                                <Row label="HTTP status">{http}</Row>
                            </dl>
                        </Section>

                        {report.error && (
                            <Section title="Error details">
                                <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-1 rounded border border-red-200 bg-red-50 p-2 text-sm">
                                    <Row label="Error name">{report.error.name}</Row>
                                    <Row label="Message">{report.error.message || "(none)"}</Row>
                                    {report.error.statusCode ? <Row label="Status code">{report.error.statusCode}</Row> : null}
                                    {report.error.cause ? <Row label="Cause">{report.error.cause}</Row> : null}
                                </dl>
                                {report.error.stack && <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-900 p-2 text-[11px] leading-4 text-gray-100">{report.error.stack}</pre>}
                            </Section>
                        )}

                        {report.hints?.length > 0 && (
                            <Section title="How to fix it">
                                <ul className="list-disc space-y-1 ps-5 text-sm">
                                    {report.hints.map((hint) => <li key={hint}>{hint}</li>)}
                                </ul>
                            </Section>
                        )}

                        <Section title="Configuration (.env on the server)">
                            <table className="w-full text-left text-xs">
                                <thead>
                                    <tr className="border-b border-gray-200 text-gray-500">
                                        <th className="py-1 pe-2 font-semibold">Variable</th>
                                        <th className="py-1 pe-2 font-semibold">Status</th>
                                        <th className="py-1 font-semibold">Value</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.configuration.map((item) => (
                                        <tr key={item.name} className="border-b border-gray-100 align-top">
                                            <td className="py-1 pe-2 font-mono">{item.name}</td>
                                            <td className="py-1 pe-2">
                                                <span className={`rounded-full px-2 py-0.5 font-bold ${STATUS_STYLE[item.status] || "bg-gray-100 text-gray-700"}`}>{item.status}</span>
                                            </td>
                                            <td className="break-all py-1 font-mono">{item.value || "-"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {report.configurationProblems?.length > 0 && (
                                <ul className="mt-2 list-disc ps-5 text-xs text-red-800">
                                    {report.configurationProblems.map((problem) => <li key={problem}>{problem}</li>)}
                                </ul>
                            )}
                            <p className="mt-1 text-[11px] text-gray-500">The API key is shown masked. This test emails only {report.recipient}; CONTACT_TO_EMAIL and CONTACT_CC_EMAILS are checked but not used.</p>
                        </Section>
                    </>
                )}

                <Section title="Full technical report">
                    <pre className="max-h-56 overflow-auto rounded bg-gray-900 p-2 text-[11px] leading-4 text-gray-100">{fullText}</pre>
                </Section>

                <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={copy} className="rounded border border-gray-400 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-100">
                        {copied ? "Copied" : "Copy details"}
                    </button>
                    <button type="button" onClick={onClose} className="rounded bg-gray-800 px-4 py-1.5 text-sm font-medium text-white hover:bg-gray-700">Close</button>
                </div>
            </div>
        </div>
    );
}

export default function TestEmailButton() {
    const [busy, setBusy] = useState(false);
    const [outcome, setOutcome] = useState(null);

    const run = async () => {
        setBusy(true);
        try {
            const response = await fetch("/api/admin/submissions/test-email", { method: "POST", cache: "no-store" });
            const text = await response.text();
            let json = null;
            try {
                json = JSON.parse(text);
            } catch { }

            if (json?.report) setOutcome({ http: response.status, report: json.report });
            else setOutcome({ http: response.status, clientError: `HTTP ${response.status}: ${json?.message || text.slice(0, 500) || "empty response"}` });
        } catch (error) {
            setOutcome({ http: 0, clientError: `Network error, the server did not answer: ${error?.message || error}` });
        } finally {
            setBusy(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={run}
                disabled={busy}
                className="rounded border border-blue-700 bg-blue-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-60"
            >
                {busy ? "Sending test..." : "Send test email"}
            </button>
            {outcome && <ResultDialog outcome={outcome} onClose={() => setOutcome(null)} />}
        </>
    );
}
