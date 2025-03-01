import Link from 'next/link';

export default function ServerError() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-700 text-white text-center px-6">
            <h1 className="text-6xl font-bold text-textBlue">500</h1>
            <h2 className="text-3xl font-semibold mt-4">Internal Server Error</h2>
            <p className="text-lg text-gray-500 mt-2">
                Something went wrong on our end. Please try again later.
            </p>
            <Link
                href="/"
                className="mt-6 px-6 py-3 border-1 border-textBlue bg-white hover:bg-textBlue text-textBlue hover:text-white text-lg font-medium rounded-sm shadow-md transition-all duration-300"
            >
                Go Home
            </Link>
        </div>
    );
}
