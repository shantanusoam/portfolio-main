import assert from "node:assert/strict";
import { test } from "node:test";

import {
  pathFromContour,
  sampleCatmullRomRail,
} from "@/lib/mascot/appearance/ContourPath";

test("sampleCatmullRomRail densifies a 4-point rail", () => {
  const rail = [
    { x: 0, y: 0 },
    { x: 10, y: 5 },
    { x: 20, y: 0 },
    { x: 30, y: 8 },
  ];
  const sampled = sampleCatmullRomRail(rail, 4);
  // 1 start + 3 segments × 4 samples
  assert.equal(sampled.length, 1 + 3 * 4);
  assert.equal(sampled[0].x, 0);
  assert.equal(sampled[sampled.length - 1].x, 30);
});

test("sampleCatmullRomRail handles short rails", () => {
  assert.deepEqual(sampleCatmullRomRail([]), []);
  assert.deepEqual(sampleCatmullRomRail([{ x: 1, y: 2 }]), [{ x: 1, y: 2 }]);
  assert.equal(
    sampleCatmullRomRail(
      [
        { x: 0, y: 0 },
        { x: 5, y: 5 },
      ],
      4,
    ).length,
    2,
  );
});

test("pathFromContour returns a closed Path2D when available", () => {
  if (typeof Path2D === "undefined") {
    assert.equal(
      pathFromContour({
        left: [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
        ],
        right: [
          { x: 0, y: 4 },
          { x: 10, y: 4 },
        ],
      }),
      null,
    );
    return;
  }

  const path = pathFromContour({
    left: [
      { x: 0, y: 0 },
      { x: 10, y: -2 },
      { x: 20, y: 0 },
    ],
    right: [
      { x: 0, y: 6 },
      { x: 10, y: 8 },
      { x: 20, y: 6 },
    ],
  });
  assert.ok(path instanceof Path2D);
});
