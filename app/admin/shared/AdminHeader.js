"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [

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

    return (
        <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
            <div className="mx-auto flex w-full flex-col gap-4 px-16 py-4 md:flex-row md:items-center md:justify-between  ">
                <Link href="/admin/gasoline" className="text-xl font-bold text-gray-900">
                    Additives Selector
                </Link>

                <nav className="flex flex-wrap gap-2">
                    {menuItems.map((item) => {
                        const active = pathname === item.href;

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