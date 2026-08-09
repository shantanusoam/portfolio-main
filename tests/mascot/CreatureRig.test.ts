import assert from "node:assert/strict";
import { test } from "node:test";

import {
  applyRibLean,
  computeRibs,
  type CreatureRigConfig,
} from "@/lib/mascot/character/CreatureRig";
import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";
import { DEFAULT_BODY_PROFILE } from "@/lib/mascot/character/BodyProfile";

const spineConfig: SpineSolverConfig = {
  jointCount: 16,
  segmentLength: 10,
  headAngleLimitRadians: (10 * Math.PI) / 180,
  tailAngleLimitRadians: (30 * Math.PI) / 180,
  iterations: 4,
};

const rigConfig: CreatureRigConfig = {
  bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 20 },
  normalSmoothing: 0.3,
};

function buildJoints() {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 50, -120, spineConfig);
  solveSpine(joints, 90, -260, spineConfig);
  return joints;
}

test("base rib generation is symmetric (equal distance from center on both sides)", () => {
  const joints = buildJoints();
  const ribs = computeRibs(joints, rigConfig);

  for (const rib of ribs) {
    const leftDist = Math.hypot(
      rib.left.x - rib.center.x,
      rib.left.y - rib.center.y,
    );
    const rightDist = Math.hypot(
      rib.right.x - rib.center.x,
      rib.right.y - rib.center.y,
    );
    assert.ok(
      Math.abs(leftDist - rightDist) < 1e-9,
      `left=${leftDist} right=${rightDist}`,
    );
  }
});

test("normals are unit length and finite", () => {
  const joints = buildJoints();
  const ribs = computeRibs(joints, rigConfig);
  for (const rib of ribs) {
    const length = Math.hypot(rib.normalX, rib.normalY);
    assert.ok(Math.abs(length - 1) < 1e-6);
    assert.ok(Number.isFinite(rib.normalX) && Number.isFinite(rib.normalY));
  }
});

test("applyRibLean widens one side and narrows the other without touching the center", () => {
  const joints = buildJoints();
  const ribs = computeRibs(joints, rigConfig);
  const centersBefore = ribs.map((r) => ({ x: r.center.x, y: r.center.y }));

  applyRibLean(ribs, 1, 0.4);

  ribs.forEach((rib, i) => {
    assert.equal(rib.center.x, centersBefore[i].x);
    assert.equal(rib.center.y, centersBefore[i].y);
    const leftDist = Math.hypot(
      rib.left.x - rib.center.x,
      rib.left.y - rib.center.y,
    );
    const rightDist = Math.hypot(
      rib.right.x - rib.center.x,
      rib.right.y - rib.center.y,
    );
    if (rib.width > 0) {
      assert.ok(
        leftDist > rightDist,
        `expected left widened for lean=1: left=${leftDist} right=${rightDist}`,
      );
    }
  });
});

test("zero lean reproduces the symmetric base", () => {
  const joints = buildJoints();
  const ribs = computeRibs(joints, rigConfig);
  const before = ribs.map((r) => ({ ...r.left, ...{} }));
  applyRibLean(ribs, 0, 0.4);
  ribs.forEach((rib, i) => {
    assert.ok(Math.abs(rib.left.x - before[i].x) < 1e-9);
  });
});
