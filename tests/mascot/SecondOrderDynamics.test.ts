import assert from "node:assert/strict";
import { test } from "node:test";

import { SecondOrderDynamics } from "@/lib/mascot/motion/SecondOrderDynamics";

const DT = 1 / 60;

test("converges to a fixed target over time", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 2, damping: 1, response: 0 },
    0,
  );
  let value = 0;
  for (let i = 0; i < 600; i += 1) {
    value = filter.update(DT, 100);
  }
  assert.ok(
    Math.abs(value - 100) < 0.5,
    `expected convergence near 100, got ${value}`,
  );
});

test("stays finite with a capped large delta (tab-suspension gap)", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 3, damping: 0.8, response: 0 },
    0,
  );
  filter.update(DT, 50);
  const value = filter.update(9999, 50);
  assert.ok(Number.isFinite(value));
  assert.ok(Number.isFinite(filter.velocity));
});

test("higher damping reduces overshoot for the same step input", () => {
  function peakOvershoot(damping: number): number {
    const filter = new SecondOrderDynamics(
      { frequency: 2, damping, response: 0 },
      0,
    );
    let peak = 0;
    for (let i = 0; i < 300; i += 1) {
      const value = filter.update(DT, 100);
      peak = Math.max(peak, value);
    }
    return peak;
  }

  const lowDampingPeak = peakOvershoot(0.3);
  const highDampingPeak = peakOvershoot(1.4);
  assert.ok(
    highDampingPeak - 100 < lowDampingPeak - 100,
    `expected less overshoot at higher damping: low=${lowDampingPeak} high=${highDampingPeak}`,
  );
});

test("reset returns exactly the supplied value", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 2, damping: 1, response: 0 },
    0,
  );
  filter.update(DT, 100);
  filter.update(DT, 100);
  filter.reset(42, 0);
  assert.equal(filter.value, 42);
  assert.equal(filter.velocity, 0);
});

test("deterministic input gives deterministic output", () => {
  const a = new SecondOrderDynamics(
    { frequency: 1.7, damping: 0.72, response: 0.08 },
    0,
  );
  const b = new SecondOrderDynamics(
    { frequency: 1.7, damping: 0.72, response: 0.08 },
    0,
  );
  const targets = [10, 12, 15, 15, 20, 18, 5, -3];
  const outputsA = targets.map((t) => a.update(DT, t));
  const outputsB = targets.map((t) => b.update(DT, t));
  assert.deepEqual(outputsA, outputsB);
});

test("never produces NaN or Infinity across a stress sequence", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 2.4, damping: 0.3, response: 0.5 },
    0,
  );
  const targets = [0, 1000, -1000, 0, 1e6, -1e6, 0];
  for (const target of targets) {
    const value = filter.update(0.001, target);
    assert.ok(Number.isFinite(value));
    assert.ok(Number.isFinite(filter.velocity));
  }
});

test("zero or negative delta is a no-op", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 2, damping: 1, response: 0 },
    5,
  );
  filter.update(DT, 100);
  const valueAfterFirst = filter.value;
  const unchanged = filter.update(0, 100);
  assert.equal(unchanged, valueAfterFirst);
  const stillUnchanged = filter.update(-1, 100);
  assert.equal(stillUnchanged, valueAfterFirst);
});

test("rejects invalid configuration", () => {
  assert.throws(
    () => new SecondOrderDynamics({ frequency: 0, damping: 1, response: 0 }),
  );
  assert.throws(
    () => new SecondOrderDynamics({ frequency: -1, damping: 1, response: 0 }),
  );
  assert.throws(
    () => new SecondOrderDynamics({ frequency: 1, damping: -1, response: 0 }),
  );
  assert.throws(
    () =>
      new SecondOrderDynamics({
        frequency: 1,
        damping: 1,
        response: Number.NaN,
      }),
  );
});

test("supports an explicit target velocity instead of estimating it", () => {
  const filter = new SecondOrderDynamics(
    { frequency: 2, damping: 1, response: 0.2 },
    0,
  );
  const value = filter.update(DT, 10, 5);
  assert.ok(Number.isFinite(value));
});
