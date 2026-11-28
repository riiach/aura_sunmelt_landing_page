"use client";

import { useEffect, useRef, useState } from "react";
import { lockPageScroll } from "../component/ui/lockPageScroll";
import type { FormEvent } from "react";
import Image from "next/image";
import auraLogo from "../public/aura_logo.png";
import footer from "./Footer.module.css";
import styles from "./ContactPanel.module.css";

interface ContactPanelProps {
    open: boolean;
    onClose: () => void;
}

const ContactPanel = ({ open, onClose }: ContactPanelProps) => {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const titleRef = useRef<HTMLHeadingElement>(null);
    const releaseScroll = useRef<(() => void) | null>(null);
    useEffect(() => () => { releaseScroll.current?.(); releaseScroll.current = null; }, []);
    const [status, setStatus] = useState("");
    const [sending, setSending] = useState(false);
    const endpoint = process.env.NEXT_PUBLIC_CONTACT_FORM_ENDPOINT;

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let animation: Animation | undefined;
        const closeDialog = () => {
            dialog.close();
            releaseScroll.current?.();
            releaseScroll.current = null;
        };
        if (open) {
            const wasOpen = dialog.open;
            if (!wasOpen) {
                releaseScroll.current ??= lockPageScroll();
                dialog.showModal();
            }
            const from = wasOpen ? getComputedStyle(dialog).transform : "translateY(100%)";
            // Focus the heading, not the Close control, when opening the dialog.
            if (!wasOpen) titleRef.current?.focus({ preventScroll: true });
            if (!reduced && typeof dialog.animate === "function") {
                animation = dialog.animate(
                    [{ transform: from }, { transform: "translateY(0)" }],
                    { duration: 600, easing: "cubic-bezier(.22,1,.36,1)" },
                );
            }
        } else if (dialog.open) {
            if (reduced || typeof dialog.animate !== "function") {
                closeDialog();
            } else {
                animation = dialog.animate(
                    [{ transform: getComputedStyle(dialog).transform }, { transform: "translateY(100%)" }],
                    { duration: 420, easing: "cubic-bezier(.4,0,.8,1)", fill: "forwards" },
                );
                animation.onfinish = () => {
                    closeDialog();
                    animation?.cancel();
                };
            }
        }
        return () => {
            if (animation) {
                animation.onfinish = null;
                animation.cancel();
            }
        };
    }, [open]);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (sending) return;
        const form = event.currentTarget;
        if (!endpoint) {
            setStatus("Online inquiries are not available yet. Your message has not been sent.");
            return;
        }
        const data = Object.fromEntries(new FormData(form));
        setSending(true);
        setStatus("");
        try {
            const result = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json", Accept: "application/json" },
                body: JSON.stringify(data),
            });
            if (!result.ok) throw new Error("Message was not accepted");
            form.reset();
            setStatus("Thank you. Your message has been sent.");
        } catch {
            setStatus("We couldn't send your message. Please try again.");
        } finally {
            setSending(false);
        }
    };

    return (
        <dialog id="contact" data-contact-panel ref={dialogRef} className={styles.panel}
            aria-labelledby="contact-title"
            onCancel={event => { event.preventDefault(); onClose(); }}>
            <div className={styles.page}>
                <div className={styles.top}>
                    <div className={footer.brand} aria-label="Aura x Sunmelt">
                        <span className={footer.logoCrop}><Image src={auraLogo} alt="" className={footer.logo} /></span>
                        <span className={footer.cross} aria-hidden="true">×</span>
                        <span className={footer.wordmark}>sunmelt</span>
                    </div>
                    <button type="button" onClick={onClose} className={styles.close} aria-label="Close contact">
                        <span>Close</span>
                        <svg viewBox="0 0 24 24" width="19" height="19" fill="none" aria-hidden="true">
                            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    </button>
                </div>
                <div className={styles.content}>
                    <div className={styles.intro}>
                        <h2 ref={titleRef} tabIndex={-1} id="contact-title">Get in touch.</h2>
                        <p>Have a question about Sunmelt, or interested in working with us? We’d love to hear from you.</p>
                    </div>
                    <form className={styles.form} onSubmit={submit}>
                        <div className={styles.fields}>
                            <label className={styles.field}>
                                <span>Your name</span>
                                <input name="name" autoComplete="name" placeholder="Full name" required maxLength={120} />
                            </label>
                            <label className={styles.field}>
                                <span>Email address</span>
                                <input name="email" type="email" autoComplete="email" placeholder="Your email" required maxLength={254} />
                            </label>
                        </div>
                        <label className={styles.field}>
                            <span>Message</span>
                            <textarea name="message" placeholder="Tell us how we can help." required rows={6} maxLength={5000} />
                        </label>
                        <button className={styles.submit} type="submit" disabled={sending}>
                            {sending ? "Sending…" : "Send message"}
                            <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden="true">
                                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <p className={styles.status} role="status" aria-live="polite">{status}</p>
                    </form>
                </div>
                <div className={styles.bottom}>© 2026 Sunmelt. All rights reserved.</div>
            </div>
        </dialog>
    );
};

export default ContactPanel;
