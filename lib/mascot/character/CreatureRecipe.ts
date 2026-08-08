import type { SpineSolverConfig } from "../motion/SpineSolver";
import type { VerletChainConfig } from "../motion/VerletChain";
import type { BodyProfileConfig, MascotQuality } from "../types";

/**
 * Musical Signal Familiar — compact bean/manta anatomy (V2 §3–4):
 * head 28–32%, torso 40–45%, short secondary tail 25–30%. Two side fins/ears
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
    // Dense joints for fluid bends; short total length (~130px) keeps a compact bean.
    jointCount: 32,
    segmentLength: 4.1,
    headAngleLimitRadians: (9 * Math.PI) / 180,
    tailAngleLimitRadians: (20 * Math.PI) / 180,
    iterations: 5,
  },
  bodyProfile: {
    // Plumper head mass — face needs room; tail must stay secondary.
    maxWidth: 44,
    headScale: 2.9,
    shoulderPosition: 0.24,
    tailExponent: 1.35,
    bellyBias: 0.24,
  },
  regions: {
    // ~34% head / ~46% torso / ~20% short tail across 32 joints.
    head: { start: 0, end: 10 },
    shoulders: { start: 9, end: 12 },
    torso: { start: 13, end: 24 },
    tailBase: { start: 25, end: 28 },
    tailTip: { start: 29, end: 31 },
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
    segmentLength: 3,
    drag: 0.92,
    iterations: 3,
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
