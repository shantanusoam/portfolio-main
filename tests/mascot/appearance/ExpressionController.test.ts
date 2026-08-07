import assert from "node:assert/strict";
import { test } from "node:test";

import {
  ExpressionController,
  mapBehaviorToExpression,
} from "@/lib/mascot/appearance/ExpressionController";
import type { MascotBehavior, MascotExpression } from "@/lib/mascot/types";

const ALL_BEHAVIORS: MascotBehavior[] = [
  "dormant",
  "wake",
  "follow",
  "wander",
  "inspect",
  "orbit",
  "avoid",
  "sprint",
  "rest",
  "scatter",
  "reform",
  "reducedMotion",
];

const VALID_EXPRESSIONS: MascotExpression[] = [
  "neutral",
  "curious",
  "happy",
  "focused",
  "surprised",
  "squint",
  "sleepy",
  "dizzy",
  "determined",
];

test("every MascotBehavior maps to a valid MascotExpression", () => {
  for (const behavior of ALL_BEHAVIORS) {
    const expression = mapBehaviorToExpression(behavior);
    assert.ok(
      VALID_EXPRESSIONS.includes(expression),
      `${behavior} mapped to invalid expression ${expression}`,
    );
  }
});

test("spec-mandated mappings hold", () => {
  assert.equal(mapBehaviorToExpression("dormant"), "sleepy");
  assert.equal(mapBehaviorToExpression("wake"), "surprised");
  assert.equal(mapBehaviorToExpression("follow"), "curious");
  assert.equal(mapBehaviorToExpression("sprint"), "squint");
  assert.equal(mapBehaviorToExpression("rest"), "sleepy");
});

test("transitions blend smoothly rather than snapping instantly", () => {
  const controller = new ExpressionController(1);
  controller.update(1, {
    behavior: "dormant",
    headingX: 0,
    headingY: -1,
    coreX: 0,
    coreY: 0,
    breathingPhase: 0,
    impactWave: 0,
  });
  // dormant -> sleepy eyeOpenness (0.25) should be fully settled by now.
  const before = controller.update(0.001, {
    behavior: "wake",
    headingX: 0,
    headingY: -1,
    coreX: 0,
    coreY: 0,
    breathingPhase: 0,
    impactWave: 0,
  });
  // One tiny step into "surprised" (eyeOpenness target 1) should not have
  // fully arrived yet.
  assert.ok(
    before.transitionBlend < 1,
    `expected partial transition, got ${before.transitionBlend}`,
  );
  assert.ok(
    before.eyeOpenness < 1,
    `expected not-yet-open eyes, got ${before.eyeOpenness}`,
  );
});

test("transitions fully settle after enough time", () => {
  const controller = new ExpressionController(2);
  let state = controller.update(1, {
    behavior: "sprint",
    headingX: 0,
    headingY: -1,
    coreX: 0,
    coreY: 0,
    breathingPhase: 0,
    impactWave: 0,
  });
  for (let i = 0; i < 60; i += 1) {
    state = controller.update(1 / 60, {
      behavior: "sprint",
      headingX: 0,
      headingY: -1,
      coreX: 0,
      coreY: 0,
      breathingPhase: 0,
      impactWave: 0,
    });
  }
  assert.equal(state.transitionBlend, 1);
  assert.equal(state.expression, "squint");
});

test("a high-impact frame suppresses blinking (eyeOpenness stays at the resting state value)", () => {
  const controller = new ExpressionController(3);
  let last = controller.update(1, {
    behavior: "wander",
    headingX: 0,
    headingY: -1,
    coreX: 0,
    coreY: 0,
    breathingPhase: 0,
    impactWave: 1,
  });
  // Simulate many frames — without impact suppression a blink would
  // eventually occur (bounded random interval up to a few seconds).
  for (let i = 0; i < 600; i += 1) {
    last = controller.update(1 / 60, {
      behavior: "wander",
      headingX: 0,
      headingY: -1,
      coreX: 0,
      coreY: 0,
      breathingPhase: 0,
      impactWave: 1,
    });
  }
  // eyeOpenness should equal the resting "curious" value (0.95) since blink
  // progress is held at 0 throughout ("wander" maps to "curious").
  assert.ok(
    Math.abs(last.eyeOpenness - 0.95) < 1e-6,
    `expected 0.95, got ${last.eyeOpenness}`,
  );
});

test("pupil offset stays within the clamped bound over many updates", () => {
  const controller = new ExpressionController(4);
  let state = controller.update(1, {
    behavior: "follow",
    headingX: 0,
    headingY: -1,
    coreX: 0,
    coreY: 0,
    interestX: 1000,
    interestY: -1000,
    breathingPhase: 0,
    impactWave: 0,
  });
  for (let i = 0; i < 300; i += 1) {
    state = controller.update(1 / 60, {
      behavior: "follow",
      headingX: 0,
      headingY: -1,
      coreX: 0,
      coreY: 0,
      interestX: 1000,
      interestY: -1000,
      breathingPhase: 0,
      impactWave: 0,
    });
  }
  const magnitude = Math.hypot(state.pupilOffsetX, state.pupilOffsetY);
  assert.ok(magnitude <= 0.4 + 1e-6, `expected <= 0.4, got ${magnitude}`);
});

test("manual expression override replaces the behavior-driven mapping", () => {
  const controller = new ExpressionController(5);
  const state = neutralAfterSettle(controller, "dormant", "happy");
  assert.equal(state.expression, "happy");

  function neutralAfterSettle(
    ctrl: ExpressionController,
    behavior: MascotBehavior,
    override: MascotExpression,
  ) {
    let s = ctrl.update(1, {
      behavior,
      headingX: 0,
      headingY: -1,
      coreX: 0,
      coreY: 0,
      breathingPhase: 0,
      impactWave: 0,
      overrideExpression: override,
    });
    for (let i = 0; i < 30; i += 1) {
      s = ctrl.update(1 / 60, {
        behavior,
        headingX: 0,
        headingY: -1,
        coreX: 0,
        coreY: 0,
        breathingPhase: 0,
        impactWave: 0,
        overrideExpression: override,
      });
    }
    return s;
  }
});
