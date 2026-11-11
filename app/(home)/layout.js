
// app/(home)/layout.js — root layout for "/" only.
// Language pages (/en/, /ar/, /es/) have their own root layout in app/[lang]/layout.js,
// so <html lang> matches each page's language.
import "../[lang]/globals.css";
import { openSans } from "@/libs/fonts";

export default function RootLayout({ children }) {
    return (
        // html/body must be on one line, no whitespace
        <html lang="en"><body className={openSans.className}>{children}</body></html>
    );
}
