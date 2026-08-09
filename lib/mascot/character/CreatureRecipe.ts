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
    headScale: 2.85,
    shoulderPosition: 0.24,
    tailExponent: 1.45,
    bellyBias: 0.18,
  },
  regions: {
    // ~24% head / ~28% torso / ~42% long cute tail across 30 joints.
    head: { start: 0, end: 7 },
    shoulders: { start: 6, end: 9 },
    torso: { start: 9, end: 17 },
    tailBase: { start: 17, end: 24 },
    tailTip: { start: 25, end: 29 },
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
