"use client";

import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { mountCarousel } from "./product-carousel/carouselScene";
import styles from "./ProductCarousel.module.css";

export type IntroPhase = "lineup" | "spread" | "reveal" | "active";

export interface AboutSceneState {
    progress: number;
    target: HTMLDivElement | null;
    returnToMango: boolean;
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
    const [ready, setReady] = useState(false);
    const [introPhase, setIntroPhase] = useState<IntroPhase>("lineup");
    const [error, setError] = useState("");
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        return mountCarousel(stage, {
            onReady: () => setReady(true),
            onIntroProgress,
            aboutState,
            onError: (message: string) => {
                setError(message);
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
