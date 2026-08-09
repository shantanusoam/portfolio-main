import { clamp } from "../core/NumericGuards";
import type { BodyProfileConfig } from "../types";

/**
 * Signal Guppy width profile. Most of the animal is one soft bean-shaped
 * volume; tapering begins late and ends at the separate paddle-tail joint.
 * Keeping a broad nose is essential because the face lives on this cap.
 */
export const DEFAULT_BODY_PROFILE: BodyProfileConfig = {
  maxWidth: 1,
  headScale: 3.4,
  shoulderPosition: 0.28,
  tailExponent: 1.7,
  bellyBias: 0.2,
};

export function bodyWidth(
  t: number,
  config: BodyProfileConfig = DEFAULT_BODY_PROFILE,
): number {
  const normalized = clamp(t, 0, 1);
  const shoulderPosition = clamp(config.shoulderPosition, 0.12, 0.42);
  const headRoundness = clamp(config.headScale / 3.4, 0.65, 1.35);
  const noseWidth = clamp(0.8 + (headRoundness - 1) * 0.08, 0.74, 0.86);
  const headT = smoothstep(0, shoulderPosition, normalized);
  const headCap = noseWidth + (1 - noseWidth) * headT;

  // The generated character reads as a compact animal because the torso
  // stays full until roughly 60% of its length. The old `(1 - t)^n` profile
  // began tapering at the nose and produced the long triangular silhouette.
  const tailStart = clamp(shoulderPosition + 0.48, 0.66, 0.74);
  const torsoSettle =
    1 - smoothstep(shoulderPosition, tailStart, normalized) * 0.1;
  const tailT = clamp(
    (normalized - tailStart) / Math.max(1e-6, 1 - tailStart),
    0,
    1,
  );
  const tailTaper = Math.pow(
    1 - smoothstep(0, 1, tailT),
    clamp(config.tailExponent * 0.48, 0.62, 1.1),
  );

  const bellyFalloff = Math.exp(
    -Math.pow((normalized - shoulderPosition) / 0.28, 2),
  );
  const belly = 1 + config.bellyBias * 0.48 * bellyFalloff;

  return (
    Math.max(0, headCap * torsoSettle * tailTaper * belly) *
    Math.max(0, config.maxWidth)
  );
}

function smoothstep(edge0: number, edge1: number, value: number): number {
  const t = clamp((value - edge0) / Math.max(1e-6, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}
