import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeContourWidths,
  buildBodyContourPoints,
  DEFAULT_BODY_CONTOUR_CONFIG,
} from "@/lib/mascot/appearance/BodyContour";
import { applyRibLean, computeRibs } from "@/lib/mascot/character/CreatureRig";
import { DEFAULT_BODY_PROFILE } from "@/lib/mascot/character/BodyProfile";
import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";
import { neutralBodyDeformation } from "@/lib/mascot/appearance/BodyDeformation";

const spineConfig: SpineSolverConfig = {
  jointCount: 24,
  segmentLength: 12,
  headAngleLimitRadians: (10 * Math.PI) / 180,
  tailAngleLimitRadians: (32 * Math.PI) / 180,
  iterations: 4,
};

function buildJoints() {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 40, -120, spineConfig);
  solveSpine(joints, 80, -260, spineConfig);
  return joints;
}

function buildRibs() {
  const joints = buildJoints();
  return computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 26 },
    normalSmoothing: 0.3,
  });
}

test("contour widths are finite and non-negative across the body", () => {
  const ribs = buildRibs();
  const widths = computeContourWidths(ribs);
  assert.equal(widths.length, ribs.length);
  for (const w of widths) {
    assert.ok(Number.isFinite(w), `expected finite width, got ${w}`);
    assert.ok(w >= 0, `expected non-negative width, got ${w}`);
  }
});

test("nose and tail-tip stay pinched to a point (matches BodyProfile's natural zero-width endpoints)", () => {
  const ribs = buildRibs();
  const widths = computeContourWidths(ribs);
  assert.ok(widths[0] < 1e-6, `expected ~0 nose width, got ${widths[0]}`);
  assert.ok(
    widths[widths.length - 1] < 1e-6,
    `expected ~0 tail-tip width, got ${widths[widths.length - 1]}`,
  );
});

test("interior widths respect the configured floor", () => {
  const ribs = buildRibs();
  const config = { ...DEFAULT_BODY_CONTOUR_CONFIG, minWidth: 3 };
  const widths = computeContourWidths(ribs, config);
  for (let i = 1; i < widths.length - 1; i += 1) {
    assert.ok(
      widths[i] >= 3 - 1e-9,
      `index ${i}: expected >= 3, got ${widths[i]}`,
    );
  }
});

test("lateralScale deformation scales interior widths proportionally", () => {
  const ribs = buildRibs();
  const neutral = computeContourWidths(
    ribs,
    DEFAULT_BODY_CONTOUR_CONFIG,
    neutralBodyDeformation(),
  );
  const widened = computeContourWidths(ribs, DEFAULT_BODY_CONTOUR_CONFIG, {
    ...neutralBodyDeformation(),
    lateralScale: 1.5,
  });

  let sawIncrease = false;
  for (let i = 1; i < neutral.length - 1; i += 1) {
    if (neutral[i] > 0) {
      assert.ok(widened[i] > neutral[i] - 1e-9);
      if (widened[i] > neutral[i]) sawIncrease = true;
    }
  }
  assert.ok(sawIncrease, "expected at least one interior rib to widen");
});

test("buildBodyContourPoints stays closed and finite, and reproduces lean asymmetry", () => {
  const ribs = buildRibs();
  applyRibLean(ribs, 1, 0.4);
  const widths = computeContourWidths(ribs);
  const contour = buildBodyContourPoints(ribs, widths);

  assert.equal(contour.left.length, ribs.length);
  assert.equal(contour.right.length, ribs.length);

  for (let i = 0; i < ribs.length; i += 1) {
    assert.ok(
      Number.isFinite(contour.left[i].x) && Number.isFinite(contour.left[i].y),
    );
    assert.ok(
      Number.isFinite(contour.right[i].x) &&
        Number.isFinite(contour.right[i].y),
    );
  }

  // Lean=1 widens the left rail relative to the right (see CreatureRig.test.ts).
  let sawWidened = false;
  for (let i = 0; i < ribs.length; i += 1) {
    const leftDist = Math.hypot(
      contour.left[i].x - ribs[i].center.x,
      contour.left[i].y - ribs[i].center.y,
    );
    const rightDist = Math.hypot(
      contour.right[i].x - ribs[i].center.x,
      contour.right[i].y - ribs[i].center.y,
    );
    if (ribs[i].width > 0 && leftDist > rightDist) sawWidened = true;
  }
  assert.ok(
    sawWidened,
    "expected the contour to reflect the rib lean asymmetry",
  );
});
