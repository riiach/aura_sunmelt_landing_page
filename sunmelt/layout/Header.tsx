"use client"

import React, { useState } from 'react'
import Image from "next/image";
import Link from "next/link";
import auraLogo from "../public/aura_logo.png";
import WaterText from "../component/ui/WaterText";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="w-full flex flex-col px-3 md:px-16 lg:px-32">
      <div className="w-full h-16 flex flex-row items-center justify-between">
        <div className="min-w-12 w-auto h-full flex flex-row items-center justify-start">
          <Image
              src={auraLogo}
              alt="Aura Logo"
              className="w-24 h-auto"
          />
          <p className="font-fraunces text-white text-2xl">sunmelt</p>
        </div>

        <nav className="hidden md:flex min-w-60 h-full
        flex-row justify-between items-center gap-6
        text-white font-bold text-base md:text-lg">
          <Link href=""><WaterText>HOME</WaterText></Link>
          <Link href=""><WaterText>ABOUT</WaterText></Link>
          <Link href=""><WaterText>SALES</WaterText></Link>
          <Link href=""><WaterText>CONTACT</WaterText></Link>
        </nav>

        <button
            type="button"
            className="md:hidden w-11 h-11 flex items-center justify-center text-white"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(!menuOpen)}
        >
          <span className="relative w-6 h-6" aria-hidden="true">
            <span className={`absolute left-0 top-1/2 w-6 h-0.5 rounded-full bg-current ${menuOpen ? "rotate-45" : "-translate-y-1.5"}`} />
            <span className={`absolute left-0 top-1/2 w-6 h-0.5 rounded-full bg-current ${menuOpen ? " -rotate-45" : "translate-y-1.5"}`} />
          </span>
        </button>
      </div>

      <div id="mobile-nav" className="md:hidden">
        {menuOpen && (
          <nav className="flex flex-col items-end gap-5 py-5 text-white font-bold text-base">
            <Link href="" onClick={() => setMenuOpen(false)}><WaterText>HOME</WaterText></Link>
            <Link href="" onClick={() => setMenuOpen(false)}><WaterText>ABOUT</WaterText></Link>
            <Link href="" onClick={() => setMenuOpen(false)}><WaterText>SALES</WaterText></Link>
            <Link href="" onClick={() => setMenuOpen(false)}><WaterText>CONTACT</WaterText></Link>
          </nav>
        )}
      </div>
    </div>
  )
}

export default Header
