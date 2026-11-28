import { wrap } from "./carouselMath.mjs";

const clamp = value => Math.max(0, Math.min(1, value));
const ease = (p, start, end) => {
    const t = clamp((p - start) / (end - start));
    return t * t * (3 - 2 * t);
};

export const MANGO_READY = .46;

export const aboutPhases = progress => ({
    settle: ease(progress, 0, .18),
    travel: ease(progress, .18, .46),
    fade: ease(progress, MANGO_READY, .68),
    land: ease(progress, .68, 1),
    reveal: ease(progress, .68, 1),
});

export const nearestFlavorPosition = (position, index, count) =>
    position + wrap(index - position, count);

export const preparationDuration = distance => ({
    settle: .32,
    travel: distance < .001 ? 0 : .25 + .23 * distance,
});
export const preparationProgress = (elapsed, duration) => {
    if (elapsed < duration.settle) return .18 * clamp(elapsed / duration.settle);
    if (!duration.travel) return MANGO_READY;
    return .18 + (MANGO_READY - .18) * clamp((elapsed - duration.settle) / duration.travel);
};
export const aboutScrollProgress = raw => MANGO_READY + (1 - MANGO_READY) * clamp(raw);

// Smooth, symmetric easing for menu-triggered scrolling; manual scroll is unchanged.
export const aboutNavigationEase = progress => ease(progress, 0, 1);

// Forward scroll stays directly responsive. Returning toward the hero is
// rate-limited and eases into its final pose even after a large wheel delta.
export const advanceAboutProgress = (current, target, dt, immediate = false) => {
    const next = clamp(target);
    if (immediate || next >= current) return next;
    const gap = current - next;
    if (gap < .001) return next;
    const step = Math.min(.78 * Math.max(0, dt), gap * (1 - Math.exp(-4.5 * Math.max(0, dt))));
    return Math.max(next, current - step);
};
