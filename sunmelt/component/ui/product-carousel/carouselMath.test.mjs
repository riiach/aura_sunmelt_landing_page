import assert from "node:assert/strict";
import { test } from "node:test";
import { wrap, mod, scaleAt, getLayout, getSnap, centerWeight, depthAt, rightTilt, isSelected } from "./carouselMath.mjs";

test("desktop shows five whole cans, tablet shows three, mobile peeks on both sides", () => {
    const sideRadius = 0.314 * scaleAt(1);
    const fullCans = width => [-2, -1, 0, 1, 2].filter(x =>
        Math.abs(x) + 0.314 * scaleAt(x) < getLayout(width) / 2
    ).length;
    assert.equal(fullCans(1280), 5);
    assert.equal(fullCans(768), 3);
    assert.equal(fullCans(375), 1);
    assert.ok(1 - sideRadius < getLayout(375) / 2);
    assert.ok(1 + sideRadius > getLayout(375) / 2);
});

test("short drags return; left and right drags advance in the correct direction", () => {
    assert.equal(getSnap(2.08, 2, 0), 2);
    assert.equal(getSnap(2.25, 2, 0), 3);
    assert.equal(getSnap(1.75, 2, 0), 1);
    assert.equal(getSnap(2.7, 2, 0, true), 2);
});

test("velocity projects the track forward and snap distance is bounded", () => {
    assert.equal(getSnap(2.08, 2, 0.004), 3);
    assert.equal(getSnap(4.7, 4, 0.003), 5);
    assert.equal(getSnap(30, 2, 0.04), 5);
});

test("loop wraps in both directions and duplicates meet at the seam", () => {
    assert.equal(mod(5, 5), 0);
    assert.equal(mod(-1, 5), 4);
    assert.equal(wrap(3, 5), -2);
    assert.equal(wrap(-3, 5), 2);
    const before = wrap(2.499, 5);
    const after = wrap(2.501, 5) + 5;
    assert.ok(Math.abs(before - after) < 0.003);
});

test("center scale grows continuously and neighboring cans have equal scale", () => {
    assert.ok(scaleAt(0) > scaleAt(0.5));
    assert.ok(scaleAt(0.5) > scaleAt(1));
    assert.equal(scaleAt(-1), scaleAt(1));
    assert.equal(scaleAt(1), scaleAt(2));
});

test("the center is closer and the sides recede symmetrically", () => {
    assert.ok(depthAt(0) > depthAt(1));
    assert.ok(depthAt(1) > depthAt(2));
    assert.equal(depthAt(-1), depthAt(1));
    assert.equal(centerWeight(0), 1);
    assert.equal(centerWeight(1), 0);
});

test("only one product owns selection and its right tilt is twelve degrees", () => {
    assert.ok(Math.abs(rightTilt * 180 / Math.PI + 12) < 1e-9);
    for (const position of [-1.3, 0, .49, .51, 2, 4.9, 5.2]) {
        assert.equal([0, 1, 2, 3, 4].filter(index => isSelected(index, position, 5)).length, 1);
    }
    assert.equal(isSelected(0, 4.9, 5), true);
    assert.equal(isSelected(2, 2, 5), true);
});
