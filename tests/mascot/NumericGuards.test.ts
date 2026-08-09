import assert from "node:assert/strict";
import { test } from "node:test";

import {
  angleLerp,
  approxEqual,
  clamp,
  distance,
  isFiniteNumber,
  lerp,
  normalize,
  safeLength,
  toFiniteOr,
  wrapAngle,
} from "@/lib/mascot/core/NumericGuards";

test("clamp bounds a value into [min, max]", () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test("lerp interpolates linearly", () => {
  assert.equal(lerp(0, 10, 0), 0);
  assert.equal(lerp(0, 10, 1), 10);
  assert.equal(lerp(0, 10, 0.5), 5);
});

test("isFiniteNumber rejects NaN, Infinity, and non-numbers", () => {
  assert.equal(isFiniteNumber(1), true);
  assert.equal(isFiniteNumber(NaN), false);
  assert.equal(isFiniteNumber(Infinity), false);
  assert.equal(isFiniteNumber("1"), false);
  assert.equal(isFiniteNumber(undefined), false);
});

test("safeLength never returns a value low enough to explode a division", () => {
  assert.ok(safeLength(0, 0) > 0);
  assert.equal(safeLength(3, 4), 5);
});

test("normalize returns a unit vector even for a zero-length input", () => {
  const zero = normalize(0, 0);
  assert.ok(Number.isFinite(zero.x));
  assert.ok(Number.isFinite(zero.y));

  const unit = normalize(10, 0);
  assert.ok(approxEqual(unit.x, 1));
  assert.ok(approxEqual(unit.y, 0));
  assert.equal(unit.length, 10);
});

test("toFiniteOr falls back only for non-finite input", () => {
  assert.equal(toFiniteOr(5, 0), 5);
  assert.equal(toFiniteOr(NaN, 42), 42);
  assert.equal(toFiniteOr(Infinity, 42), 42);
});

test("wrapAngle keeps angles within (-PI, PI]", () => {
  assert.ok(approxEqual(wrapAngle(0), 0));
  assert.ok(
    approxEqual(wrapAngle(Math.PI * 3), -Math.PI, 1e-9) ||
      approxEqual(wrapAngle(Math.PI * 3), Math.PI, 1e-9),
  );
  const wrapped = wrapAngle(-Math.PI * 5);
  assert.ok(wrapped > -Math.PI - 1e-9 && wrapped <= Math.PI + 1e-9);
});

test("angleLerp takes the shortest path across the +-PI seam", () => {
  const near180 = angleLerp(Math.PI - 0.1, -Math.PI + 0.1, 0.5);
  // Shortest path from just-under-PI to just-over-negative-PI crosses the
  // seam, so the midpoint should be near +-PI, not near 0.
  assert.ok(Math.abs(Math.abs(near180) - Math.PI) < 0.05);
});

test("distance matches Math.hypot", () => {
  assert.equal(distance(0, 0, 3, 4), 5);
});
