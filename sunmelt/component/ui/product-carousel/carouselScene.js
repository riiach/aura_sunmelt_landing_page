import * as THREE from "three";
import { gsap } from "gsap";
import { createCanAssets, flavors, frontRotation } from "./createCan";
import { wrap, mod, scaleAt, getLayout, getSnap } from "./carouselMath.mjs";

export const mountCarousel = (stage, { onReady, onError, onChange }) => {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
        onError("3D preview is unavailable on this device.");
        return () => {};
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2.56, 2.56, 1, -1, 0.1, 30);
    camera.position.set(0, 0.27, 7);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0xe7e7e7, 2));
    const light = new THREE.DirectionalLight(0xffffff, 1.1);
    light.position.set(2, 5, 5);
    scene.add(light);

    const count = flavors.length;
    const track = { position: 2 };
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const cans = [];
    let assets, snapTween, spinTween, spinningCan;
    let ready = false, disposed = false, dirty = true, inView = true;
    let worldWidth = 5.12, pixelsPerUnit = 1;
    let activeIndex = 2, drag = null, lastMouse = null;

    const invalidate = () => { dirty = true; };
    const render = () => {
        if (disposed || !ready || !dirty || !inView) return;
        dirty = false;
        renderer.render(scene, camera);
    };

    const updateLayout = () => {
        cans.forEach(({ index, primary, copy }) => {
            const distance = wrap(index - track.position, count);
            const otherDistance = distance + (distance < 0 ? count : -count);

            [[primary, distance], [copy, otherDistance]].forEach(([can, x]) => {
                can.position.x = x;
                can.scale.setScalar(scaleAt(x));
                can.visible = Math.abs(x) < worldWidth / 2 + 0.4;
            });
        });
        invalidate();
    };

    const resize = () => {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height || disposed) return;

        worldWidth = getLayout(width);
        const worldHeight = worldWidth * height / width;
        camera.left = -worldWidth / 2;
        camera.right = worldWidth / 2;
        camera.top = worldHeight / 2;
        camera.bottom = -worldHeight / 2;
        camera.updateProjectionMatrix();
        pixelsPerUnit = width / worldWidth;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 640 ? 1.5 : 2));
        renderer.setSize(width, height, false);
        updateLayout();
    };

    const returnToFront = (can, immediate = false) => {
        if (!can) return;
        gsap.killTweensOf(can.rotation);
        const delta = wrap(can.rotation.y - frontRotation, Math.PI * 2);
        can.rotation.y = frontRotation + delta;
        if (immediate || motionPreference.matches) {
            can.rotation.y = frontRotation;
            invalidate();
            return;
        }
        gsap.to(can.rotation, {
            y: frontRotation, duration: 0.7, ease: "power2.out",
            overwrite: true, onUpdate: invalidate,
        });
    };

    const stopSpin = (immediate = false) => {
        spinTween?.kill();
        spinTween = undefined;
        if (spinningCan) returnToFront(spinningCan, immediate);
        spinningCan = undefined;
    };

    const startSpin = (can) => {
        if (spinningCan === can || motionPreference.matches) return;
        stopSpin();
        gsap.killTweensOf(can.rotation);
        spinningCan = can;
        spinTween = gsap.to(can.rotation, {
            y: "+=" + Math.PI * 2, duration: 11,
            ease: "none", repeat: -1, onUpdate: invalidate,
        });
    };

    const updateHover = () => {
        if (!ready || drag || snapTween || !lastMouse || !inView) {
            stopSpin();
            return;
        }
        const center = cans[activeIndex]?.primary;
        if (!center) return;
        const rect = stage.getBoundingClientRect();
        pointer.set(
            (lastMouse.x - rect.left) / rect.width * 2 - 1,
            -(lastMouse.y - rect.top) / rect.height * 2 + 1,
        );
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);
        if (raycaster.intersectObject(center, true).length) startSpin(center);
        else stopSpin();
    };

    const cancelSnap = () => {
        snapTween?.kill();
        snapTween = undefined;
    };

    const snapTo = (target, velocity = 0) => {
        cancelSnap();
        stopSpin(true);
        const distance = Math.abs(target - track.position);
        const finish = () => {
            track.position = mod(target, count);
            activeIndex = mod(target, count);
            snapTween = undefined;
            updateLayout();
            onChange(flavors[activeIndex].name);
            updateHover();
        };

        if (distance < 0.0001 || motionPreference.matches) {
            finish();
            return;
        }

        snapTween = gsap.to(track, {
            position: target,
            duration: Math.max(0.32, Math.min(0.95, 0.42 + distance * 0.16 + Math.abs(velocity) * 45)),
            ease: "power3.out",
            overwrite: true,
            onUpdate: updateLayout,
            onComplete: finish,
        });
    };

    const onPointerDown = (event) => {
        if (!ready || drag || !event.isPrimary || event.button !== 0) return;
        cancelSnap();
        stopSpin(true);
        // Reset any earlier front-return tween before the cans start sliding.
        cans.forEach(({ primary, copy }) => {
            returnToFront(primary, true);
            returnToFront(copy, true);
        });
        drag = {
            id: event.pointerId, x: event.clientX, y: event.clientY,
            origin: track.position, lastPosition: track.position,
            lastTime: performance.now(), velocity: 0, moved: false,
        };
        stage.setPointerCapture(event.pointerId);
        stage.style.cursor = "grabbing";
    };

    const onPointerMove = (event) => {
        if (event.pointerType === "mouse") lastMouse = { x: event.clientX, y: event.clientY };

        if (!drag) {
            updateHover();
            return;
        }
        if (drag.id !== event.pointerId) return;

        const dx = event.clientX - drag.x;
        const dy = event.clientY - drag.y;
        if (!drag.moved && Math.abs(dx) < 5) return;
        if (!drag.moved && event.pointerType === "touch" && Math.abs(dy) > Math.abs(dx)) return;
        drag.moved = true;
        const now = performance.now();
        const next = drag.origin - dx / pixelsPerUnit;
        const dt = Math.max(8, now - drag.lastTime);
        const instantVelocity = (next - drag.lastPosition) / dt;
        drag.velocity = drag.velocity * 0.35 + instantVelocity * 0.65;
        drag.lastPosition = next;
        drag.lastTime = now;
        track.position = next;
        updateLayout();
    };

    const release = (event, canceled = false) => {
        if (!drag || event.pointerId !== drag.id) return;
        const previous = drag;
        drag = null;
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        stage.style.cursor = "grab";
        const velocity = performance.now() - previous.lastTime > 100 ? 0 : previous.velocity;
        if (event.pointerType !== "mouse" || canceled) lastMouse = null;
        const target = previous.moved
            ? getSnap(track.position, previous.origin, velocity, canceled)
            : Math.round(track.position);
        snapTo(target, velocity);
    };

    const onPointerUp = event => release(event);
    const onPointerCancel = event => release(event, true);
    const onPointerLeave = () => {
        lastMouse = null;
        if (!drag) stopSpin();
    };
    const onKeyDown = event => {
        if (!ready || drag || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        snapTo(Math.round(track.position) + (event.key === "ArrowRight" ? 1 : -1));
    };
    const onMotionChange = () => {
        if (motionPreference.matches) {
            stopSpin(true);
            if (snapTween) snapTo(Math.round(track.position));
        }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    const visibility = new IntersectionObserver(entries => {
        inView = entries[0]?.isIntersecting ?? true;
        if (!inView) {
            lastMouse = null;
            stopSpin(true);
        }
        invalidate();
    });
    visibility.observe(stage);

    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerCancel);
    stage.addEventListener("lostpointercapture", onPointerCancel);
    stage.addEventListener("pointerleave", onPointerLeave);
    stage.addEventListener("keydown", onKeyDown);
    motionPreference.addEventListener("change", onMotionChange);
    gsap.ticker.add(render);

    createCanAssets(renderer).then(result => {
        if (disposed) {
            result.dispose();
            return;
        }
        assets = result;
        assets.preload();
        flavors.forEach((_, index) => {
            const primary = assets.createCan(index);
            const copy = assets.createCan(index);
            scene.add(primary, copy);
            cans.push({ index, primary, copy });
        });
        ready = true;
        resize();
        onReady();
        onChange(flavors[activeIndex].name);
    }).catch(() => {
        if (!disposed) onError("Product textures could not be loaded.");
    });

    return () => {
        disposed = true;
        cancelSnap();
        stopSpin(true);
        cans.forEach(({ primary, copy }) => {
            gsap.killTweensOf(primary.rotation);
            gsap.killTweensOf(copy.rotation);
        });
        gsap.ticker.remove(render);
        observer.disconnect();
        visibility.disconnect();
        stage.removeEventListener("pointerdown", onPointerDown);
        stage.removeEventListener("pointermove", onPointerMove);
        stage.removeEventListener("pointerup", onPointerUp);
        stage.removeEventListener("pointercancel", onPointerCancel);
        stage.removeEventListener("lostpointercapture", onPointerCancel);
        stage.removeEventListener("pointerleave", onPointerLeave);
        stage.removeEventListener("keydown", onKeyDown);
        motionPreference.removeEventListener("change", onMotionChange);
        assets?.dispose();
        renderer.dispose();
        renderer.domElement.remove();
    };
};
