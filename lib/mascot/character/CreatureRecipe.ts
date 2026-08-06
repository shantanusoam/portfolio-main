import type { SpineSolverConfig } from "../motion/SpineSolver";
import type { VerletChainConfig } from "../motion/VerletChain";
import type { BodyProfileConfig, MascotQuality } from "../types";

/**
 * The one concrete creature this portfolio ships: 24 spine joints, a
 * front-weighted silhouette, two antennae, and a soft tail-tip whisker on a
 * Verlet chain. Original anatomy per spec — not a copy of the reference
 * video's character.
 */

export interface SpineRegionBounds {
  start: number;
  end: number;
}

export interface CreatureRecipe {
  name: string;
  spine: SpineSolverConfig;
  bodyProfile: BodyProfileConfig;
  regions: {
    head: SpineRegionBounds;
    shoulders: SpineRegionBounds;
    torso: SpineRegionBounds;
    tailBase: SpineRegionBounds;
    tailTip: SpineRegionBounds;
  };
  antennaeCount: number;
  antennaeSegments: number;
  antennaeChain: VerletChainConfig;
  tailWhiskerChain: VerletChainConfig;
  coreRadius: number;
}

export const DEFAULT_CREATURE_RECIPE: CreatureRecipe = {
  name: "constellation-familiar",
  spine: {
    jointCount: 24,
    segmentLength: 12,
    headAngleLimitRadians: (10 * Math.PI) / 180,
    tailAngleLimitRadians: (32 * Math.PI) / 180,
    iterations: 4,
  },
  bodyProfile: {
    maxWidth: 26,
    headScale: 1.9,
    shoulderPosition: 0.3,
    tailExponent: 1.35,
    bellyBias: 0.08,
  },
  regions: {
    head: { start: 0, end: 3 },
    shoulders: { start: 4, end: 7 },
    torso: { start: 8, end: 13 },
    tailBase: { start: 14, end: 18 },
    tailTip: { start: 19, end: 23 },
  },
  antennaeCount: 2,
  antennaeSegments: 4,
  antennaeChain: {
    segmentLength: 6,
    drag: 0.94,
    iterations: 3,
    maxSpeed: 3000,
  },
  tailWhiskerChain: {
    segmentLength: 5,
    drag: 0.9,
    iterations: 3,
    maxSpeed: 3000,
  },
  coreRadius: 9,
};

/** Spine solver iterations per quality tier — spine-specific, distinct from
 * the dot/particle QUALITY_PRESETS in rendering/RenderQuality.ts. */
export function getSpineIterationsForQuality(quality: MascotQuality): number {
  switch (quality) {
    case "high":
      return 4;
    case "medium":
      return 3;
    case "low":
      return 2;
    case "reduced":
      return 1;
    default:
      return 3;
  }
}
