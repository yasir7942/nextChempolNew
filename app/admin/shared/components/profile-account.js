"use client";

import { useEffect, useState } from "react";

const inputClass = "mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// Profile of the logged-in SuperAdmin: account details and a password change form
export default function ProfileAccount() {
    const [user, setUser] = useState(undefined); // undefined = loading, null = not available
    const [currentPassword, setCurrentPassword] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [show, setShow] = useState(false);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState(null); // { ok, text }

    useEffect(() => {
        let alive = true;
        fetch("/api/admin/me", { cache: "no-store" })
            .then((response) => response.json())
            .then((json) => alive && setUser(json?.user || null))
            .catch(() => alive && setUser(null));
        return () => {
            alive = false;
        };
    }, []);

    const submit = async (event) => {
        event.preventDefault();
        setMessage(null);

        if (password !== passwordConfirmation) return setMessage({ ok: false, text: "The new password and its confirmation do not match." });
        if (password.length < 8) return setMessage({ ok: false, text: "The new password must have at least 8 characters." });

        setBusy(true);
        try {
            const response = await fetch("/api/admin/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, password, passwordConfirmation }),
                cache: "no-store",
            });
            const json = await response.json().catch(() => null);

            if (response.ok && json?.success) {
                setMessage({ ok: true, text: "Your password was changed." });
                setCurrentPassword("");
                setPassword("");
                setPasswordConfirmation("");
            } else {
                setMessage({ ok: false, text: json?.message || `The password could not be changed (HTTP ${response.status}).` });
            }
        } catch {
            setMessage({ ok: false, text: "The server did not answer. Try again." });
        } finally {
            setBusy(false);
        }
    };

    if (user === undefined) return <p className="mt-6 text-sm text-gray-600">Loading...</p>;

    if (!user?.isSuperAdmin) {
        return <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">Only a SuperAdmin can use this page.</p>;
    }

    return (
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                <dl className="mt-3 grid grid-cols-[110px_1fr] gap-y-2 text-sm">
                    <dt className="font-semibold text-gray-600">Username</dt>
                    <dd className="break-words">{user.username || "-"}</dd>
                    <dt className="font-semibold text-gray-600">Email</dt>
                    <dd className="break-words">{user.email || "-"}</dd>
                    <dt className="font-semibold text-gray-600">Role</dt>
                    <dd>{user.role || "-"}</dd>
                </dl>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-5">
                <h2 className="text-lg font-semibold text-gray-900">Change password</h2>

                {message && (
                    <p role="status" className={`mt-3 rounded border p-3 text-sm ${message.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
                        {message.text}
                    </p>
                )}

                <form onSubmit={submit} className="mt-3 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                        Current password
                        <input type={show ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" required className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        New password <span className="font-normal text-gray-500">(at least 8 characters)</span>
                        <input type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" minLength={8} required className={inputClass} />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">
                        Confirm new password
                        <input type={show ? "text" : "password"} value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} autoComplete="new-password" minLength={8} required className={inputClass} />
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
                        Show passwords
                    </label>
                    <button type="submit" disabled={busy} className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-blue-300">
                        {busy ? "Saving..." : "Update password"}
                    </button>
                </form>
            </section>
        </div>
    );
}
