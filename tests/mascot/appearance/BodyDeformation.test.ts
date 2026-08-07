import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BodyDeformationController,
  neutralBodyDeformation,
} from "@/lib/mascot/appearance/BodyDeformation";

test("neutralBodyDeformation returns the identity deformation", () => {
  const neutral = neutralBodyDeformation();
  assert.equal(neutral.longitudinalScale, 1);
  assert.equal(neutral.lateralScale, 1);
  assert.equal(neutral.headSquash, 0);
  assert.equal(neutral.tailStretch, 0);
  assert.equal(neutral.finSpread, 0);
  assert.equal(neutral.impactWave, 0);
  assert.equal(neutral.tumbleRotation, 0);
});

test("controller starts at the neutral deformation", () => {
  const controller = new BodyDeformationController();
  assert.deepEqual(controller.getState(), neutralBodyDeformation());
});

test("deformation smooths toward the behavior target rather than snapping instantly", () => {
  const controller = new BodyDeformationController();
  const state = controller.update({
    behavior: "sprint",
    speed: 300,
    turnRate: 0,
    scatterProgress: 0,
    dt: 1 / 60,
  });
  // One small step should move partway, not fully, toward a stretched sprint target.
  assert.ok(state.tailStretch > 0);
  assert.ok(
    state.tailStretch < 1,
    `expected partial progress, got ${state.tailStretch}`,
  );
});

test("deformation converges to the sprint target over many steps", () => {
  const controller = new BodyDeformationController();
  let state = neutralBodyDeformation();
  for (let i = 0; i < 300; i += 1) {
    state = controller.update({
      behavior: "sprint",
      speed: 300,
      turnRate: 0,
      scatterProgress: 0,
      dt: 1 / 60,
    });
  }
  assert.ok(
    state.longitudinalScale > 1,
    "expected sprint to stretch longitudinally",
  );
  assert.ok(state.lateralScale < 1, "expected sprint to narrow laterally");
});

test("avoid behavior produces an impact pulse and head squash", () => {
  const controller = new BodyDeformationController();
  let state = neutralBodyDeformation();
  for (let i = 0; i < 60; i += 1) {
    state = controller.update({
      behavior: "avoid",
      speed: 100,
      turnRate: 0,
      scatterProgress: 0,
      dt: 1 / 60,
    });
  }
  assert.ok(state.impactWave > 0.5);
  assert.ok(state.headSquash > 0);
});

test("rest/dormant produces a negative tailStretch (curl)", () => {
  const controller = new BodyDeformationController();
  let state = neutralBodyDeformation();
  for (let i = 0; i < 120; i += 1) {
    state = controller.update({
      behavior: "rest",
      speed: 0,
      turnRate: 0,
      scatterProgress: 0,
      dt: 1 / 60,
    });
  }
  assert.ok(state.tailStretch < 0);
});

test("tumbleRotation stays bounded even with a large sustained turn rate (no constant spin)", () => {
  const controller = new BodyDeformationController();
  let state = neutralBodyDeformation();
  for (let i = 0; i < 120; i += 1) {
    state = controller.update({
      behavior: "scatter",
      speed: 200,
      turnRate: 100,
      scatterProgress: 1,
      dt: 1 / 60,
    });
  }
  assert.ok(Number.isFinite(state.tumbleRotation));
  assert.ok(
    Math.abs(state.tumbleRotation) <= 0.6 + 1e-6,
    `expected bounded tumble, got ${state.tumbleRotation}`,
  );
});

test("manualOverride replaces only the specified fields, leaving the rest computed", () => {
  const controller = new BodyDeformationController();
  const state = controller.update({
    behavior: "sprint",
    speed: 300,
    turnRate: 0,
    scatterProgress: 0,
    dt: 1 / 60,
    manualOverride: { headSquash: 0.77 },
  });
  assert.equal(state.headSquash, 0.77);
  // Untouched fields still come from the computed sprint target's first step.
  assert.ok(state.tailStretch > 0);
});
