"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ADMIN_PAGES } from "@/app/admin/admin-pages";

// Two drop-down menus: the additives selector pages and the reports
const SELECTOR_ITEMS = [
    { label: "Home", href: "/admin/selector" },
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

// Product Report, Redirect Links and YouTube live in app/admin/(reports)
const REPORT_ITEMS = [
    { label: "Home", href: "/admin" },
    ...ADMIN_PAGES.map(({ title, href }) => ({ label: title, href })),
];

// "/admin/x/" and "/admin/x" are the same page
const withoutSlash = (path) => (path || "/").replace(/\/+$/, "") || "/";

function DropdownMenu({ id, label, items, pathname, openId, setOpenId }) {
    const open = openId === id;
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const onClick = (event) => {
            if (ref.current && !ref.current.contains(event.target)) setOpenId(null);
        };
        const onKey = (event) => {
            if (event.key === "Escape") setOpenId(null);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onKey);
        };
    }, [open, setOpenId]);

    const active = items.some((item) => {
        const href = withoutSlash(item.href);
        return pathname === href || (href !== "/admin" && pathname.startsWith(href + "/"));
    });

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : id)}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${active
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
            >
                {label}
                <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>

            {open && (
                <ul
                    role="menu"
                    className="absolute start-0 top-full z-50 mt-2 max-h-[70vh] w-64 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
                >
                    {items.map((item) => {
                        const href = withoutSlash(item.href);
                        const current = pathname === href;

                        return (
                            <li key={item.href} role="none">
                                <Link
                                    role="menuitem"
                                    href={item.href}
                                    onClick={() => setOpenId(null)}
                                    aria-current={current ? "page" : undefined}
                                    className={`block rounded-md px-3 py-2 text-sm font-medium transition ${current
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

export default function AdminHeader() {
    const pathname = withoutSlash(usePathname());
    const router = useRouter();

    const [loggingOut, setLoggingOut] = useState(false);
    const [openId, setOpenId] = useState(null);

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
                        Admin
                    </Link>

                    <nav aria-label="Admin" className="flex flex-wrap items-center gap-2">
                        <DropdownMenu id="selector" label="Additives Selector" items={SELECTOR_ITEMS} pathname={pathname} openId={openId} setOpenId={setOpenId} />
                        <DropdownMenu id="reports" label="Reports" items={REPORT_ITEMS} pathname={pathname} openId={openId} setOpenId={setOpenId} />
                    </nav>

                    <button
                        type="button"
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-fit rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                    >
                        {loggingOut ? "Logging out..." : "Logout"}
                    </button>
                </div>
            </div>
        </header>
    );
}
