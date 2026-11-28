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
        <path d="M14.5 3.8 C15.15 3.8 15.45 4.3 15.5 5.1 L16.05 16.3 Q16.12 17.95 17.85 18.03 L28.7 18.55 Q30.05 18.63 30.05 19.5 Q30.05 20.37 28.7 20.45 L17.85 20.97 Q16.12 21.05 16.05 22.7 L15.5 33.9 Q15.45 35.2 14.5 35.2 Q13.55 35.2 13.5 33.9 L12.95 22.7 Q12.88 21.05 11.15 20.97 L1.35 20.45 Q.05 20.37 .05 19.5 Q.05 18.63 1.35 18.55 L11.15 18.03 Q12.88 17.95 12.95 16.3 L13.5 5.1 C13.55 4.3 13.85 3.8 14.5 3.8 Z" />
        <circle cx="31.7" cy="10.5" r="1.7" />
        {twoDots && <circle cx="36.2" cy="4.8" r="1.05" />}
    </svg>
);

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}
             style={{ "--about-ribbon": `url("${process.env.NEXT_PUBLIC_BASE_PATH || ""}/backgrounds/C36474C1-21B3-4870-B89D-90F5730E7CB6.png")` } as CSSProperties}>
        <div className={styles.ribbon} aria-hidden="true" />
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
            <div className={styles.artworkSlot} aria-hidden="true">
                <div className={styles.artwork} ref={tileRef} data-about-artwork>
                    <div className={styles.glow} />
                    <div className={styles.tiles}>
                        {Array.from({ length: 25 }, (_, i) => <div key={i} className={styles.tile} />)}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

export default AboutSection;
