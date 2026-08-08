/**
 * Resonance Weaver MVP tuning — V2 §22–31, §49.
 * Hero-sized arena; bounded strings and proxies.
 */

export const WEAVER_CONFIG = {
  gravity: 1400,
  maxFallSpeed: 920,
  horizontalAccel: 2400,
  horizontalDrag: 0.9,
  bounceImpulse: 620,
  playerRadius: 22,
  /** Max simultaneous player-created strings (V2 §49). */
  maxActiveStrings: 3,
  /** Seconds a woven string stays active. */
  stringLifetime: 8,
  /** Minimum weave length in px. */
  minStringLength: 48,
  /** Maximum weave length in px. */
  maxStringLength: 420,
  stringThickness: 6,
  /** Fraction of proxies that must be collected to win. */
  collectWinFraction: 0.55,
  /** Absolute floor for win target (small hero subsets). */
  collectWinMin: 4,
  comboDecaySeconds: 2.4,
  rootMidi: 57,
  mutedOk: true,
} as const;

export type WeaverConfig = typeof WEAVER_CONFIG;
