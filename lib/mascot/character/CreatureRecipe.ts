import type { SpineSolverConfig } from "../motion/SpineSolver";
import type { VerletChainConfig } from "../motion/VerletChain";
import type { BodyProfileConfig, MascotQuality } from "../types";

/**
 * Signal Guppy anatomy: a compact rounded body with a short taper and a
 * separate paddle tail. Two side fins come from the existing Verlet chains,
 * but their rendered reach is deliberately short and soft.
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
  name: "signal-guppy",
  spine: {
    // A shorter spine prevents the body from returning to the old stretched
    // manta shape while retaining enough joints for a fluid tail wave.
    jointCount: 24,
    segmentLength: 4,
    headAngleLimitRadians: (8 * Math.PI) / 180,
    tailAngleLimitRadians: (24 * Math.PI) / 180,
    iterations: 5,
  },
  bodyProfile: {
    maxWidth: 32,
    headScale: 3.4,
    shoulderPosition: 0.22,
    tailExponent: 1.5,
    bellyBias: 0.16,
  },
  regions: {
    head: { start: 0, end: 7 },
    shoulders: { start: 7, end: 10 },
    torso: { start: 9, end: 17 },
    tailBase: { start: 18, end: 20 },
    tailTip: { start: 21, end: 23 },
  },
  antennaeCount: 2,
  // Short soft ears — not long triangular spikes.
  antennaeSegments: 4,
  antennaeChain: {
    segmentLength: 3.5,
    drag: 0.94,
    iterations: 3,
    maxSpeed: 2400,
  },
  tailWhiskerChain: {
    segmentLength: 3,
    drag: 0.92,
    iterations: 3,
    maxSpeed: 2400,
  },
  coreRadius: 11,
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
