"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import styles from "./ProductCarousel.module.css";

const palettes = [
    { name: "Mango Glow", colors: ["#fff2ce", "#ffce76", "#f9a650"] },
    { name: "Peach Glow", colors: ["#fff3e9", "#f6c7ad", "#eea7a0"] },
    { name: "Grapefruit Fizz", colors: ["#fff1e8", "#f7b8aa", "#f48380"] },
    { name: "Pomegranate Aura", colors: ["#faedf1", "#eebacb", "#dc8eac"] },
    { name: "Grape Aura", colors: ["#f5effa", "#d9c9e9", "#bba4d7"] },
];

interface ProductHeroProps {
    header: ReactNode;
}

const ProductHero = ({ header }: ProductHeroProps) => {
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");

    return (
        <div className={styles.frame}>
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
            {header}
            <main className="w-full">
                <ProductCarousel onProductChange={setActiveProduct} />
            </main>
        </div>
    );
};

export default ProductHero;
