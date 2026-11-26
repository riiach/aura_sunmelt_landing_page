import * as THREE from "three";
import { gsap } from "gsap";
import { createCanAssets, flavors, frontRotation } from "./createCan";
import { wrap, mod, scaleAt, getLayout, getSnap, centerWeight, depthAt, rightTilt, isSelected } from "./carouselMath.mjs";
import { createStudio, createContactShadows } from "./studio";

export const mountCarousel = (stage, { onReady, onError, onChange }) => {
    let renderer;
    try {
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
        onError("3D preview is unavailable on this device.");
        return () => {};
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.cssText = "display:block;width:100%;height:100%;pointer-events:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
    const cameraDistance = 7.8;
    const cameraHeight = 1.18;
    camera.position.set(0, cameraHeight, cameraDistance);
    camera.lookAt(0, 0, 0);
    let disposeStudio, shadows;
    try {
        disposeStudio = createStudio(renderer, scene);
        shadows = createContactShadows(stage.clientWidth < 640 ? 64 : 128);
    } catch (error) {
        renderer.dispose();
        renderer.domElement.remove();
        onError("Studio lighting could not be initialized.");
        console.error(error);
        return () => {};
    }

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
    let visualIndex = 2, elapsed = 0;
    let parallaxX = 0, parallaxY = 0;
    const parallax = new THREE.Vector2();
    const reduced = () => motionPreference.matches;
    const damp = (from, to, dt) => reduced() ? to : THREE.MathUtils.damp(from, to, 10, dt);

    const invalidate = () => { dirty = true; };
    const render = (_time, deltaMs) => {
        if (disposed || !ready || !inView) return;
        const dt = Math.min(.05, (deltaMs || 16.7) / 1000);
        if (!reduced()) elapsed += dt;
        const moving = Boolean(drag || snapTween);
        const px = moving || reduced() ? 0 : parallax.x * .19;
        const py = moving || reduced() ? 0 : parallax.y * .14;
        const nextX = damp(parallaxX, px, dt);
        const nextY = damp(parallaxY, py, dt);
        if (Math.abs(nextX - parallaxX) + Math.abs(nextY - parallaxY) > .00001) dirty = true;
        parallaxX = nextX;
        parallaxY = nextY;
        camera.position.set(parallaxX, cameraHeight + parallaxY, cameraDistance);
        camera.lookAt(0, 0, 0);
        cans.forEach(({ index, primary, copy, primaryShadow, copyShadow }) => {
            for (const [can, shadow, isPrimary] of [[primary, primaryShadow, true], [copy, copyShadow, false]]) {
                const selected = isPrimary && isSelected(index, track.position, count);
                const tilt = can.userData.tilt;
                const targetTilt = selected ? rightTilt : 0;
                const nextTilt = damp(tilt.rotation.z, targetTilt, dt);
                const float = selected && !moving && !reduced() ? .045 * Math.sin(elapsed * 1.5) : 0;
                const nextFloat = damp(tilt.position.y, float, dt);
                if (Math.abs(tilt.rotation.z - nextTilt) + Math.abs(tilt.position.y - nextFloat) > .00001) dirty = true;
                tilt.rotation.z = Math.abs(nextTilt - targetTilt) < .0001 ? targetTilt : nextTilt;
                tilt.position.y = Math.abs(nextFloat - float) < .0001 ? float : nextFloat;
                shadow.material.opacity = selected ? .48 - tilt.position.y * 1.5 : .60;
                shadow.scale.setScalar(selected ? 1.15 + tilt.position.y * 2 : .82);
            }
        });
        if (!dirty) return;
        dirty = false;
        renderer.render(scene, camera);
    };

    const updateLayout = () => {
        cans.forEach(({ index, primary, copy, primaryShadow, copyShadow }) => {
            const distance = wrap(index - track.position, count);
            const otherDistance = distance + (distance < 0 ? count : -count);
            [[primary, primaryShadow, distance], [copy, copyShadow, otherDistance]].forEach(([can, shadow, x]) => {
                const weight = centerWeight(x);
                const scale = scaleAt(x);
                can.position.set(x, -.11 + .20 * weight, depthAt(x));
                can.scale.setScalar(scale);
                can.visible = Math.abs(x) < worldWidth / 2 + .9;
                shadow.position.x = x;
                shadow.position.z = can.position.z;
                shadow.visible = can.visible;
            });
        });
        const nextIndex = mod(Math.round(track.position), count);
        if (visualIndex !== nextIndex) {
            visualIndex = nextIndex;
            onChange(flavors[visualIndex].name);
        }
        invalidate();
    };

    const resize = () => {
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (!width || !height || disposed) return;

        worldWidth = getLayout(width);
        const aspect = width / height;
        const distance = Math.hypot(cameraDistance, cameraHeight);
        // Keep five / three / one-plus-peeks horizontally, with vertical room for the hero.
        const worldHeight = Math.max(2.65, worldWidth / aspect);
        camera.aspect = aspect;
        camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(worldHeight / (2 * distance)));
        camera.updateProjectionMatrix();
        pixelsPerUnit = width / (worldHeight * aspect);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 640 ? 1.25 : 1.75));
        renderer.setSize(width, height, false);
        updateLayout();
    };

    const returnToFront = (can, immediate = false) => {
        if (!can) return;
        const rotation = can.userData.spin.rotation;
        gsap.killTweensOf(rotation);
        const delta = wrap(rotation.y - frontRotation, Math.PI * 2);
        rotation.y = frontRotation + delta;
        if (immediate || motionPreference.matches) {
            rotation.y = frontRotation;
            invalidate();
            return;
        }
        gsap.to(rotation, {
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
        const rotation = can.userData.spin.rotation;
        gsap.killTweensOf(rotation);
        spinningCan = can;
        spinTween = gsap.to(rotation, {
            y: "+=" + Math.PI * 2, duration: 10,
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
        if (event.pointerType === "mouse") {
            lastMouse = { x: event.clientX, y: event.clientY };
            const rect = stage.getBoundingClientRect();
            parallax.set(
                THREE.MathUtils.clamp((event.clientX - rect.left) / rect.width * 2 - 1, -1, 1),
                THREE.MathUtils.clamp(1 - (event.clientY - rect.top) / rect.height * 2, -1, 1),
            );
        }

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
        parallax.set(0, 0);
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
            parallax.set(0, 0);
            if (snapTween) snapTo(Math.round(track.position));
        }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    const visibility = new IntersectionObserver(entries => {
        inView = entries[0]?.isIntersecting ?? true;
        if (!inView) {
            lastMouse = null;
            parallax.set(0, 0);
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
            const primaryShadow = shadows.create();
            const copyShadow = shadows.create();
            scene.add(primary, copy, primaryShadow, copyShadow);
            cans.push({ index, primary, copy, primaryShadow, copyShadow });
            primary.userData.tilt.rotation.z = index === activeIndex ? rightTilt : 0;
        });
        ready = true;
        resize();
        onReady();
        onChange(flavors[activeIndex].name);
    }).catch(error => {
        if (!disposed) {
            console.error("Sunmelt carousel:", error);
            onError(error instanceof Error ? error.message : "Product textures could not be loaded.");
        }
    });

    return () => {
        disposed = true;
        cancelSnap();
        stopSpin(true);
        cans.forEach(({ primary, copy }) => {
            gsap.killTweensOf(primary.userData.spin.rotation);
            gsap.killTweensOf(copy.userData.spin.rotation);
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
        shadows.dispose();
        disposeStudio();
        renderer.dispose();
        renderer.domElement.remove();
    };
};
