"use client";

import type { RefObject } from "react";
import styles from "./AboutSection.module.css";

interface AboutSectionProps {
    tileRef: RefObject<HTMLDivElement | null>;
    interactive: boolean;
    onMeetMango: () => void;
}

const AboutSection = ({ tileRef, interactive, onMeetMango }: AboutSectionProps) => (
    <section className={styles.section} aria-labelledby="about-title" inert={!interactive}>
        <div className={styles.inner}>
            <div className={styles.copy}>
                <span className={styles.eyebrow}>A little brighter by nature.</span>
                <h2 id="about-title" className={styles.title}>Melt into<br />something <em>brighter.</em></h2>
                <p className={styles.description}>Fruit-forward flavor, a playful pop of sparkle, and a little sunshine in every sip. Find your moment with Sunmelt.</p>
                <div className={styles.actions}>
                    <a className={styles.glassButton} href="#home">Explore flavors</a>
                    <button type="button" className={styles.whiteButton} onClick={onMeetMango}>Meet mango <span aria-hidden="true">↗</span></button>
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
