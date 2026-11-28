"use client";

import type { CSSProperties, RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
}

const Sparkle = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 38 38" fill="currentColor" aria-hidden="true" focusable="false">
        <path d="M16 4 C16.8 17 18 18.2 32 20 C18 21.2 16.8 23 16 36 C15.2 23 14 21.2 0 20 C14 18.2 15.2 17 16 4 Z" />
        <circle cx="34" cy="3" r="2.8" />
    </svg>
);

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.ribbon} aria-hidden="true"
             style={{ "--about-ribbon": `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/about-ribbon.png")` } as CSSProperties} />
        <div className={styles.inner}>
            <div className={styles.copy}>
                <Sparkle className={`${styles.sparkle} ${styles.sparkleTop}`} />
                <h2 id="about-title" className={styles.title}>A taste of sunshine, melted into a brighter kind of soda.</h2>
                <p className={styles.description}>Mango Glow blends sparkling water and mango purée with yuzu and calendula extracts, cane sugar, live probiotic cultures (L. plantarum), and natural flavors.</p>
                <div className={styles.actions}>
                    <a className={styles.primaryButton} href="#home">Explore Flavors</a>
                    <Sparkle className={`${styles.sparkle} ${styles.sparkleBottom}`} />
                </div>
            </div>
            <div className={styles.artwork} ref={tileRef} aria-hidden="true">
                <div className={styles.glow} />
                <div className={styles.tiles}>
                    {Array.from({ length: 25 }, (_, i) => <div key={i} className={styles.tile} />)}
                </div>
            </div>
        </div>
    </section>
);

export default AboutSection;
