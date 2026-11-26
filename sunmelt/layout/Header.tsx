"use client"

import React from 'react'
import Image from "next/image";
import Link from "next/link";
import auraLogo from "../public/aura_logo.png";
import WaterText from "../component/ui/WaterText";

const Header = () => {
  return (
    <div className="w-full h-16 flex flex-col md:flex-row items-center justify-between
    px-3 md:px-16 lg:px-32
    ">
      <div className="min-w-12 w-auto h-full flex flex-row items-center justify-start">
          <Image
              src={auraLogo}
              alt="Aura Logo"
              className="w-24 h-auto"
          />
          <p className="font-fraunces text-white text-2xl">sunmelt</p>
      </div>

      <nav className="min-w-60 h-full
      flex flex-col md:flex-row justify-between items-center gap-0 md:gap-6
      text-white font-bold text-md md:text-lg">
        <Link href=""><WaterText>HOME</WaterText></Link>
          <Link href=""><WaterText>ABOUT</WaterText></Link>
          <Link href=""><WaterText>SALES</WaterText></Link>
          <Link href=""><WaterText>CONTACT</WaterText></Link>
      </nav>
    </div>
  )
}

export default Header