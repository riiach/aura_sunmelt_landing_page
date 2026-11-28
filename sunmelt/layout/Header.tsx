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
  { label: "About", href: "#about" },
  { label: "Sales", href: "" },
  { label: "Contact", href: "" },
];

const Header = ({ transparent = false }: { transparent?: boolean }) => {
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<"home" | "about">("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  // Follow the visible section instead of the URL, which stays on "/" while
  // the carousel performs its scroll-driven About transition.
  useEffect(() => {
    const about = document.getElementById("about");
    if (!about) {
      setActiveSection("home");
      return;
    }

    const viewport = window.visualViewport;
    let frame = 0;
    const update = () => {
      frame = 0;
      const normalScale = viewport && Math.abs(viewport.scale - 1) < .01;
      const viewportTop = normalScale ? viewport.offsetTop : 0;
      const height = normalScale ? viewport.height : window.innerHeight;
      const midpoint = viewportTop + height / 2;
      const rect = about.getBoundingClientRect();
      setActiveSection(rect.top <= midpoint && rect.bottom > midpoint ? "about" : "home");
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(schedule);
    observer.observe(about);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    viewport?.addEventListener("scroll", schedule, { passive: true });
    viewport?.addEventListener("resize", schedule, { passive: true });
    schedule();

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      viewport?.removeEventListener("resize", schedule);
    };
  }, [pathname]);

  const currentLink = (href: string): "location" | undefined => {
    if (href === "/") return pathname === "/" && activeSection === "home" ? "location" : undefined;
    if (href === "#about") return pathname === "/" && activeSection === "about" ? "location" : undefined;
    return undefined;
  };

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
                    data-about-link={href === "#about" ? "" : undefined}
                    data-home-link={href === "/" ? "" : undefined}
                    scroll={href !== "#about"}
                    aria-current={currentLink(href)}>
                <span className={styles.linkLabel}>{label}</span>
              </Link>
            ))}
          </div>

          <Link href="/" className={styles.brand} aria-label="Aura x Sunmelt home" data-home-link
                onClick={() => setMenuOpen(false)}>
            <span className={styles.logoCrop}>
              <Image
                  src={auraLogo}
                  alt=""
                  className={`${styles.logo} ${transparent ? "" : styles.darkLogo}`}
              />
            </span>
            <svg className={styles.collaboration} width="9" height="9" viewBox="0 0 10 10" fill="none" aria-hidden="true">
              <path d="M2 2 8 8M8 2 2 8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
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
                    <Link key={label} href={href}
                          data-about-link={href === "#about" ? "" : undefined}
                          data-home-link={href === "/" ? "" : undefined}
                          scroll={href !== "#about"}
                          className={label === "Contact" ? `${styles.mobileLink} ${styles.mobileContact}` : styles.mobileLink}
                          aria-current={currentLink(href)}
                          onClick={() => setMenuOpen(false)}>
                      {label === "Contact" ? (
                        <span className={styles.flipWindow}>
                          <span className={styles.flipTrack}>
                            <span>{label}</span>
                            <span aria-hidden="true">{label}</span>
                          </span>
                        </span>
                      ) : (
                        <span className={styles.linkLabel}>{label}</span>
                      )}
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
