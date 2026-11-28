"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import StoriesSection from "./StoriesSection";
import Footer from "../../layout/Footer";
import ContactPanel from "../../layout/ContactPanel";
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

/* Temporarily disabled for the plain white hero preview.
// Uploaded background artwork is stored in public/backgrounds.
// Keep the existing grapefruit can until its replacement lychee artwork is supplied.
const imageBackgrounds = ["mango", "grape", "peach", "pomegranate", "lychee"] as const;

const backgroundFor = (name: string) => {
    const flavor = name.toLowerCase().split(" ")[0];
    return flavor === "grapefruit" ? "lychee" : flavor;
};
*/

interface ProductHeroProps {
    header: ReactNode;
}

const ProductHero = ({ header }: ProductHeroProps) => {
    // const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");
    // const activeBackground = backgroundFor(activeProduct);
    const [introPhase, setIntroPhase] = useState<IntroPhase>("lineup");
    const frameRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const tileRef = useRef<HTMLDivElement>(null);
    const ingredientsRef = useRef<HTMLDivElement>(null);
    const aboutState = useRef<AboutSceneState>({ progress: 0, target: null, ingredientsTarget: null, returnToMango: false, preparing: false, failed: false });
    const [aboutInteractive, setAboutInteractive] = useState(false);
    const [contactOpen, setContactOpen] = useState(false);
    const closeContact = useCallback(() => setContactOpen(false), []);
    useEffect(() => {
        const root = trackRef.current, frame = frameRef.current;
        if (!root || !frame) return;
        const about = root.querySelector<HTMLElement>("#about");
        const stories = root.querySelector<HTMLElement>("#section-four");
        const storiesPanel = root.querySelector<HTMLElement>("[data-stories-panel]");
        const storiesSlot = root.querySelector<HTMLElement>("[data-stories-slot]");
        if (!about || !stories || !storiesPanel || !storiesSlot) return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const state = aboutState.current;
        const html = document.documentElement;
        let scheduled = 0, navigationFrame = 0;
        let followSection: HTMLElement | null = null;
        let alignedScrollY: number | null = null;
        let pendingSection: HTMLElement | null = null;
        const visual = window.visualViewport;
        let locked = false, prepared = false, entered = false;
        let priorOverflow = "", priorGutter = "";
        let safetyTimer: ReturnType<typeof setTimeout> | undefined;
        let touchX = 0, touchY = 0;
        const contactVisible = () => Boolean(root.querySelector("dialog[data-contact-panel][open]"));
        let slide: Animation | null = null;
        let finishSlide: (() => void) | null = null;
        const top = () => window.scrollY + root.getBoundingClientRect().top;
        const aboutTop = () => window.scrollY + about.getBoundingClientRect().top;
        const visualTop = () => visual && Math.abs(visual.scale - 1) < .01 ? visual.offsetTop : 0;
        const aboutRemaining = () => about.getBoundingClientRect().top - visualTop();
        const sectionDestination = (section: HTMLElement) =>
            Math.max(0, Math.min(html.scrollHeight - html.clientHeight,
                window.scrollY + section.getBoundingClientRect().top - visualTop()));
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
        const alignSection = (section: HTMLElement) => {
            const target = sectionDestination(section);
            if (Math.abs(window.scrollY - target) > 1) {
                window.scrollTo({ top: target, behavior: "instant" });
            }
            alignedScrollY = window.scrollY;
            schedule();
        };
        const cancelNavigation = () => {
            if (navigationFrame) cancelAnimationFrame(navigationFrame);
            navigationFrame = 0;
            followSection = null;
            alignedScrollY = null;
        };
        const scrollToSection = (section: HTMLElement) => {
            cancelNavigation();
            followSection = section;
            syncViewport();
            const from = window.scrollY;
            if (motion.matches || Math.abs(from - sectionDestination(section)) <= 1) {
                alignSection(section);
                return;
            }
            const started = performance.now();
            const duration = 1450;
            const step = (now: number) => {
                const progress = Math.min(1, (now - started) / duration);
                // Read the live section position to account for responsive layout changes.
                const target = sectionDestination(section);
                window.scrollTo({
                    top: from + (target - from) * aboutNavigationEase(progress),
                    behavior: "instant",
                });
                schedule();
                if (progress < 1) navigationFrame = requestAnimationFrame(step);
                else {
                    navigationFrame = 0;
                    alignSection(section);
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
            if (pendingSection) {
                const section = pendingSection;
                pendingSection = null;
                scrollToSection(section);
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
            if (slide) return;
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
            if (contactVisible()) return;
            if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
            if ((event.target as Element | null)?.closest?.('nav[aria-label="Mobile navigation"]')) return;
            if (slide || locked) { if (event.cancelable) event.preventDefault(); return; }
            cancelNavigation();
            if (!prepared && event.deltaY > 0 && !state.failed) {
                event.preventDefault();
                beginPreparation();
            }
        };
        const onTouchStart = (event: TouchEvent) => {
            if (contactVisible()) return;
            if (event.touches.length !== 1) return;
            touchX = event.touches[0].clientX;
            touchY = event.touches[0].clientY;
            // A new touch relinquishes the previous menu alignment immediately,
            // including native gestures whose touchmove events Safari coalesces.
            if (!slide && !locked) cancelNavigation();
        };
        const onTouchMove = (event: TouchEvent) => {
            if (contactVisible()) return;
            if (event.touches.length !== 1) return;
            if ((event.target as Element | null)?.closest?.("[data-rotate-control], [data-rotating='true']")) return;
            if ((event.target as Element | null)?.closest?.('nav[aria-label="Mobile navigation"]')) return;
            const dy = touchY - event.touches[0].clientY;
            const dx = event.touches[0].clientX - touchX;
            if (slide || locked) { if (event.cancelable) event.preventDefault(); return; }
            if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx)) cancelNavigation();
            if (!prepared && !state.failed && dy > 8 && dy > Math.abs(dx)) {
                if (event.cancelable) event.preventDefault();
                beginPreparation();
            }
        };
        const scrollToHome = () => {
            cancelNavigation();
            pendingSection = null;
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
        // Direct Stories navigation uses the actual stories panel as a
        // sliding cover. Its slot preserves the document height while fixed.
        // On return, place the destination and its can behind the cover
        // before revealing it, rather than passing through Ingredients.
        const directStoriesSlide = (opening: boolean, returnTo: "home" | "about" = "home") => {
            finishSlide?.();
            cancelNavigation();
            pendingSection = null;
            if (locked) unlock();
            state.preparing = false;
            const panelRect = storiesPanel.getBoundingClientRect();
            const viewportHeight = Math.max(window.innerHeight, html.clientHeight);
            const startY = opening ? viewportHeight : panelRect.top;
            const endY = opening ? visualTop() : viewportHeight;
            storiesSlot.style.height = `${panelRect.height}px`;
            storiesPanel.style.setProperty("--stories-slide-width", `${panelRect.width}px`);
            storiesPanel.style.setProperty("--stories-slide-left", `${panelRect.left}px`);
            root.dataset.storiesDestination = opening ? "stories" : returnTo;
            root.dataset.storiesSlide = "true";
            storiesPanel.style.transform = `translate3d(0,${startY}px,0)`;

            const placeDestination = () => {
                const returningToAbout = returnTo === "about";
                prepared = returningToAbout;
                entered = returningToAbout;
                state.returnToMango = false;
                state.snapToProgress = true;
                publish(returningToAbout ? 1 : 0);
                if (returningToAbout) alignSection(about);
                else pinToHero();
            };
            if (!opening) placeDestination();

            const finish = () => {
                const animation = slide;
                slide = null;
                finishSlide = null;
                if (animation) {
                    animation.onfinish = null;
                    animation.cancel();
                }
                root.removeAttribute("data-stories-slide");
                storiesPanel.style.removeProperty("--stories-slide-width");
                storiesPanel.style.removeProperty("--stories-slide-left");
                storiesPanel.style.removeProperty("transform");
                storiesSlot.style.removeProperty("height");
                if (opening) {
                    prepared = true;
                    entered = true;
                    state.snapToProgress = true;
                    publish(1);
                    alignSection(stories);
                } else {
                    placeDestination();
                    if (returnTo === "about") followSection = about;
                }
                syncViewport();
                // Clear the navigation override only after the real panel
                // has returned to flow and the destination has been aligned.
                root.removeAttribute("data-stories-destination");
                schedule();
            };
            finishSlide = finish;
            if (motion.matches || typeof storiesPanel.animate !== "function") {
                finish();
                return;
            }
            slide = storiesPanel.animate([
                { transform: `translate3d(0,${startY}px,0)` },
                { transform: `translate3d(0,${endY}px,0)` },
            ], { duration: 650, easing: "cubic-bezier(.22,1,.36,1)", fill: "forwards" });
            slide.onfinish = finish;
        };
        const onAboutLink = (event: MouseEvent) => {
            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
            const target = event.target as Element | null;
            if (target?.closest?.("dialog[data-contact-panel]")) return;
            if (target?.closest?.('a[href="#contact"]')) {
                event.preventDefault();
                finishSlide?.();
                cancelNavigation();
                pendingSection = null;
                setContactOpen(true);
                return;
            }
            finishSlide?.();
            const anchor = target?.closest?.('a[data-about-link], a[href="#section-four"]');
            if (!anchor) {
                if ((event.target as Element | null)?.closest?.('a[href="#home"], a[data-home-link]')) {
                    event.preventDefault();
                    const midpoint = visualTop() + (visual?.height || window.innerHeight) / 2;
                    if (stories.getBoundingClientRect().top <= midpoint) directStoriesSlide(false);
                    else scrollToHome();
                }
                return;
            }
            const section = anchor.getAttribute("href") === "#section-four"
                ? stories : about;
            if (!section) return;
            event.preventDefault();
            const midpoint = visualTop() + (visual?.height || window.innerHeight) / 2;
            if (section === stories && about.getBoundingClientRect().top > midpoint) {
                directStoriesSlide(true);
                return;
            }
            if (section === about && stories.getBoundingClientRect().top <= midpoint) {
                directStoriesSlide(false, "about");
                return;
            }
            if (prepared || state.failed) {
                prepared = true;
                pendingSection = null;
                scrollToSection(section);
                return;
            }
            pendingSection = section;
            beginPreparation();
        };
        // Only correct an explicit menu arrival if the user is still there.
        // VisualViewport scroll events include Safari rubber-band offsets;
        // they must not resize sections or trigger another document scroll.
        const onDocumentScroll = () => {
            if (!navigationFrame && followSection && alignedScrollY !== null &&
                Math.abs(window.scrollY - alignedScrollY) > 4) {
                followSection = null;
                alignedScrollY = null;
            }
            schedule();
        };
        const onViewportChange = () => {
            if (slide) return;
            const stillAtArrival = alignedScrollY !== null &&
                Math.abs(window.scrollY - alignedScrollY) <= 4;
            // Do not recalculate the section dimensions during out-of-bounds
            // elastic scrolling on older Safari versions.
            const maxY = Math.max(0, html.scrollHeight - html.clientHeight);
            if (window.scrollY < -1 || window.scrollY > maxY + 1) {
                schedule();
                return;
            }
            syncViewport();
            if (followSection && !navigationFrame && !locked && stillAtArrival) {
                alignSection(followSection);
            } else schedule();
        };
        const onScrollKey = (event: KeyboardEvent) => {
            if (contactVisible()) return;
            if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "].includes(event.key)
                && !(event.target as Element | null)?.closest?.("button, input, textarea, select, [contenteditable]")) {
                if (slide) { event.preventDefault(); return; }
                cancelNavigation();
            }
        };
        const observer = new ResizeObserver(onViewportChange);
        observer.observe(root);
        observer.observe(frame);
        observer.observe(about);
        const ingredients = root.querySelector<HTMLElement>("#ingredients");
        if (ingredients) observer.observe(ingredients);
        window.addEventListener("scroll", onDocumentScroll, { passive: true });
        window.addEventListener("resize", onViewportChange, { passive: true });
        visual?.addEventListener("resize", onViewportChange, { passive: true });
        visual?.addEventListener("scroll", schedule, { passive: true });
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
            if (slide) {
                slide.onfinish = null;
                slide.cancel();
                slide = null;
            }
            finishSlide = null;
            root.removeAttribute("data-stories-slide");
            root.removeAttribute("data-stories-destination");
            storiesPanel.style.removeProperty("transform");
            storiesPanel.style.removeProperty("--stories-slide-width");
            storiesPanel.style.removeProperty("--stories-slide-left");
            storiesSlot.style.removeProperty("height");
            unlock();
            state.preparing = false;
            state.onPrepared = undefined;
            cancelAnimationFrame(scheduled);
            cancelNavigation();
            observer.disconnect();
            window.removeEventListener("scroll", onDocumentScroll);
            window.removeEventListener("resize", onViewportChange);
            visual?.removeEventListener("resize", onViewportChange);
            visual?.removeEventListener("scroll", schedule);
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
                    {/* Hero background preview: artwork and glass flutes disabled together.
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
                    */}
                </div>
                <AboutSection tileRef={tileRef} interactive={aboutInteractive} />
                <IngredientsSection tileRef={ingredientsRef} interactive={aboutInteractive} />
                <div data-stories-slot>
                    <div data-stories-panel className={styles.storiesPanel}>
                        <StoriesSection className={styles.emptySection} />
                        <Footer />
                    </div>
                </div>
            </main>
            <ProductCarousel
                onIntroPhase={setIntroPhase}
                onIntroProgress={syncIntroProgress}
                aboutState={aboutState}
                aboutInteractive={aboutInteractive}
            />
            <div className={styles.headerReveal} inert={introPhase !== "active"}>
                {header}
            </div>
            <ContactPanel open={contactOpen} onClose={closeContact} />
        </div>
    );
};

export default ProductHero;
