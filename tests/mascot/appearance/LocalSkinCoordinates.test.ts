import assert from "node:assert/strict";
import { test } from "node:test";

import {
  boneBlendForU,
  resolveLocalPoint,
} from "@/lib/mascot/appearance/LocalSkinCoordinates";
import { computeRibs } from "@/lib/mascot/character/CreatureRig";
import { DEFAULT_BODY_PROFILE } from "@/lib/mascot/character/BodyProfile";
import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";

const spineConfig: SpineSolverConfig = {
  jointCount: 10,
  segmentLength: 10,
  headAngleLimitRadians: (10 * Math.PI) / 180,
  tailAngleLimitRadians: (30 * Math.PI) / 180,
  iterations: 4,
};

test("boneBlendForU stays within valid rib index bounds across the domain", () => {
  const ribCount = 10;
  for (let i = 0; i <= 40; i += 1) {
    const u = -0.2 + (i / 40) * 1.4; // sweep beyond [0, 1] too
    const { boneA, boneB, weightB } = boneBlendForU(u, ribCount);
    assert.ok(boneA >= 0 && boneA <= ribCount - 1);
    assert.ok(boneB >= 0 && boneB <= ribCount - 1);
    assert.ok(weightB >= 0 && weightB <= 1);
  }
});

test("resolveLocalPoint returns null for an empty rib set", () => {
  const result = resolveLocalPoint({ u: 0.5, v: 0 }, []);
  assert.equal(result, null);
});

test("v=0 lands exactly on the spine centerline", () => {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 0, -50, spineConfig);
  const ribs = computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 20 },
    normalSmoothing: 0,
  });

  const resolved = resolveLocalPoint({ u: 0.5, v: 0 }, ribs);
  assert.ok(resolved);

  const { boneA, boneB, weightB } = boneBlendForU(0.5, ribs.length);
  const a = ribs[boneA];
  const b = ribs[boneB];
  const expectedX = a.center.x + (b.center.x - a.center.x) * weightB;
  const expectedY = a.center.y + (b.center.y - a.center.y) * weightB;

  assert.ok(Math.abs(resolved!.x - expectedX) < 1e-6);
  assert.ok(Math.abs(resolved!.y - expectedY) < 1e-6);
});

test("v=1 lands offset from the centerline by the resolved width, along the resolved normal", () => {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 0, -50, spineConfig);
  const ribs = computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 20 },
    normalSmoothing: 0,
  });

  const center = resolveLocalPoint({ u: 0.4, v: 0 }, ribs)!;
  const offset = resolveLocalPoint({ u: 0.4, v: 1 }, ribs)!;

  const dist = Math.hypot(offset.x - center.x, offset.y - center.y);
  assert.ok(
    Math.abs(dist - offset.width) < 1e-6,
    `expected offset ~= width, got ${dist} vs ${offset.width}`,
  );
});

test("widths override substitutes the caller-provided contour widths", () => {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 0, -50, spineConfig);
  const ribs = computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 20 },
    normalSmoothing: 0,
  });

  const overrideWidths = ribs.map(() => 5);
  const resolved = resolveLocalPoint({ u: 0.3, v: 1 }, ribs, {
    widths: overrideWidths,
  });
  assert.ok(resolved);
  assert.ok(Math.abs(resolved!.width - 5) < 1e-6);
});
