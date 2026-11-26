"use client"

import React, { useRef, useState } from 'react'
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import auraLogo from "../public/aura_logo.png";
import WaterText from "../component/ui/WaterText";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();

  return (
    <div
        className="w-full flex flex-col bg-white px-3 md:px-16 lg:px-32"
        onKeyDown={e => {
          if (e.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
    >
      <div className="w-full h-16 flex flex-row items-center justify-between">
        <div className="min-w-12 w-auto h-full flex flex-row items-center justify-start gap-2 shrink-0">
          <div className="w-14 flex items-center justify-center overflow-hidden shrink-0">
            <Image
                src={auraLogo}
                alt="Aura Logo"
                className="w-24 max-w-none h-auto shrink-0 brightness-0"
            />
          </div>
          <span className="font-fraunces text-black text-lg">x</span>
          <p className="font-fraunces text-black text-2xl">sunmelt</p>
        </div>

        <nav className="hidden md:flex min-w-60 h-full
        flex-row justify-between items-center gap-6
        text-black font-medium text-base md:text-lg">
          <Link href=""><WaterText>HOME</WaterText></Link>
          <Link href=""><WaterText>ABOUT</WaterText></Link>
          <Link href=""><WaterText>SALES</WaterText></Link>
          <Link href=""><WaterText>CONTACT</WaterText></Link>
        </nav>

        <button
            ref={menuButton}
            type="button"
            className="md:hidden w-11 h-11 flex items-center justify-center text-black"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            onClick={() => setMenuOpen(open => !open)}
        >
          <span className="relative w-6 h-6" aria-hidden="true">
            <motion.span
                initial={false}
                animate={{ y: menuOpen ? 0 : -7, rotate: menuOpen ? 45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                className="absolute left-0 top-[11px] w-6 h-0.5 rounded-full bg-current"
            />
            <motion.span
                initial={false}
                animate={{ opacity: menuOpen ? 0 : 1, scaleX: menuOpen ? 0 : 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeInOut" }}
                className="absolute left-0 top-[11px] w-6 h-0.5 rounded-full bg-current"
            />
            <motion.span
                initial={false}
                animate={{ y: menuOpen ? 0 : 7, rotate: menuOpen ? -45 : 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                className="absolute left-0 top-[11px] w-6 h-0.5 rounded-full bg-current"
            />
          </span>
        </button>
      </div>

      <div id="mobile-nav" className="md:hidden" inert={!menuOpen}>
        <AnimatePresence initial={false}>
          {menuOpen && (
            <motion.div
                key="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduceMotion ? 0 : 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
            >
              <nav className="flex flex-col items-center gap-5 py-5 text-black font-medium text-base">
                <Link href="" onClick={() => setMenuOpen(false)}><WaterText>HOME</WaterText></Link>
                <Link href="" onClick={() => setMenuOpen(false)}><WaterText>ABOUT</WaterText></Link>
                <Link href="" onClick={() => setMenuOpen(false)}><WaterText>SALES</WaterText></Link>
                <Link href="" onClick={() => setMenuOpen(false)}><WaterText>CONTACT</WaterText></Link>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Header
