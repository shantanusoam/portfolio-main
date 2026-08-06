import assert from "node:assert/strict";
import { test } from "node:test";

import { ParticlePool } from "@/lib/mascot/rendering/ParticlePool";

test("spawning never exceeds the configured capacity", () => {
  const pool = new ParticlePool(5);
  for (let i = 0; i < 20; i += 1) {
    pool.spawn("spark", i, i, 0, 0, 1, 2, i);
  }
  assert.equal(pool.getActiveCount(), 5);
});

test("recycles the oldest slot once the pool is full", () => {
  const pool = new ParticlePool(2);
  const first = pool.spawn("spark", 1, 1, 0, 0, 1, 2, 1);
  pool.spawn("spark", 2, 2, 0, 0, 1, 2, 2);
  pool.spawn("spark", 3, 3, 0, 0, 1, 2, 3); // should recycle `first`'s slot
  assert.equal(first?.x, 3);
  assert.equal(first?.seed, 3);
});

test("update decays life and deactivates expired particles", () => {
  const pool = new ParticlePool(3);
  pool.spawn("spark", 0, 0, 0, 0, 0.1, 2, 0);
  pool.update(0.2);
  assert.equal(pool.getActiveCount(), 0);
});

test("update moves particles by velocity and applies drag", () => {
  const pool = new ParticlePool(1);
  const p = pool.spawn("spark", 0, 0, 100, 0, 10, 2, 0)!;
  pool.update(1 / 60);
  assert.ok(p.x > 0);
  assert.ok(p.vx < 100, "drag should reduce velocity");
});

test("clear deactivates every particle", () => {
  const pool = new ParticlePool(4);
  for (let i = 0; i < 4; i += 1) pool.spawn("spark", i, i, 0, 0, 5, 2, i);
  pool.clear();
  assert.equal(pool.getActiveCount(), 0);
});

test("zero-capacity pool never spawns and never throws", () => {
  const pool = new ParticlePool(0);
  const result = pool.spawn("spark", 0, 0, 0, 0, 1, 1, 0);
  assert.equal(result, null);
  assert.equal(pool.getActiveCount(), 0);
  pool.update(1 / 60);
});

test("forEachActive only visits active particles", () => {
  const pool = new ParticlePool(3);
  pool.spawn("spark", 1, 1, 0, 0, 5, 1, 1);
  pool.spawn("spark", 2, 2, 0, 0, 0.001, 1, 2);
  pool.update(0.1); // expires the second particle
  let visited = 0;
  pool.forEachActive(() => (visited += 1));
  assert.equal(visited, 1);
});

test("non-finite motion deactivates the particle instead of propagating NaN", () => {
  const pool = new ParticlePool(1);
  pool.spawn("spark", 0, 0, Infinity, 0, 5, 1, 0);
  pool.update(1);
  assert.equal(pool.getActiveCount(), 0);
});
