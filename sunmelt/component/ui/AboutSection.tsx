"use client";

import type { CSSProperties, RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
}

const Sparkle = ({ className }: { className: string }) => (
    <svg className={className} viewBox="0 0 38 38" fill="currentColor" aria-hidden="true" focusable="false">
        {/* Match the can label's slim, softly tapered four-arm mark and two dots. */}
        <path d="M12.8 5.5 C14.1 5.3 14.6 7.1 14.6 9.3 L15.2 18.3 L24.7 19.1 C27 19.3 28.2 19.8 28.1 20.8 C28 21.8 26.5 22.2 24.2 22.1 L15.1 21.9 L14.3 32.4 C14.1 34.6 13.5 35.5 12.6 35.4 C11.6 35.3 11.4 34 11.5 31.7 L11.8 21.8 L3.3 21.3 C1.1 21.2 .4 20.6 .6 19.7 C.7 18.9 2 18.5 4.1 18.6 L11.9 18.7 L11.5 9.1 C11.4 6.9 11.8 5.7 12.8 5.5 Z" />
        <ellipse cx="30.4" cy="13.2" rx="2.25" ry="2.05" transform="rotate(-18 30.4 13.2)" />
        <circle cx="36" cy="6.8" r="1.35" />
    </svg>
);

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.ribbon} aria-hidden="true"
             style={{ "--about-ribbon": `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/C36474C1-21B3-4870-B89D-90F5730E7CB6.png")` } as CSSProperties} />
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
