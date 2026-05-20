"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

export default function AdminAuthGuard({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [checking, setChecking] = useState(true);
    const [allowed, setAllowed] = useState(false);

    useEffect(() => {
        let alive = true;

        async function checkAuth() {
            const cleanPathname = pathname?.replace(/\/$/, "") || "";

            // IMPORTANT:
            // Never check /api/admin/me on login page.
            if (cleanPathname === "/admin/login") {
                if (alive) {
                    setAllowed(true);
                    setChecking(false);
                }
                return;
            }

            try {
                const res = await fetch("/api/admin/me", {
                    method: "GET",
                    cache: "no-store",
                });

                const json = await res.json().catch(() => null);

                if (!res.ok || !json?.ok) {
                    router.replace("/admin/login");
                    return;
                }

                if (alive) {
                    setAllowed(true);
                    setChecking(false);
                }
            } catch (error) {
                router.replace("/admin/login");
            }
        }

        checkAuth();

        return () => {
            alive = false;
        };
    }, [pathname, router]);

    if (checking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <div className="bg-white rounded-xl shadow px-6 py-5 text-center">
                    <div className="w-8 h-8 mx-auto mb-3 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
                    <p className="text-sm font-medium text-gray-700">
                        Checking admin login...
                    </p>
                </div>
            </div>
        );
    }

    if (!allowed) {
        return null;
    }

    return children;
}