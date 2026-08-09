import assert from "node:assert/strict";
import { test } from "node:test";

import {
  clampFacialPose,
  computeFacialPose,
  neutralFacialPose,
  sanitizeFacialMotionInput,
} from "@/lib/mascot/appearance/FacialMotionMatrix";
import type { FacialMotionInput, FacialPose } from "@/lib/mascot/types";

function baseInput(
  overrides: Partial<FacialMotionInput> = {},
): FacialMotionInput {
  return {
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    speed: 0,
    fallingSpeed: 0,
    dragTension: 0,
    collisionImpulse: 0,
    stringTension: 0,
    targetDirectionX: 0,
    targetDirectionY: -1,
    ...overrides,
  };
}

test("expected use: fast horizontal drag leans head and narrows eyelids", () => {
  const pose = computeFacialPose(
    baseInput({
      velocityX: 220,
      speed: 220,
      dragTension: 0.7,
      targetDirectionX: 1,
      targetDirectionY: 0,
    }),
  );
  assert.ok(
    pose.headLean > 0.15,
    `expected forward lean, got ${pose.headLean}`,
  );
  assert.ok(pose.eyelid > 0.1, `expected squint, got ${pose.eyelid}`);
  assert.ok(pose.pupilX > 0.1, `expected eyes look ahead, got ${pose.pupilX}`);
  assert.ok(pose.mouthCurve < 0.1, "mouth should tighten, not smile wide");
});

test("expected use: falling widens eyes and opens mouth with downward pupils", () => {
  const pose = computeFacialPose(
    baseInput({
      velocityY: 200,
      fallingSpeed: 200,
      speed: 200,
    }),
  );
  assert.ok(pose.eyeScaleY > 1, `expected wider eyes, got ${pose.eyeScaleY}`);
  assert.ok(pose.pupilY > 0.2, `expected downward gaze, got ${pose.pupilY}`);
  assert.ok(
    pose.mouthOpen > 0.15,
    `expected open mouth, got ${pose.mouthOpen}`,
  );
});

test("expected use: successful chord brightens eyes and smiles", () => {
  const pose = computeFacialPose(
    baseInput({
      stringTension: 0.85,
      collisionImpulse: 0.1,
    }),
  );
  assert.ok(pose.mouthCurve > 0.25, `expected smile, got ${pose.mouthCurve}`);
  assert.ok(pose.eyeScaleY > 1, `expected bright eyes, got ${pose.eyeScaleY}`);
  assert.ok(pose.cheekIntensity > 0.2);
});

test("edge: rest lowers eyelids with near-zero motion", () => {
  const pose = computeFacialPose(baseInput());
  assert.ok(
    pose.eyelid > 0.15,
    `expected drowsy lids at rest, got ${pose.eyelid}`,
  );
  assert.ok(Math.abs(pose.headLean) < 0.05);
  assert.ok(pose.mouthOpen < 0.1);
});

test("edge: high drag tension squints without requiring horizontal speed", () => {
  const pose = computeFacialPose(
    baseInput({
      dragTension: 0.9,
      targetDirectionX: -1,
      targetDirectionY: 0.2,
    }),
  );
  assert.ok(pose.eyelid > 0.25);
  assert.ok(pose.pupilX < -0.15);
  assert.ok(pose.mouthCurve < 0);
});

test("failure/clamp: NaN and extreme inputs sanitize to finite clamped pose", () => {
  const dirty = sanitizeFacialMotionInput(
    baseInput({
      velocityX: Number.NaN,
      velocityY: Number.POSITIVE_INFINITY,
      accelerationX: Number.NaN,
      speed: -50,
      fallingSpeed: -10,
      dragTension: 4,
      collisionImpulse: -2,
      stringTension: 99,
      targetDirectionX: 5,
      targetDirectionY: -5,
    }),
  );
  assert.equal(dirty.velocityX, 0);
  assert.equal(dirty.speed, 0);
  assert.equal(dirty.fallingSpeed, 0);
  assert.equal(dirty.dragTension, 1);
  assert.equal(dirty.collisionImpulse, 0);
  assert.equal(dirty.stringTension, 1);
  assert.equal(dirty.targetDirectionX, 1);
  assert.equal(dirty.targetDirectionY, -1);

  const pose = computeFacialPose(
    baseInput({
      velocityX: 1e9,
      fallingSpeed: 1e9,
      dragTension: 1,
      collisionImpulse: 1,
      stringTension: 1,
      accelerationX: 1e9,
      accelerationY: 1e9,
      speed: 1e9,
    }),
  );
  assertPoseFiniteAndClamped(pose);
});

test("clampFacialPose hard-limits every channel", () => {
  const clamped = clampFacialPose({
    pupilX: 4,
    pupilY: -4,
    eyeScaleX: 0.01,
    eyeScaleY: 9,
    eyelid: 2,
    mouthOpen: -1,
    mouthCurve: 3,
    headLean: -3,
    cheekIntensity: 2,
  });
  assertPoseFiniteAndClamped(clamped);
  assert.equal(clamped.pupilX, 1);
  assert.equal(clamped.pupilY, -1);
  assert.equal(clamped.eyelid, 1);
  assert.equal(clamped.mouthOpen, 0);
});

test("neutralFacialPose is the identity acting pose", () => {
  const neutral = neutralFacialPose();
  assert.equal(neutral.eyeScaleX, 1);
  assert.equal(neutral.eyeScaleY, 1);
  assert.equal(neutral.eyelid, 0);
  assert.equal(neutral.mouthOpen, 0);
  assert.equal(neutral.mouthCurve, 0);
});

function assertPoseFiniteAndClamped(pose: FacialPose): void {
  for (const [key, value] of Object.entries(pose)) {
    assert.ok(Number.isFinite(value), `${key} not finite: ${value}`);
  }
  assert.ok(pose.pupilX >= -1 && pose.pupilX <= 1);
  assert.ok(pose.pupilY >= -1 && pose.pupilY <= 1);
  assert.ok(pose.eyeScaleX >= 0.35 && pose.eyeScaleX <= 1.6);
  assert.ok(pose.eyeScaleY >= 0.25 && pose.eyeScaleY <= 1.6);
  assert.ok(pose.eyelid >= 0 && pose.eyelid <= 1);
  assert.ok(pose.mouthOpen >= 0 && pose.mouthOpen <= 1);
  assert.ok(pose.mouthCurve >= -1 && pose.mouthCurve <= 1);
  assert.ok(pose.headLean >= -1 && pose.headLean <= 1);
  assert.ok(pose.cheekIntensity >= 0 && pose.cheekIntensity <= 1);
}
