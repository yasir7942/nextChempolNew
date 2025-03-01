import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center  py-[8%]  text-gray-600 text-center ">
      <h1 className="text-6xl font-bold   text-textBlue">404</h1>
      <h2 className="text-3xl font-semibold mt-4">Oops! Page Not Found</h2>
      <p className="text-lg text-gray-500 mt-2">
        The page you’re looking for doesn’t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-6 px-6 py-3 border-1 border-textBlue bg-white hover:bg-textBlue text-textBlue hover:text-white text-lg font-medium rounded-sm shadow-md transition-all duration-300"
      >
        Go Home
      </Link>
    </div>
  )
}