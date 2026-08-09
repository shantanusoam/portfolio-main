import assert from "node:assert/strict";
import { test } from "node:test";

import { SoftChain } from "@/lib/procedural-character/physics/SoftChain";

const spring = {
  damping: 0.93,
  guideStrength: 0.18,
  gravity: 220,
  curl: 600,
  constraintIterations: 8,
};

test("the soft chain pins both endpoints while retaining secondary curvature", () => {
  const guide = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 40, y: 0 },
    { x: 60, y: 0 },
  ];
  const chain = new SoftChain(guide, [20, 20, 20]);
  const anchor = { x: 8, y: 3 };
  const tip = { x: 65, y: 14 };

  for (let frame = 0; frame < 45; frame += 1) {
    guide[0] = { ...anchor };
    guide[1].x += 0.08;
    guide[2].y = Math.sin(frame * 0.12) * 6;
    guide[3] = { ...tip };
    chain.update(guide, anchor, tip, {
      dt: 1 / 120,
      elapsedTime: frame / 120,
      phase: 0.2,
      reducedMotion: false,
      spring,
    });
  }

  assert.deepEqual(chain.points[0], anchor);
  assert.deepEqual(chain.points.at(-1), tip);
  assert.notDeepEqual(chain.points[2], guide[2]);
  assert.ok(chain.points.every((point) => Number.isFinite(point.x + point.y)));
});

test("reduced motion strongly limits procedural curl", () => {
  const guide = [
    { x: 0, y: 0 },
    { x: 20, y: 0 },
    { x: 40, y: 0 },
    { x: 60, y: 0 },
  ];
  const full = new SoftChain(guide, [20, 20, 20]);
  const reduced = new SoftChain(guide, [20, 20, 20]);

  for (let frame = 0; frame < 30; frame += 1) {
    const options = {
      dt: 1 / 120,
      elapsedTime: frame / 120,
      phase: 0.7,
      spring,
    };
    full.update(guide, guide[0], guide[3], {
      ...options,
      reducedMotion: false,
    });
    reduced.update(guide, guide[0], guide[3], {
      ...options,
      reducedMotion: true,
    });
  }

  assert.ok(Math.abs(full.points[1].y) > Math.abs(reduced.points[1].y));
});
