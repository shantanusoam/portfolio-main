/**
 * Small numeric helpers shared across the mascot simulation. Every hot-loop
 * division or normalization in lib/mascot must route through these guards —
 * see .claude/skills/building-procedural-motion/references/numeric-stability.md.
 */

export const EPSILON = 1e-6;

export function clamp(value: number, min: number, max: number): number {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Euclidean length, floored at EPSILON so callers can safely divide by it. */
export function safeLength(x: number, y: number): number {
  return Math.max(EPSILON, Math.hypot(x, y));
}

export function normalize(
  x: number,
  y: number,
): { x: number; y: number; length: number } {
  const length = safeLength(x, y);
  return { x: x / length, y: y / length, length };
}

export function toFiniteOr(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

/** Shortest-path lerp between two angles in radians. */
export function angleLerp(a: number, b: number, t: number): number {
  const diff = wrapAngle(b - a);
  return a + diff * t;
}

/** Wraps an angle in radians to (-PI, PI]. */
export function wrapAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let wrapped = angle % twoPi;
  if (wrapped > Math.PI) wrapped -= twoPi;
  if (wrapped < -Math.PI) wrapped += twoPi;
  return wrapped;
}

export function distance(
  ax: number,
  ay: number,
  bx: number,
  by: number,
): number {
  return Math.hypot(bx - ax, by - ay);
}

export function approxEqual(
  a: number,
  b: number,
  tolerance = EPSILON,
): boolean {
  return Math.abs(a - b) <= tolerance;
}
