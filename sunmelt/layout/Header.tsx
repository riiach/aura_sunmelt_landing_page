"use client"

import React from 'react'
import Image from "next/image";
import Link from "next/link";
import auraLogo from "../public/aura_logo.png";

const Header = () => {
  return (
    <div className="bg-red-500 w-full h-16 flex flex-col md:flex-row items-center justify-between
    px-3 md:px-16 lg:px-32
    ">
      <Image
          src={auraLogo}
          alt="Aura Logo"
          className="w-24 h-auto"
      />
      <nav className="bg-yellow-500 min-w-60 h-full
      flex flex-col md:flex-row justify-between items-center gap-0 md:gap-8
      text-white font-bold text-md md:text-lg">
        <Link href="">HOME</Link>
        <Link href="/about">ABOUT</Link>
        <Link href="/contact">SALES</Link>
        <Link href="/contact">CONTACT</Link>
      </nav>
    </div>
  )
}

export default Header