"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import type { IntroPhase } from "./ProductCarousel";
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

interface ProductHeroProps {
    header: ReactNode;
}

const ProductHero = ({ header }: ProductHeroProps) => {
    // const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");
    const [introPhase, setIntroPhase] = useState<IntroPhase>("lineup");

    return (
        <div className={styles.frame} data-intro-phase={introPhase}>
            {/* <div className={styles.backdrop} aria-hidden="true">
                {palettes.map(({ name, colors: [mid, deep] }) => (
                    <div key={name}
                         className={styles.gradient}
                         style={{
                             opacity: activeProduct === name ? 1 : 0,
                             background: `radial-gradient(ellipse var(--curve-rx) var(--curve-ry) at 50% var(--curve-center-y), ${deep} 0%, ${deep} 94%, ${mid} 110%, transparent 119%), linear-gradient(to bottom, ${mid} 0%, ${mid} 28%, #ffffff 100%)`,
                         }}
                    />
                ))}
            </div> */}
            <div className={styles.headerReveal} inert={introPhase === "lineup" || introPhase === "spread"}>
                {header}
            </div>
            <main className="w-full">
                <ProductCarousel
                    // onProductChange={setActiveProduct}
                    onIntroPhase={setIntroPhase}
                />
            </main>
        </div>
    );
};

export default ProductHero;
