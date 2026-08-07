import assert from "node:assert/strict";
import { test } from "node:test";

import {
  generatePatternMarks,
  markBudgetForQuality,
  type PatternRecipeName,
} from "@/lib/mascot/appearance/PatternRecipes";
import type { MascotQuality } from "@/lib/mascot/types";

const RECIPES: PatternRecipeName[] = [
  "terrazzo-confetti",
  "constellation-freckles",
  "soft-stripes",
];
const QUALITIES: MascotQuality[] = ["reduced", "low", "medium", "high"];

test("reduced quality never generates any marks", () => {
  for (const recipe of RECIPES) {
    const marks = generatePatternMarks(recipe, 1, "reduced");
    assert.equal(marks.length, 0);
  }
});

test("mark budgets increase monotonically with quality", () => {
  for (const recipe of RECIPES) {
    const counts = QUALITIES.map((q) => markBudgetForQuality(recipe, q));
    for (let i = 1; i < counts.length; i += 1) {
      assert.ok(
        counts[i] >= counts[i - 1],
        `${recipe}: expected ${QUALITIES[i]} (${counts[i]}) >= ${
          QUALITIES[i - 1]
        } (${counts[i - 1]})`,
      );
    }
  }
});

test("low quality still produces at least one mark ('one flat print')", () => {
  for (const recipe of RECIPES) {
    assert.ok(markBudgetForQuality(recipe, "low") >= 1);
  }
});

test("generation is deterministic for a fixed (recipe, seed, quality) triple", () => {
  for (const recipe of RECIPES) {
    const a = generatePatternMarks(recipe, 42, "high");
    const b = generatePatternMarks(recipe, 42, "high");
    assert.deepEqual(a, b);
  }
});

test("different seeds produce different mark layouts", () => {
  const a = generatePatternMarks("terrazzo-confetti", 1, "high");
  const b = generatePatternMarks("terrazzo-confetti", 2, "high");
  assert.notDeepEqual(a, b);
});

test("every mark stays within valid local-coordinate bounds", () => {
  for (const recipe of RECIPES) {
    const marks = generatePatternMarks(recipe, 7, "high");
    for (const mark of marks) {
      assert.ok(mark.u >= 0 && mark.u <= 1, `u out of range: ${mark.u}`);
      assert.ok(mark.v >= -1 && mark.v <= 1, `v out of range: ${mark.v}`);
      assert.ok(mark.along > 0);
      assert.ok(mark.across >= 0);
      assert.ok(Number.isFinite(mark.rotation));
      assert.ok(Number.isFinite(mark.seed));
    }
  }
});

test("constellation-freckles thins out near the face (low u) more than the shoulder band", () => {
  const marks = generatePatternMarks("constellation-freckles", 11, "high");
  const nearFace = marks.filter((m) => m.u < 0.16).length;
  const shoulderBand = marks.filter((m) => m.u >= 0.16 && m.u < 0.5).length;
  assert.ok(
    shoulderBand >= nearFace,
    `expected shoulder band (${shoulderBand}) to be at least as dense as near-face (${nearFace})`,
  );
});

test("soft-stripes marks span across v (band shape, near-full width)", () => {
  const marks = generatePatternMarks("soft-stripes", 3, "high");
  assert.ok(marks.length > 0);
  for (const mark of marks) {
    assert.equal(mark.shape, "band");
    assert.ok(mark.across > 0.5);
  }
});
