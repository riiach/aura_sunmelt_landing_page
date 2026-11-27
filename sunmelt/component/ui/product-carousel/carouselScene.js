import * as THREE from "three";
import { gsap } from "gsap";
import { createCanAssets, flavors, frontRotation } from "./createCan";
import { wrap, mod, getLayout, getSnap, rightTilt, isSelected, introPoseAt, introSpreadAt } from "./carouselMath.mjs";
import { createStudio, createContactShadows } from "./studio";
import { aboutPhases, nearestFlavorPosition, preparationDuration, preparationProgress, MANGO_READY } from "./aboutMath.mjs";

export const mountCarousel = (stage, { onReady, onError, onChange, onIntroPhase, onIntroProgress, aboutState }) => {
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
    const cameraHeight = 2.05;
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
    let assets, snapTween, spinTween, spinningCan, introTween;
    const intro = { spread: 0, progress: 0 };
    let introComplete = false;
    let ready = false, disposed = false, dirty = true, inView = true;
    let worldWidth = 4.92, pixelsPerUnit = 1, spacing = 1;
    let activeIndex = 2, drag = null, lastMouse = null;
    let visualIndex = 2, elapsed = 0;
    let parallaxX = 0, parallaxY = 0;
    const parallax = new THREE.Vector2();
    const mangoIndex = flavors.findIndex(flavor => flavor.name.toLowerCase().startsWith("mango"));
    let aboutOrigin = null, aboutTarget = null, lastAboutProgress = -1;
    let prepTime = 0, prepDuration = null;
    const fadeMaterials = new Map();
    const setCanOpacity = (can, opacity) => {
        let entries = fadeMaterials.get(can);
        if (opacity >= .999) {
            if (entries) for (const { mesh, original } of entries) mesh.material = original;
            return;
        }
        if (!entries) {
            entries = [];
            const clones = new Map();
            can.traverse(mesh => {
                if (!mesh.isMesh) return;
                const original = mesh.material;
                if (!clones.has(original)) {
                    const faded = original.clone();
                    faded.transparent = true;
                    faded.depthWrite = false;
                    clones.set(original, faded);
                }
                entries.push({ mesh, original, faded: clones.get(original) });
            });
            fadeMaterials.set(can, entries);
        }
        for (const { mesh, faded } of entries) {
            faded.opacity = opacity;
            mesh.material = faded;
        }
    };
    const targetRay = new THREE.Raycaster();
    const tilePoint = new THREE.Vector3();
    const tilePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -.65);
    const aboutProgress = () => aboutState?.current?.progress || 0;
    const reduced = () => motionPreference.matches;
    const damp = (from, to, dt) => reduced() ? to : THREE.MathUtils.damp(from, to, 10, dt);

    const invalidate = () => { dirty = true; };
    const render = (_time, deltaMs) => {
        if (disposed || !ready || !inView) return;
        const dt = Math.min(.05, (deltaMs || 16.7) / 1000);
        const state = aboutState?.current;
        let preparedNow = false;
        if (introComplete && state?.preparing && mangoIndex >= 0) {
            if (!prepDuration) {
                const destination = nearestFlavorPosition(track.position, mangoIndex, count);
                prepDuration = preparationDuration(Math.abs(destination - track.position));
                prepTime = 0;
            }
            prepTime += dt;
            state.progress = reduced() ? MANGO_READY : preparationProgress(prepTime, prepDuration);
            preparedNow = state.progress >= MANGO_READY;
        }
        const progress = introComplete ? aboutProgress() : 0;
        if (progress > 0 && mangoIndex >= 0) {
            if (aboutOrigin === null || progress !== lastAboutProgress || dirty || aboutState?.current?.returnToMango) {
                updateAboutLayout(progress);
                lastAboutProgress = progress;
                dirty = false;
                renderer.render(scene, camera);
            }
            if (preparedNow) {
                state.preparing = false;
                state.onPrepared?.();
                prepDuration = null;
            }
            return;
        }
        if (aboutOrigin !== null) {
            track.position = mod(Math.round(state?.returnToMango ? aboutTarget : aboutOrigin), count);
            if (state) state.returnToMango = false;
            prepDuration = null;
            prepTime = 0;
            activeIndex = mod(Math.round(track.position), count);
            aboutOrigin = aboutTarget = null;
            lastAboutProgress = -1;
            cans.forEach(({primary, copy}) => {
                for (const can of [primary, copy]) {
                    can.userData.tilt.rotation.set(0, 0, 0);
                    can.userData.tilt.position.y = 0;
                    can.userData.spin.rotation.y = frontRotation;
                    setCanOpacity(can, 1);
                }
            });
            updateLayout();
            onChange(flavors[activeIndex].name);
            stage.style.cursor = "grab";
        }
        if (introComplete && !reduced()) elapsed += dt;
        const moving = Boolean(!introComplete || drag || snapTween);
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
                const targetTilt = selected ? rightTilt * intro.progress : 0;
                const nextTilt = introComplete ? damp(tilt.rotation.z, targetTilt, dt) : targetTilt;
                const float = selected && !moving && !reduced() ? .045 * Math.sin(elapsed * 1.5) : 0;
                const nextFloat = damp(tilt.position.y, float, dt);
                if (Math.abs(tilt.rotation.z - nextTilt) + Math.abs(tilt.position.y - nextFloat) > .00001) dirty = true;
                tilt.rotation.z = Math.abs(nextTilt - targetTilt) < .0001 ? targetTilt : nextTilt;
                tilt.position.y = Math.abs(nextFloat - float) < .0001 ? float : nextFloat;
                const emphasis = selected ? intro.progress : 0;
                const shadowReveal = introComplete || selected ? 1 :
                    introSpreadAt(wrap(index - track.position, count), intro.spread);
                shadow.material.opacity = (.60 - .12 * emphasis - tilt.position.y * 1.5) * shadowReveal * .72;
                shadow.scale.setScalar(.82 + .33 * emphasis + tilt.position.y * 2);
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
                const pose = introPoseAt(x, intro.progress);
                const spread = introComplete ? 1 : introSpreadAt(x, intro.spread);
                const spreadX = x * spread;
                // The center stays in front while the other cans emerge from behind it.
                const overlap = introComplete ? 0 : (1 - spread) * (Math.abs(x) > .01 ? .11 + Math.abs(x) * .06 : 0);
                can.position.set(spreadX * spacing, pose.y, pose.z - overlap);
                can.scale.setScalar(pose.scale);
                can.visible = (introComplete || can === primary) &&
                    (introComplete || Math.abs(x) < .01 || spread > .001) &&
                    Math.abs(spreadX) < worldWidth / 2 + .9;
                shadow.position.x = spreadX * spacing;
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

    // Keep the original procedural mango can and its shared materials.
    const updateAboutLayout = progress => {
        if (aboutOrigin === null) {
            cancelSnap();
            stopSpin(true);
            aboutOrigin = track.position;
            aboutTarget = nearestFlavorPosition(aboutOrigin, mangoIndex, count);
            lastMouse = null;
            parallax.set(0, 0);
            cans.forEach(({primary, copy}) => {
                returnToFront(primary, true);
                returnToFront(copy, true);
            });
        }
        if (aboutState?.current?.returnToMango) {
            aboutOrigin = aboutTarget;
            aboutState.current.returnToMango = false;
        }
        const { settle, travel, fade, land } = aboutPhases(progress);
        const lerp = THREE.MathUtils.lerp;
        track.position = lerp(aboutOrigin, aboutTarget, travel);
        parallaxX = parallaxY = 0;
        camera.position.set(0, cameraHeight, cameraDistance);
        camera.lookAt(0, 0, 0);
        camera.updateMatrixWorld();
        const tile = aboutState?.current?.target?.getBoundingClientRect();
        const rect = stage.getBoundingClientRect();
        let landingScale = 1.05;
        tilePoint.set(1.3, -.08, .65);
        if (tile && rect.width > 0 && rect.height > 0) {
            targetRay.setFromCamera(new THREE.Vector2(
                (tile.left + tile.width * .5 - rect.left) / rect.width * 2 - 1,
                1 - (tile.top + tile.height * .46 - rect.top) / rect.height * 2
            ), camera);
            targetRay.ray.intersectPlane(tilePlane, tilePoint);
            const top = tilePoint.clone().add(new THREE.Vector3(0, .74, 0)).project(camera);
            const bottom = tilePoint.clone().add(new THREE.Vector3(0, -.74, 0)).project(camera);
            const unitHeight = Math.abs(top.y - bottom.y) * rect.height / 2;
            landingScale = THREE.MathUtils.clamp(tile.height * .88 / Math.max(1, unitHeight), .30, 1.45);
        }
        cans.forEach(({index, primary, copy, primaryShadow, copyShadow}) => {
            const distance = wrap(index - track.position, count);
            const other = distance + (distance < 0 ? count : -count);
            for (const [can, shadow, x, isPrimary] of [[primary, primaryShadow, distance, true], [copy, copyShadow, other, false]]) {
                const pose = introPoseAt(x, 1 - settle);
                const mango = index === mangoIndex && isPrimary;
                const opacity = mango ? 1 : 1 - fade;
                const tilt = can.userData.tilt;
                can.position.set(x * spacing, pose.y, pose.z);
                can.scale.setScalar(pose.scale);
                setCanOpacity(can, opacity);
                tilt.rotation.set(0, 0, isPrimary ? rightTilt * (1 - settle) * Math.max(0, 1-Math.abs(x)) : 0);
                tilt.position.y = 0;
                can.userData.spin.rotation.y = frontRotation;
                can.visible = Math.abs(x) < worldWidth / 2 + .9 && opacity > .005;
                shadow.position.x = can.position.x;
                shadow.position.z = can.position.z;
                shadow.visible = can.visible && land < .99;
                shadow.scale.setScalar(.82);
                shadow.material.opacity = .43 * opacity * (1 - land);
                if (mango && land > 0) {
                    can.position.set(lerp(0, tilePoint.x, land),
                        lerp(-.11, tilePoint.y, land) - Math.sin(Math.PI * land) * .22,
                        lerp(0, tilePoint.z, land));
                    can.scale.setScalar(lerp(.86, landingScale, land));
                    tilt.rotation.set(-.12 * land, 0, -.43 * land);
                    can.userData.spin.rotation.y = frontRotation - Math.PI * 2 * land - .15 * land;
                    can.visible = true;
                    shadow.visible = false;
                }
            }
        });
        const nextIndex = mod(Math.round(track.position), count);
        if (visualIndex !== nextIndex) {
            visualIndex = nextIndex;
            onChange(flavors[nextIndex].name);
        }
        stage.style.cursor = progress >= .985 ? "default" : drag ? "grabbing" : "ns-resize";
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
        spacing = worldHeight * aspect / worldWidth;
        pixelsPerUnit = width / worldWidth;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 640 ? 1.25 : 1.75));
        renderer.setSize(width, height, false);
        if (introComplete && aboutProgress() > 0) invalidate();
        else updateLayout();
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
            y: "-=" + Math.PI * 2, duration: 10,
            ease: "none", repeat: -1, onUpdate: invalidate,
        });
    };

    const updateHover = () => {
        if (!ready || !introComplete || aboutProgress() > 0 || drag || snapTween || !lastMouse || !inView) {
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
        if (!ready || !introComplete || aboutState?.current?.preparing || drag || aboutProgress() >= .985 || !event.isPrimary || event.button !== 0) return;
        cancelSnap();
        stopSpin(true);
        // Reset any earlier front-return tween before the cans start sliding.
        if (aboutProgress() === 0) cans.forEach(({ primary, copy }) => {
            returnToFront(primary, true);
            returnToFront(copy, true);
        });
        drag = {
            id: event.pointerId, x: event.clientX, y: event.clientY,
            origin: track.position, lastPosition: track.position,
            lastTime: performance.now(), velocity: 0, moved: false,
            axis: null, scrollY: event.clientY, aboutOnly: aboutProgress() > 0,
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
        if (!drag.axis) {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 5) return;
            drag.axis = drag.aboutOnly || Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal";
        }
        if (drag.axis === "vertical") {
            if (event.pointerType === "mouse") {
                window.scrollBy({ top: event.clientY - drag.scrollY, behavior: "instant" });
                drag.scrollY = event.clientY;
                if (event.cancelable) event.preventDefault();
            }
            return;
        }
        if (aboutState?.current?.preparing || aboutProgress() > 0) return;
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
        if (aboutState?.current?.preparing || aboutProgress() > 0 || previous.axis === "vertical") return;
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
        if (!ready || !introComplete || aboutState?.current?.preparing || aboutProgress() > 0 || drag || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
        event.preventDefault();
        snapTo(Math.round(track.position) + (event.key === "ArrowRight" ? 1 : -1));
    };
    const finishIntro = () => {
        if (disposed || introComplete) return;
        introTween?.kill();
        introTween = undefined;
        intro.spread = 1;
        intro.progress = 1;
        introComplete = true;
        elapsed = 0;
        cans.forEach(({ index, primary }) => {
            primary.userData.tilt.rotation.z = index === activeIndex ? rightTilt : 0;
        });
        updateLayout();
        stage.style.cursor = "grab";
        onIntroProgress?.(1);
        onIntroPhase?.("active");
        updateHover();
    };

    const startIntro = () => {
        if (reduced()) {
            finishIntro();
            return;
        }

        // One shared timeline: hold the single hero, fan out, then lift and tilt.
        stage.style.cursor = "default";
        introTween = gsap.timeline({
            onUpdate: () => {
                updateLayout();
                // Drive the DOM header from the exact same eased progress as the can.
                onIntroProgress?.(intro.progress);
            },
            onComplete: finishIntro,
        });
        introTween.to(intro, {
            spread: 1,
            duration: .84,
            ease: "power3.inOut",
            onStart: () => onIntroPhase?.("spread"),
        }, .26);
        introTween.to(intro, {
            progress: 1,
            duration: .92,
            ease: "power3.inOut",
            onStart: () => onIntroPhase?.("reveal"),
        }, 1.15);
    };

    const onMotionChange = () => {
        if (motionPreference.matches) {
            if (ready && !introComplete) finishIntro();
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
        });
        ready = true;
        resize();
        onReady();
        onChange(flavors[activeIndex].name);
        render(0, 0);
        startIntro();
    }).catch(error => {
        if (!disposed) {
            console.error("Sunmelt carousel:", error);
            onError(error instanceof Error ? error.message : "Product textures could not be loaded.");
        }
    });

    return () => {
        disposed = true;
        introTween?.kill();
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
        for (const entries of fadeMaterials.values()) {
            for (const material of new Set(entries.map(entry => entry.faded))) material.dispose();
        }
        fadeMaterials.clear();
        assets?.dispose();
        shadows.dispose();
        disposeStudio();
        renderer.dispose();
        renderer.domElement.remove();
    };
};
