"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import styles from "./StoriesSection.module.css";
import ArticlePanel from "./ArticlePanel";
import { stories, storyImage, type Story } from "./stories";

const StoriesSection = ({ className }: { className?: string }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const moveRef = useRef<(direction: -1 | 1) => void>(() => {});
    const cancelSnapRef = useRef<() => void>(() => {});
    const [edges, setEdges] = useState({ start: true, end: false });
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [articleOpen, setArticleOpen] = useState(false);
    useEffect(() => {
        const slug = new URLSearchParams(window.location.search).get("story");
        const story = stories.find(item => item.slug === slug);
        if (story) { setSelectedStory(story); setArticleOpen(true); }
    }, []);
    const closeArticle = () => {
        setArticleOpen(false);
        const url = new URL(window.location.href);
        if (url.searchParams.has("story")) {
            url.searchParams.delete("story");
            window.history.replaceState(window.history.state, "", url);
        }
    };

    useEffect(() => {
        const rail = railRef.current;
        if (!rail) return;
        const update = () => {
            const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
            const position = Math.min(maxScroll, Math.max(0, rail.scrollLeft));
            const start = position <= 2;
            const end = maxScroll - position <= 2;
            const indicator = indicatorRef.current;
            if (indicator) {
                const fraction = rail.scrollWidth > 0 ? Math.min(1, rail.clientWidth / rail.scrollWidth) : 1;
                const progress = maxScroll > 0 ? position / maxScroll : 0;
                indicator.style.setProperty("--indicator-width", `${fraction * 100}%`);
                indicator.style.setProperty("--indicator-offset", `${progress * (1 - fraction) * 100}%`);
                indicator.hidden = maxScroll <= 2;
            }
            setEdges(previous => previous.start === start && previous.end === end ? previous : { start, end });
        };
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let tween: gsap.core.Tween | null = null;
        let timer: ReturnType<typeof setTimeout> | undefined;
        let destination: number | null = null;
        let touching = false;
        const snapPoints = () => {
            const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
            const cards = Array.from(rail.children);
            const first = cards[0]?.getBoundingClientRect().left ?? 0;
            return [...new Set([0, ...cards.map(card =>
                Math.max(0, Math.min(max, card.getBoundingClientRect().left - first))), max])].sort((a, b) => a - b);
        };
        const clearTimer = () => { clearTimeout(timer); timer = undefined; };
        const cancelSnap = () => {
            clearTimer();
            tween?.kill();
            tween = null;
            destination = null;
        };
        const nearest = (points: number[], position: number) =>
            points.reduce((best, point) => Math.abs(point - position) < Math.abs(best - position) ? point : best, points[0]);
        const snapTo = (target: number) => {
            cancelSnap();
            const from = rail.scrollLeft;
            if (Math.abs(from - target) <= 1 || reduced.matches) {
                rail.scrollLeft = target;
                update();
                return;
            }
            destination = target;
            // Animate the native scroll offset; do not fight CSS snap or
            // intercept vertical page scrolling / native touch momentum.
            const proxy = { x: from };
            tween = gsap.to(proxy, {
                x: target,
                duration: .48,
                ease: "power3.out",
                onUpdate: () => {
                    rail.scrollLeft = proxy.x;
                    update();
                },
                onComplete: () => {
                    rail.scrollLeft = target;
                    tween = null;
                    destination = null;
                    update();
                },
            });
        };
        const settle = () => {
            clearTimer();
            if (touching || tween || document.querySelector("dialog[open]")) return;
            const target = nearest(snapPoints(), rail.scrollLeft);
            if (Math.abs(target - rail.scrollLeft) > 1) snapTo(target);
        };
        const queueSnap = () => {
            clearTimer();
            if (!touching && !tween) timer = setTimeout(settle, 180);
        };
        const onScroll = () => {
            update();
            if (!tween) queueSnap();
        };
        const onTouchStart = () => { touching = true; cancelSnap(); };
        const onTouchEnd = (event: TouchEvent) => {
            touching = event.touches.length > 0;
            if (!touching) queueSnap();
        };
        const onScrollEnd = () => { if (!touching && !tween) settle(); };
        moveRef.current = direction => {
            const points = snapPoints();
            const position = destination ?? rail.scrollLeft;
            const target = direction === 1
                ? points.find(point => point > position + 2) ?? points[points.length - 1]
                : [...points].reverse().find(point => point < position - 2) ?? points[0];
            snapTo(target);
        };
        cancelSnapRef.current = cancelSnap;
        const observer = new ResizeObserver(() => { cancelSnap(); update(); });
        observer.observe(rail);
        if (rail.firstElementChild) observer.observe(rail.firstElementChild);
        rail.addEventListener("scroll", onScroll, { passive: true });
        rail.addEventListener("scrollend", onScrollEnd);
        rail.addEventListener("wheel", cancelSnap, { passive: true });
        rail.addEventListener("pointerdown", cancelSnap, { passive: true });
        rail.addEventListener("touchstart", onTouchStart, { passive: true });
        rail.addEventListener("touchend", onTouchEnd, { passive: true });
        rail.addEventListener("touchcancel", onTouchEnd, { passive: true });
        update();
        return () => {
            cancelSnap();
            moveRef.current = () => {};
            cancelSnapRef.current = () => {};
            observer.disconnect();
            rail.removeEventListener("scroll", onScroll);
            rail.removeEventListener("scrollend", onScrollEnd);
            rail.removeEventListener("wheel", cancelSnap);
            rail.removeEventListener("pointerdown", cancelSnap);
            rail.removeEventListener("touchstart", onTouchStart);
            rail.removeEventListener("touchend", onTouchEnd);
            rail.removeEventListener("touchcancel", onTouchEnd);
        };
    }, []);

    const move = (direction: -1 | 1) => moveRef.current(direction);

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return (
        <>
        <section id="section-four" className={`${className || ""} ${styles.stories}`} aria-labelledby="stories-title">
            <div className={styles.heading}>
                <h2 id="stories-title">Stories &amp; Articles</h2>
                <div className={styles.controls}>
                    {([-1, 1] as const).map(direction => (
                        <button key={direction} type="button"
                            className={styles.arrow}
                            aria-label={direction === -1 ? "Previous story" : "Next story"}
                            aria-controls="stories-rail"
                            disabled={direction === -1 ? edges.start : edges.end}
                            onClick={() => move(direction)}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                <path d={direction === -1 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}
                                    stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    ))}
                </div>
            </div>
            <div id="stories-rail" ref={railRef} className={styles.rail}
                tabIndex={-1} role="region" aria-label="Sunmelt editorial stories">
                {stories.map(story => (
                    <a key={story.slug} className={styles.story}
                        href={`?story=${story.slug}`}
                        aria-haspopup="dialog"
                        onClick={event => {
                            if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                            event.preventDefault();
                            cancelSnapRef.current();
                            setSelectedStory(story);
                            setArticleOpen(true);
                        }}
                        style={{
                            backgroundImage: `url("${storyImage(story, 900)}"), url("${base}/backgrounds/${story.fallback}.webp")`,
                            backgroundPosition: story.position,
                        }}>
                        <span className={styles.storyCopy}>
                            <span className={styles.category}>{story.category}</span>
                            <span className={styles.storyTitle}>{story.title}</span>
                        </span>
                    </a>
                ))}
            </div>
            <div ref={indicatorRef} className={styles.indicator} aria-hidden="true">
                <span className={styles.indicatorThumb} />
            </div>
        </section>
        <ArticlePanel story={selectedStory} open={articleOpen} onClose={closeArticle} />
        </>
    );
};

export default StoriesSection;
