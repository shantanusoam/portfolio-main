import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeFryDesiredVelocity,
  predictedThreatPoint,
  tangentialDodge,
} from "@/lib/mascot/ecosystem/FrySteering";

test("predictedThreatPoint looks ahead along predator velocity", () => {
  const predicted = predictedThreatPoint(
    { x: 0, y: 0 },
    { x: 100, y: 0, vx: 80, vy: 0 },
    60,
  );
  assert.ok(predicted.x > 100);
  assert.equal(predicted.y, 0);
});

test("tangentialDodge is zero when the predator is not closing", () => {
  const dodge = tangentialDodge(1, 0, -10, 0, 1);
  assert.equal(dodge.x, 0);
  assert.equal(dodge.y, 0);
});

test("tangentialDodge pushes sideways when the predator closes head-on", () => {
  const dodge = tangentialDodge(1, 0, 60, 0, 1);
  assert.ok(Math.abs(dodge.y) > 10);
  assert.ok(Math.abs(dodge.x) < 1);
});

test("fresh fry desired speed exceeds a typical adult wander pace when threatened", () => {
  const steered = computeFryDesiredVelocity({
    x: 200,
    y: 200,
    vx: 0,
    vy: 0,
    age: 1,
    fatigue: 0,
    dodgeSign: 1,
    reducedMotion: false,
    threats: [{ x: 240, y: 200, vx: -40, vy: 0 }],
    pointer: null,
    hideTarget: null,
    neighbors: [],
    bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600 },
  });
  assert.ok(steered.burst);
  assert.ok(steered.maxSpeed > 90);
  assert.ok(steered.desiredVx < 0, "should flee left away from a right-side threat");
});
