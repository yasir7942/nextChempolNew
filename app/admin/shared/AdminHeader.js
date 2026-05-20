"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const menuItems = [
    { label: "Home", href: "/admin" },
    { label: "Gasoline/PCMO", href: "/admin/gasoline" },
    { label: "Heavy Duty/HDDEO", href: "/admin/heavy-duty" },
    { label: "Motorcycle", href: "/admin/motorcycle" },
    { label: "Driveline", href: "/admin/driveline" },
    { label: "Viscosity", href: "/admin/viscosity" },
    { label: "Industrial", href: "/admin/industrial" },
    { label: "Marine", href: "/admin/marine" },
    { label: "Lubricant Components", href: "/admin/components" },
    { label: "Grease", href: "/admin/grease" },
    { label: "Synthetic", href: "/admin/synthetic" },
    { label: "Speciality", href: "/admin/speciality" },
];

export default function AdminHeader() {
    const pathname = usePathname();
    const router = useRouter();

    const [loggingOut, setLoggingOut] = useState(false);

    async function handleLogout() {
        try {
            setLoggingOut(true);

            await fetch("/api/admin/logout", {
                method: "POST",
            });

            router.replace("/admin/login");
            router.refresh();
        } catch (error) {
            console.error("Logout failed:", error);
            window.location.href = "/admin/login";
        } finally {
            setLoggingOut(false);
        }
    }

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto flex w-full flex-col gap-4 px-6 py-4 md:px-16">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <Link href="/admin" className="text-xl font-bold text-gray-900">
                        Additives Selector
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>

                <nav className="flex flex-wrap gap-2">
                    {menuItems.map((item) => {
                        const active =
                            pathname === item.href ||
                            (item.href !== "/admin" && pathname.startsWith(item.href));

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${active
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}