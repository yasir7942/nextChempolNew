import "../[lang]/globals.css";
import { openSans } from "@/libs/fonts";
import AdminShell from "./shared/AdminShell";

// Root layout for /admin (the site's language pages have their own root layout in app/[lang]).
export default function AdminLayout({ children }) {
    return (
        // html/body must be on one line, no whitespace
        <html lang="en"><body className={openSans.className}><AdminShell>{children}</AdminShell></body></html>
    );
}
