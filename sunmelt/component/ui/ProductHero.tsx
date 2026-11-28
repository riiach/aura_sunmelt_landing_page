"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import StoriesSection from "./StoriesSection";
import Footer from "../../layout/Footer";
import type { AboutSceneState, IntroPhase } from "./ProductCarousel";
import AboutSection, { IngredientsSection } from "./AboutSection";
import { aboutPhases, aboutScrollProgress, aboutNavigationEase, aboutViewportMetrics, MANGO_READY } from "./product-carousel/aboutMath.mjs";
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
    const ingredientsRef = useRef<HTMLDivElement>(null);
    const aboutState = useRef<AboutSceneState>({ progress: 0, target: null, ingredientsTarget: null, returnToMango: false, preparing: false, failed: false });
    const [aboutInteractive, setAboutInteractive] = useState(false);
    useEffect(() => {
        const root = trackRef.current, frame = frameRef.current;
        if (!root || !frame) return;
        const about = root.querySelector<HTMLElement>("#about");
        if (!about) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const state = aboutState.current;
        const html = document.documentElement;
        let scheduled = 0, navigationFrame = 0;
        let followAbout = false;
        const visual = window.visualViewport;
        let locked = false, prepared = false, entered = false, jumpToAbout = false;
        let priorOverflow = "", priorGutter = "";
        let safetyTimer: ReturnType<typeof setTimeout> | undefined;
        let touchX = 0, touchY = 0;
        const top = () => window.scrollY + root.getBoundingClientRect().top;
        const aboutTop = () => window.scrollY + about.getBoundingClientRect().top;
        const visualTop = () => visual && Math.abs(visual.scale - 1) < .01 ? visual.offsetTop : 0;
        const aboutRemaining = () => about.getBoundingClientRect().top - visualTop();
        const aboutDestination = () => Math.max(0, aboutTop() - visualTop());
        const scrollRange = () => Math.max(1, aboutTop() - top());
        const pinToHero = () => window.scrollTo({ top: top(), behavior: "instant" });
        const syncViewport = () => {
            const { visibleHeight, scrollHeight } = aboutViewportMetrics(
                window.innerHeight, html.clientHeight, visual?.height,
                visual?.scale, visual?.offsetTop,
            );
            for (const [key, value] of [
                ["--about-view-height", `${visibleHeight}px`],
                ["--about-scroll-height", `${scrollHeight}px`],
            ]) {
                if (root.style.getPropertyValue(key) !== value) root.style.setProperty(key, value);
            }
        };
        const alignAbout = () => {
            if (Math.abs(aboutRemaining()) > 1) {
                window.scrollTo({ top: aboutDestination(), behavior: "instant" });
            }
            schedule();
        };
        const cancelNavigation = () => {
            if (navigationFrame) cancelAnimationFrame(navigationFrame);
            navigationFrame = 0;
            followAbout = false;
        };
        const scrollToAbout = () => {
            cancelNavigation();
            followAbout = true;
            syncViewport();
            const from = window.scrollY;
            if (motion.matches || Math.abs(aboutRemaining()) <= 1) {
                alignAbout();
                return;
            }
            const started = performance.now();
            const duration = 1450;
            const step = (now: number) => {
                const progress = Math.min(1, (now - started) / duration);
                // Read the live section position to account for responsive layout changes.
                const target = aboutDestination();
                window.scrollTo({
                    top: from + (target - from) * aboutNavigationEase(progress),
                    behavior: "instant",
                });
                schedule();
                if (progress < 1) navigationFrame = requestAnimationFrame(step);
                else {
                    navigationFrame = 0;
                    alignAbout();
                }
            };
            navigationFrame = requestAnimationFrame(step);
        };
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
            state.ingredientsTarget = ingredientsRef.current;
            root.style.setProperty("--about-land", String(phases.land));
            // Keep About readable even when WebGL cannot render the transition.
            if (state.failed) root.style.setProperty("--about-content-fade", String(phases.reveal));
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
                scrollToAbout();
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
            state.ingredientsTarget = ingredientsRef.current;
            if (locked) {
                if (Math.abs(root.getBoundingClientRect().top) > 1) pinToHero();
                return;
            }
            const remaining = aboutRemaining();
            const raw = remaining <= 1 ? 1 : Math.max(0, Math.min(1, 1 - remaining / scrollRange()));
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
            cancelNavigation();
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
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) cancelNavigation();
            if (!prepared && !state.failed && dy > 8 && dy > Math.abs(dx)) {
                if (event.cancelable) event.preventDefault();
                beginPreparation();
            }
        };
        const scrollToHome = () => {
            cancelNavigation();
            jumpToAbout = false;
            if (locked || state.preparing) {
                unlock();
                state.preparing = false;
            }
            // Retain the scroll-driven reverse transition, including a click
            // that interrupts preparation before the first scroll frame.
            if (prepared || state.progress > 0) {
                prepared = true;
                entered = true;
            }
            const from = window.scrollY;
            const destination = Math.max(0, top());
            const finish = () => {
                navigationFrame = 0;
                window.scrollTo({ top: Math.max(0, top()), behavior: "instant" });
                entered = false;
                prepared = false;
                state.returnToMango = true;
                publish(0);
                schedule();
            };
            if (motion.matches || Math.abs(from - destination) <= 1) {
                finish();
                return;
            }
            const started = performance.now();
            const step = (now: number) => {
                const progress = Math.min(1, (now - started) / 1450);
                window.scrollTo({
                    top: from + (Math.max(0, top()) - from) * aboutNavigationEase(progress),
                    behavior: "instant",
                });
                schedule();
                if (progress < 1) navigationFrame = requestAnimationFrame(step);
                else finish();
            };
            navigationFrame = requestAnimationFrame(step);
        };
        const onAboutLink = (event: MouseEvent) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const anchor = (event.target as Element | null)?.closest?.("a[data-about-link]");
            if (!anchor) {
                if ((event.target as Element | null)?.closest?.('a[href="#home"], a[data-home-link]')) {
                    event.preventDefault();
                    scrollToHome();
                }
                return;
            }
            event.preventDefault();
            if (prepared || state.failed) {
                prepared = true;
                scrollToAbout();
                return;
            }
            jumpToAbout = true;
            beginPreparation();
        };
        // iPad browser chrome changes the visible height independently of layout.
        // Re-align a menu-selected About section after that change, but never
        // fight a deliberate wheel/touch/keyboard scroll back toward Home.
        const onViewportChange = () => {
            syncViewport();
            if (followAbout && !navigationFrame && !locked) alignAbout();
            else schedule();
        };
        const onScrollKey = (event: KeyboardEvent) => {
            if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
                && !(event.target as Element | null)?.closest?.("button, input, textarea, select, [contenteditable]")) {
                cancelNavigation();
            }
        };
        const observer = new ResizeObserver(onViewportChange);
        observer.observe(root);
        observer.observe(frame);
        observer.observe(about);
        const ingredients = root.querySelector<HTMLElement>("#ingredients");
        if (ingredients) observer.observe(ingredients);
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", onViewportChange, { passive: true });
        visual?.addEventListener("resize", onViewportChange, { passive: true });
        visual?.addEventListener("scroll", onViewportChange, { passive: true });
        window.addEventListener("keydown", onScrollKey);
        syncViewport();
        window.addEventListener("wheel", onWheel, { passive: false });
        window.addEventListener("touchstart", onTouchStart, { passive: true });
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        root.addEventListener("click", onAboutLink, true);
        motion.addEventListener("change", schedule);
        // The layout's early script clears reload anchors before hydration.
        // Pin once more before deriving the initial 3D scene from scroll position.
        const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
        if (navigation?.type === "reload" || (!navigation && performance.navigation?.type === 1)) {
            window.scrollTo({ top: 0, left: 0, behavior: "instant" });
        }
        update();
        return () => {
            unlock();
            state.preparing = false;
            state.onPrepared = undefined;
            cancelAnimationFrame(scheduled);
            cancelNavigation();
            observer.disconnect();
            window.removeEventListener("scroll", schedule);
            window.removeEventListener("resize", onViewportChange);
            visual?.removeEventListener("resize", onViewportChange);
            visual?.removeEventListener("scroll", onViewportChange);
            window.removeEventListener("keydown", onScrollKey);
            window.removeEventListener("wheel", onWheel);
            window.removeEventListener("touchstart", onTouchStart);
            window.removeEventListener("touchmove", onTouchMove);
            root.removeEventListener("click", onAboutLink, true);
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
                                     backgroundImage: `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/${flavor}.webp")`,
                                 }}
                            />
                        ))}
                    </div>
                </div>
                <AboutSection tileRef={tileRef} interactive={aboutInteractive} />
                <IngredientsSection tileRef={ingredientsRef} interactive={aboutInteractive} />
                <StoriesSection className={styles.emptySection} />
                <Footer />
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
