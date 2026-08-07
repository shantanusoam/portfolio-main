import assert from "node:assert/strict";
import { test } from "node:test";

import {
  computeCheekAnchors,
  computeEyeAnchors,
  computeFaceFrame,
  computeMouthAnchor,
} from "@/lib/mascot/appearance/FaceRig";
import { computeRibs } from "@/lib/mascot/character/CreatureRig";
import { DEFAULT_BODY_PROFILE } from "@/lib/mascot/character/BodyProfile";
import { DEFAULT_CREATURE_RECIPE } from "@/lib/mascot/character/CreatureRecipe";
import {
  createSpineJoints,
  solveSpine,
  type SpineSolverConfig,
} from "@/lib/mascot/motion/SpineSolver";

const spineConfig: SpineSolverConfig = {
  jointCount: 24,
  segmentLength: 12,
  headAngleLimitRadians: (10 * Math.PI) / 180,
  tailAngleLimitRadians: (32 * Math.PI) / 180,
  iterations: 4,
};

function buildRibs() {
  const joints = createSpineJoints(spineConfig, 0, 0);
  solveSpine(joints, 30, -100, spineConfig);
  solveSpine(joints, 60, -220, spineConfig);
  return computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 26 },
    normalSmoothing: 0.3,
  });
}

test("degenerate (empty ribs) case never throws or produces NaN", () => {
  const frame = computeFaceFrame({
    ribs: [],
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  for (const value of Object.values(frame)) {
    assert.ok(Number.isFinite(value), `expected finite, got ${value}`);
  }
});

test("forward vector is unit length", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 1,
    headingY: 0,
  });
  const length = Math.hypot(frame.forwardX, frame.forwardY);
  assert.ok(Math.abs(length - 1) < 1e-6, `expected unit length, got ${length}`);
});

test("normal vector is unit length and perpendicular-ish (finite)", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0.6,
    headingY: -0.8,
  });
  const length = Math.hypot(frame.normalX, frame.normalY);
  assert.ok(Math.abs(length - 1) < 1e-6, `expected unit length, got ${length}`);
});

test("eye anchors are symmetric around the face centre along the normal axis", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  const eyes = computeEyeAnchors(frame, 0.34, 0.18);

  const midX = (eyes.left.x + eyes.right.x) / 2;
  const midY = (eyes.left.y + eyes.right.y) / 2;
  const expectedX = frame.centerX + frame.forwardX * frame.height * 0.18;
  const expectedY = frame.centerY + frame.forwardY * frame.height * 0.18;

  assert.ok(Math.abs(midX - expectedX) < 1e-6);
  assert.ok(Math.abs(midY - expectedY) < 1e-6);

  const leftDist = Math.hypot(eyes.left.x - midX, eyes.left.y - midY);
  const rightDist = Math.hypot(eyes.right.x - midX, eyes.right.y - midY);
  assert.ok(Math.abs(leftDist - rightDist) < 1e-6);
});

test("mouth anchor sits forward of the face centre along the forward axis", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  const mouth = computeMouthAnchor(frame, 0.5);
  const dx = mouth.x - frame.centerX;
  const dy = mouth.y - frame.centerY;
  const dot = dx * frame.forwardX + dy * frame.forwardY;
  assert.ok(
    dot > 0,
    "expected the mouth anchor to sit forward of the frame centre",
  );
});

test("cheek anchors sit outward of the eyes along the normal axis", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  const eyes = computeEyeAnchors(frame, 0.34, 0.18);
  const cheeks = computeCheekAnchors(frame, eyes, 0.12);

  const leftEyeToCheek = Math.hypot(
    cheeks.left.x - eyes.left.x,
    cheeks.left.y - eyes.left.y,
  );
  assert.ok(leftEyeToCheek > 0);
});

// MASCOT_VISUAL_RESCUE_AND_GENERATED_ASSET_SPRINT.md's required automated
// invariant: "distance(faceCenter, expectedHeadCenter) < allowedHeadOffset".
// `expectedHeadCenter` here is the plain (unbiased) centroid of the head
// region's ribs, computed independently of computeFaceFrame's own NOSE_BIAS
// logic, so this genuinely guards against the face frame silently drifting
// onto an unrelated point (e.g. the old build's pose-root-anchored core)
// rather than just re-asserting the implementation.
function headRegionCentroid(ribs: ReturnType<typeof buildRibs>) {
  const region = DEFAULT_CREATURE_RECIPE.regions.head;
  const lo = Math.min(region.start, region.end);
  const hi = Math.max(region.start, region.end);
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let i = lo; i <= hi && i < ribs.length; i += 1) {
    sumX += ribs[i].center.x;
    sumY += ribs[i].center.y;
    count += 1;
  }
  return { x: sumX / count, y: sumY / count };
}

test("face frame never separates from the head silhouette (still pose)", () => {
  const ribs = buildRibs();
  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  const expected = headRegionCentroid(ribs);
  const offset = Math.hypot(
    frame.centerX - expected.x,
    frame.centerY - expected.y,
  );
  const allowedHeadOffset = 24;
  assert.ok(
    offset < allowedHeadOffset,
    `face frame drifted ${offset}px from the head region centroid (limit ${allowedHeadOffset}px)`,
  );
});

test("face frame stays attached to the head through a hard turn (during motion)", () => {
  const joints = createSpineJoints(spineConfig, 0, 0);
  // Drag the head through several conflicting targets to force a genuine
  // hard turn, not just a straight approach — the exact scenario the spec
  // worries the face could visually separate during.
  solveSpine(joints, 40, -80, spineConfig);
  solveSpine(joints, -120, -40, spineConfig);
  solveSpine(joints, -20, 140, spineConfig);
  const ribs = computeRibs(joints, {
    bodyProfile: { ...DEFAULT_BODY_PROFILE, maxWidth: 26 },
    normalSmoothing: 0.3,
  });

  const frame = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: -0.14,
    headingY: 0.99,
  });
  const expected = headRegionCentroid(ribs);
  const offset = Math.hypot(
    frame.centerX - expected.x,
    frame.centerY - expected.y,
  );
  const allowedHeadOffset = 24;
  assert.ok(
    offset < allowedHeadOffset,
    `face frame drifted ${offset}px from the head region centroid mid-turn (limit ${allowedHeadOffset}px)`,
  );
});

test("headSquash deformation widens and flattens the frame", () => {
  const ribs = buildRibs();
  const neutral = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
  });
  const squashed = computeFaceFrame({
    ribs,
    headRegion: DEFAULT_CREATURE_RECIPE.regions.head,
    headingX: 0,
    headingY: -1,
    deformation: {
      longitudinalScale: 1,
      lateralScale: 1,
      headSquash: 1,
      tailStretch: 0,
      finSpread: 0,
      impactWave: 1,
      tumbleRotation: 0,
    },
  });
  assert.ok(squashed.width > neutral.width);
  assert.ok(squashed.height < neutral.height);
});
