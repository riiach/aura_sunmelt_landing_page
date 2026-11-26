"use client";

import { useEffect, useRef, useState } from "react";
import { mountCarousel } from "./product-carousel/carouselScene";

const ProductCarousel = () => {
    const stageRef = useRef<HTMLDivElement>(null);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState("");
    const [activeProduct, setActiveProduct] = useState("Grapefruit Fizz");

    useEffect(() => {
        const stage = stageRef.current;
        if (!stage) return;

        return mountCarousel(stage, {
            onReady: () => setReady(true),
            onError: (message: string) => setError(message),
            onChange: (name: string) => setActiveProduct(name),
        });
    }, []);

    return (
        <section aria-label="Sunmelt product carousel" className="relative w-full bg-white text-black">
            <div
                ref={stageRef}
                tabIndex={0}
                role="group"
                aria-label="Drag or use the arrow keys to browse Sunmelt flavors"
                aria-busy={!ready && !error}
                className="relative w-full max-w-[1280px] mx-auto aspect-[5/6] sm:aspect-[3/2] lg:aspect-[5/2] overflow-hidden cursor-grab select-none touch-pan-y"
            />
            {!ready && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-6">
                    <p className="text-sm text-center text-black/60" role="status">
                        {error || "Loading Sunmelt flavors..."}
                    </p>
                </div>
            )}
            <p className="sr-only" aria-live="polite">{activeProduct}</p>
        </section>
    );
};

export default ProductCarousel;
