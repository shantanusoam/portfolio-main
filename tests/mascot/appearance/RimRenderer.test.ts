import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeRimWidthAt,
  DEFAULT_RIM_CONFIG,
} from "@/lib/mascot/appearance/RimRenderer";

test("rim width is non-negative and finite across the domain", () => {
  for (let i = 0; i <= 40; i += 1) {
    const t = i / 40;
    const width = computeRimWidthAt(t, DEFAULT_RIM_CONFIG, 1);
    assert.ok(Number.isFinite(width));
    assert.ok(width >= 0);
  }
});

test("rim is thinner near the face (t=0) than at the body midpoint (t=0.5)", () => {
  const nearFace = computeRimWidthAt(0, DEFAULT_RIM_CONFIG, 1);
  const midBody = computeRimWidthAt(0.5, DEFAULT_RIM_CONFIG, 1);
  assert.ok(nearFace < midBody, `expected ${nearFace} < ${midBody}`);
});

test("rim reaches full width past the face-thinning zone", () => {
  const pastFace = computeRimWidthAt(
    DEFAULT_RIM_CONFIG.faceThinningEnd + 0.01,
    DEFAULT_RIM_CONFIG,
    1,
  );
  assert.ok(Math.abs(pastFace - DEFAULT_RIM_CONFIG.baseWidth) < 1e-6);
});

test("widthMultiplier scales the result proportionally", () => {
  const base = computeRimWidthAt(0.8, DEFAULT_RIM_CONFIG, 1);
  const doubled = computeRimWidthAt(0.8, DEFAULT_RIM_CONFIG, 2);
  assert.ok(Math.abs(doubled - base * 2) < 1e-9);
});

test("zero widthMultiplier collapses the rim to zero", () => {
  assert.equal(computeRimWidthAt(0.8, DEFAULT_RIM_CONFIG, 0), 0);
});
