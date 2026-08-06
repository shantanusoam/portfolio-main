import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";

const baseConfig: SpineSolverConfig = {
  jointCount: 12,
  segmentLength: 12,
  headAngleLimitRadians: (12 * Math.PI) / 180,
  tailAngleLimitRadians: (35 * Math.PI) / 180,
  iterations: 4,
};

test("segment lengths stay within tolerance after solving", () => {
  const joints = createSpineJoints(baseConfig, 0, 0);
  solveSpine(joints, 100, 100, baseConfig);
  solveSpine(joints, 140, 80, baseConfig);

  for (let i = 1; i < joints.length; i += 1) {
    const dist = Math.hypot(
      joints[i].x - joints[i - 1].x,
      joints[i].y - joints[i - 1].y,
    );
    assert.ok(
      Math.abs(dist - baseConfig.segmentLength) < 1e-6,
      `segment ${i} length ${dist} deviates from ${baseConfig.segmentLength}`,
    );
  }
});

test("root pin remains exact", () => {
  const joints = createSpineJoints(baseConfig, 0, 0);
  solveSpine(joints, 53.4, -22.1, baseConfig);
  assert.equal(joints[0].x, 53.4);
  assert.equal(joints[0].y, -22.1);
});

test("angle limit prevents a sharp turn from folding the chain", () => {
  const joints = createSpineJoints(baseConfig, 0, 0);
  // Settle pointing straight down (+y).
  for (let i = 0; i < 30; i += 1) {
    solveSpine(joints, 0, i * baseConfig.segmentLength, baseConfig);
  }
  // Now yank the root hard to the side - a full 180-degree fold must not
  // appear in any single segment given the configured angle limits.
  solveSpine(joints, 400, 0, baseConfig);

  for (let i = 2; i < joints.length; i += 1) {
    const a = joints[i - 1].angle;
    const b = joints[i].angle;
    let delta = Math.abs(a - b);
    if (delta > Math.PI) delta = Math.PI * 2 - delta;
    assert.ok(
      delta <= baseConfig.tailAngleLimitRadians + 1e-6,
      `joint ${i} turned ${delta} rad`,
    );
  }
});

test("coincident joints recover to valid segment lengths without NaN", () => {
  const joints = createSpineJoints(baseConfig, 5, 5);
  for (const joint of joints) {
    joint.x = 5;
    joint.y = 5;
  }
  solveSpine(joints, 5, 5, baseConfig);
  solveSpine(joints, 60, 5, baseConfig);

  for (const joint of joints) {
    assert.ok(Number.isFinite(joint.x));
    assert.ok(Number.isFinite(joint.y));
    assert.ok(Number.isFinite(joint.angle));
  }
  for (let i = 1; i < joints.length; i += 1) {
    const dist = Math.hypot(
      joints[i].x - joints[i - 1].x,
      joints[i].y - joints[i - 1].y,
    );
    assert.ok(Math.abs(dist - baseConfig.segmentLength) < 1e-6);
  }
});

test("iteration count is bounded even when given an absurd value", () => {
  const joints = createSpineJoints(baseConfig, 0, 0);
  const start = Date.now();
  solveSpine(joints, 10, 10, { ...baseConfig, iterations: 1_000_000 });
  const elapsed = Date.now() - start;
  assert.ok(
    elapsed < 500,
    `solve took ${elapsed}ms, iterations were not bounded`,
  );
  for (const joint of joints) {
    assert.ok(Number.isFinite(joint.x));
    assert.ok(Number.isFinite(joint.y));
  }
});

test("no non-finite values across a longer simulated path", () => {
  const joints = createSpineJoints(baseConfig, 0, 0);
  for (let i = 0; i < 200; i += 1) {
    const x = Math.sin(i * 0.1) * 200;
    const y = Math.cos(i * 0.13) * 150;
    solveSpine(joints, x, y, baseConfig);
    for (const joint of joints) {
      assert.ok(Number.isFinite(joint.x));
      assert.ok(Number.isFinite(joint.y));
      assert.ok(Number.isFinite(joint.angle));
    }
  }
});
