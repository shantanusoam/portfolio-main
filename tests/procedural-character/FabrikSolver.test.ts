import assert from "node:assert/strict";
import { test } from "node:test";

import {
  createFabrikChain,
  signedBendSide,
  solveFabrik,
  totalChainLength,
} from "@/lib/procedural-character/physics/FabrikSolver";

const lengths = [24, 21, 18];
const root = { x: 3, y: -4 };

test("FABRIK reaches a reachable target and preserves every segment", () => {
  const target = { x: 47, y: 12 };
  const points = createFabrikChain(lengths, root, target, 1);
  const error = solveFabrik(points, lengths, root, target, {
    iterations: 12,
    tolerance: 0.05,
    preferredBendDirection: 1,
  });

  assert.ok(error < 0.06, `expected the foot to converge, error=${error}`);
  assert.deepEqual(points[0], root);
  for (let index = 1; index < points.length; index += 1) {
    const actual = Math.hypot(
      points[index].x - points[index - 1].x,
      points[index].y - points[index - 1].y,
    );
    assert.ok(Math.abs(actual - lengths[index - 1]) < 0.002);
  }
  assert.ok(signedBendSide(root, target, points[1]) > 0);
});

test("an unreachable foot extends toward the target without stretching", () => {
  const target = { x: 900, y: -4 };
  const points = createFabrikChain(lengths, root, target, -1);
  solveFabrik(points, lengths, root, target, {
    iterations: 8,
    tolerance: 0.05,
    preferredBendDirection: -1,
  });

  const end = points[points.length - 1];
  assert.ok(Math.abs(end.x - (root.x + totalChainLength(lengths))) < 0.0001);
  assert.ok(Math.abs(end.y - root.y) < 0.0001);
});

test("warm-started target changes keep the requested bend side", () => {
  const target = { x: 42, y: 5 };
  const points = createFabrikChain(lengths, root, target, -1);

  for (let index = 0; index < 30; index += 1) {
    target.x = 42 + Math.cos(index * 0.17) * 5;
    target.y = 5 + Math.sin(index * 0.21) * 7;
    solveFabrik(points, lengths, root, target, {
      iterations: 10,
      tolerance: 0.05,
      preferredBendDirection: -1,
    });
    assert.ok(signedBendSide(root, target, points[1]) <= 0);
  }
});
