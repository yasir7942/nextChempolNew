
// app/layout.js
import "./[lang]/globals.css";
import { Open_Sans } from "next/font/google";

const openSans = Open_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
});

export default function RootLayout({ children }) {
    return (
        // html/body must be on one line, no whitespace
        <html lang="en"><body className={openSans.className}>{children}</body></html>
    );
}