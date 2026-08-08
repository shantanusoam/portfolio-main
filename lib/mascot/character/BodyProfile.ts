import { clamp } from "../core/NumericGuards";
import type { BodyProfileConfig } from "../types";

/**
 * Compact bean/manta width profile for the Musical Signal Familiar (V2 §3–4):
 * round head via clipped sine + high headScale, plush belly bias, aggressive
 * tail power taper so the secondary tail never dominates the silhouette.
 */
export const DEFAULT_BODY_PROFILE: BodyProfileConfig = {
  maxWidth: 1,
  headScale: 2.9,
  shoulderPosition: 0.24,
  tailExponent: 1.35,
  bellyBias: 0.24,
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
