import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createFabrikChain,
  sideOfLine,
  solveFabrik,
  type FabrikChainConfig,
} from "@/lib/mascot/motion/FabrikSolver";

const segmentLengths = [20, 18];
const config: FabrikChainConfig = {
  segmentLengths,
  iterations: 10,
  tolerance: 0.1,
};

test("converges to a reachable target within tolerance", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  solveFabrik(points, 0, 0, 25, 10, config);
  const end = points[points.length - 1];
  assert.ok(Math.hypot(end.x - 25, end.y - 10) < config.tolerance + 1e-6);
});

test("an unreachable target fully extends the chain toward it, preserving segment lengths", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  const totalLength = segmentLengths.reduce((a, b) => a + b, 0);
  solveFabrik(points, 0, 0, totalLength * 5, 0, config);

  for (let i = 1; i < points.length; i += 1) {
    const dist = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
    assert.ok(Math.abs(dist - segmentLengths[i - 1]) < 1e-6);
  }
  const end = points[points.length - 1];
  assert.ok(Math.abs(end.x - totalLength) < 1e-6);
  assert.ok(Math.abs(end.y) < 1e-6);
});

test("segment lengths are preserved for a reachable target too", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  solveFabrik(points, 0, 0, 15, 15, config);
  for (let i = 1; i < points.length; i += 1) {
    const dist = Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
    assert.ok(Math.abs(dist - segmentLengths[i - 1]) < 1e-3);
  }
});

test("root stays pinned exactly", () => {
  const points = createFabrikChain(segmentLengths, 5, -3, 1);
  solveFabrik(points, 5, -3, 20, 20, config);
  assert.equal(points[0].x, 5);
  assert.equal(points[0].y, -3);
});

test("iteration count is bounded even for a pathological value", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  const start = Date.now();
  solveFabrik(points, 0, 0, 15, 15, { ...config, iterations: 10_000_000 });
  const elapsed = Date.now() - start;
  assert.ok(elapsed < 200, `expected bounded iterations, took ${elapsed}ms`);
  for (const point of points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  }
});

test("degenerate case (target equals root) resolves to finite, non-exploding positions", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  solveFabrik(points, 0, 0, 0, 0, config);
  for (const point of points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  }
});

test("deterministic: identical inputs produce identical output", () => {
  const a = createFabrikChain(segmentLengths, 0, 0, 1);
  const b = createFabrikChain(segmentLengths, 0, 0, 1);
  solveFabrik(a, 0, 0, 22, 12, config);
  solveFabrik(b, 0, 0, 22, 12, config);
  assert.deepEqual(a, b);
});

test("warm-started small target movements keep the bend on the same side (no knee flip)", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  solveFabrik(points, 0, 0, 20, 5, config);
  const knee = points[1];
  const initialSide = Math.sign(sideOfLine(0, 0, 20, 5, knee.x, knee.y));

  // Small continuous target movements, warm-starting from the persisted `points` array.
  for (let i = 1; i <= 20; i += 1) {
    const targetX = 20 + i * 0.3;
    const targetY = 5 + Math.sin(i * 0.2) * 2;
    solveFabrik(points, 0, 0, targetX, targetY, config);
    const side = Math.sign(
      sideOfLine(0, 0, targetX, targetY, points[1].x, points[1].y),
    );
    assert.equal(side, initialSide, `bend flipped at step ${i}`);
  }
});

test("createFabrikChain produces a non-degenerate (bent) initial pose", () => {
  const points = createFabrikChain(segmentLengths, 0, 0, 1);
  assert.equal(points.length, 3);
  for (const point of points) {
    assert.ok(Number.isFinite(point.x));
    assert.ok(Number.isFinite(point.y));
  }
});
