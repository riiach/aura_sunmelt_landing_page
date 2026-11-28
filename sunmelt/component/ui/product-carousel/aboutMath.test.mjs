import test from "node:test";
import assert from "node:assert/strict";
import { aboutPhases, nearestFlavorPosition, preparationDuration, preparationProgress, aboutScrollProgress, aboutNavigationEase, aboutViewportMetrics, MANGO_READY, advanceAboutProgress, ingredientsScrollProgress, ingredientsRotationProgress } from "./aboutMath.mjs";

test("the four phases follow the requested order", () => {
    assert.deepEqual(aboutPhases(0), {settle:0,travel:0,fade:0,land:0,reveal:0});
    assert.equal(aboutPhases(.18).settle, 1);
    assert.equal(aboutPhases(.18).travel, 0);
    assert.equal(aboutPhases(.46).travel, 1);
    assert.equal(aboutPhases(.46).fade, 0);
    assert.equal(aboutPhases(.68).fade, 1);
    assert.equal(aboutPhases(.68).land, 0);
    assert.deepEqual(aboutPhases(1), {settle:1,travel:1,fade:1,land:1,reveal:1});
});
test("mango takes the shortest circular path from every flavor", () => {
    assert.deepEqual([0,1,2,3,4].map(i=>nearestFlavorPosition(i,0,5)), [0,0,0,5,5]);
    assert.equal(nearestFlavorPosition(-1,0,5),0);
    assert.equal(nearestFlavorPosition(6,0,5),5);
});
test("travel progress is reversible and distance proportional", () => {
    const p = aboutPhases(.32).travel;
    assert.ok(Math.abs(p-.5)<1e-9);
    assert.equal(2*p, 2*aboutPhases(.32).travel);
});

test("preparation is time driven and distance adjusted", () => {
    const one = preparationDuration(1), two = preparationDuration(2);
    assert.ok(two.travel > one.travel);
    assert.equal(preparationProgress(0, two), 0);
    assert.equal(preparationProgress(two.settle, two), .18);
    assert.equal(preparationProgress(two.settle + two.travel + .01, two), MANGO_READY);
    assert.equal(preparationProgress(.32, preparationDuration(0)), MANGO_READY);
    assert.equal(aboutScrollProgress(0), MANGO_READY);
    assert.equal(aboutScrollProgress(1), 1);
});
test("fade finishes before the rotating landing starts", () => {
    assert.equal(aboutPhases(MANGO_READY).fade, 0);
    assert.ok(aboutPhases(.57).fade > 0 && aboutPhases(.57).fade < 1);
    assert.equal(aboutPhases(.68).fade, 1);
    assert.equal(aboutPhases(.68).land, 0);
});

test("About content fades in later than the outgoing cans", () => {
    assert.equal(aboutPhases(.60).reveal, 0);
    assert.ok(aboutPhases(.60).fade > .65);
    assert.ok(aboutPhases(.68).reveal > 0 && aboutPhases(.68).reveal < .5);
    assert.ok(Math.abs(aboutPhases(.75).reveal - .5) < 1e-9);
    assert.equal(aboutPhases(.90).reveal, 1);
});

test("reverse scroll limits speed and restores the hero smoothly", () => {
    let p = 1;
    const dt = 1 / 60;
    const first = advanceAboutProgress(p, 0, dt);
    assert.ok(first > .98 && first < 1);
    for (let i = 0; i < 60; i++) {
        const next = advanceAboutProgress(p, 0, dt);
        assert.ok(next <= p && next >= 0);
        p = next;
    }
    assert.ok(p > .2);
    for (let i = 0; i < 180; i++) p = advanceAboutProgress(p, 0, dt);
    assert.equal(p, 0);
});
test("forward scroll and reduced motion do not inherit reverse lag", () => {
    assert.equal(advanceAboutProgress(.2, .9, 1/60), .9);
    assert.equal(advanceAboutProgress(.9, 0, 1/60, true), 0);
});


test("menu navigation eases from the exact start to the exact destination", () => {
    assert.equal(aboutNavigationEase(-1), 0);
    assert.equal(aboutNavigationEase(0), 0);
    assert.ok(aboutNavigationEase(.25) < .25);
    assert.equal(aboutNavigationEase(.5), .5);
    assert.ok(aboutNavigationEase(.75) > .75);
    assert.equal(aboutNavigationEase(1), 1);
    assert.equal(aboutNavigationEase(2), 1);
});


test("iPad About sizing separates the visible viewport from scroll reach", () => {
    assert.deepEqual(aboutViewportMetrics(820, 900, 760, 1, 0), {visibleHeight:760, scrollHeight:900});
    assert.deepEqual(aboutViewportMetrics(820, 900, 820, 1, 0), {visibleHeight:820, scrollHeight:900});
    assert.deepEqual(aboutViewportMetrics(820, 900, 410, 2, 100), {visibleHeight:820, scrollHeight:900});
    assert.deepEqual(aboutViewportMetrics(768, 768), {visibleHeight:768, scrollHeight:768});
});

test("ingredients scroll is reversible and respects the viewport offset", () => {
    assert.equal(ingredientsScrollProgress(0, 800), 0);
    assert.equal(ingredientsScrollProgress(-400, 400), .5);
    assert.equal(ingredientsScrollProgress(-800, 0), 1);
    assert.equal(ingredientsScrollProgress(-900, -100), 1);
    assert.equal(ingredientsScrollProgress(20, 820, 20), 0);
    assert.equal(ingredientsScrollProgress(0, 0), 0);
    assert.equal(ingredientsRotationProgress(.08), 0);
    assert.equal(ingredientsRotationProgress(.86), 1);
    assert.ok(ingredientsRotationProgress(.45) > 0 && ingredientsRotationProgress(.45) < 1);
});

test("mobile landing spin is rate limited even when scroll jumps to the destination", async () => {
    const { advanceMobileLandingSpin } = await import("./aboutMath.mjs");
    let spin = 0;
    for (let i = 0; i < 30; i++) spin = advanceMobileLandingSpin(spin, 1, 1 / 60);
    assert.ok(Math.abs(spin - .55) < 1e-9);
    for (let i = 0; i < 30; i++) spin = advanceMobileLandingSpin(spin, 1, 1 / 60);
    assert.equal(spin, 1);
    assert.equal(advanceMobileLandingSpin(.8, .4, 1 / 60), .4);
    assert.equal(advanceMobileLandingSpin(0, 1, 1 / 60, true), 1);
});

test("reverse landing does not follow an About tile downward after leaving its section", async () => {
    const { reverseLandingTargetY } = await import("./aboutMath.mjs");
    assert.equal(reverseLandingTargetY(550, 0, 0, true), 550);
    assert.equal(reverseLandingTargetY(950, 400, 0, true), 550);
    assert.equal(reverseLandingTargetY(1250, 700, 0, true), 550);
    assert.equal(reverseLandingTargetY(950, 400, 0, false), 950);
    assert.equal(reverseLandingTargetY(450, -100, 0, true), 450);
    assert.equal(reverseLandingTargetY(970, 420, 20, true), 570);
});

test("mobile phases stay continuous and tied to native scroll in both directions", async () => {
    const { mobileAboutScrollProgress } = await import("./aboutMath.mjs");
    assert.equal(mobileAboutScrollProgress(0), 0);
    assert.equal(mobileAboutScrollProgress(.24), MANGO_READY);
    assert.ok(Math.abs(mobileAboutScrollProgress(.43) - .68) < 1e-9);
    assert.ok(Math.abs(mobileAboutScrollProgress(1) - 1) < 1e-9);
    assert.equal(mobileAboutScrollProgress(-1), 0);
    for (let i = 1; i <= 100; i++) {
        const a = mobileAboutScrollProgress((i - 1) / 100);
        const b = mobileAboutScrollProgress(i / 100);
        assert.ok(b >= a && b - a < .03);
    }
});
