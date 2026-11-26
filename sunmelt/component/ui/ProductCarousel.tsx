"use client";

import { useEffect, useRef, useState } from "react";
import { mountCarousel } from "./product-carousel/carouselScene";
import styles from "./ProductCarousel.module.css";

const palettes = [
    { name: "Mango Glow", colors: ["#fff2ce", "#ffce76", "#f9a650"] },
    { name: "Peach Glow", colors: ["#fff3e9", "#f6c7ad", "#eea7a0"] },
    { name: "Grapefruit Fizz", colors: ["#fff1e8", "#f7b8aa", "#f48380"] },
    { name: "Pomegranate Aura", colors: ["#faedf1", "#eebacb", "#dc8eac"] },
    { name: "Grape Aura", colors: ["#f5effa", "#d9c9e9", "#bba4d7"] },
];

const ProductCarousel = () => {
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
            onChange: (name: string) => setActiveProduct(name),
        });
    }, []);

    return (
        <section aria-label="Sunmelt product carousel" className={styles.hero}>
            <div className={styles.backdrop} aria-hidden="true">
                {palettes.map(({ name, colors: [light, mid, deep] }) => (
                    <div key={name}
                         className={styles.gradient}
                         style={{
                             opacity: activeProduct === name ? 1 : 0,
                             background: `radial-gradient(ellipse at 48% 30%, ${light} 0%, transparent 63%), radial-gradient(ellipse at 12% 85%, ${mid}, transparent 62%), radial-gradient(ellipse at 94% 12%, ${deep}, transparent 68%), linear-gradient(135deg, ${light}, ${mid})`,
                         }}
                    />
                ))}
            </div>
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
                    <span className={styles.hint}>Drag to explore</span>
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
