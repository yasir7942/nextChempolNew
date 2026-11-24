
// app/(home)/layout.js — root layout for "/" only.
// Language pages (/en/, /ar/, /es/) have their own root layout in app/[lang]/layout.js,
// so <html lang> matches each page's language.
import "../[lang]/globals.css";
import { openSans } from "@/libs/fonts";
import GoogleTagManager, { GoogleTagManagerNoScript } from "../[lang]/components/elements/google-tag-manager";

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className={openSans.className}>
                {/* Google Tag Manager (GA4 runs inside it): see google-tag-manager.js */}
                <GoogleTagManagerNoScript />
                <GoogleTagManager />
                {children}
            </body>
        </html>
    );
}
