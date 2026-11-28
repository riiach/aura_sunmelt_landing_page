import * as THREE from "three";
import { gsap } from "gsap";
import { createCanAssets, flavors, frontRotation } from "./createCan";
import { wrap, mod, getLayout, getSnap, rightTilt, isSelected, introPoseAt, introSpreadAt } from "./carouselMath.mjs";
import { createStudio, createContactShadows } from "./studio";
import { aboutPhases, nearestFlavorPosition, preparationDuration, preparationProgress, MANGO_READY, advanceAboutProgress, ingredientsScrollProgress, ingredientsRotationProgress } from "./aboutMath.mjs";

// Keep the hint dismissed for this document, even if the scene is remounted.
// A reload creates a new document and starts with a fresh hint.
const dismissedRotateHints = new WeakSet();
const swipeHintPhases = new WeakMap();

export const mountCarousel = (stage, { onReady, onError, onChange, onIntroPhase, onIntroProgress, aboutState, rotateControl, rightHint, leftHint }) => {
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
    renderer.domElement.style.cssText = "position:absolute;left:0;top:0;display:block;width:100%;height:100%;pointer-events:none";
    renderer.domElement.setAttribute("aria-hidden", "true");
    stage.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
    // Keep the hero camera and its pointer/landing projection unchanged.
    // A second camera renders the same projection into a taller drawing buffer
    // when the can leaves the sticky hero's original canvas during landing.
    const landingCamera = new THREE.PerspectiveCamera();
    const hero = stage.parentElement;
    const trackElement = hero?.parentElement;
    const originalOverflow = hero?.style.overflow || "";
    let canvasWidth = 0, canvasHeight = 0;
    const sizeCanvas = (width, height) => {
        if (canvasWidth === width && canvasHeight === height) return;
        canvasWidth = width;
        canvasHeight = height;
        renderer.domElement.style.height = `${height}px`;
        renderer.setSize(width, height, false);
    };
    const renderScene = (landing = false) => {
        const width = stage.clientWidth, height = stage.clientHeight;
        if (!width || !height) return;
        let extra = 0;
        if (landing && hero && trackElement) {
            const rect = stage.getBoundingClientRect();
            const visual = window.visualViewport;
            const visibleBottom = visual && Math.abs(visual.scale - 1) < .01
                ? visual.offsetTop + visual.height : window.innerHeight;
            // Cover the visible space below the small-viewport-height hero
            // (notably on iPad), without extending the document scroll range.
            const viewportBottom = Math.max(visibleBottom, window.innerHeight, document.documentElement.clientHeight);
            const bottom = Math.min(viewportBottom, trackElement.getBoundingClientRect().bottom);
            extra = Math.max(0, Math.ceil(bottom - rect.bottom));
        }
        if (hero) hero.style.overflow = extra > 0 ? "visible" : originalOverflow;
        sizeCanvas(width, height + extra);
        if (extra > 0) {
            landingCamera.copy(camera, false);
            // Expand below the original frustum rather than stretching it.
            // The original NDC-to-screen mapping remains exactly the same.
            landingCamera.setViewOffset(width, height, 0, 0, width, height + extra);
            renderer.render(scene, landingCamera);
        } else {
            renderer.render(scene, camera);
        }
    };
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
    const touchPreference = window.matchMedia("(hover: none) and (pointer: coarse)");
    const rotateAnchor = new THREE.Vector3();
    let heldCan = null, heldPointer = null, heldKey = null;
    const hintDocument = stage.ownerDocument;
    let rotateAvailable = false;
    if (dismissedRotateHints.has(hintDocument)) rotateControl?.setAttribute("data-dismissed", "true");
    else rotateControl?.removeAttribute("data-dismissed");
    let holdStartedAt = 0, heldCapture = null, pendingHold = null;
    const clearPendingHold = () => {
        if (pendingHold !== null) window.clearTimeout(pendingHold);
        pendingHold = null;
    };
    const dismissRotateHint = () => {
        dismissedRotateHints.add(hintDocument);
        rotateControl?.setAttribute("data-dismissed", "true");
        if (!swipeHintPhases.has(hintDocument)) swipeHintPhases.set(hintDocument, "right");
    };
    const advanceSwipeHint = () => {
        if (!dismissedRotateHints.has(hintDocument)) {
            dismissRotateHint();
            return;
        }
        const phase = swipeHintPhases.get(hintDocument) || "right";
        swipeHintPhases.set(hintDocument, phase === "right" ? "left" : "done");
    };
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
    let displayAboutProgress = 0;
    let lastContentFade = -1, lastIngredientsProgress = -1;
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
    const ingredientFacing = new THREE.Quaternion();
    const ingredientFacingMatrix = new THREE.Matrix4();
    const ingredientUp = new THREE.Vector3();
    const ingredientWorldUp = new THREE.Vector3(0, 1, 0);
    const tilePlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -.65);
    const aboutProgress = () => Math.max(displayAboutProgress, aboutState?.current?.progress || 0);
    const ingredientsProgress = () => {
        const first = aboutState?.current?.target?.closest("section");
        const next = aboutState?.current?.ingredientsTarget?.closest("section");
        if (!first || !next) return 0;
        const visual = window.visualViewport;
        const viewportTop = visual && Math.abs(visual.scale - 1) < .01 ? visual.offsetTop : 0;
        return ingredientsScrollProgress(first.getBoundingClientRect().top, next.getBoundingClientRect().top, viewportTop);
    };
    const reduced = () => motionPreference.matches;
    const damp = (from, to, dt) => reduced() ? to : THREE.MathUtils.damp(from, to, 10, dt);

    const invalidate = () => { dirty = true; };
    const stopHeldRotation = () => {
        clearPendingHold();
        const id = heldPointer;
        const capture = heldCapture;
        if (heldCan && performance.now() - holdStartedAt >= 1000) dismissRotateHint();
        heldCan = null;
        heldCapture = null;
        heldPointer = heldKey = null;
        stage.removeAttribute("data-rotating");
        rotateControl?.removeAttribute("data-holding");
        if (id !== null && capture?.hasPointerCapture(id)) capture.releasePointerCapture(id);
        // Deliberately keep the current rotation angle on release.
        invalidate();
    };
    const canBrowse = () => Boolean(ready && introComplete && inView && !disposed && !drag && !snapTween &&
        !aboutState?.current?.preparing && aboutProgress() === 0);
    const canHoldRotate = () => Boolean(rotateControl && touchPreference.matches && canBrowse());
    const syncRotateControl = () => {
        if (!rotateControl) return;
        const available = canHoldRotate();
        if (!available && heldCan) stopHeldRotation();
        const showHint = available && (!dismissedRotateHints.has(hintDocument) || heldCapture === rotateControl || heldKey !== null);
        if (showHint !== rotateAvailable) {
            rotateAvailable = showHint;
            rotateControl.dataset.available = String(showHint);
        }
        // Desktop uses hover to rotate, so it can start at the arrow tutorial
        // without waiting for a touch-only long press. Keep the same one-time sequence.
        if (canBrowse() && !touchPreference.matches && !dismissedRotateHints.has(hintDocument)) dismissRotateHint();
        const phase = swipeHintPhases.get(hintDocument);
        const showSwipe = canBrowse() && !heldCan && dismissedRotateHints.has(hintDocument);
        for (const [button, direction] of [[rightHint, "right"], [leftHint, "left"]]) {
            if (!button) continue;
            const show = showSwipe && phase === direction;
            if (button.disabled === show) button.disabled = !show;
            if (button.dataset.available !== String(show)) button.dataset.available = String(show);
        }
        if (!showHint && !showSwipe) return;
        const center = cans[activeIndex]?.primary;
        if (!center) return;
        // Project the actual 3D center so the button follows the floating can.
        center.userData.tilt.getWorldPosition(rotateAnchor);
        camera.updateMatrixWorld();
        rotateAnchor.project(camera);
        rotateControl.style.setProperty("--rotate-x", `${(rotateAnchor.x + 1) * 50}%`);
        rotateControl.style.setProperty("--rotate-y", `${(1 - rotateAnchor.y) * 50}%`);
        hero?.style.setProperty("--swipe-y", `${(1 - rotateAnchor.y) * 50}%`);
    };
    const beginHeldRotation = () => {
        if (!canHoldRotate() || heldCan) return false;
        const center = cans[activeIndex]?.primary;
        if (!center) return false;
        lastMouse = null;
        stopSpin(true);
        gsap.killTweensOf(center.userData.spin.rotation);
        heldCan = center;
        holdStartedAt = performance.now();
        stage.dataset.rotating = "true";
        rotateControl.dataset.holding = "true";
        invalidate();
        return true;
    };
    const onRotateDown = event => {
        if (!event.isPrimary || event.button !== 0 || !beginHeldRotation()) return;
        event.preventDefault();
        heldPointer = event.pointerId;
        heldCapture = rotateControl;
        rotateControl.setPointerCapture(event.pointerId);
    };
    const onRotateRelease = event => {
        if (event.pointerId === heldPointer) {
            if (heldCan && event.type === "pointerup") dismissRotateHint();
            stopHeldRotation();
        }
    };
    const onRotateKeyDown = event => {
        if (![" ", "Enter"].includes(event.key)) return;
        event.preventDefault();
        if (!event.repeat && beginHeldRotation()) heldKey = event.key;
    };
    const onRotateKeyUp = event => {
        if (heldKey === event.key) {
            event.preventDefault();
            if (heldCan) dismissRotateHint();
            stopHeldRotation();
        }
    };
    const onRotateContextMenu = event => event.preventDefault();
    const onStageContextMenu = event => { if (touchPreference.matches) event.preventDefault(); };
    const onRotateVisibility = () => { if (document.hidden) stopHeldRotation(); };
    const onRotatePreference = () => { stopHeldRotation(); syncRotateControl(); };
    const render = (_time, deltaMs) => {
        if (disposed) return;
        const state = aboutState?.current;
        // Leaving Home consumes the initial tutorial even without a long press.
        // Ordinary drag/snap interruptions still allow it during the first visit.
        if (state?.preparing || state?.progress > 0) {
            if (!dismissedRotateHints.has(hintDocument)) dismissRotateHint();
            swipeHintPhases.set(hintDocument, "done");
            syncRotateControl();
        }
        if (!ready || (!inView && !(state?.progress > 0 || displayAboutProgress > 0))) return;
        const dt = Math.min(.05, (deltaMs || 16.7) / 1000);
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
        const requestedProgress = introComplete ? state?.progress || 0 : 0;
        displayAboutProgress = advanceAboutProgress(
            displayAboutProgress, requestedProgress, dt,
            !introComplete || reduced() || Boolean(state?.preparing) || preparedNow
        );
        const progress = displayAboutProgress;
        // Reveal About slightly after the outgoing cans begin fading.
        // Use rendered (not raw scroll) progress so reverse scrolling stays synced.
        const contentFade = aboutPhases(progress).reveal;
        if (!state?.failed && contentFade !== lastContentFade) {
            trackElement?.style.setProperty("--about-content-fade", String(contentFade));
            lastContentFade = contentFade;
        }
        if (progress > 0 && mangoIndex >= 0) {
            syncRotateControl();
            const nextIngredientsProgress = ingredientsProgress();
            if (aboutOrigin === null || progress !== lastAboutProgress || nextIngredientsProgress !== lastIngredientsProgress || dirty || aboutState?.current?.returnToMango) {
                updateAboutLayout(progress, nextIngredientsProgress);
                lastAboutProgress = progress;
                lastIngredientsProgress = nextIngredientsProgress;
                dirty = false;
                renderScene(aboutPhases(progress).land > 0);
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
        syncRotateControl();
        if (heldCan) {
            if (performance.now() - holdStartedAt >= 1000) dismissRotateHint();
            // User-controlled rotation: one full turn every six seconds.
            heldCan.userData.spin.rotation.y -= dt * Math.PI * 2 / 6;
            dirty = true;
        }
        if (!dirty) return;
        dirty = false;
        renderScene();
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
    const updateAboutLayout = (progress, ingredientProgress = 0) => {
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
        const ingredientTile = aboutState?.current?.ingredientsTarget?.getBoundingClientRect();
        const ingredientBlend = ingredientTile ? ingredientProgress : 0;
        const ingredientTurn = ingredientsRotationProgress(ingredientBlend);
        const rect = stage.getBoundingClientRect();
        let landingScale = 1.05;
        tilePoint.set(1.3, -.08, .65);
        if (tile && rect.width > 0 && rect.height > 0) {
            const mobileAbout = window.matchMedia("(max-width: 767px)").matches;
            const centerX = tile.left + tile.width * .5;
            const centerY = tile.top + tile.height * .5;
            const nextX = ingredientTile ? ingredientTile.left + ingredientTile.width * .5 : centerX;
            const nextY = ingredientTile ? ingredientTile.top + ingredientTile.height * .5 : centerY;
            targetRay.setFromCamera(new THREE.Vector2(
                (lerp(centerX, nextX, ingredientBlend) - rect.left) / rect.width * 2 - 1,
                1 - (lerp(centerY, nextY, ingredientBlend) - rect.top) / rect.height * 2
            ), camera);
            targetRay.ray.intersectPlane(tilePlane, tilePoint);
            const top = tilePoint.clone().add(new THREE.Vector3(0, .74, 0)).project(camera);
            const bottom = tilePoint.clone().add(new THREE.Vector3(0, -.74, 0)).project(camera);
            const unitHeight = Math.abs(top.y - bottom.y) * rect.height / 2;
            // Keep the tilted can inside the square desktop grid or 5:4 mobile
            // grid, allowing margin for the projected rim and tilted silhouette.
            const relativeScale = tile.height * (mobileAbout ? .85 : .90) / Math.max(1, unitHeight);
            const gridScale = mobileAbout ? relativeScale : Math.min(relativeScale, 1.65);
            // Align the can's local Y axis perpendicular to the camera ray
            // at its actual position. A zero Euler tilt alone still exposes
            // the lid because the hero camera looks down from above.
            ingredientFacingMatrix.lookAt(camera.position, tilePoint, ingredientWorldUp);
            ingredientFacing.setFromRotationMatrix(ingredientFacingMatrix);
            ingredientUp.set(0, .74, 0).applyQuaternion(ingredientFacing);
            const frontTop = tilePoint.clone().add(ingredientUp).project(camera);
            const frontBottom = tilePoint.clone().sub(ingredientUp).project(camera);
            const frontUnitHeight = Math.abs(frontTop.y - frontBottom.y) * rect.height / 2;
            const ingredientScale = ingredientTile ? ingredientTile.height * .96 / Math.max(1, frontUnitHeight) : gridScale;
            landingScale = lerp(gridScale, ingredientScale, ingredientBlend);
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
                    // The destination is the real tile in the next section's
                    // current viewport position, not a fixed coordinate in the hero.
                    can.position.set(lerp(0, tilePoint.x, land),
                        lerp(-.11, tilePoint.y, land) - Math.sin(Math.PI * land) * .24,
                        lerp(0, tilePoint.z, land));
                    can.scale.setScalar(lerp(.86, landingScale, land));
                    tilt.rotation.set(-.12 * land, 0, -.43 * land);
                    tilt.quaternion.slerp(ingredientFacing, ingredientTurn);
                    // The original label's ingredients panel is centered at U ≈ .865.
                    // Continue the existing rotation toward that panel, then stop.
                    const labelAngle = lerp(.15, Math.PI * 2 * (.865 - .5), ingredientTurn);
                    can.userData.spin.rotation.y = frontRotation - Math.PI * 2 * land - labelAngle * land;
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
        sizeCanvas(width, height);
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
        if (heldCan || touchPreference.matches) return;
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
        stopHeldRotation();
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

    const onSwipeHint = direction => {
        if (!canBrowse() || heldCan || swipeHintPhases.get(hintDocument) !== direction) return;
        advanceSwipeHint();
        snapTo(Math.round(track.position) + (direction === "right" ? 1 : -1));
        syncRotateControl();
    };
    const onRightHint = () => onSwipeHint("right");
    const onLeftHint = () => onSwipeHint("left");

    const hitsCenterCan = (event) => {
        const center = cans[activeIndex]?.primary;
        if (!center) return false;
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return false;
        pointer.set((event.clientX - rect.left) / rect.width * 2 - 1,
            1 - (event.clientY - rect.top) / rect.height * 2);
        scene.updateMatrixWorld(true);
        camera.updateMatrixWorld();
        raycaster.setFromCamera(pointer, camera);
        return raycaster.intersectObject(center, true).length > 0;
    };

    const onPointerDown = (event) => {
        if (!ready || !introComplete || aboutState?.current?.preparing || drag || aboutProgress() >= .985 || !event.isPrimary || event.button !== 0) return;
        if (heldCan) return;
        const directHold = event.pointerType !== "mouse" && canHoldRotate() && hitsCenterCan(event);
        stopHeldRotation();
        cancelSnap();
        stopSpin(true);
        // Keep the angle for a new hold. Reset only when a carousel drag begins.
        if (!directHold && aboutProgress() === 0) cans.forEach(({ primary, copy }) => {
            returnToFront(primary, true);
            returnToFront(copy, true);
        });
        drag = {
            id: event.pointerId, x: event.clientX, y: event.clientY,
            origin: track.position, lastPosition: track.position,
            lastTime: performance.now(), velocity: 0, moved: false,
            axis: null, scrollY: event.clientY, aboutOnly: aboutProgress() > 0,
            directHold,
        };
        stage.setPointerCapture(event.pointerId);
        stage.style.cursor = "grabbing";
        if (directHold) {
            // Brief intent delay lets normal swipes win over a stationary press.
            const candidate = drag;
            pendingHold = window.setTimeout(() => {
                pendingHold = null;
                if (drag !== candidate || drag.axis) return;
                drag = null;
                if (beginHeldRotation()) {
                    heldPointer = candidate.id;
                    heldCapture = stage;
                } else {
                    drag = candidate;
                }
            }, 160);
        }
    };

    const onPointerMove = (event) => {
        if (heldCan) return;
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
            clearPendingHold();
            drag.axis = drag.aboutOnly || Math.abs(dy) > Math.abs(dx) ? "vertical" : "horizontal";
            if (drag.directHold && drag.axis === "horizontal") cans.forEach(({ primary, copy }) => {
                returnToFront(primary, true);
                returnToFront(copy, true);
            });
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
        if (event.pointerId === heldPointer) {
            if (heldCan && !canceled) dismissRotateHint();
            stopHeldRotation();
            stage.style.cursor = "grab";
            return;
        }
        if (!drag || event.pointerId !== drag.id) return;
        clearPendingHold();
        const previous = drag;
        drag = null;
        if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
        stage.style.cursor = "grab";
        if (aboutState?.current?.preparing || aboutProgress() > 0 || previous.axis === "vertical" || (previous.directHold && !previous.axis)) return;
        const velocity = performance.now() - previous.lastTime > 100 ? 0 : previous.velocity;
        if (event.pointerType !== "mouse" || canceled) lastMouse = null;
        const target = previous.moved
            ? getSnap(track.position, previous.origin, velocity, canceled)
            : Math.round(track.position);
        if (!canceled && previous.axis === "horizontal" && previous.moved &&
            target !== Math.round(previous.origin)) advanceSwipeHint();
        snapTo(target, velocity);
        syncRotateControl();
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
        advanceSwipeHint();
        snapTo(Math.round(track.position) + (event.key === "ArrowRight" ? 1 : -1));
        syncRotateControl();
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
    const onAboutScroll = () => {
        if (aboutProgress() > 0) invalidate();
    };
    // Text wrapping, font loading and viewport changes can resize the ice
    // independently of the hero canvas. Keep its live landing target in sync.
    const aboutArtworkObserver = new ResizeObserver(onAboutScroll);
    const aboutArtwork = trackElement?.querySelector("[data-about-artwork]");
    if (aboutArtwork) aboutArtworkObserver.observe(aboutArtwork);
    const ingredientsArtwork = trackElement?.querySelector("[data-ingredients-artwork]");
    if (ingredientsArtwork) aboutArtworkObserver.observe(ingredientsArtwork);
    // Short mobile viewports may scroll past the initial About landing point.
    // Re-project the can onto its real ice grid as the document continues moving.
    window.addEventListener("scroll", onAboutScroll, { passive: true });
    window.visualViewport?.addEventListener("resize", onAboutScroll, { passive: true });
    window.visualViewport?.addEventListener("scroll", onAboutScroll, { passive: true });
    const visibility = new IntersectionObserver(entries => {
        inView = entries[0]?.isIntersecting ?? true;
        if (!inView) {
            stopHeldRotation();
            syncRotateControl();
            lastMouse = null;
            parallax.set(0, 0);
            stopSpin(true);
        }
        invalidate();
    });
    visibility.observe(stage);

    rightHint?.addEventListener("click", onRightHint);
    leftHint?.addEventListener("click", onLeftHint);
    rotateControl?.addEventListener("pointerdown", onRotateDown);
    rotateControl?.addEventListener("pointerup", onRotateRelease);
    rotateControl?.addEventListener("pointercancel", onRotateRelease);
    rotateControl?.addEventListener("lostpointercapture", onRotateRelease);
    rotateControl?.addEventListener("keydown", onRotateKeyDown);
    rotateControl?.addEventListener("keyup", onRotateKeyUp);
    rotateControl?.addEventListener("blur", stopHeldRotation);
    rotateControl?.addEventListener("contextmenu", onRotateContextMenu);
    window.addEventListener("blur", stopHeldRotation);
    document.addEventListener("visibilitychange", onRotateVisibility);
    touchPreference.addEventListener("change", onRotatePreference);
    stage.addEventListener("contextmenu", onStageContextMenu);
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
        stopHeldRotation();
        for (const button of [rightHint, leftHint]) {
            if (!button) continue;
            button.disabled = true;
            button.removeAttribute("data-available");
        }
        rightHint?.removeEventListener("click", onRightHint);
        leftHint?.removeEventListener("click", onLeftHint);
        hero?.style.removeProperty("--swipe-y");
        rotateControl?.removeAttribute("data-available");
        rotateControl?.removeAttribute("data-dismissed");
        rotateControl?.removeEventListener("pointerdown", onRotateDown);
        rotateControl?.removeEventListener("pointerup", onRotateRelease);
        rotateControl?.removeEventListener("pointercancel", onRotateRelease);
        rotateControl?.removeEventListener("lostpointercapture", onRotateRelease);
        rotateControl?.removeEventListener("keydown", onRotateKeyDown);
        rotateControl?.removeEventListener("keyup", onRotateKeyUp);
        rotateControl?.removeEventListener("blur", stopHeldRotation);
        rotateControl?.removeEventListener("contextmenu", onRotateContextMenu);
        window.removeEventListener("blur", stopHeldRotation);
        document.removeEventListener("visibilitychange", onRotateVisibility);
        touchPreference.removeEventListener("change", onRotatePreference);
        introTween?.kill();
        cancelSnap();
        stopSpin(true);
        cans.forEach(({ primary, copy }) => {
            gsap.killTweensOf(primary.userData.spin.rotation);
            gsap.killTweensOf(copy.userData.spin.rotation);
        });
        gsap.ticker.remove(render);
        observer.disconnect();
        aboutArtworkObserver.disconnect();
        window.removeEventListener("scroll", onAboutScroll);
        window.visualViewport?.removeEventListener("resize", onAboutScroll);
        window.visualViewport?.removeEventListener("scroll", onAboutScroll);
        if (hero) hero.style.overflow = originalOverflow;
        if (!aboutState?.current?.failed) trackElement?.style.removeProperty("--about-content-fade");
        visibility.disconnect();
        stage.removeEventListener("contextmenu", onStageContextMenu);
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
