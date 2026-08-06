import {
  DEFAULT_CREATURE_RECIPE,
  getSpineIterationsForQuality,
} from "./character/CreatureRecipe";
import { QUALITY_PRESETS } from "./rendering/RenderQuality";
import type { MascotQuality } from "./types";

/**
 * Central tuning knobs the engine reads when assembling MascotRuntime and
 * deciding quality-tier behavior. Keep magic numbers here, not scattered
 * through MascotRuntime/MascotEngine — see docs/mascot/MOTION_RECIPES.md
 * for the reasoning behind the current values.
 */
export const MASCOT_CONFIG = {
  creature: DEFAULT_CREATURE_RECIPE,

  wanderBoundsMargin: 48,
  wanderSegmentDuration: { min: 3, max: 7 },

  targetBlendDurationSeconds: 0.6,

  pointerIdleThresholdSeconds: 2.5,

  interest: {
    cooldownSeconds: 14,
    minRevisitGap: 2,
    approachDistance: 70,
  },

  steering: {
    influenceRadius: { hard: 90, soft: 50 },
    maxForce: 140,
    tangentWeight: 0.45,
    avoidTriggerForce: 90,
  },

  dotSkin: {
    coreDotRatio: 0.12,
    accentDotRatio: 0.18,
  },

  normalSmoothing: 0.35,

  breathingRateRadiansPerSecond: 1.1,
  breathingAmount: 0.05,

  particleDrag: 0.94,

  statusUpdateIntervalMs: 500,
} as const;

export function getSpineConfigForQuality(quality: MascotQuality) {
  return {
    ...MASCOT_CONFIG.creature.spine,
    iterations: getSpineIterationsForQuality(quality),
  };
}

export function getQualityDotCapacity(quality: MascotQuality): number {
  return QUALITY_PRESETS[quality].dotCount;
}

export function getQualityParticleCapacity(quality: MascotQuality): number {
  return QUALITY_PRESETS[quality].particles;
}

export function getQualityDprCap(quality: MascotQuality): number {
  return QUALITY_PRESETS[quality].dprCap;
}
