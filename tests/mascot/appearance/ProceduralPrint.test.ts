import assert from "node:assert/strict";
import { test } from "node:test";

import { resolvePatternMark } from "@/lib/mascot/appearance/ProceduralPrint";
import { NIGHT_CANDY_PALETTE } from "@/lib/mascot/appearance/AppearancePresets";
import { computeRibs } from "@/lib/mascot/character/CreatureRig";
import { DEFAULT_BODY_PROFILE } from "@/lib/mascot/character/BodyProfile";
import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";
import type { PatternMark } from "@/lib/mascot/appearance/PatternRecipes";

const spineConfig: SpineSolverConfig = {
  jointCount: 12,
  segmentLength: 10,
  headAngleLimitRadians: (10 * Math.PI) / 180,
  tailAngleLimitRadians: (30 * Math.PI) / 180,
  iterations: 4,
};

function buildRibs() {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 0, -60, spineConfig);
  return computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 18 },
    normalSmoothing: 0,
  });
}

function baseMark(overrides: Partial<PatternMark> = {}): PatternMark {
  return {
    u: 0.4,
    v: 0.2,
    seed: 1,
    colorRole: "primary",
    along: 0.5,
    across: 0.2,
    rotation: 0,
    shape: "blob",
    layer: 0,
    ...overrides,
  };
}

test("returns null when there is no rib data", () => {
  const resolved = resolvePatternMark(
    baseMark(),
    [],
    undefined,
    NIGHT_CANDY_PALETTE,
    1,
  );
  assert.equal(resolved, null);
});

test("maps colorRole to the matching palette colour", () => {
  const ribs = buildRibs();
  const primary = resolvePatternMark(
    baseMark({ colorRole: "primary" }),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    1,
  );
  const secondary = resolvePatternMark(
    baseMark({ colorRole: "secondary" }),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    1,
  );
  const accent = resolvePatternMark(
    baseMark({ colorRole: "accent" }),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    1,
  );

  assert.equal(primary!.color, NIGHT_CANDY_PALETTE.printPrimary);
  assert.equal(secondary!.color, NIGHT_CANDY_PALETTE.printSecondary);
  assert.equal(accent!.color, NIGHT_CANDY_PALETTE.highlight);
});

test("patternScale multiplies both radii, clamped to the supported range", () => {
  const ribs = buildRibs();
  const normalScale = resolvePatternMark(
    baseMark(),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    1,
  );
  const doubledScale = resolvePatternMark(
    baseMark(),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    2,
  );
  const overClamped = resolvePatternMark(
    baseMark(),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    999,
  );
  const clampedAtMax = resolvePatternMark(
    baseMark(),
    ribs,
    undefined,
    NIGHT_CANDY_PALETTE,
    2.2,
  );

  assert.ok(doubledScale!.radiusAlong > normalScale!.radiusAlong);
  assert.ok(
    Math.abs(overClamped!.radiusAlong - clampedAtMax!.radiusAlong) < 1e-6,
  );
});

test("resolved position/rotation are always finite", () => {
  const ribs = buildRibs();
  for (const v of [-1, -0.3, 0, 0.5, 1]) {
    const resolved = resolvePatternMark(
      baseMark({ v }),
      ribs,
      undefined,
      NIGHT_CANDY_PALETTE,
      1,
    );
    assert.ok(resolved);
    assert.ok(Number.isFinite(resolved!.x));
    assert.ok(Number.isFinite(resolved!.y));
    assert.ok(Number.isFinite(resolved!.rotation));
  }
});
