import assert from "node:assert/strict";
import { test } from "node:test";

import { SeededRandom } from "@/lib/mascot/core/SeededRandom";
import {
  clampFrequency,
  clampPan,
  evictOldestIfAtCapacity,
  perceptualIntensity,
  renderKarplusStrongSamples,
} from "@/lib/mascot/music/MascotPluckVoice";

test("clampFrequency keeps values inside the configured range", () => {
  assert.equal(clampFrequency(20), 40);
  assert.equal(clampFrequency(5000), 2000);
  assert.equal(clampFrequency(440), 440);
});

test("clampFrequency falls back to the minimum for non-finite input", () => {
  assert.equal(clampFrequency(NaN), 40);
  assert.equal(clampFrequency(Infinity), 40);
});

test("clampPan keeps values within the configured symmetric limit", () => {
  assert.equal(clampPan(-5), -0.75);
  assert.equal(clampPan(5), 0.75);
  assert.equal(clampPan(0.2), 0.2);
});

test("clampPan treats non-finite input as centered", () => {
  assert.equal(clampPan(NaN), 0);
});

test("perceptualIntensity is concave (quiet input is boosted proportionally more than loud input)", () => {
  const quiet = perceptualIntensity(0.1);
  const loud = perceptualIntensity(1);
  assert.equal(loud, 1);
  assert.ok(
    quiet > 0.1,
    "0.6 exponent on [0,1] must lift values above the linear diagonal",
  );
});

test("perceptualIntensity floors at the configured minimum audible level", () => {
  assert.equal(perceptualIntensity(0), 0.12);
  assert.ok(perceptualIntensity(-5) >= 0.12);
});

test("perceptualIntensity clamps out-of-range and non-finite input", () => {
  assert.equal(perceptualIntensity(NaN), 0.12);
  assert.equal(perceptualIntensity(5), 1);
});

test("renderKarplusStrongSamples is deterministic for a given seed", () => {
  const a = renderKarplusStrongSamples(44100, 220, 0.05, new SeededRandom(7));
  const b = renderKarplusStrongSamples(44100, 220, 0.05, new SeededRandom(7));
  assert.deepEqual(Array.from(a), Array.from(b));
});

test("renderKarplusStrongSamples produces only finite samples", () => {
  const samples = renderKarplusStrongSamples(
    44100,
    220,
    0.05,
    new SeededRandom(1),
  );
  for (let i = 0; i < samples.length; i += 1) {
    assert.ok(Number.isFinite(samples[i]));
  }
});

test("renderKarplusStrongSamples produces the requested frame count", () => {
  const sampleRate = 44100;
  const duration = 0.1;
  const samples = renderKarplusStrongSamples(
    sampleRate,
    220,
    duration,
    new SeededRandom(1),
  );
  assert.equal(samples.length, Math.floor(sampleRate * duration));
});

test("renderKarplusStrongSamples decays: late-window energy is lower than early-window energy", () => {
  const sampleRate = 44100;
  const samples = renderKarplusStrongSamples(
    sampleRate,
    220,
    1,
    new SeededRandom(3),
  );
  const windowSize = 2000;
  const earlyEnergy = rms(samples.slice(2000, 2000 + windowSize));
  const lateEnergy = rms(samples.slice(samples.length - windowSize));
  assert.ok(
    lateEnergy < earlyEnergy,
    `expected decay: early=${earlyEnergy}, late=${lateEnergy}`,
  );
});

function rms(values: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < values.length; i += 1) sum += values[i] * values[i];
  return Math.sqrt(sum / values.length);
}

test("evictOldestIfAtCapacity is a no-op below capacity", () => {
  const cache = new Map<number, string>([
    [1, "a"],
    [2, "b"],
  ]);
  evictOldestIfAtCapacity(cache, 5);
  assert.equal(cache.size, 2);
});

test("evictOldestIfAtCapacity drops the oldest (first-inserted) entry once at capacity", () => {
  const cache = new Map<number, string>();
  cache.set(1, "a");
  cache.set(2, "b");
  cache.set(3, "c");
  evictOldestIfAtCapacity(cache, 3);
  assert.equal(cache.size, 2);
  assert.equal(cache.has(1), false, "oldest entry should have been evicted");
  assert.ok(cache.has(2) && cache.has(3));
});

test("evictOldestIfAtCapacity never grows the cache past maxSize across repeated insertions", () => {
  const cache = new Map<number, string>();
  const maxSize = 4;
  for (let i = 0; i < 20; i += 1) {
    evictOldestIfAtCapacity(cache, maxSize);
    cache.set(i, `v${i}`);
  }
  assert.ok(cache.size <= maxSize);
});
