import { wrapAngle } from "../core/NumericGuards";

/**
 * Clamps the turn from `fromAngle` to `toAngle` to at most `maxDelta`
 * radians in either direction, taking the shortest path across the +-PI
 * seam. Used to stop spine segments from folding or zigzagging.
 */
export function clampAngleDelta(
  fromAngle: number,
  toAngle: number,
  maxDelta: number,
): number {
  const delta = wrapAngle(toAngle - fromAngle);
  const clamped = Math.max(-maxDelta, Math.min(maxDelta, delta));
  return fromAngle + clamped;
}

/**
 * Interpolates an angle limit along the spine: stiffer near the head
 * (t near 0), softer toward the tail (t near 1). Caller clamps `t` to
 * [0, 1].
 */
export function angleLimitForRegion(
  t: number,
  headLimitRadians: number,
  tailLimitRadians: number,
): number {
  const eased = t * t * (3 - 2 * t); // smoothstep
  return headLimitRadians + (tailLimitRadians - headLimitRadians) * eased;
}
