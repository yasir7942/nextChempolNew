"use client";

import { usePathname } from "next/navigation";
import AdminHeader from "./AdminHeader";
import AdminAuthGuard from "./AdminAuthGuard";

export default function AdminShell({ children }) {
    const pathname = usePathname();

    const cleanPathname = pathname?.replace(/\/$/, "") || "";
    const isLoginPage = cleanPathname === "/admin/login";

    if (isLoginPage) {
        return children;
    }

    return (
        <AdminAuthGuard>
            <div className="min-h-screen bg-gray-100">
                <AdminHeader />
                {children}
            </div>
        </AdminAuthGuard>
    );
}