"use client";

import { useEffect, useRef, useState } from "react";
import { mountCarousel } from "./product-carousel/carouselScene";
import styles from "./ProductCarousel.module.css";

interface ProductCarouselProps {
    onProductChange?: (name: string) => void;
}

const ProductCarousel = ({ onProductChange }: ProductCarouselProps) => {
    const stageRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        return mountCarousel(stage, {
            onReady: () => setReady(true),
            onError: (message: string) => setError(message),
            onChange: (name: string) => {
                setActiveProduct(name);
                onProductChange?.(name);
            },
        });
    }, [onProductChange]);

    return (
        <section aria-label="Sunmelt product carousel" className={styles.hero}>
            <div className={styles.wordmark} aria-hidden="true">sunmelt.</div>
            <div
                ref={stageRef}
                tabIndex={0}
                role="group"
                aria-label="Drag or use the arrow keys to browse Sunmelt flavors"
                aria-busy={!ready && !error}
                className={styles.stage}
            />
            {ready && (
                <div className={styles.caption} aria-hidden="true">
                    <span className={styles.flavor}>{activeProduct}</span>
                </div>
            )}
            {!ready && (
                <div className={styles.status}>
                    <p role="status">{error || "Loading Sunmelt flavors..."}</p>
                </div>
            )}
            <p className="sr-only" aria-live="polite">{activeProduct}</p>
        </section>
    );
};

export default ProductCarousel;
