import assert from "node:assert/strict";
import { test } from "node:test";

import { SoftBodyRuntime } from "@/lib/procedural-character/physics/SoftBody";
import { mantaPreset } from "@/lib/procedural-character/presets/manta";

function segmentsIntersect(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
  d: { x: number; y: number },
): boolean {
  const cross = (
    p: { x: number; y: number },
    q: { x: number; y: number },
    r: { x: number; y: number },
  ) => (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x);
  return (
    cross(a, b, c) * cross(a, b, d) < 0 && cross(c, d, a) * cross(c, d, b) < 0
  );
}

function hasSelfIntersection(points: readonly { x: number; y: number }[]) {
  for (let left = 0; left < points.length; left += 1) {
    const leftNext = (left + 1) % points.length;
    for (let right = left + 1; right < points.length; right += 1) {
      const rightNext = (right + 1) % points.length;
      if (leftNext === right || rightNext === left) continue;
      if (
        segmentsIntersect(
          points[left],
          points[leftNext],
          points[right],
          points[rightNext],
        )
      )
        return true;
    }
  }
  return false;
}

test("the soft polygon stays finite, unfolded, and preserves area", () => {
  const center = { x: 0, y: 0 };
  const body = new SoftBodyRuntime(
    mantaPreset.body.softBody,
    center,
    0,
    mantaPreset.body.radius,
  );

  for (let frame = 0; frame < 720; frame += 1) {
    center.x = Math.sin(frame * 0.031) * 180;
    center.y = Math.cos(frame * 0.047) * 120;
    body.update({
      dt: 1 / 120,
      elapsedTime: frame / 120,
      center,
      rotation: Math.sin(frame * 0.017) * 1.4,
      radius: mantaPreset.body.radius,
      normalizedSpeed: frame % 180 < 90 ? 0.25 : 1,
      reducedMotion: false,
    });
    assert.ok(body.points.every((point) => Number.isFinite(point.x + point.y)));
    assert.ok(body.areaRatio > 0.84 && body.areaRatio < 1.16);
    assert.equal(hasSelfIntersection(body.points), false);
  }
});

test("the soft body exposes its deformed rest outline separately", () => {
  const center = { x: 10, y: 20 };
  const body = new SoftBodyRuntime(
    mantaPreset.body.softBody,
    center,
    0,
    mantaPreset.body.radius,
  );
  const initialTip = { ...body.restTargets[3] };
  body.update({
    dt: 1 / 60,
    elapsedTime: 0.4,
    center,
    rotation: 0,
    radius: mantaPreset.body.radius,
    normalizedSpeed: 1,
    reducedMotion: false,
  });
  assert.notDeepEqual(body.restTargets[3], initialTip);
  assert.notEqual(body.points, body.restTargets);
});
