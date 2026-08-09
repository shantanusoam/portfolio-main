import assert from "node:assert/strict";
import { test } from "node:test";

import { PersonalityController } from "@/lib/procedural-character/behavior/PersonalityController";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";

test("physical speed and landing impulses blend into squash and stretch", () => {
  const controller = new PersonalityController(77);
  const body = {
    position: { x: 0, y: 0 },
    previousPosition: { x: -2, y: 0 },
    velocity: { x: octopodPreset.dynamics.maxSpeed * 0.8, y: 0 },
    acceleration: { x: -900, y: 1800 },
    movementDirection: { x: 1, y: 0 },
    speed: octopodPreset.dynamics.maxSpeed * 0.8,
    normalizedSpeed: 0.8,
    facingAngle: 0.18,
    angularVelocity: 0,
  };

  controller.reactToLanding(0.9, 1);
  for (let frame = 0; frame < 12; frame += 1) {
    controller.update(1 / 120, frame / 120, body, octopodPreset, 2, false);
  }

  assert.ok(controller.pose.scaleX > 1);
  assert.ok(controller.pose.scaleY < controller.pose.scaleX);
  assert.ok(controller.pose.rotation > 0);
  assert.ok(controller.pose.eyeOpen > 0 && controller.pose.eyeOpen <= 1);
});
