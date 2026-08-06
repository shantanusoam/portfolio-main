import assert from "node:assert/strict";
import { test } from "node:test";

import {
  closestPointOnRectangle,
  combineSteering,
  computeRectangleSteering,
  expandRectangle,
  isInsideRectangle,
  outwardNormalForInsidePoint,
  type Rectangle,
  type RectangleSteeringConfig,
} from "@/lib/mascot/interaction/RectangleSteering";

const rect: Rectangle = { left: 100, top: 100, right: 200, bottom: 160 };
const config: RectangleSteeringConfig = {
  influenceRadius: 60,
  maxForce: 10,
  tangentWeight: 0.4,
};

test("left side pushes outward with a negative x normal", () => {
  const result = computeRectangleSteering(80, 130, 0, 0, rect, config);
  assert.ok(result.x < 0);
  assert.ok(!result.inside);
});

test("right side pushes outward with a positive x normal", () => {
  const result = computeRectangleSteering(220, 130, 0, 0, rect, config);
  assert.ok(result.x > 0);
});

test("top side pushes outward with a negative y normal", () => {
  const result = computeRectangleSteering(150, 80, 0, 0, rect, config);
  assert.ok(result.y < 0);
});

test("bottom side pushes outward with a positive y normal", () => {
  const result = computeRectangleSteering(150, 180, 0, 0, rect, config);
  assert.ok(result.y > 0);
});

test("corners produce a finite diagonal push", () => {
  const corners = [
    [90, 90],
    [210, 90],
    [210, 170],
    [90, 170],
  ];
  for (const [x, y] of corners) {
    const result = computeRectangleSteering(x, y, 0, 0, rect, config);
    assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
    const magnitude = Math.hypot(result.x, result.y);
    assert.ok(magnitude > 0 && magnitude <= config.maxForce + 1e-6);
  }
});

test("a point inside the rectangle exits through the nearest side", () => {
  const result = computeRectangleSteering(105, 130, 0, 0, rect, config);
  assert.equal(result.inside, true);
  assert.ok(
    result.x < 0,
    "closest side is left, so force should point left (negative x)",
  );
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
});

test("zero distance to the boundary is finite, not NaN or Infinity", () => {
  const result = computeRectangleSteering(rect.left, 130, 0, 0, rect, config);
  assert.ok(Number.isFinite(result.x) && Number.isFinite(result.y));
});

test("outside the influence radius produces zero steering", () => {
  const result = computeRectangleSteering(1000, 1000, 0, 0, rect, config);
  assert.equal(result.x, 0);
  assert.equal(result.y, 0);
  assert.equal(result.inside, false);
});

test("tangent selection favors the direction aligned with current travel", () => {
  // Approaching the left side while moving straight up (-y): the tangent
  // aligned with upward travel should dominate the y component more than
  // when approaching while moving straight down (+y).
  const movingUp = computeRectangleSteering(80, 130, 0, -50, rect, config);
  const movingDown = computeRectangleSteering(80, 130, 0, 50, rect, config);
  assert.ok(movingUp.y < movingDown.y, `up=${movingUp.y} down=${movingDown.y}`);
});

test("force never exceeds maxForce for a single rectangle", () => {
  for (const [x, y] of [
    [80, 130],
    [90, 90],
    [105, 130],
  ]) {
    const result = computeRectangleSteering(x, y, 30, 40, rect, config);
    const magnitude = Math.hypot(result.x, result.y);
    assert.ok(
      magnitude <= config.maxForce + 1e-6,
      `magnitude ${magnitude} exceeds cap`,
    );
  }
});

test("combineSteering sums forces and caps the total magnitude", () => {
  const combined = combineSteering(
    [
      { x: 8, y: 0 },
      { x: 8, y: 0 },
    ],
    10,
  );
  const magnitude = Math.hypot(combined.x, combined.y);
  assert.ok(Math.abs(magnitude - 10) < 1e-6);
});

test("combineSteering leaves a small combined force untouched", () => {
  const combined = combineSteering([{ x: 1, y: 1 }], 10);
  assert.equal(combined.x, 1);
  assert.equal(combined.y, 1);
});

test("expandRectangle grows the rectangle by padding on every side", () => {
  const expanded = expandRectangle(rect, 5);
  assert.deepEqual(expanded, { left: 95, top: 95, right: 205, bottom: 165 });
});

test("closestPointOnRectangle clamps into the rectangle", () => {
  assert.deepEqual(closestPointOnRectangle(50, 50, rect), { x: 100, y: 100 });
  assert.deepEqual(closestPointOnRectangle(150, 130, rect), { x: 150, y: 130 });
});

test("isInsideRectangle is inclusive of the boundary", () => {
  assert.equal(isInsideRectangle(100, 100, rect), true);
  assert.equal(isInsideRectangle(99, 100, rect), false);
});

test("outwardNormalForInsidePoint always returns a unit axis vector", () => {
  const normal = outwardNormalForInsidePoint(101, 130, rect);
  const length = Math.hypot(normal.x, normal.y);
  assert.ok(Math.abs(length - 1) < 1e-9);
});
