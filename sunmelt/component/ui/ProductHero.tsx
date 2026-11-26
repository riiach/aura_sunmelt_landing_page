"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import ProductCarousel from "./ProductCarousel";
import styles from "./ProductCarousel.module.css";

const palettes = [
    { name: "Mango Glow", colors: ["#fff2ce", "#ffce76", "#90501b"] },
    { name: "Peach Glow", colors: ["#fff3e9", "#f6c7ad", "#95534f"] },
    { name: "Grapefruit Fizz", colors: ["#fff1e8", "#f7b8aa", "#a04542"] },
    { name: "Pomegranate Aura", colors: ["#faedf1", "#eebacb", "#8b3658"] },
    { name: "Grape Aura", colors: ["#f5effa", "#d9c9e9", "#6d4b89"] },
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
                             background: `linear-gradient(to bottom, ${deep} 0%, transparent 30%, transparent 58%, #ffffff 100%), radial-gradient(ellipse at 20% 38%, ${light} 0%, transparent 55%), radial-gradient(ellipse at 86% 32%, ${mid} 0%, transparent 60%), linear-gradient(to bottom, ${deep} 0%, ${mid} 42%, ${light} 72%, #ffffff 100%)`,
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
