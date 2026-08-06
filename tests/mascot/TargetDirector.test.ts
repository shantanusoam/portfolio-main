import assert from "node:assert/strict";
import { test } from "node:test";

import {
  blendTargets,
  TargetDirector,
} from "@/lib/mascot/behavior/TargetDirector";

test("blend ramps toward the target over blendDurationSeconds, not instantly", () => {
  const director = new TargetDirector({ blendDurationSeconds: 0.5 }, 0);
  const afterOneFrame = director.update(1 / 60, 1);
  assert.ok(
    afterOneFrame > 0 && afterOneFrame < 0.5,
    `expected a partial step, got ${afterOneFrame}`,
  );
});

test("blend reaches the target after enough time and stays clamped to [0, 1]", () => {
  const director = new TargetDirector({ blendDurationSeconds: 0.5 }, 0);
  for (let i = 0; i < 120; i += 1) director.update(1 / 60, 1);
  assert.ok(Math.abs(director.getBlend() - 1) < 1e-6);

  for (let i = 0; i < 120; i += 1) director.update(1 / 60, 0);
  assert.ok(Math.abs(director.getBlend() - 0) < 1e-6);
});

test("reset sets the blend immediately without ramping", () => {
  const director = new TargetDirector({ blendDurationSeconds: 0.5 }, 0);
  director.reset(0.75);
  assert.equal(director.getBlend(), 0.75);
});

test("blendTargets interpolates and clamps blend to [0, 1]", () => {
  const pointer = { x: 0, y: 0 };
  const wander = { x: 100, y: 200 };
  assert.deepEqual(blendTargets(pointer, wander, 0), { x: 0, y: 0 });
  assert.deepEqual(blendTargets(pointer, wander, 1), { x: 100, y: 200 });
  assert.deepEqual(blendTargets(pointer, wander, 0.5), { x: 50, y: 100 });
  assert.deepEqual(blendTargets(pointer, wander, 5), { x: 100, y: 200 });
  assert.deepEqual(blendTargets(pointer, wander, -5), { x: 0, y: 0 });
});
