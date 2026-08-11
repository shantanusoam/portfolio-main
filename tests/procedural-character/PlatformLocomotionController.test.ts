import assert from "node:assert/strict";
import { test } from "node:test";

import { PlatformLocomotionController } from "@/lib/procedural-character/behavior/PlatformLocomotionController";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import type { CharacterKinematics } from "@/lib/procedural-character/types";

function makeBody(): CharacterKinematics {
  return {
    position: { x: 120, y: 80 },
    previousPosition: { x: 120, y: 80 },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    movementDirection: { x: 1, y: 0 },
    speed: 0,
    normalizedSpeed: 0,
    facingAngle: 0,
    angularVelocity: 0,
  };
}

test("platform locomotion lands on a cached page surface and can hop", () => {
  const controller = new PlatformLocomotionController();
  const body = makeBody();
  const target = { x: 120, y: 300 };
  const surface = { id: "deck", left: 20, top: 280, right: 520, bottom: 360 };
  controller.resize(560, 400);
  controller.setSurfaces([surface]);
  let landed = false;
  for (let frame = 0; frame < 180; frame += 1) {
    const result = controller.update(
      1 / 120,
      body,
      target,
      octopodPreset.locomotion,
      octopodPreset.scale,
    );
    landed ||= result.landed;
  }
  assert.equal(landed, true);
  assert.equal(controller.grounded, true);
  assert.equal(controller.surfaceId, "deck");
  assert.ok(
    Math.abs(
      body.position.y -
        (surface.top - octopodPreset.locomotion.bodyGroundOffset),
    ) < 1e-6,
  );

  target.x = 460;
  target.y = 120;
  const jump = controller.update(
    1 / 120,
    body,
    target,
    octopodPreset.locomotion,
    octopodPreset.scale,
  );
  assert.equal(jump.jumped, true);
  assert.equal(controller.grounded, false);
  assert.ok(body.velocity.y < 0);
});
