/**
 * Central tuning knobs for the Strumrise MVP — mirrors MascotConfig.ts's
 * role for the homepage mascot. See docs/mascot/STRUMRISE_DESIGN.md for the
 * reasoning behind the current values and the documented scope reductions
 * from the full upgrade spec (three platform kinds, one sector).
 */
export const STRUMRISE_CONFIG = {
  fallingOutDurationSeconds: 0.7,

  viewport: {
    /** How far below the camera's bottom edge a miss must fall before costing a life. */
    missMarginBelowCamera: 260,
  },

  physics: {
    gravity: 1400,
    maxFallSpeed: 900,
    horizontalAcceleration: 2200,
    horizontalDragPerSecond: 10,
    maxHorizontalSpeed: 340,
    /** Multiplier on horizontal control while airborne (not grounded this frame). */
    airControlMultiplier: 0.82,
    playerRadius: 16,
    coyoteTimeSeconds: 0.09,
    invulnerableSeconds: 1,
    /** Upward bounce speed magnitude by the platform kind the player just left. */
    bounce: {
      normal: 640,
      bass: 640,
      treble: 690,
    } as Record<"normal" | "bass" | "treble", number>,
  },

  generation: {
    minGapY: 90,
    /** Fraction of the theoretical max jump height a generated gap may use. */
    maxGapYFactor: 0.82,
    /** Shrinks the computed horizontal reach so generation never sits exactly on the physical limit. */
    reachSafetyFactor: 0.82,
    widths: { normal: 140, bass: 190, treble: 90 } as Record<
      "normal" | "bass" | "treble",
      number
    >,
    firstGenerousCount: 3,
    maxConsecutiveTreble: 2,
    typeWeights: { bass: 0.2, treble: 0.25 },
    windowAhead: 6,
    maxActivePlatforms: 24,
    harmonyRootMidi: 57,
    landingCooldownSeconds: 0.12,
  },

  camera: {
    followFraction: 0.42,
    smoothing: 4.5,
    /** Keeps the player near the bottom of the viewport at run start instead of the top. */
    startBottomMargin: 96,
  },

  score: {
    basePoints: 10,
    heightPointsPerUnit: 0.05,
    kindBonus: { normal: 0, bass: 10, treble: 15 } as Record<
      "normal" | "bass" | "treble",
      number
    >,
    comboStepBonus: 0.08,
    comboCap: 12,
    comboResetSeconds: 2.2,
  },

  lives: {
    starting: 3,
  },

  sector: {
    heightTarget: 5200,
  },

  particles: {
    low: 150,
    medium: 400,
    high: 700,
  },

  audioVoiceCap: {
    reduced: 6,
    low: 6,
    medium: 10,
    high: 16,
  },
} as const;
