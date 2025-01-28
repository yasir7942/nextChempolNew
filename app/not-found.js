import Link from 'next/link'

export default function NotFound() {
  return (
    <div className='text-white text-center mt-10 h-72 flex justify-center items-center flex-col space-y-5'>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}