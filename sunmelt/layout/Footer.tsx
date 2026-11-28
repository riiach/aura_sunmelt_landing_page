import Image from "next/image";
import auraLogo from "../public/aura_logo.png";
import styles from "./Footer.module.css";

const columns = [
    [
        { label: "Home", href: "#home" },
        { label: "About us", href: "#about" },
        { label: "Explore flavors", href: "#home" },
        { label: "Our ingredients", href: "#ingredients" },
    ],
    [
        { label: "Stories & articles", href: "#section-four" },
        { label: "Business inquiries", href: "#contact" },
        { label: "Sales", href: null },
        { label: "Contact us", href: "#contact" },
    ],
];

const SocialIcon = ({ name }: { name: "Instagram" | "Facebook" | "X" | "LinkedIn" }) => {
    if (name === "Instagram") return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5.5" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/><circle cx="17.5" cy="6.5" r="1.2" fill="currentColor"/></svg>;
    if (name === "Facebook") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="12" r="11.5"/><path fill="#f1f1ee" d="M13.4 22V13.2h2.95l.44-3.43H13.4V7.58c0-.99.27-1.66 1.7-1.66h1.8V2.85c-.31-.04-1.38-.13-2.62-.13-2.6 0-4.38 1.59-4.38 4.5v2.55H7v3.43h2.9V22z"/></svg>;
    if (name === "X") return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.3 3h3.1l-6.77 7.74L21.6 21h-6.25l-4.9-6.4L4.85 21H1.7l7.24-8.27L1.3 3h6.4l4.43 5.86L17.3 3Zm-1.1 16.2h1.72L6.77 4.7H4.92z"/></svg>;
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="22" height="22" rx="3.4"/><path transform="translate(-.65 0)" fill="#f1f1ee" d="M6 9h3v10H6zm1.5-4.1a1.7 1.7 0 1 1 0 3.4 1.7 1.7 0 0 1 0-3.4zM11 9h2.9v1.4h.04A3.2 3.2 0 0 1 16.8 8.8c3 0 3.5 2 3.5 4.5V19h-3v-5c0-1.2-.03-2.7-1.65-2.7-1.65 0-1.65 1.45-1.65 2.6V19h-3z"/></svg>;
};

const Footer = () => (
    <footer id="footer" className={styles.footer} role="contentinfo">
        <div className={styles.inner}>
            <div className={styles.top}>
                <div className={styles.identity}>
                    <a href="#home" className={styles.brand} aria-label="Aura x Sunmelt home">
                        <span className={styles.logoCrop}><Image src={auraLogo} alt="" className={styles.logo}/></span>
                        <span className={styles.cross} aria-hidden="true">×</span>
                        <span className={styles.wordmark}>sunmelt</span>
                    </a>
                    <p>A taste of sunshine, melted into a brighter kind of soda.</p>
                    <div className={styles.socials} aria-label="Social media profiles pending">
                        {(["Facebook", "X", "Instagram", "LinkedIn"] as const).map(name => (
                            <span key={name} className={styles.social} role="img" aria-label={name + " (not yet linked)"} title={name + " — link coming soon"}>
                                <SocialIcon name={name}/>
                            </span>
                        ))}
                    </div>
                </div>
                <nav className={styles.navigation} aria-label="Footer navigation">
                    {columns.map((column, index) => (
                        <div key={index} className={styles.column}>
                            {column.map(item => item.href ? <a key={item.label} href={item.href} data-about-link={item.href === "#about" ? "" : undefined}>{item.label}</a> : <span key={item.label} aria-disabled="true">{item.label}</span>)}
                        </div>
                    ))}
                </nav>
            </div>
            <div className={styles.bottom}>
                <p>© 2026 Sunmelt. All rights reserved.</p>
                <div className={styles.legal} aria-label="Legal pages pending">
                    <span>Terms</span><span>Privacy</span><span>Cookies</span>
                </div>
            </div>
        </div>
    </footer>
);

export default Footer;
