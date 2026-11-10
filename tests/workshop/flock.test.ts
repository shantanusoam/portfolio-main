import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createFlock,
  stepFlock,
} from "../../components/workshop/playground/flock";

test("the same seed arrangement and steering produce a reproducible flock", () => {
  const a = createFlock(),
    b = createFlock();
  for (let i = 0; i < 300; i++) {
    stepFlock(a, 1 / 60, { x: 650, y: 220 }, "release", i / 60);
    stepFlock(b, 1 / 60, { x: 650, y: 220 }, "release", i / 60);
  }
  assert.deepEqual(a, b);
});
test("long-running steering and a suspended-tab time gap remain bounded", () => {
  const flock = createFlock(40);
  for (let i = 0; i < 6000; i++) {
    stepFlock(
      flock,
      i % 500 === 0 ? 30 : 1 / 60,
      { x: i % 1000, y: i % 600 },
      i % 400 < 200 ? "gather" : "release",
      i / 60,
    );
    for (const seed of flock) {
      assert.ok(Number.isFinite(seed.x + seed.y + seed.vx + seed.vy));
      assert.ok(seed.x >= 30 && seed.x <= 970 && seed.y >= 30 && seed.y <= 470);
      assert.ok(Math.hypot(seed.vx, seed.vy) <= 72.00001);
    }
  }
});
test("gather forms a smaller shared region than release without collapsing the flock", () => {
  const gather = createFlock(),
    release = createFlock();
  for (let i = 0; i < 2400; i++) {
    stepFlock(gather, 1 / 60, { x: 500, y: 250 }, "gather", i / 60);
    stepFlock(release, 1 / 60, { x: 500, y: 250 }, "release", i / 60);
  }
  const radius = (f: typeof gather) =>
    f.reduce((sum, p) => sum + Math.hypot(p.x - 500, p.y - 250), 0) / f.length;
  assert.ok(radius(gather) < radius(release));
  const unique = new Set(
    gather.map((p) => `${Math.round(p.x)},${Math.round(p.y)}`),
  );
  assert.ok(unique.size > gather.length * 0.9);
});
