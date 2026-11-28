"use client";

import type { CSSProperties, RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
}

const AboutSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="about" className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.inner}>
            <div className={styles.copy}>
                <h2 id="about-title" className={styles.title}>A taste of sunshine, melted into a brighter kind of soda.</h2>
                <p className={styles.description}>Mango Glow blends sparkling water and mango purée with yuzu and calendula extracts, cane sugar, live probiotic cultures (L. plantarum), and natural flavors.</p>
                <div className={styles.actions}>
                    <a className={styles.primaryButton} href="#home">Explore Flavors</a>
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

// Reuse the second section's actual glass tile treatment, not an image.
// Occupied cells follow the sketch; empty cells preserve an even pitch.
const iceClusters = [
    { side: "left", cells: [[2, 1], [1, 2], [1, 3], [3, 3], [2, 4], [4, 4], [1, 5], [3, 5]] },
    // Extend inward by one column while preserving the original right-aligned cells.
    { side: "right", cells: [[4, 1], [3, 2], [1, 2], [2, 3], [4, 3], [3, 4], [4, 4], [2, 5]] },
];

export const IngredientsSection = ({ tileRef, interactive }: AboutSectionProps) => (
    <section id="ingredients" className={styles.ingredientsSection} aria-labelledby="ingredients-title" inert={!interactive}>
        <div className={styles.ingredientsFrost} aria-hidden="true" />
        <div className={styles.scatteredIce} aria-hidden="true">
            {iceClusters.map(({ side, cells }) => (
                <div key={side} className={`${styles.iceCluster} ${side === "left" ? styles.iceClusterLeft : styles.iceClusterRight}`}>
                    {cells.map(([column, row]) => (
                        <div key={`${column}-${row}`} className={`${styles.tile} ${styles.scatteredCube}`}
                            style={{ gridColumn: column, gridRow: row } as CSSProperties} />
                    ))}
                </div>
            ))}
        </div>
        <div className={styles.ingredientsInner}>
            <div className={styles.ingredientsCopy}>
                <h2 id="ingredients-title" className={styles.title}>Rooted in nature.<br />Grown organically.</h2>
                <p className={styles.description}>From tropical mango orchards and yuzu groves to calendula fields and sugarcane farms, we choose only organically grown produce.</p>
                <div className={styles.actions}>
                    <a className={styles.primaryButton} href="#home">Explore Flavors</a>
                </div>
            </div>
            <div className={styles.ingredientsStage} aria-hidden="true">
                <div className={styles.ingredientsCanTarget} ref={tileRef} data-ingredients-artwork />
            </div>
        </div>
    </section>
);

export default AboutSection;
