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
    // Preserve the dense procedural bend, but shorten its visible footprint so
    // the familiar reads head-first rather than as a long swimming ribbon.
    jointCount: 30,
    segmentLength: 3.9,
    headAngleLimitRadians: (9 * Math.PI) / 180,
    tailAngleLimitRadians: (20 * Math.PI) / 180,
    iterations: 5,
  },
  bodyProfile: {
    maxWidth: 40,
    headScale: 3.4,
    shoulderPosition: 0.28,
    tailExponent: 1.7,
    bellyBias: 0.2,
  },
  regions: {
    // ~34% head / ~45% torso / ~21% short tail across 30 joints.
    head: { start: 0, end: 9 },
    shoulders: { start: 8, end: 11 },
    torso: { start: 12, end: 22 },
    tailBase: { start: 23, end: 26 },
    tailTip: { start: 27, end: 29 },
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
