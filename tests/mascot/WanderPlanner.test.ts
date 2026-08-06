import assert from "node:assert/strict";
import { test } from "node:test";

import {
  isWanderSegmentFinished,
  sampleWanderSegment,
  WanderPlanner,
  type WanderBounds,
} from "@/lib/mascot/behavior/WanderPlanner";

const bounds: WanderBounds = { minX: 0, minY: 0, maxX: 1280, maxY: 800 };
const config = { bounds, minSegmentDuration: 2, maxSegmentDuration: 6 };

test("same seed produces the identical sequence of segments", () => {
  const a = new WanderPlanner(7, config, { x: 640, y: 400 });
  const b = new WanderPlanner(7, config, { x: 640, y: 400 });
  for (let i = 0; i < 10; i += 1) {
    const segA = a.nextSegment(i * 4);
    const segB = b.nextSegment(i * 4);
    assert.deepEqual(segA, segB);
  }
});

test("all sampled points stay within bounds, including spline overshoot", () => {
  const planner = new WanderPlanner(42, config, { x: 640, y: 400 });
  for (let i = 0; i < 12; i += 1) {
    const segment = planner.nextSegment(i * 4);
    for (let step = 0; step <= 40; step += 1) {
      const t = segment.startTime + (step / 40) * segment.duration;
      const point = sampleWanderSegment(segment, t, bounds);
      assert.ok(
        point.x >= bounds.minX - 1e-6 && point.x <= bounds.maxX + 1e-6,
        `x=${point.x}`,
      );
      assert.ok(
        point.y >= bounds.minY - 1e-6 && point.y <= bounds.maxY + 1e-6,
        `y=${point.y}`,
      );
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
    }
  }
});

test("segment durations are always within the configured range", () => {
  const planner = new WanderPlanner(3, config, { x: 0, y: 0 });
  for (let i = 0; i < 30; i += 1) {
    const segment = planner.nextSegment(i * 5);
    assert.ok(segment.duration >= config.minSegmentDuration - 1e-6);
    assert.ok(segment.duration <= config.maxSegmentDuration + 1e-6);
  }
});

test("control points are always finite", () => {
  const planner = new WanderPlanner(99, config, { x: 10, y: 10 });
  for (let i = 0; i < 20; i += 1) {
    const segment = planner.nextSegment(i * 3);
    for (const point of segment.controlPoints) {
      assert.ok(Number.isFinite(point.x));
      assert.ok(Number.isFinite(point.y));
    }
  }
});

test("no teleport between segments: next segment starts where the previous one ended", () => {
  const planner = new WanderPlanner(5, config, { x: 200, y: 200 });
  let previous = planner.nextSegment(0);
  for (let i = 1; i < 10; i += 1) {
    const segment = planner.nextSegment(i * 4);
    const previousEnd = sampleWanderSegment(
      previous,
      previous.startTime + previous.duration,
      bounds,
    );
    const nextStart = sampleWanderSegment(segment, segment.startTime, bounds);
    assert.ok(Math.abs(previousEnd.x - nextStart.x) < 1e-6);
    assert.ok(Math.abs(previousEnd.y - nextStart.y) < 1e-6);
    previous = segment;
  }
});

test("never repeats the same path kind twice in a row", () => {
  const planner = new WanderPlanner(11, config, { x: 640, y: 400 });
  let lastKind = planner.nextSegment(0).kind;
  for (let i = 1; i < 60; i += 1) {
    const segment = planner.nextSegment(i * 4);
    assert.notEqual(segment.kind, lastKind);
    lastKind = segment.kind;
  }
});

test("isWanderSegmentFinished flips true once duration elapses", () => {
  const planner = new WanderPlanner(1, config, { x: 0, y: 0 });
  const segment = planner.nextSegment(0);
  assert.equal(isWanderSegmentFinished(segment, segment.startTime), false);
  assert.equal(
    isWanderSegmentFinished(segment, segment.startTime + segment.duration),
    true,
  );
});
