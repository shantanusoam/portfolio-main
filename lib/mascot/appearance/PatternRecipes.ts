import { SeededRandom } from "../core/SeededRandom";
import type { AppearancePatternRecipeName, MascotQuality } from "../types";

/**
 * Original local-space print recipes — upgrade spec "LOCAL-SPACE PROCEDURAL
 * PRINT" / "Pattern recipes". Three of the six suggested recipes,
 * implemented as bounded local-space primitives (Option A: circles/capsules/
 * short lines) so they stay stable, art-directable, and asset-free:
 *
 * - Terrazzo Confetti: medium irregular blobs, two accent colours, low coverage.
 * - Constellation Freckles: sparse points + occasional connecting lines, denser at the shoulders, thin near the face.
 * - Soft Stripes: broad low-contrast bands across the body width.
 *
 * Generated once per recipe/quality change via `generatePatternMarks` — never
 * per frame — mirroring `MascotRuntime.setQuality()`'s existing
 * `skinPoints` regeneration.
 */

export type PatternRecipeName = AppearancePatternRecipeName;
export type PatternColorRole = "primary" | "secondary" | "accent";
export type PatternMarkShape = "blob" | "line" | "band";

export interface PatternMark {
  /** 0 = head, 1 = tail — stable forever, resolved fresh each frame via LocalSkinCoordinates. */
  u: number;
  /** -1 = left, 1 = right. */
  v: number;
  seed: number;
  colorRole: PatternColorRole;
  /** Half-extent along the body's longitudinal axis, in local "segment" units. */
  along: number;
  /** Half-extent across the body's lateral axis, as a fraction of the local half-width. */
  across: number;
  rotation: number;
  shape: PatternMarkShape;
  layer: 0 | 1;
}

/** Sparse accent budgets — V2 §9 reduces saturated print coverage heavily. */
const RECIPE_BUDGET: Record<PatternRecipeName, number> = {
  "terrazzo-confetti": 12,
  "constellation-freckles": 14,
  "soft-stripes": 5,
};

/** Mark count budget per quality tier — "low" gets one flat print (a couple of large marks), reduced gets none. */
export function markBudgetForQuality(
  recipe: PatternRecipeName,
  quality: MascotQuality,
): number {
  const base = RECIPE_BUDGET[recipe];
  switch (quality) {
    case "reduced":
      return 0;
    case "low":
      return Math.max(1, Math.round(base * 0.12));
    case "medium":
      return Math.round(base * 0.7);
    case "high":
    default:
      return base;
  }
}

function clampToRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function generateTerrazzoConfetti(
  rng: SeededRandom,
  count: number,
): PatternMark[] {
  const marks: PatternMark[] = [];
  for (let i = 0; i < count; i += 1) {
    marks.push({
      u: rng.range(0.1, 0.92),
      v: rng.range(-0.75, 0.75),
      seed: rng.next() * 1000,
      colorRole: rng.next() < 0.5 ? "primary" : "secondary",
      along: rng.range(0.18, 0.42),
      across: rng.range(0.08, 0.18),
      rotation: rng.angle(),
      shape: "blob",
      layer: 0,
    });
  }
  return marks;
}

function generateConstellationFreckles(
  rng: SeededRandom,
  count: number,
): PatternMark[] {
  const marks: PatternMark[] = [];
  let lastV = 0;
  for (let i = 0; i < count; i += 1) {
    // Bias toward the shoulder band, thin out near the face (upgrade spec:
    // "increased density near shoulders, reduced density near face").
    const u = clampToRange(0.14 + Math.pow(rng.next(), 0.6) * 0.68, 0.14, 0.95);
    const v = rng.range(-0.8, 0.8);
    marks.push({
      u,
      v,
      seed: rng.next() * 1000,
      colorRole: "accent",
      along: rng.range(0.06, 0.12),
      across: rng.range(0.06, 0.12),
      rotation: 0,
      shape: "blob",
      layer: 1,
    });
    if (i > 0 && rng.next() < 0.3) {
      marks.push({
        u,
        v: lerpUnbounded(lastV, v, 0.5),
        seed: rng.next() * 1000,
        colorRole: "accent",
        along: rng.range(0.15, 0.3),
        across: 0.02,
        rotation: rng.angle(),
        shape: "line",
        layer: 1,
      });
    }
    lastV = v;
  }
  return marks;
}

function lerpUnbounded(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function generateSoftStripes(rng: SeededRandom, count: number): PatternMark[] {
  const marks: PatternMark[] = [];
  for (let i = 0; i < count; i += 1) {
    const spread = count > 1 ? i / (count - 1) : 0;
    const u = clampToRange(
      0.12 + spread * 0.72 + rng.range(-0.02, 0.02),
      0.06,
      0.92,
    );
    marks.push({
      u,
      v: 0,
      seed: rng.next() * 1000,
      colorRole: i % 2 === 0 ? "primary" : "secondary",
      along: rng.range(0.06, 0.1),
      across: 0.92,
      rotation: 0,
      shape: "band",
      layer: 0,
    });
  }
  return marks;
}

/**
 * Generates the stable mark list for a recipe. Deterministic for a given
 * (recipe, seed, quality) triple — call once on recipe/quality change, never
 * per frame.
 */
export function generatePatternMarks(
  recipe: PatternRecipeName,
  seed: number,
  quality: MascotQuality,
): PatternMark[] {
  const rng = new SeededRandom(seed);
  const count = markBudgetForQuality(recipe, quality);
  if (count <= 0) return [];

  switch (recipe) {
    case "terrazzo-confetti":
      return generateTerrazzoConfetti(rng, count);
    case "constellation-freckles":
      return generateConstellationFreckles(rng, count);
    case "soft-stripes":
      return generateSoftStripes(rng, count);
    default:
      return [];
  }
}
