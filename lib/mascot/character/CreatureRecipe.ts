import type { SpineSolverConfig } from "../motion/SpineSolver";
import type { VerletChainConfig } from "../motion/VerletChain";
import type { BodyProfileConfig, MascotQuality } from "../types";

/**
 * Musical Signal Familiar — cute fish anatomy (V2 §3–4):
 * compact rounded head, mid torso, long soft secondary tail. Two side fins/ears
 * come from the antennae Verlet chains. Not a ribbon/comet; not a copy of
 * the reference video's character.
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
  name: "musical-signal-familiar",
  spine: {
    // A moderately sampled, fixed-length chain creates a readable S-curve
    // without the old over-dense, folding ribbon.
    jointCount: 21,
    segmentLength: 6.4,
    headAngleLimitRadians: (8 * Math.PI) / 180,
    tailAngleLimitRadians: (22 * Math.PI) / 180,
    iterations: 5,
  },
  bodyProfile: {
    maxWidth: 24.5,
    headScale: 2.4,
    shoulderPosition: 0.28,
    tailExponent: 1.08,
    bellyBias: 0.12,
  },
  regions: {
    // ~24% head / ~34% torso / ~38% long soft tail across 21 joints.
    head: { start: 0, end: 4 },
    shoulders: { start: 3, end: 6 },
    torso: { start: 6, end: 13 },
    tailBase: { start: 13, end: 17 },
    tailTip: { start: 17, end: 20 },
  },
  antennaeCount: 2,
  // Short soft ears — not long triangular spikes.
  antennaeSegments: 4,
  antennaeChain: {
    segmentLength: 4.2,
    drag: 0.95,
    iterations: 3,
    maxSpeed: 2400,
  },
  tailWhiskerChain: {
    segmentLength: 11,
    drag: 0.955,
    iterations: 4,
    maxSpeed: 2400,
  },
  coreRadius: 14,
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
