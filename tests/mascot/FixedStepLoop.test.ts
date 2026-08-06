import assert from "node:assert/strict";
import { test } from "node:test";

import { FixedStepLoop } from "@/lib/mascot/core/FixedStepLoop";

function makeLoop(
  overrides: Partial<ConstructorParameters<typeof FixedStepLoop>[0]> = {},
) {
  const updates: number[] = [];
  const renders: number[] = [];
  const loop = new FixedStepLoop({
    fixedDt: 1 / 60,
    maxFrameDt: 0.05,
    maxSteps: 3,
    update: (dt) => updates.push(dt),
    render: (alpha) => renders.push(alpha),
    requestFrame: () => 0,
    cancelFrame: () => {},
    ...overrides,
  });
  return { loop, updates, renders };
}

test("first tick only establishes a timing baseline", () => {
  const { loop, updates, renders } = makeLoop();
  loop.tick(1000);
  assert.equal(updates.length, 0);
  assert.equal(renders.length, 0);
});

test("runs one fixed update per ~16.67ms of elapsed time", () => {
  const { loop, updates } = makeLoop();
  loop.tick(0);
  loop.tick(1000 / 60);
  assert.equal(updates.length, 1);
  assert.ok(Math.abs(updates[0] - 1 / 60) < 1e-9);
});

test("caps catch-up steps at maxSteps and drops leftover time", () => {
  let dropped = 0;
  // maxFrameDt raised well above fixedDt*maxSteps so the clamp in the spec's
  // pseudocode (frame delta clamped first, then accumulated) doesn't itself
  // hide the overflow this test is checking for.
  const { loop, updates } = makeLoop({
    maxFrameDt: 1,
    onDroppedSimulationTime: () => (dropped += 1),
  });
  loop.tick(0);
  // 500ms elapsed - far more than maxSteps(3) * fixedDt (~50ms) can consume.
  loop.tick(500);
  assert.equal(updates.length, 3);
  assert.equal(dropped, 1);
});

test("clamps a huge frame delta (tab suspension) instead of running an unbounded loop", () => {
  const { loop, updates } = makeLoop();
  loop.tick(0);
  loop.tick(1_000_000);
  assert.ok(updates.length <= 3);
});

test("render receives an interpolation alpha in [0, 1]", () => {
  const { loop, renders } = makeLoop();
  loop.tick(0);
  loop.tick(1000 / 60 + 5);
  for (const alpha of renders) {
    assert.ok(alpha >= 0 && alpha <= 1);
  }
});

test("resetTiming clears the accumulator so the next tick doesn't jump", () => {
  const { loop, updates } = makeLoop();
  loop.tick(0);
  loop.tick(1000 / 60);
  assert.equal(updates.length, 1);
  loop.resetTiming();
  loop.tick(999999);
  // First tick after reset only rebaselines, no updates yet.
  assert.equal(updates.length, 1);
});

test("start/stop schedule and cancel exactly one frame handle each", () => {
  let requested = 0;
  let cancelled = 0;
  const { loop } = makeLoop({
    requestFrame: () => {
      requested += 1;
      return requested;
    },
    cancelFrame: () => {
      cancelled += 1;
    },
  });

  loop.start();
  assert.equal(requested, 1);
  loop.start(); // repeated start must not schedule a second loop
  assert.equal(requested, 1);
  loop.stop();
  assert.equal(cancelled, 1);
  loop.stop(); // repeated stop is safe
  assert.equal(cancelled, 1);
});
