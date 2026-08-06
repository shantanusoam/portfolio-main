import { clamp } from "../core/NumericGuards";
import type { BodyProfileConfig } from "../types";

/**
 * Front-weighted body-width profile: head/shoulder growth via a clipped
 * sine ramp, tail taper via a power curve, plus an optional Gaussian
 * "belly" bump centered on shoulderPosition. Not a symmetric sine — the
 * mass sits forward, matching a fish/eel silhouette rather than a balloon.
 */
export const DEFAULT_BODY_PROFILE: BodyProfileConfig = {
  maxWidth: 1,
  headScale: 1.9,
  shoulderPosition: 0.3,
  tailExponent: 1.35,
  bellyBias: 0,
};

export function bodyWidth(
  t: number,
  config: BodyProfileConfig = DEFAULT_BODY_PROFILE,
): number {
  const normalized = clamp(t, 0, 1);

  const headGrowth = Math.sin(
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

  return (
    Math.max(0, headGrowth * tailTaper * belly) * Math.max(0, config.maxWidth)
  );
}
