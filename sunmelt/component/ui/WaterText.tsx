"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface WaterTextProps {
    children: ReactNode;
}

const WaterText = ({ children }: WaterTextProps) => {
    const [hovered, setHovered] = useState(false);

    // Animation Settings
    const settings = {
        firstWaveDuration: 1800,
        secondWaveDuration: 1950,
        firstWaveExitDuration: 600,
        secondWaveExitDuration: 700,
        waveEnterEasing: "cubic-bezier(0.18, 0.65, 0.35, 1)",

        firstColor: "#D2C6D4",
        secondColor: "#F89862",
    };

    const handleMouseEnter = () => {
        setHovered(true);
    };

    const handleMouseLeave = () => {
        setHovered(false);
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
                    transition: `clip-path ${hovered ? settings.firstWaveDuration : settings.firstWaveExitDuration}ms ${hovered ? settings.waveEnterEasing : "ease-in-out"}`,
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
                    transition: `clip-path ${hovered ? settings.secondWaveDuration : settings.secondWaveExitDuration}ms ${hovered ? settings.waveEnterEasing : "ease-in-out"}`,
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

        </span>
    );
};

export default WaterText;