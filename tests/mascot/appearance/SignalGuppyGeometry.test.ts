import assert from "node:assert/strict";
import { test } from "node:test";

import { neutralBodyDeformation } from "@/lib/mascot/appearance/BodyDeformation";
import { computePaddleTailFrame } from "@/lib/mascot/appearance/SignalGuppyGeometry";
import type { RibPoint } from "@/lib/mascot/character/CreatureRig";

function rib(x: number, width: number): RibPoint {
  return {
    center: { x, y: 20 },
    left: { x, y: 20 + width },
    right: { x, y: 20 - width },
    normalX: 0,
    normalY: 1,
    width,
  };
}

test("paddle tail extends behind the final body rib with bounded dimensions", () => {
  const frame = computePaddleTailFrame([
    rib(0, 12),
    rib(10, 9),
    rib(20, 4),
    rib(30, 0),
  ]);
  assert.ok(frame);
  assert.deepEqual(frame.attach, { x: 30, y: 20 });
  assert.ok(frame.directionX > 0.99);
  assert.ok(Math.abs(frame.directionY) < 1e-9);
  assert.ok(frame.length >= 17 && frame.length <= 21);
  assert.ok(frame.halfWidth >= 11 && frame.halfWidth <= 15);
});

test("paddle tail reacts gently to stretch without becoming a needle", () => {
  const ribs = [rib(0, 12), rib(10, 8), rib(20, 3), rib(30, 0)];
  const neutral = computePaddleTailFrame(ribs, neutralBodyDeformation());
  const stretched = computePaddleTailFrame(ribs, {
    ...neutralBodyDeformation(),
    tailStretch: 1,
  });
  assert.ok(neutral && stretched);
  assert.ok(stretched.length > neutral.length);
  assert.ok(stretched.length < neutral.length * 1.2);
  assert.ok(stretched.halfWidth > neutral.halfWidth * 0.9);
});

test("degenerate ribs never produce non-finite tail geometry", () => {
  const frame = computePaddleTailFrame([rib(10, 4), rib(10, 0)]);
  assert.ok(frame);
  for (const value of Object.values(frame)) {
    if (typeof value === "number") assert.ok(Number.isFinite(value));
  }
});
