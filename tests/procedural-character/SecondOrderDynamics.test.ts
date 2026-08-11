import assert from "node:assert/strict";
import { test } from "node:test";

import { SecondOrderDynamics2D } from "@/lib/procedural-character/math/SecondOrderDynamics";

const config = { frequency: 1.8, damping: 0.72, response: 0.08 };

test("2D second-order motion converges while respecting radial max speed", () => {
  const dynamics = new SecondOrderDynamics2D(config, { x: 0, y: 0 });
  const target = { x: 300, y: 400 };
  const dt = 1 / 120;
  const maximumSpeed = 90;

  for (let index = 0; index < 1_200; index += 1) {
    const previousX = dynamics.position.x;
    const previousY = dynamics.position.y;
    dynamics.update(dt, target, maximumSpeed);
    const frameDistance = Math.hypot(
      dynamics.position.x - previousX,
      dynamics.position.y - previousY,
    );
    assert.ok(frameDistance <= maximumSpeed * dt + 1e-8);
  }

  assert.ok(
    Math.hypot(dynamics.position.x - 300, dynamics.position.y - 400) < 1,
  );
});

test("2D dynamics stays finite through abrupt reversals", () => {
  const dynamics = new SecondOrderDynamics2D(config, { x: 50, y: 50 });
  const targets = [
    { x: 1_000, y: -1_000 },
    { x: -1_000, y: 1_000 },
    { x: 50, y: 50 },
  ];

  for (const target of targets) {
    for (let frame = 0; frame < 60; frame += 1) {
      dynamics.update(1 / 60, target, 700);
      assert.ok(Number.isFinite(dynamics.position.x));
      assert.ok(Number.isFinite(dynamics.position.y));
      assert.ok(Number.isFinite(dynamics.velocity.x));
      assert.ok(Number.isFinite(dynamics.acceleration.y));
    }
  }
});
