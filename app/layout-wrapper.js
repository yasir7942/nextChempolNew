"use client";

import { usePathname } from "next/navigation";
import Topbar from "./[lang]/components/navigation/topbar";
import Footer from "./[lang]/components/layout/footer";

export default function LayoutWrapper({ children }) {
    const pathname = usePathname();

    // true only if we are exactly on `/`
    const isEnglishHome = pathname === "/";

    // console.log("LayoutWrapper - pathname:", pathname, " isEnglishHome:", isEnglishHome);

    return (
        <>
            {isEnglishHome && <Topbar locale="en" />}
            {children}
            {isEnglishHome && <Footer locale="en" />}
        </>
    );
}
