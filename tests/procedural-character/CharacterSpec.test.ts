import assert from "node:assert/strict";
import { test } from "node:test";

import { createCharacterSpec } from "@/lib/procedural-character/createCharacterSpec";

test("the generic builder creates an arbitrary radial appendage count", () => {
  const creature = createCharacterSpec({
    id: "ten-legged-alien",
    appendages: 10,
    appendageDefaults: {
      segmentLengths: [12, 11, 10, 9],
      step: { threshold: 18 },
    },
  });

  assert.equal(creature.appendages.length, 10);
  assert.equal(new Set(creature.appendages.map((leg) => leg.id)).size, 10);
  assert.ok(
    creature.appendages.every((leg) => leg.segmentLengths.length === 4),
  );
  assert.ok(creature.appendages.every((leg) => leg.step.threshold === 18));
});

test("the same specification infrastructure supports a zero-leg chain body", () => {
  const worm = createCharacterSpec({
    id: "test-worm",
    appendages: 0,
    bodyShape: "chain",
    body: {
      segmentCount: 16,
      segmentSpacing: 9,
      widthProfile: { kind: "head-heavy", exponent: 1.5 },
    },
  });

  assert.equal(worm.body.shape, "chain");
  assert.equal(worm.body.segmentCount, 16);
  assert.equal(worm.appendages.length, 0);
});
