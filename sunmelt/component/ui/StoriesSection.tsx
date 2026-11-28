"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StoriesSection.module.css";

// Editorial concepts only: replace placeholder photography and copy with
// approved interviews and verified sales figures before publishing case studies.
const stories = [
    {
        category: "Sunmelt Journal",
        title: "A brighter kind of soda",
        photo: "photo-1544145945-f90425340c7e",
        fallback: "mango",
        position: "50% 50%",
    },
    {
        category: "Founder Stories",
        title: "Behind the counter: a chicken shop owner's story",
        photo: "photo-1517248135467-4c7edcad34c4",
        fallback: "peach",
        position: "50% 50%",
    },
    {
        category: "Business Stories",
        title: "Growing sales with Sunmelt on the menu",
        photo: "photo-1562967914-608f82629710",
        fallback: "pomegranate",
        position: "50% 50%",
    },
    {
        category: "Food & Drink",
        title: "A little sunshine with every bite",
        photo: "photo-1552566626-52f8b828add9",
        fallback: "lychee",
        position: "50% 50%",
    },
    {
        category: "Sunmelt Journal",
        title: "From nature to your glass",
        photo: "photo-1546069901-ba9599a7e63c",
        fallback: "grape",
        position: "50% 50%",
    },
];

const StoriesSection = ({ className }: { className?: string }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: true, end: false });

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
        const observer = new ResizeObserver(update);
        observer.observe(rail);
        if (rail.firstElementChild) observer.observe(rail.firstElementChild);
        rail.addEventListener("scroll", update, { passive: true });
        update();
        return () => {
            observer.disconnect();
            rail.removeEventListener("scroll", update);
        };
    }, []);

    const move = (direction: -1 | 1) => {
        const rail = railRef.current;
        if (!rail || !rail.firstElementChild) return;
        const card = rail.firstElementChild as HTMLElement;
        const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
        const step = card.offsetWidth + gap;
        const next = (Math.round(rail.scrollLeft / step) + direction) * step;
        rail.scrollTo({
            left: Math.max(0, Math.min(next, rail.scrollWidth - rail.clientWidth)),
            behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        });
    };

    const base = process.env.NEXT_PUBLIC_BASE_PATH || "";
    return (
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
                tabIndex={0} role="region" aria-label="Sunmelt editorial stories">
                {stories.map(story => (
                    <article key={story.title} className={styles.story}
                        style={{
                            backgroundImage: `url("https://images.unsplash.com/${story.photo}?auto=format&fit=crop&w=900&q=80"), url("${base}/backgrounds/${story.fallback}.webp")`,
                            backgroundPosition: story.position,
                        }}>
                        <div className={styles.storyCopy}>
                            <span className={styles.category}>{story.category}</span>
                            <h3>{story.title}</h3>
                        </div>
                    </article>
                ))}
            </div>
            <div ref={indicatorRef} className={styles.indicator} aria-hidden="true">
                <span className={styles.indicatorThumb} />
            </div>
        </section>
    );
};

export default StoriesSection;
