"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import type { AboutSceneState, IntroPhase } from "./ProductCarousel";
import AboutSection from "./AboutSection";
import { aboutPhases, aboutScrollProgress, MANGO_READY } from "./product-carousel/aboutMath.mjs";
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
    const aboutState = useRef<AboutSceneState>({ progress: 0, target: null, returnToMango: false, preparing: false, failed: false });
    const [aboutInteractive, setAboutInteractive] = useState(false);
    useEffect(() => {
        const root = trackRef.current, frame = frameRef.current;
        if (!root || !frame) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const state = aboutState.current;
        const html = document.documentElement;
        let scheduled = 0;
        let locked = false, prepared = false, entered = false, jumpToAbout = false;
        let priorOverflow = "", priorGutter = "";
        let safetyTimer: ReturnType<typeof setTimeout> | undefined;
        let touchX = 0, touchY = 0;
        const top = () => window.scrollY + root.getBoundingClientRect().top;
        const scrollRange = () => Math.max(1, frame.offsetHeight);
        const pinToHero = () => window.scrollTo({ top: top(), behavior: "instant" });
        const unlock = () => {
            clearTimeout(safetyTimer);
            if (!locked) return;
            locked = false;
            html.style.overflowY = priorOverflow;
            html.style.scrollbarGutter = priorGutter;
            root.removeAttribute("data-scroll-locked");
        };
        const publish = (progress: number) => {
            const phases = aboutPhases(progress);
            state.progress = progress;
            state.target = tileRef.current;
            root.style.setProperty("--about-land", String(phases.land));
            const interactive = progress >= .985;
            root.dataset.aboutActive = String(interactive);
            setAboutInteractive(interactive);
        };
        const completePreparation = () => {
            if (!locked) return;
            state.preparing = false;
            prepared = true;
            publish(MANGO_READY);
            pinToHero();
            unlock();
            if (jumpToAbout) {
                jumpToAbout = false;
                window.scrollTo({ top: top() + scrollRange(), behavior: motion.matches ? "instant" : "smooth" });
            }
        };
        state.onPrepared = completePreparation;
        const beginPreparation = () => {
            if (locked || prepared) return;
            if (state.failed) { prepared = true; return; }
            priorOverflow = html.style.overflowY;
            priorGutter = html.style.scrollbarGutter;
            html.style.scrollbarGutter = "stable";
            html.style.overflowY = "hidden";
            locked = true;
            state.preparing = true;
            root.dataset.scrollLocked = "true";
            pinToHero();
            safetyTimer = setTimeout(() => {
                state.failed = true;
                completePreparation();
            }, 12000);
        };
        const update = () => {
            scheduled = 0;
            state.target = tileRef.current;
            if (locked) {
                if (Math.abs(root.getBoundingClientRect().top) > 1) pinToHero();
                return;
            }
            const raw = Math.max(0, Math.min(1, -root.getBoundingClientRect().top / scrollRange()));
            if (!prepared && raw > .001) {
                beginPreparation();
                if (locked) return;
            }
            if (!prepared) { publish(0); return; }
            if (raw > .001) entered = true;
            if (entered && raw <= .001) {
                entered = false;
                prepared = false;
                state.returnToMango = true;
                publish(0);
                return;
            }
            publish(motion.matches && raw > .001 ? 1 : aboutScrollProgress(raw));
        };
        const schedule = () => { if (!scheduled) scheduled = requestAnimationFrame(update); };
        const onWheel = (event: WheelEvent) => {
            if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            if ((event.target as Element | null)?.closest?.('nav[aria-label="Mobile navigation"]')) return;
            if (locked) { event.preventDefault(); return; }
            if (!prepared && event.deltaY > 0 && !state.failed) {
                event.preventDefault();
                beginPreparation();
            }
        };
        const onTouchStart = (event: TouchEvent) => {
            if (event.touches.length !== 1) return;
            touchX = event.touches[0].clientX;
            touchY = event.touches[0].clientY;
        };
        const onTouchMove = (event: TouchEvent) => {
            if (event.touches.length !== 1) return;
            if ((event.target as Element | null)?.closest?.("[data-rotate-control], [data-rotating='true']")) return;
            if ((event.target as Element | null)?.closest?.('nav[aria-label="Mobile navigation"]')) return;
            const dy = touchY - event.touches[0].clientY;
            const dx = event.touches[0].clientX - touchX;
            if (locked) { if (event.cancelable) event.preventDefault(); return; }
            if (!prepared && !state.failed && dy > 8 && dy > Math.abs(dx)) {
                if (event.cancelable) event.preventDefault();
                beginPreparation();
            }
        };
        const onAboutLink = (event: MouseEvent) => {
            const anchor = (event.target as Element | null)?.closest?.('a[href="#about"]');
            if (!anchor || prepared || state.failed) return;
            event.preventDefault();
            jumpToAbout = true;
            beginPreparation();
        };
        const observer = new ResizeObserver(schedule);
        observer.observe(root);
        observer.observe(frame);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule, { passive: true });
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        root.addEventListener("click", onAboutLink);
        motion.addEventListener("change", schedule);
        update();
        return () => {
            unlock();
            state.preparing = false;
            state.onPrepared = undefined;
            cancelAnimationFrame(scheduled);
            observer.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", schedule);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            root.removeEventListener("click", onAboutLink);
            motion.removeEventListener("change", schedule);
        };
    }, []);
    const syncIntroProgress = useCallback((progress: number) => {
        trackRef.current?.style.setProperty("--intro-progress", String(Math.max(0, Math.min(1, progress))));
    }, []);

    return (
        <div id="home" ref={trackRef} className={styles.aboutTrack} data-intro-phase={introPhase}>
            <main className={styles.sections}>
                <div ref={frameRef} className={styles.frame}>
                    <div className={styles.backdrop} aria-hidden="true">
                        {imageBackgrounds.map(flavor => (
                            <div key={flavor}
                                 className={styles.imageBackground}
                                 style={{
                                     opacity: activeBackground === flavor ? 1 : 0,
                                     backgroundImage: `url("/backgrounds/${flavor}.webp")`,
                                 }}
                            />
                        ))}
                    </div>
                </div>
                <AboutSection tileRef={tileRef} interactive={aboutInteractive} />
            </main>
            <ProductCarousel
                onProductChange={setActiveProduct}
                onIntroPhase={setIntroPhase}
                onIntroProgress={syncIntroProgress}
                aboutState={aboutState}
                aboutInteractive={aboutInteractive}
            />
            <div className={styles.headerReveal} inert={introPhase !== "active"}>
                {header}
            </div>
        </div>
    );
};

export default ProductHero;
