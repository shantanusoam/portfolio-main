import {
  DEFAULT_CREATURE_RECIPE,
  getSpineIterationsForQuality,
} from "./character/CreatureRecipe";
import { DEFAULT_BODY_CONTOUR_CONFIG } from "./appearance/BodyContour";
import { DEFAULT_APPEARANCE_PRESET_ID } from "./appearance/AppearancePresets";
import { DEFAULT_RIM_CONFIG } from "./appearance/RimRenderer";
import { QUALITY_PRESETS } from "./rendering/RenderQuality";
import type { AppearancePresetName, MascotQuality } from "./types";

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
    // Slightly snappier so hero inspect feels present without becoming constant.
    cooldownSeconds: 10,
    minRevisitGap: 2,
    approachDistance: 56,
  },

  steering: {
    influenceRadius: { hard: 90, soft: 50 },
    maxForce: 140,
    tangentWeight: 0.45,
    avoidTriggerForce: 90,
  },

  /**
   * V2 Phase 4 — sparse hero perch / slide / drag resistance.
   * See `lib/mascot/interaction/HeroInteractionDirector.ts`.
   */
  heroInteraction: {
    perchSnapDistance: 36,
    perchSurfaceSlack: 14,
    perchEdgeInset: 18,
    maxDragStretch: 90,
    dragResistGain: 0.85,
    reboundTensionThreshold: 0.35,
    reboundGain: 55,
    reboundDuration: 0.28,
    preferredInterestTag: "hero",
    preferredInterestWeight: 2.5,
  },

  /**
   * V2 Phase 5 — string pull tension + slingshot-ready gate.
   * See `lib/mascot/music/StringTensionGate.ts`.
   */
  stringTension: {
    maxStringPull: 110,
    attachBand: 28,
    slingshotTensionThreshold: 0.82,
    slingshotReleaseVelocity: 1.4,
    triggerCooldownSeconds: 2.5,
    tensionDecayPerSecond: 3.5,
  },

  dotSkin: {
    coreDotRatio: 0.12,
    accentDotRatio: 0.18,
  },

  // Reason: higher blend kills per-rib normal flicker that showed as silhouette facets.
  normalSmoothing: 0.55,

  breathingRateRadiansPerSecond: 1.1,
  breathingAmount: 0.05,

  particleDrag: 0.94,

  statusUpdateIntervalMs: 500,

  strings: {
    /** Per (contact point, string) — prevents a resting overlap from retriggering every frame. */
    cooldownSeconds: 0.18,
    /** px/s — filters out slow drags so only a genuine crossing plucks a string. */
    minContactSpeed: 220,
    strum: {
      strumWindowSeconds: 0.5,
      minStringsForStrum: 3,
      comboResetSeconds: 2,
    },
  },

  /**
   * Tuning for the mascot's own opt-in string-contact audio system
   * (lib/mascot/music). Independent of and not shared with the hand-played
   * hero instrument's Web Audio graph (components/IntrectiveComponents/
   * stringSynth.ts) — see docs/mascot/AUDIO_ARCHITECTURE.md.
   */
  audio: {
    masterVolumeDefault: 0.5,
    /** setTargetAtTime time-constant for gain/mute ramps — avoids clicks. */
    masterVolumeSmoothingSeconds: 0.02,
    /** Added to `currentTime` for direct-contact plucks so they never schedule in the past. */
    gestureSafetyOffsetSeconds: 0.006,

    /**
     * Fixed voice-pool capacity per quality tier (spec: "homepage low
     * quality: 4 voices, medium: 8, high: 12"). `reduced` quality disables
     * *rendering* only — it says nothing about the visitor's sound
     * preference, so it floors at the same conservative cap as `low`
     * rather than 0.
     */
    voicePoolCapacity: {
      reduced: 4,
      low: 4,
      medium: 8,
      high: 12,
    },

    /** Bounded pre-rendered pluck-buffer cache — never render hundreds of buffers. */
    bufferCacheMaxSize: 24,
    bufferDurationSeconds: 2.2,
    attackSeconds: 0.004,
    releaseTailSeconds: 2.15,
    /** Perceptual floor so quiet contacts stay audible instead of vanishing. */
    minAudibleIntensity: 0.12,

    frequencyClamp: { min: 40, max: 2000 },
    panClamp: 0.75,
    /** velocity = clamp(raw, 0, 1) ** exponent — concave curve, matches the spec's example. */
    velocityCurveExponent: 0.6,

    scheduler: {
      lookaheadIntervalMs: 25,
      scheduleAheadSeconds: 0.1,
      maxQueueLength: 32,
    },

    compressor: {
      thresholdDb: -20,
      kneeDb: 24,
      ratio: 4,
      attackSeconds: 0.005,
      releaseSeconds: 0.25,
    },

    /** Lightweight delay-network send, gated off below "medium" quality — no convolution. */
    effects: {
      sendLevel: 0.18,
      delaySeconds: 0.24,
      feedback: 0.28,
      wetLevel: 0.5,
    },
  },

  appearance: {
    defaultPresetId: DEFAULT_APPEARANCE_PRESET_ID as AppearancePresetName,
    /** Seed offset from the base mascot seed, keeps pattern-mark generation independent of dot-skin/particle sampling. */
    patternSeedOffset: 7,
    /** Seed offset for the expression controller's blink timing. */
    expressionSeedOffset: 3,
    contour: DEFAULT_BODY_CONTOUR_CONFIG,
    rim: DEFAULT_RIM_CONFIG,
    /** Fraction of the full skin-point cloud rendered as the sparse structural-dot accent layer at density=1 (medium/high quality only — see AppearanceConfig.resolveLayersForQuality). */
    sparseDotFraction: 0.12,
  },
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
