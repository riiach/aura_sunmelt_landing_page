"use client";

import type { CSSProperties, RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
}

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.ribbon} aria-hidden="true"
             style={{ "--about-ribbon": `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/about-ribbon.png")` } as CSSProperties} />
        <div className={styles.inner}>
            <div className={styles.copy}>
                <h2 id="about-title" className={styles.title}>A taste of sunshine, melted into a brighter kind of soda.</h2>
                <p className={styles.description}>Mango Glow blends sparkling water and mango purée with yuzu and calendula extracts, cane sugar, live probiotic cultures (L. plantarum), and natural flavors.</p>
                <div className={styles.actions}>
                    <a className={styles.primaryButton} href="#home">Explore Flavors</a>
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
