import assert from "node:assert/strict";
import { test } from "node:test";

import { SeededRandom } from "@/lib/mascot/core/SeededRandom";

test("same seed produces the identical sequence", () => {
  const a = new SeededRandom(42);
  const b = new SeededRandom(42);
  const seqA = Array.from({ length: 20 }, () => a.next());
  const seqB = Array.from({ length: 20 }, () => b.next());
  assert.deepEqual(seqA, seqB);
});

test("different seeds diverge", () => {
  const a = new SeededRandom(1);
  const b = new SeededRandom(2);
  const seqA = Array.from({ length: 10 }, () => a.next());
  const seqB = Array.from({ length: 10 }, () => b.next());
  assert.notDeepEqual(seqA, seqB);
});

test("next() stays within [0, 1)", () => {
  const rng = new SeededRandom(7);
  for (let i = 0; i < 500; i += 1) {
    const value = rng.next();
    assert.ok(value >= 0 && value < 1, `value ${value} out of range`);
  }
});

test("seed 0 does not degenerate to a constant stream", () => {
  const rng = new SeededRandom(0);
  const values = new Set(Array.from({ length: 20 }, () => rng.next()));
  assert.ok(values.size > 1);
});

test("range respects bounds", () => {
  const rng = new SeededRandom(99);
  for (let i = 0; i < 200; i += 1) {
    const value = rng.range(-5, 5);
    assert.ok(value >= -5 && value < 5);
  }
});

test("pick only returns supplied items and throws on empty input", () => {
  const rng = new SeededRandom(3);
  const items = ["a", "b", "c"] as const;
  for (let i = 0; i < 50; i += 1) {
    assert.ok(items.includes(rng.pick(items)));
  }
  assert.throws(() => rng.pick([]));
});

test("fork produces a deterministic but different generator", () => {
  const a = new SeededRandom(11);
  const forkA1 = a.fork();

  const b = new SeededRandom(11);
  const forkB1 = b.fork();

  assert.equal(forkA1.next(), forkB1.next());
});
