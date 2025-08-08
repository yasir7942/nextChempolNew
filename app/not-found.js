
// app/not-found.js

import Link from "next/link"
import Topbar from "./[lang]/components/navigation/topbar"
import Footer from "./[lang]/components/layout/footer"

export default function NotFoundPage() {
    return (
        <div dir="ltr">
            <Topbar locale="en" />

            <main className="container mx-auto py-20 text-center">
                <h1 className="text-6xl font-bold text-textBlue">404</h1>
                <h2 className="text-3xl font-semibold mt-4">Oops! Page Not Found</h2>
                <p className="text-lg text-gray-500 mt-2">
                    The page you’re looking for doesn’t exist or has been moved.
                </p>
                <Link
                    href="/en/"
                    className="mt-6 inline-block px-6 py-3 border border-textBlue bg-white hover:bg-textBlue hover:text-white text-textBlue text-lg font-medium rounded shadow transition"
                >
                    Go Home
                </Link>
            </main>

            <Footer locale="en" />
        </div>
    )
}

