import test from "node:test";
import assert from "node:assert/strict";
import { aboutPhases, nearestFlavorPosition } from "./aboutMath.mjs";

test("the four phases follow the requested order", () => {
    assert.deepEqual(aboutPhases(0), {settle:0,travel:0,merge:0,land:0,reveal:0});
    assert.equal(aboutPhases(.18).settle, 1);
    assert.equal(aboutPhases(.18).travel, 0);
    assert.equal(aboutPhases(.46).travel, 1);
    assert.equal(aboutPhases(.46).merge, 0);
    assert.equal(aboutPhases(.68).merge, 1);
    assert.equal(aboutPhases(.68).land, 0);
    assert.deepEqual(aboutPhases(1), {settle:1,travel:1,merge:1,land:1,reveal:1});
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
