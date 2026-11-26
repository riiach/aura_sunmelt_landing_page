"use client";

import { useState } from "react";
import type { ReactNode, MouseEvent } from "react";

interface WaterTextProps {
    children: ReactNode;
}

const WaterText = ({ children }: WaterTextProps) => {
    const [hovered, setHovered] = useState(false);

    // Animation Settings
    const settings = {
        firstWaveDuration: 350,
        secondWaveDuration: 450,

        fizzCount: 7,
        fizzDuration: 250,
        fizzDelay: 400,
        fizzInterval: 15,
        fizzHeight: 12,
        fizzTop: "20%",

        firstColor: "#F89862",
        secondColor: "#D2C6D4",
    };

    const handleMouseEnter = (
        e: MouseEvent<HTMLSpanElement>
    ) => {
        setHovered(true);

        if (
            window.matchMedia(
                "(prefers-reduced-motion: reduce)"
            ).matches
        ) {
            return;
        }

        const bubbles =
            e.currentTarget.querySelectorAll("[data-bubble]");

        bubbles.forEach((bubble, i) => {
            bubble.getAnimations().forEach(a => a.cancel());

            bubble.animate(
                [
                    {
                        opacity: 0,
                        transform: "translate(0, 0) scale(0.3)",
                    },
                    {
                        opacity: 1,
                        transform: "translate(0, -3px) scale(1)",
                        offset: 0.2,
                    },
                    {
                        opacity: 0.8,
                        transform: `
                            translate(
                                ${(i % 3 - 1) * 5}px,
                                -${settings.fizzHeight * 0.65}px
                            ) scale(1.1)
                        `,
                        offset: 0.7,
                    },
                    {
                        opacity: 0,
                        transform: `
                            translate(
                                ${(i % 3 - 1) * 8}px,
                                -${settings.fizzHeight}px
                            ) scale(0.5)
                        `,
                    },
                ],
                {
                    duration: settings.fizzDuration,
                    delay:
                        settings.fizzDelay +
                        (i % 4) * settings.fizzInterval,
                    easing: "ease-out",
                    fill: "both",
                }
            );
        });
    };

    const handleMouseLeave = (
        e: MouseEvent<HTMLSpanElement>
    ) => {
        setHovered(false);

        e.currentTarget
            .querySelectorAll("[data-bubble]")
            .forEach(bubble => {
                bubble.getAnimations().forEach(a => a.cancel());
            });
    };

    return (
        <span
            className="
                relative inline-block cursor-pointer
                whitespace-nowrap overflow-visible
            "
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {children}

            {/* First Wave */}
            <span
                aria-hidden="true"
                className="absolute inset-0 z-10 pointer-events-none"
                style={{
                    color: settings.firstColor,
                    transition: `clip-path ${settings.firstWaveDuration}ms ease-in-out`,
                    clipPath: hovered
                        ? `polygon(
                            0 -10%,
                            25% -20%,
                            50% -5%,
                            75% -20%,
                            100% -10%,
                            100% 130%,
                            0 130%
                        )`
                        : `polygon(
                            0 110%,
                            25% 100%,
                            50% 115%,
                            75% 100%,
                            100% 110%,
                            100% 130%,
                            0 130%
                        )`,
                }}
            >
                {children}
            </span>

            {/* Second Wave */}
            <span
                aria-hidden="true"
                className="absolute inset-0 z-20 pointer-events-none"
                style={{
                    color: settings.secondColor,
                    transition: `clip-path ${settings.secondWaveDuration}ms ease-in-out`,
                    clipPath: hovered
                        ? `polygon(
                            0 -20%,
                            25% -10%,
                            50% -30%,
                            75% -10%,
                            100% -20%,
                            100% 140%,
                            0 140%
                        )`
                        : `polygon(
                            0 120%,
                            25% 130%,
                            50% 110%,
                            75% 130%,
                            100% 120%,
                            100% 140%,
                            0 140%
                        )`,
                }}
            >
                {children}
            </span>

            {/* Fizz Bubbles */}
            {Array.from(
                { length: settings.fizzCount },
                (_, i) => (
                    <span
                        key={i}
                        data-bubble
                        aria-hidden="true"
                        className="
                            absolute z-30 rounded-full
                            pointer-events-none
                        "
                        style={{
                            opacity: 0,
                            top: settings.fizzTop,
                            left: `${5 + i * (90 / Math.max(settings.fizzCount - 1, 1))}%`,
                            width: `${3 + (i % 3) * 1.5}px`,
                            height: `${3 + (i % 3) * 1.5}px`,
                            backgroundColor:
                                i % 2 === 0
                                    ? settings.firstColor
                                    : settings.secondColor,
                        }}
                    />
                )
            )}
        </span>
    );
};

export default WaterText;