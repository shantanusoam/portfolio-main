import assert from "node:assert/strict";
import { test } from "node:test";

import { AscentCamera } from "@/lib/mascot/game/AscentCamera";

// A realistic run start: camera positioned so the player (worldY ~ 0)
// appears near the bottom of an 800px viewport, matching
// StrumriseRuntime's constructor (`playerY - viewportHeight + startBottomMargin`).
const VIEWPORT_HEIGHT = 800;
const START_CAMERA_Y = 0 - VIEWPORT_HEIGHT + 96;

test("camera does not move while the player stays within the follow band", () => {
  const camera = new AscentCamera(START_CAMERA_Y);
  for (let i = 0; i < 60; i += 1) camera.update(-200, VIEWPORT_HEIGHT, 1 / 60);
  assert.equal(camera.getY(), START_CAMERA_Y);
});

test("camera follows (moves to a smaller/more-negative Y) once the player climbs above threshold", () => {
  const camera = new AscentCamera(START_CAMERA_Y);
  for (let i = 0; i < 300; i += 1)
    camera.update(-2000, VIEWPORT_HEIGHT, 1 / 60);
  assert.ok(camera.getY() < START_CAMERA_Y);
});

test("camera Y is monotonically non-increasing across a run with a temporary dip", () => {
  const camera = new AscentCamera(START_CAMERA_Y);
  let previous = camera.getY();
  let everDecreased = false;
  const path = [-2000, -2000, -1500, -1000, -2500, -3000];
  for (const playerY of path) {
    for (let i = 0; i < 30; i += 1) {
      const y = camera.update(playerY, VIEWPORT_HEIGHT, 1 / 60);
      assert.ok(y <= previous + 1e-6, "camera must never scroll back down");
      if (y < previous) everDecreased = true;
      previous = y;
    }
  }
  assert.ok(everDecreased);
});

test("reset snaps the camera to a new starting Y", () => {
  const camera = new AscentCamera(START_CAMERA_Y);
  for (let i = 0; i < 120; i += 1)
    camera.update(-2000, VIEWPORT_HEIGHT, 1 / 60);
  camera.reset(-500);
  assert.equal(camera.getY(), -500);
});
