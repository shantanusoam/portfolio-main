import { clamp, EPSILON, lerp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import type { SkinPoint } from "../types";
import type { RibPoint } from "./CreatureRig";

/**
 * Seeded dot-skin sampling and per-frame world-position resolution.
 * Sampling happens once (recipe/quality change only) — see spec "Do not
 * generate randomness every frame." Position resolution runs every frame
 * but writes into a caller-owned `out` point, so the hot loop allocates
 * nothing.
 */

export interface DotSkinConfig {
  dotCount: number;
  seed: number;
  /** Fraction of dots assigned to the structural "core" visual layer. */
  coreDotRatio: number;
  /** Fraction assigned to the accent visual layer. */
  accentDotRatio: number;
}

export function generateSkinPoints(
  jointCount: number,
  config: DotSkinConfig,
): SkinPoint[] {
  const rng = new SeededRandom(config.seed);
  const points: SkinPoint[] = new Array(Math.max(0, config.dotCount));
  const maxBoneA = Math.max(0, jointCount - 2);

  for (let i = 0; i < points.length; i += 1) {
    const longitudinal = clamp(rng.next(), 0, 1);
    const lateral = rng.range(-1, 1);

    const positionInChain = longitudinal * Math.max(0, jointCount - 1);
    const boneA = clamp(Math.floor(positionInChain), 0, maxBoneA);
    const weightB = clamp(positionInChain - boneA, 0, 1);
    const boneB = Math.min(Math.max(0, jointCount - 1), boneA + 1);

    const groupRoll = rng.next();
    let group = 1;
    if (groupRoll < config.coreDotRatio) group = 0;
    else if (groupRoll > 1 - config.accentDotRatio) group = 2;

    points[i] = {
      longitudinal,
      lateral,
      radius: rng.range(0.8, 1.6),
      opacity: rng.range(0.55, 1),
      boneA,
      boneB,
      weightB,
      noiseSeed: rng.next() * 1000,
      group,
    };
  }

  return points;
}

export interface DotDeformation {
  breathingPhase: number;
  breathingAmount: number;
  /** 1 = neutral, >1 stretched (sprint), <1 compressed (impact/rest). */
  stateStretch: number;
  /** Additional multiplicative width offset as a function of longitudinal position, e.g. an impact ripple. */
  rippleAt?: (longitudinal: number) => number;
  noiseAmount: number;
}

/**
 * Resolves one skin point's world position from the current rib set,
 * writing into `out` to avoid allocating a fresh object per dot per frame.
 */
export function resolveSkinPointPosition(
  point: SkinPoint,
  ribs: readonly RibPoint[],
  deformation: DotDeformation,
  out: { x: number; y: number },
): void {
  const a = ribs[point.boneA];
  const b = ribs[Math.min(ribs.length - 1, point.boneB)];
  if (!a || !b) {
    out.x = 0;
    out.y = 0;
    return;
  }

  const centerX = lerp(a.center.x, b.center.x, point.weightB);
  const centerY = lerp(a.center.y, b.center.y, point.weightB);

  let normalX = lerp(a.normalX, b.normalX, point.weightB);
  let normalY = lerp(a.normalY, b.normalY, point.weightB);
  const normalLength = Math.max(EPSILON, Math.hypot(normalX, normalY));
  normalX /= normalLength;
  normalY /= normalLength;

  const width = lerp(a.width, b.width, point.weightB);

  const breathing =
    1 +
    Math.sin(deformation.breathingPhase + point.noiseSeed * 0.01) *
      deformation.breathingAmount;
  let effectiveWidth = width * breathing * deformation.stateStretch;

  if (deformation.rippleAt) {
    effectiveWidth *= 1 + deformation.rippleAt(point.longitudinal);
  }

  const noise =
    deformation.noiseAmount > 0
      ? Math.sin(point.noiseSeed + deformation.breathingPhase * 0.5) *
        deformation.noiseAmount
      : 0;

  out.x = centerX + normalX * (point.lateral * effectiveWidth + noise);
  out.y = centerY + normalY * (point.lateral * effectiveWidth + noise);
}
