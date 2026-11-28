// Keep the document stationary while a full-screen modal is visible,
// including its exit animation. Avoid position:fixed on body, which
// would disturb sticky hero/ingredients layouts behind the sliding panel.
let count = 0;
let restore: (() => void) | undefined;

export function lockPageScroll(): () => void {
    if (count++ === 0) {
        const root = document.documentElement;
        const x = window.scrollX, y = window.scrollY;
        const keepPosition = () => {
            if (Math.abs(window.scrollX - x) > 1 || Math.abs(window.scrollY - y) > 1)
                window.scrollTo({ left: x, top: y, behavior: "instant" });
        };
        const preventOutside = (event: Event) => {
            const target = event.target;
            if (!(target instanceof Element) ||
                !target.closest("dialog[open]")) {
                if (event.cancelable) event.preventDefault();
            }
        };
        root.setAttribute("data-modal-scroll-lock", "");
        document.addEventListener("wheel", preventOutside, { capture: true, passive: false });
        document.addEventListener("touchmove", preventOutside, { capture: true, passive: false });
        window.addEventListener("scroll", keepPosition, { passive: true });
        keepPosition();
        restore = () => {
            window.removeEventListener("scroll", keepPosition);
            document.removeEventListener("wheel", preventOutside, true);
            document.removeEventListener("touchmove", preventOutside, true);
            root.removeAttribute("data-modal-scroll-lock");
            keepPosition();
        };
    }
    let released = false;
    return () => {
        if (released) return;
        released = true;
        if (--count === 0) {
            restore?.();
            restore = undefined;
        }
    };
}
