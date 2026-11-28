"use client";

import { useEffect, useRef, useState } from "react";
import { lockPageScroll } from "./lockPageScroll";
import { storyImage, type Story } from "./stories";
import styles from "./ArticlePanel.module.css";

export default function ArticlePanel({ story, open, onClose }: { story: Story | null; open: boolean; onClose: () => void }) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const releaseScroll = useRef<(() => void) | null>(null);
    useEffect(() => () => { releaseScroll.current?.(); releaseScroll.current = null; }, []);
    const [shareStatus, setShareStatus] = useState("");
    useEffect(() => {
        const dialog = ref.current;
        if (!dialog) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let animation: Animation | undefined;
        const closeDialog = () => {
            dialog.close();
            releaseScroll.current?.();
            releaseScroll.current = null;
        };
        if (open && story) {
            if (!dialog.open) {
                releaseScroll.current ??= lockPageScroll();
                dialog.showModal();
                dialog.scrollTop = 0;
                // Keep initial focus within the reader without outlining Go back.
                titleRef.current?.focus({ preventScroll: true });
            }
            if (!reduced) animation = dialog.animate(
                [{ transform: "translateY(100%)" }, { transform: "translateY(0)" }],
                { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" }
            );
        } else if (dialog.open) {
            if (reduced || typeof dialog.animate !== "function") closeDialog();
            else {
                animation = dialog.animate([{ transform: "translateY(0)" }, { transform: "translateY(100%)" }],
                    { duration: 420, easing: "cubic-bezier(.4,0,.8,1)", fill: "forwards" });
                animation.onfinish = () => { closeDialog(); animation?.cancel(); };
            }
        }
        return () => {
            if (animation) { animation.onfinish = null; animation.cancel(); }
        };
    }, [open, story]);

    const share = async () => {
        if (!story) return;
        const url = new URL(window.location.href);
        url.hash = "";
        url.searchParams.set("story", story.slug);
        setShareStatus("");
        if (navigator.share) {
            try { await navigator.share({ title: story.title, url: url.href }); return; }
            catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
        }
        try {
            await navigator.clipboard.writeText(url.href);
            setShareStatus("Link copied.");
        } catch {
            setShareStatus(url.href);
        }
    };
    return (
        <dialog ref={ref} data-article-panel className={styles.panel} aria-labelledby="article-title"
            onCancel={event => { event.preventDefault(); onClose(); }}
            onClose={() => setShareStatus("")}>
            {story && <article className={styles.article}>
                <div className={styles.toolbar}>
                    <button type="button" className={styles.action} onClick={onClose}>
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Go back
                    </button>
                    <button type="button" className={styles.action} onClick={share}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 15V3m-4 4 4-4 4 4M5 12v8h14v-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> Share
                    </button>
                </div>
                {shareStatus && <p className={styles.shareStatus} role="status">{shareStatus}</p>}
                <h1 ref={titleRef} tabIndex={-1} id="article-title">{story.title}</h1>
                <div className={styles.meta}>{story.category} · Sunmelt{story.draft && " · Preview"}</div>
                <div className={styles.cover} role="img" aria-label="Illustrative editorial photograph"
                    style={{ backgroundImage: `url("${storyImage(story)}"), url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/${story.fallback}.webp")` }} />
                <div className={styles.body}>
                    <p>{story.intro}</p>
                    {story.sections.map(section => <section key={section.heading}><h2>{section.heading}</h2><p>{section.text}</p></section>)}
                </div>
            </article>}
        </dialog>
    );
}
