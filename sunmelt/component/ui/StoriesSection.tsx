"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StoriesSection.module.css";
import ArticlePanel from "./ArticlePanel";
import { stories, storyImage, type Story } from "./stories";

const StoriesSection = ({ className }: { className?: string }) => {
    const railRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
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
