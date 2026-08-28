import assert from "node:assert/strict";
import test from "node:test";
import {
  advanceSignalPulses,
  createSignalPulse,
  packSignalPulseUniforms,
  pushSignalPulse,
} from "../../lib/living-canvas/pulseField";

test("createSignalPulse clamps unsafe input", () => {
  assert.deepEqual(
    createSignalPulse({ x: -4, y: 2, intensity: Number.NaN, tone: "cool" }),
    { x: 0, y: 1, age: 0, intensity: 0, tone: "cool" },
  );
});

test("pushSignalPulse retains only the newest bounded entries", () => {
  let pulses = [
    createSignalPulse({ x: 0.1, y: 0.1 }),
    createSignalPulse({ x: 0.2, y: 0.2 }),
  ];
  pulses = pushSignalPulse(pulses, createSignalPulse({ x: 0.3, y: 0.3 }), 2);
  assert.deepEqual(
    pulses.map((pulse) => pulse.x),
    [0.2, 0.3],
  );
});

test("advanceSignalPulses ages entries and removes expired pulses", () => {
  const young = createSignalPulse({ x: 0.2, y: 0.3 });
  const old = { ...createSignalPulse({ x: 0.7, y: 0.8 }), age: 2.3 };
  const result = advanceSignalPulses([young, old], 0.2, 2.4);
  assert.equal(result.length, 1);
  assert.equal(result[0].age, 0.2);
});

test("packSignalPulseUniforms flips Y and signs cool intensity", () => {
  const packed = packSignalPulseUniforms([
    createSignalPulse({ x: 0.25, y: 0.2, intensity: 0.8, tone: "cool" }),
  ]);
  assert.equal(packed.length, 16);
  assert.ok(Math.abs(packed[0] - 0.25) < 1e-6);
  assert.ok(Math.abs(packed[1] - 0.8) < 1e-6);
  assert.equal(packed[2], 0);
  assert.ok(Math.abs(packed[3] + 0.8) < 1e-6);
});

test("packSignalPulseUniforms reuses and clears a fixed target", () => {
  const target = new Float32Array(16).fill(9);
  const packed = packSignalPulseUniforms(
    [createSignalPulse({ x: 0.4, y: 0.6 })],
    4,
    target,
  );
  assert.equal(packed, target);
  assert.equal(packed[4], 0);
  assert.equal(packed[15], 0);
});
