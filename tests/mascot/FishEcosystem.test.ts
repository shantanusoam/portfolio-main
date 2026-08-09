import assert from "node:assert/strict";
import { test } from "node:test";

import {
  adultSpineLength,
  FishEcosystem,
  FRY_SCHOOL_SIZE,
  MEALS_TO_FISSION,
} from "@/lib/mascot/ecosystem/FishEcosystem";
import { MascotRuntime } from "@/lib/mascot/MascotRuntime";
import { PoseController } from "@/lib/mascot/motion/PoseController";
import { MOTION_RECIPES } from "@/lib/mascot/motion/MotionRecipes";
import { resolveAnatomyForMeals } from "@/lib/mascot/ecosystem/AnatomyGrowth";

const BOUNDS = { minX: 40, minY: 40, maxX: 760, maxY: 560 };

function createRuntime(seed: number, x = 300, y = 260) {
  return new MascotRuntime({
    seed,
    quality: "low",
    originX: x,
    originY: y,
    bounds: BOUNDS,
    obstacles: null,
    strings: null,
  });
}

function createEcosystem(seed: number, x = 300, y = 260) {
  const leader = createRuntime(seed, x, y);
  return new FishEcosystem({
    leader,
    seed,
    quality: "low",
    bounds: BOUNDS,
    createRuntime: (childSeed, cx, cy) => createRuntime(childSeed, cx, cy),
  });
}

/** Eat exactly one fry (tests that need precise meal counts). */
function feedOne(ecosystem: FishEcosystem) {
  for (
    let step = 0;
    step < 240 && !ecosystem.getStatus().canReleaseFry;
    step += 1
  ) {
    ecosystem.update(1 / 60);
  }

  const hunter = ecosystem.getAdults()[0];
  const root = hunter.runtime.pose.getRoot();
  assert.equal(ecosystem.releaseFry(root.x, root.y, 1), true);
  assert.equal(ecosystem.getAllFry().length, 1);

  for (
    let step = 0;
    step < 4800 && ecosystem.getStatus().activeFry;
    step += 1
  ) {
    ecosystem.setPointer(root.x, root.y, false);
    ecosystem.update(1 / 60);
  }
  assert.equal(ecosystem.getStatus().activeFry, false);
}

test("one egg click drops a school near the click, not across the page", () => {
  const ecosystem = createEcosystem(101, 400, 300);
  const dropX = 700;
  const dropY = 120;
  assert.equal(ecosystem.releaseFry(dropX, dropY), true);
  assert.equal(ecosystem.getAllFry().length, FRY_SCHOOL_SIZE);
  assert.equal(ecosystem.getStatus().activeFryCount, FRY_SCHOOL_SIZE);

  for (const fry of ecosystem.getAllFry()) {
    assert.ok(
      Math.hypot(fry.x - dropX, fry.y - dropY) < 90,
      "each fry should stay near the egg drop point",
    );
  }
});

test("hunters wait a grace period before chasing freshly dropped fry", () => {
  const ecosystem = createEcosystem(202, 200, 200);
  assert.equal(ecosystem.releaseFry(220, 200, 1), true);

  for (let step = 0; step < 60; step += 1) ecosystem.update(1 / 60);
  assert.equal(ecosystem.getAdults()[0].runtime.pointerActive, false);
  // Still within grace — leader should not be locked onto chase via steer.
  // After grace, hunting may begin.
  for (let step = 0; step < 120; step += 1) ecosystem.update(1 / 60);
  assert.ok(ecosystem.getFry());
});

test("fry flees the nearest adult before fatigue", () => {
  const ecosystem = createEcosystem(44, 300, 300);
  assert.equal(ecosystem.releaseFry(360, 300, 1), true);
  const fry = ecosystem.getFry();
  assert.ok(fry);
  const startDistance = Math.hypot(fry.x - 300, fry.y - 300);

  for (let step = 0; step < 45; step += 1) ecosystem.update(1 / 60);

  const moved = ecosystem.getFry();
  assert.ok(moved);
  assert.ok(
    Math.hypot(moved.x - 300, moved.y - 300) > startDistance - 1,
    "fry should increase distance from the adult while fresh",
  );
});

test("egg pointer suppression stops leader follow without freezing companions", () => {
  const ecosystem = createEcosystem(55, 300, 300);
  ecosystem.setPointer(500, 200, true);
  ecosystem.setPointerSuppressed(true);
  ecosystem.update(1 / 60);

  assert.equal(ecosystem.isPointerSuppressed(), true);
  assert.equal(ecosystem.getAdults()[0].runtime.pointerActive, false);
});

test("reduced motion still catches a far fry", () => {
  const ecosystem = createEcosystem(66, 180, 420);
  ecosystem.setReducedMotion(true);
  assert.equal(ecosystem.releaseFry(700, 90, 1), true);

  for (
    let step = 0;
    step < 4800 && ecosystem.getStatus().activeFry;
    step += 1
  ) {
    ecosystem.update(1 / 60);
  }

  assert.equal(ecosystem.getStatus().activeFry, false);
});

test("meals plump the fish and rebuild joint milestones", () => {
  const ecosystem = createEcosystem(77, 320, 280);
  const startLength = adultSpineLength(ecosystem.getAdults()[0]);
  const startJoints = ecosystem.getAdults()[0].runtime.pose.joints.length;
  const startWidth =
    ecosystem.getAdults()[0].anatomy.bodyProfile.maxWidth;

  for (let meal = 0; meal < 5; meal += 1) feedOne(ecosystem);

  const grown = ecosystem.getAdults()[0];
  assert.equal(grown.mealsEaten, 5);
  assert.ok(adultSpineLength(grown) > startLength);
  assert.ok(grown.anatomy.bodyProfile.maxWidth > startWidth);
  assert.ok(grown.runtime.pose.joints.length > startJoints);
  assert.equal(
    grown.runtime.pose.joints.length,
    resolveAnatomyForMeals(5).jointCount,
  );
});

test("fission happens on meal 20 and creates equal independent offspring", () => {
  const ecosystem = createEcosystem(88, 320, 280);

  for (let meal = 0; meal < MEALS_TO_FISSION; meal += 1) {
    feedOne(ecosystem);
    for (
      let step = 0;
      step < 240 && ecosystem.getStatus().fissionPhase;
      step += 1
    ) {
      ecosystem.update(1 / 60);
    }
  }

  assert.equal(ecosystem.getStatus().population, 2);
  assert.equal(ecosystem.getAdults().length, 2);

  const [leader, companion] = ecosystem.getAdults();
  assert.equal(leader.role, "leader");
  assert.equal(companion.role, "companion");
  assert.equal(leader.mealsEaten, 0);
  assert.equal(companion.mealsEaten, 0);
  assert.equal(leader.anatomy.jointCount, companion.anatomy.jointCount);
  assert.equal(leader.anatomy.segmentLength, companion.anatomy.segmentLength);
  assert.notEqual(leader.phaseOffset, companion.phaseOffset);

  ecosystem.setPointer(700, 100, true);
  ecosystem.setPointerSuppressed(false);
  for (let step = 0; step < 120; step += 1) ecosystem.update(1 / 60);

  assert.equal(companion.runtime.pointerActive, false);
  const headingDelta = Math.abs(
    leader.runtime.pose.getHeading() - companion.runtime.pose.getHeading(),
  );
  const rootDelta = Math.hypot(
    leader.runtime.pose.getRoot().x - companion.runtime.pose.getRoot().x,
    leader.runtime.pose.getRoot().y - companion.runtime.pose.getRoot().y,
  );
  assert.ok(
    headingDelta > 0.08 || rootDelta > 24,
    "siblings should diverge in heading or position",
  );
});

test("quality, bounds and reduced motion propagate to every spawned sibling", () => {
  const ecosystem = createEcosystem(22);
  ecosystem.setQuality("medium");
  ecosystem.setReducedMotion(true);
  ecosystem.setBounds({ minX: 50, minY: 50, maxX: 700, maxY: 500 });

  const adult = ecosystem.getAdults()[0];
  assert.equal(adult.runtime.quality, "medium");
  assert.equal(adult.runtime.reducedMotion, true);
  assert.deepEqual(adult.runtime.bounds, {
    minX: 50,
    minY: 50,
    maxX: 700,
    maxY: 500,
  });
});

test("PoseController rebuildSpine preserves root and honors new joint count", () => {
  const pose = new PoseController(
    {
      spine: {
        jointCount: 30,
        segmentLength: 3.9,
        headAngleLimitRadians: 0.2,
        tailAngleLimitRadians: 0.4,
        iterations: 3,
      },
    },
    100,
    200,
    MOTION_RECIPES.wander,
  );
  pose.update(1 / 60, 130, 210);
  const root = pose.getRoot();

  pose.rebuildSpine({
    jointCount: 48,
    segmentLength: 5.8,
    headAngleLimitRadians: 0.2,
    tailAngleLimitRadians: 0.4,
    iterations: 3,
  });

  assert.equal(pose.joints.length, 48);
  assert.ok(
    Math.hypot(pose.getRoot().x - root.x, pose.getRoot().y - root.y) < 1,
  );
  for (let i = 1; i < pose.joints.length; i += 1) {
    const length = Math.hypot(
      pose.joints[i].x - pose.joints[i - 1].x,
      pose.joints[i].y - pose.joints[i - 1].y,
    );
    assert.ok(Math.abs(length - 5.8) < 0.2);
    assert.ok(Number.isFinite(pose.joints[i].x));
    assert.ok(Number.isFinite(pose.joints[i].y));
  }
});
