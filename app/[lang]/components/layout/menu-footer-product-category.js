"use client";

import Link from "next/link"


const MenuFooterPcategory = () => {
  return (



    <ul className="text-gray-300  space-y-1 font-light">
      <li>
        <Link href={`/certificates`} >Certifications & Approvals </Link>
      </li>
      <li>
        <Link href={`/`} >Privacy Policy </Link>
      </li>
      <li>
        <Link href={`/`} >Interested Parties </Link>
      </li>
      <li>
        <Link href={`/`} >IMS Policy </Link>
      </li>
      <li>
        <Link href={`/`} >HSE</Link>
      </li>
    </ul>


  )
}

export default MenuFooterPcategory
