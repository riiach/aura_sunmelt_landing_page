"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { mountCarousel } from "./product-carousel/carouselScene";
import styles from "./ProductCarousel.module.css";

export type IntroPhase = "lineup" | "spread" | "reveal" | "active";

export interface AboutSceneState {
    progress: number;
    target: HTMLDivElement | null;
    ingredientsTarget: HTMLDivElement | null;
    returnToMango: boolean;
    preparing: boolean;
    snapToProgress?: boolean;
    failed: boolean;
    onPrepared?: () => void;
}

interface ProductCarouselProps {
    aboutState?: RefObject<AboutSceneState>;
    aboutInteractive?: boolean;
    onProductChange?: (name: string) => void;
    onIntroPhase?: (phase: IntroPhase) => void;
    onIntroProgress?: (progress: number) => void;
}

const ProductCarousel = ({ onProductChange, onIntroPhase, onIntroProgress, aboutState, aboutInteractive }: ProductCarouselProps) => {
    const stageRef = useRef<HTMLDivElement>(null);
    const rotateRef = useRef<HTMLButtonElement>(null);
    const rightHintRef = useRef<HTMLButtonElement>(null);
    const leftHintRef = useRef<HTMLButtonElement>(null);
    const [ready, setReady] = useState(false);
    const [introPhase, setIntroPhase] = useState<IntroPhase>("lineup");
    const [error, setError] = useState("");
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        return mountCarousel(stage, {
            onReady: () => setReady(true),
            rotateControl: rotateRef.current,
            rightHint: rightHintRef.current,
            leftHint: leftHintRef.current,
            onIntroProgress,
            aboutState,
            onError: (message: string) => {
                setError(message);
                if (aboutState) {
                    aboutState.current.failed = true;
                    aboutState.current.preparing = false;
                    aboutState.current.onPrepared?.();
                }
                onIntroProgress?.(1);
                setIntroPhase("active");
                onIntroPhase?.("active");
            },
            onIntroPhase: (phase: IntroPhase) => {
                setIntroPhase(phase);
                onIntroPhase?.(phase);
            },
            onChange: (name: string) => {
                setActiveProduct(name);
                onProductChange?.(name);
            },
        });
    }, [onProductChange, onIntroPhase, onIntroProgress, aboutState]);

    return (
        <section aria-label="Sunmelt product carousel" className={styles.hero} data-carousel-phase={introPhase}>
            <div
                ref={stageRef}
                tabIndex={introPhase === "active" && !error && !aboutInteractive ? 0 : -1}
                role="group"
                aria-label="Drag or use the arrow keys to browse Sunmelt flavors"
                aria-busy={introPhase !== "active" && !error}
                className={styles.stage}
            />
            <button ref={rotateRef} type="button" className={styles.rotateControl}
                    data-rotate-control aria-label="Press and hold to rotate the selected can">
                <span className={styles.rotateDisc} aria-hidden="true">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none">
                        <path d="M20 11a8 8 0 1 0-2.3 5.7M20 5v6h-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className={styles.rotateLabel}>Press to<br />rotate</span>
                </span>
            </button>
            <button ref={rightHintRef} type="button" className={`${styles.swipeHint} ${styles.swipeHintRight}`}
                    aria-label="Show next flavor" disabled>
                <span className={styles.swipeDisc} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            <button ref={leftHintRef} type="button" className={`${styles.swipeHint} ${styles.swipeHintLeft}`}
                    aria-label="Show previous flavor" disabled>
                <span className={styles.swipeDisc} aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                        <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </span>
            </button>
            {!ready && !aboutInteractive && (
                <div className={styles.status}>
                    <p role="status">{error || "Loading Sunmelt flavors..."}</p>
                </div>
            )}
            <p className="sr-only" aria-live="polite">{introPhase === "active" && !error ? activeProduct : ""}</p>
        </section>
    );
};

export default ProductCarousel;
