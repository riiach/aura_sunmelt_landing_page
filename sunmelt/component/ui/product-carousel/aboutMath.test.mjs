import test from "node:test";
import assert from "node:assert/strict";
import { aboutPhases, nearestFlavorPosition, preparationDuration, preparationProgress, aboutScrollProgress, MANGO_READY, advanceAboutProgress } from "./aboutMath.mjs";

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
