import { wrap } from "./carouselMath.mjs";

const clamp = value => Math.max(0, Math.min(1, value));
const ease = (p, start, end) => {
    const t = clamp((p - start) / (end - start));
    return t * t * (3 - 2 * t);
};

export const aboutPhases = progress => ({
    settle: ease(progress, 0, .18),
    travel: ease(progress, .18, .46),
    merge: ease(progress, .46, .68),
    land: ease(progress, .68, 1),
    reveal: ease(progress, .46, .82),
});

export const nearestFlavorPosition = (position, index, count) =>
    position + wrap(index - position, count);
