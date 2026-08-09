import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyBounce,
  computeHorizontalReach,
  computeMaxJumpHeight,
  computeTimeToHeight,
  createInitialPlayerState,
  integratePlayer,
  isReachable,
} from "@/lib/mascot/game/AscentPhysics";

test("integratePlayer applies gravity and clamps to max fall speed", () => {
  let state = createInitialPlayerState(0, 0);
  for (let i = 0; i < 600; i += 1) {
    state = integratePlayer(state, 1 / 60);
  }
  assert.ok(state.velocityY <= 900 + 1e-6);
  assert.ok(state.velocityY > 0);
});

test("integratePlayer tracks previousX/previousY from the prior step", () => {
  const state = createInitialPlayerState(10, 20);
  const next = integratePlayer(state, 1 / 60);
  assert.equal(next.previousX, 10);
  assert.equal(next.previousY, 20);
});

test("applyBounce sets a negative (upward) velocityY and the grounded reference", () => {
  const state = createInitialPlayerState(0, 0);
  const bounced = applyBounce(state, 640, "platform-1");
  assert.equal(bounced.velocityY, -640);
  assert.equal(bounced.groundedStringId, "platform-1");
  assert.ok(bounced.coyoteTimer > 0);
});

test("applyBounce always produces an upward velocity regardless of sign passed in", () => {
  const state = createInitialPlayerState(0, 0);
  const bounced = applyBounce(state, -640, "platform-1");
  assert.equal(bounced.velocityY, -640);
});

test("computeMaxJumpHeight matches v^2/(2g)", () => {
  const height = computeMaxJumpHeight(640, 1400);
  assert.ok(Math.abs(height - (640 * 640) / (2 * 1400)) < 1e-6);
});

test("computeMaxJumpHeight is zero for non-positive gravity", () => {
  assert.equal(computeMaxJumpHeight(640, 0), 0);
});

test("computeTimeToHeight returns null when the height exceeds the apex", () => {
  const maxHeight = computeMaxJumpHeight(640, 1400);
  assert.equal(computeTimeToHeight(640, 1400, maxHeight + 50), null);
});

test("computeTimeToHeight returns a positive time for a reachable height", () => {
  const maxHeight = computeMaxJumpHeight(640, 1400);
  const t = computeTimeToHeight(640, 1400, maxHeight * 0.5);
  assert.ok(t !== null && t > 0);
});

test("computeTimeToHeight is a real root of the projectile equation", () => {
  const bounceSpeed = 640;
  const gravity = 1400;
  const deltaHeight = 120;
  const t = computeTimeToHeight(bounceSpeed, gravity, deltaHeight);
  assert.ok(t !== null);
  const reached =
    bounceSpeed * (t as number) - 0.5 * gravity * (t as number) ** 2;
  assert.ok(Math.abs(reached - deltaHeight) < 1e-3);
});

test("computeHorizontalReach grows with time and is bounded by acceleration ramp-up", () => {
  const maxSpeed = 340;
  const acceleration = 2200;
  const timeToMax = maxSpeed / acceleration;

  const shortReach = computeHorizontalReach(
    maxSpeed,
    acceleration,
    timeToMax / 2,
  );
  assert.ok(shortReach < 0.5 * acceleration * (timeToMax / 2) ** 2 + 1e-6);
  assert.ok(shortReach < maxSpeed * (timeToMax / 2));

  const longReach = computeHorizontalReach(
    maxSpeed,
    acceleration,
    timeToMax * 3,
  );
  const expected =
    0.5 * acceleration * timeToMax * timeToMax +
    maxSpeed * (timeToMax * 3 - timeToMax);
  assert.ok(Math.abs(longReach - expected) < 1e-6);
});

test("computeHorizontalReach is zero for non-positive time", () => {
  assert.equal(computeHorizontalReach(340, 2200, 0), 0);
  assert.equal(computeHorizontalReach(340, 2200, -1), 0);
});

test("isReachable is true within the physical bound and false just beyond it", () => {
  const bounceSpeed = 640;
  const gravity = 1400;
  const maxSpeed = 340;
  const acceleration = 2200;
  const dy = 120;

  const time = computeTimeToHeight(bounceSpeed, gravity, dy) as number;
  const reach = computeHorizontalReach(maxSpeed, acceleration, time);

  assert.ok(
    isReachable(reach * 0.9, dy, bounceSpeed, gravity, maxSpeed, acceleration),
  );
  assert.ok(
    !isReachable(reach * 1.5, dy, bounceSpeed, gravity, maxSpeed, acceleration),
  );
});

test("isReachable is false for a height above the apex", () => {
  const maxHeight = computeMaxJumpHeight(640, 1400);
  assert.ok(!isReachable(0, maxHeight + 100, 640, 1400, 340, 2200));
});
