"use client"

import React, { useEffect, useRef, useState } from 'react'
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import auraLogo from "../public/aura_logo.png";
import styles from "./Header.module.css";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "" },
  { label: "Sales", href: "" },
  { label: "Contact", href: "" },
];

const Header = ({ transparent = false }: { transparent?: boolean }) => {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!menuOpen) return;

    const closeOutside = (event: PointerEvent) => {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOutside);
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, [menuOpen]);

  return (
    <div
        ref={headerRef}
        className={`${styles.header} ${transparent ? styles.transparent : styles.solid}`}
        onKeyDown={e => {
          if (e.key === "Escape" && menuOpen) {
            setMenuOpen(false);
            menuButton.current?.focus();
          }
        }}
    >
      <div className={styles.glassSurface}>
        <nav className={styles.inner} aria-label="Main navigation">
          <div className={styles.leftNav}>
            {links.slice(0, 3).map(({ label, href }) => (
              <Link key={label} href={href} className={styles.navLink}
                    aria-current={href && pathname === href ? "page" : undefined}>
                <span className={styles.linkLabel}>{label}</span>
              </Link>
            ))}
          </div>

          <Link href="/" className={styles.brand} aria-label="Aura x Sunmelt home"
                onClick={() => setMenuOpen(false)}>
            <span className={styles.logoCrop}>
              <Image
                  src={auraLogo}
                  alt=""
                  className={`${styles.logo} ${transparent ? "" : styles.darkLogo}`}
              />
            </span>
            <span className={styles.collaboration} aria-hidden="true">×</span>
            <span className={styles.wordmark}>sunmelt</span>
          </Link>

          <div className={styles.rightNav}>
            <span className={styles.contactHint}>Have a question?</span>
            <Link href={links[3].href} className={styles.contact}>
              <span className={styles.linkLabel}>{links[3].label}</span>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M4 12 12 4M5 4h7v7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          </div>

          <button
              ref={menuButton}
              type="button"
              className={styles.menuButton}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              onClick={() => setMenuOpen(open => !open)}
          >
            <span className={styles.menuIcon} aria-hidden="true">
              <motion.span
                  initial={false}
                  animate={{ y: menuOpen ? 0 : -4, rotate: menuOpen ? 45 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                  className={styles.menuLine}
              />
              <motion.span
                  initial={false}
                  animate={{ y: menuOpen ? 0 : 4, rotate: menuOpen ? -45 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.25, ease: "easeInOut" }}
                  className={styles.menuLine}
              />
            </span>
          </button>
        </nav>

        <div id="mobile-nav" className={styles.mobileOverlay} inert={!menuOpen}>
          <AnimatePresence initial={false}>
            {menuOpen && (
              <motion.div
                  key="mobile-menu"
                  initial={{ height: 0 }}
                  animate={{ height: "auto" }}
                  exit={{ height: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={styles.mobilePanel}
              >
                <nav aria-label="Mobile navigation" className={styles.mobileNav}>
                  {links.map(({ label, href }) => (
                    <Link key={label} href={href} className={styles.mobileLink}
                          aria-current={href && pathname === href ? "page" : undefined}
                          onClick={() => setMenuOpen(false)}>
                      <span className={styles.linkLabel}>{label}</span>
                    </Link>
                  ))}
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Header
