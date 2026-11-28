"use client";

import type { CSSProperties, RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
}

const Sparkle = ({ className, twoDots = false }: { className: string; twoDots?: boolean }) => (
    <svg className={className} viewBox="0 0 38 38" fill="currentColor" aria-hidden="true" focusable="false">
        {/* Clean, lightly tapered cross from the printed can label; the sketch only guides placement. */}
        <path d="M14.6 4 L16.15 18.1 L29.5 19.15 Q30.25 19.5 29.5 19.85 L16.15 20.9 L14.6 35 Q14.25 35.75 13.9 35 L12.85 20.9 L.5 19.85 Q-.25 19.5 .5 19.15 L12.85 18.1 L13.9 4 Q14.25 3.25 14.6 4 Z" />
        <circle cx="31.7" cy="10.5" r="1.7" />
        {twoDots && <circle cx="36.2" cy="4.8" r="1.05" />}
    </svg>
);

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.ribbon} aria-hidden="true"
             style={{ "--about-ribbon": `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/C36474C1-21B3-4870-B89D-90F5730E7CB6.png")` } as CSSProperties} />
        <div className={styles.inner}>
            <div className={styles.copy}>
                <Sparkle className={`${styles.sparkle} ${styles.sparkleTop}`} twoDots />
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
