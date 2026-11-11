import { Open_Sans } from "next/font/google";

// Site font, shared by the root layouts ([lang], (home), admin) and global-not-found.
export const openSans = Open_Sans({
    subsets: ["latin"],
    weight: ["300", "400", "600", "700"],
});
