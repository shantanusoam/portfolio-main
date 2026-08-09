import { clamp } from "../core/NumericGuards";
import type { BodyProfileConfig } from "../types";

/**
 * Compact familiar width profile. The front keeps real volume instead of
 * collapsing to a needle, which is the crucial difference between a readable
 * head and the old leaf/ribbon silhouette. The tail still tapers to zero.
 */
export const DEFAULT_BODY_PROFILE: BodyProfileConfig = {
  maxWidth: 1,
  // Gentler head ramp → rounder nose, less flat “wide mouth” wall.
  headScale: 2.85,
  shoulderPosition: 0.24,
  tailExponent: 1.45,
  bellyBias: 0.18,
};

export function bodyWidth(
  t: number,
  config: BodyProfileConfig = DEFAULT_BODY_PROFILE,
): number {
  const normalized = clamp(t, 0, 1);

  const headGrowth =
    0.52 +
    0.48 *
      Math.sin(
        Math.min(1, normalized * config.headScale) * Math.PI * 0.5,
      );
  const tailTaper = Math.pow(
    1 - normalized,
    Math.max(0.1, config.tailExponent),
  );

  const shoulderPosition = clamp(config.shoulderPosition, 0, 1);
  const bellyFalloff = Math.exp(
    -Math.pow((normalized - shoulderPosition) / 0.25, 2),
  );
  const belly = 1 + config.bellyBias * bellyFalloff;

  // Soft nose pinch on the first ~7% — closes the silhouette without a flat
  // wall of max head width (which made mouths look huge as the fish grew).
  const nosePinch =
    normalized < 0.07
      ? Math.sin((normalized / 0.07) * Math.PI * 0.5)
      : 1;

  return (
    Math.max(0, headGrowth * tailTaper * belly * nosePinch) *
    Math.max(0, config.maxWidth)
  );
}
