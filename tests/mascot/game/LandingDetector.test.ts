import assert from "node:assert/strict";
import { test } from "node:test";

import { detectLanding } from "@/lib/mascot/game/LandingDetector";
import type { GeneratedPlatform } from "@/lib/mascot/game/GameTypes";

function platform(
  overrides: Partial<GeneratedPlatform> = {},
): GeneratedPlatform {
  return {
    id: "p1",
    kind: "normal",
    x: 100,
    y: 0,
    width: 140,
    note: { midiNote: 60, frequency: 261.63 },
    chordRole: 0,
    difficulty: 0,
    seed: 0,
    active: true,
    ...overrides,
  };
}

test("a downward crossing through the platform top with horizontal overlap lands", () => {
  const result = detectLanding(-10, 5, 400, 150, 16, [platform()], 1, {});
  assert.ok(result);
  assert.equal(result?.platformId, "p1");
});

test("upward velocity never resolves as a landing", () => {
  const result = detectLanding(5, -10, -400, 150, 16, [platform()], 1, {});
  assert.equal(result, null);
});

test("staying entirely above the platform top never lands", () => {
  const result = detectLanding(-30, -10, 400, 150, 16, [platform()], 1, {});
  assert.equal(result, null);
});

test("horizontal miss (outside the platform footprint plus radius) does not land", () => {
  const result = detectLanding(-10, 5, 400, 500, 16, [platform()], 1, {});
  assert.equal(result, null);
});

test("landing within playerRadius of the platform edge still counts", () => {
  const result = detectLanding(-10, 5, 400, 100 - 15, 16, [platform()], 1, {});
  assert.ok(result);
});

test("a platform on cooldown does not retrigger", () => {
  const cooldowns = { p1: 5 };
  const result = detectLanding(
    -10,
    5,
    400,
    150,
    16,
    [platform()],
    1,
    cooldowns,
  );
  assert.equal(result, null);
});

test("an inactive platform never lands", () => {
  const result = detectLanding(
    -10,
    5,
    400,
    150,
    16,
    [platform({ active: false })],
    1,
    {},
  );
  assert.equal(result, null);
});

test("among multiple valid platforms, the topmost (smallest y, first crossed) wins", () => {
  const platforms = [
    platform({ id: "lower", y: 40 }),
    platform({ id: "upper", y: 10 }),
  ];
  const result = detectLanding(-10, 60, 400, 150, 16, platforms, 1, {});
  assert.equal(result?.platformId, "upper");
});

test("contactPosition is a clamped 0..1 fraction across the platform width", () => {
  const centerResult = detectLanding(
    -10,
    5,
    400,
    100 + 70,
    16,
    [platform()],
    1,
    {},
  );
  assert.ok(centerResult);
  assert.ok(Math.abs((centerResult?.contactPosition ?? -1) - 0.5) < 1e-6);

  const edgeResult = detectLanding(
    -10,
    5,
    400,
    100 - 16,
    16,
    [platform()],
    1,
    {},
  );
  assert.ok(edgeResult);
  assert.equal(edgeResult?.contactPosition, 0);
});

test("a zero-magnitude velocityY never lands (must be strictly downward)", () => {
  const result = detectLanding(-10, 5, 0, 150, 16, [platform()], 1, {});
  assert.equal(result, null);
});
