"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import type { AboutSceneState, IntroPhase } from "./ProductCarousel";
import AboutSection from "./AboutSection";
import { aboutPhases } from "./product-carousel/aboutMath.mjs";
import styles from "./ProductCarousel.module.css";

/* Temporarily disabled for the white-background preview.
const palettes = [
    { name: "Mango Glow", colors: ["#e5a048", "#98531b"] },
    { name: "Peach Glow", colors: ["#e69c84", "#95534f"] },
    { name: "Grapefruit Fizz", colors: ["#e48d82", "#a04542"] },
    { name: "Pomegranate Aura", colors: ["#dc8eae", "#8b3658"] },
    { name: "Grape Aura", colors: ["#bca1d6", "#6d4b89"] },
];
*/

// Uploaded background artwork is stored in public/backgrounds.
// Keep the existing grapefruit can until its replacement lychee artwork is supplied.
const imageBackgrounds = ["mango", "grape", "peach", "pomegranate", "lychee"] as const;

const backgroundFor = (name: string) => {
    const flavor = name.toLowerCase().split(" ")[0];
    return flavor === "grapefruit" ? "lychee" : flavor;
};

interface ProductHeroProps {
    header: ReactNode;
}

const ProductHero = ({ header }: ProductHeroProps) => {
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");
    const activeBackground = backgroundFor(activeProduct);
    const [introPhase, setIntroPhase] = useState<IntroPhase>("lineup");
    const frameRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const tileRef = useRef<HTMLDivElement>(null);
    const aboutState = useRef<AboutSceneState>({ progress: 0, target: null, returnToMango: false });
    const [aboutInteractive, setAboutInteractive] = useState(false);
    useEffect(() => {
        const root = trackRef.current, frame = frameRef.current;
        if (!root || !frame) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        let scheduled = 0;
        const update = () => {
            scheduled = 0;
            const travel = Math.max(1, root.offsetHeight - frame.offsetHeight);
            const raw = Math.max(0, Math.min(1, -root.getBoundingClientRect().top / travel));
            const progress = motion.matches ? (raw >= .5 ? 1 : 0) : raw;
            const phases = aboutPhases(progress);
            aboutState.current.progress = progress;
            aboutState.current.target = tileRef.current;
            frame.style.setProperty("--about-opacity", String(phases.reveal));
            frame.style.setProperty("--about-land", String(phases.land));
            const interactive = progress >= .985;
            frame.dataset.aboutActive = String(interactive);
            setAboutInteractive(interactive);
        };
        const schedule = () => { if (!scheduled) scheduled = requestAnimationFrame(update); };
        const observer = new ResizeObserver(schedule);
        observer.observe(root);
        observer.observe(frame);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        motion.addEventListener("change", schedule);
        update();
        return () => {
            cancelAnimationFrame(scheduled);
            observer.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            motion.removeEventListener("change", schedule);
        };
    }, []);
    const meetMango = useCallback(() => {
        aboutState.current.returnToMango = true;
        trackRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    }, []);
    const syncIntroProgress = useCallback((progress: number) => {
        frameRef.current?.style.setProperty("--intro-progress", String(Math.max(0, Math.min(1, progress))));
    }, []);

    return (
        <div id="home" ref={trackRef} className={styles.aboutTrack}>
            <div id="about" className={styles.aboutAnchor} aria-hidden="true" />
            <div ref={frameRef} className={styles.frame} data-intro-phase={introPhase}>
            {/* <div className={styles.backdrop} aria-hidden="true">
                {palettes.map(({ name, colors: [mid, deep] }) => (
                    <div key={name}
                         className={styles.gradient}
                         style={{
                             opacity: activeProduct === name ? 1 : 0,
                             background: `radial-gradient(ellipse var(--curve-rx) var(--curve-ry) at 50% var(--curve-center-y), ${deep} 0%, ${deep} 94%, ${mid} 110%, transparent 119%), linear-gradient(to bottom, ${mid} 0%, ${mid} 28%, #ffffff 100%)`,
                         }}
                    />
                ))}
            </div> */}
            <div className={styles.backdrop} aria-hidden="true">
                {imageBackgrounds.map(flavor => (
                    <div
                        key={flavor}
                        className={styles.imageBackground}
                        style={{
                            opacity: activeBackground === flavor ? 1 : 0,
                            backgroundImage: `url("/backgrounds/${flavor}.webp")`,
                        }}
                    />
                ))}
            </div>
            <div className={styles.headerReveal} inert={introPhase !== "active"}>
                {header}
            </div>
            <main className="w-full">
                <ProductCarousel
                    onProductChange={setActiveProduct}
                    onIntroPhase={setIntroPhase}
                    onIntroProgress={syncIntroProgress}
                    aboutState={aboutState}
                    aboutInteractive={aboutInteractive}
                />
                <AboutSection tileRef={tileRef} interactive={aboutInteractive} onMeetMango={meetMango} />
            </main>
            </div>
        </div>
    );
};

export default ProductHero;
