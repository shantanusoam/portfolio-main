import { EPSILON, clamp, lerp } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";

/**
 * Stable body-local coordinate system for procedural print marks — see
 * upgrade spec "LOCAL-SPACE PROCEDURAL PRINT". Every mark keeps its (u, v)
 * and seed forever; only the *resolved* world position changes as the rig
 * moves, so texture never swims through the body during a turn (Problem 2).
 *
 * Resolution uses the same bone-blending technique as
 * `DotSkin.resolveSkinPointPosition` (interpolate between two rib "bones" by
 * `weightB`, blend+normalize the normal, position by `v * width`) — kept as
 * a sibling here rather than importing that function, since it operates on
 * `SkinPoint`'s own precomputed bone indices, not a general (u, v) pair.
 */

export interface SkinCoordinate {
  /** 0 = head, 1 = tail. */
  u: number;
  /** -1 = left rail, 1 = right rail. */
  v: number;
}

export interface BoneBlend {
  boneA: number;
  boneB: number;
  weightB: number;
}

/** Selects and weights the two ribs a given `u` falls between. */
export function boneBlendForU(u: number, ribCount: number): BoneBlend {
  const clampedU = clamp(u, 0, 1);
  const maxBoneA = Math.max(0, ribCount - 2);
  const positionInChain = clampedU * Math.max(0, ribCount - 1);
  const boneA = clamp(Math.floor(positionInChain), 0, maxBoneA);
  const weightB = clamp(positionInChain - boneA, 0, 1);
  const boneB = Math.min(Math.max(0, ribCount - 1), boneA + 1);
  return { boneA, boneB, weightB };
}

export interface LocalPointResolution {
  x: number;
  y: number;
  normalX: number;
  normalY: number;
  width: number;
  forwardX: number;
  forwardY: number;
}

export interface ResolveLocalPointOptions {
  /** Per-rib width override (e.g. BodyContour's zone-adjusted widths) in place of the raw rig width. */
  widths?: readonly number[];
  /** Extra multiplicative scale applied on top of the resolved width. */
  lateralScale?: number;
}

/**
 * Resolves a stable (u, v) coordinate to a world position from the current
 * rib set. Returns `null` only when there is no rib data yet (e.g. before
 * the first simulation step).
 */
export function resolveLocalPoint(
  coord: SkinCoordinate,
  ribs: readonly RibPoint[],
  options?: ResolveLocalPointOptions,
): LocalPointResolution | null {
  if (ribs.length === 0) return null;

  const { boneA, boneB, weightB } = boneBlendForU(coord.u, ribs.length);
  const a = ribs[boneA];
  const b = ribs[Math.min(ribs.length - 1, boneB)];
  if (!a || !b) return null;

  const centerX = lerp(a.center.x, b.center.x, weightB);
  const centerY = lerp(a.center.y, b.center.y, weightB);

  let normalX = lerp(a.normalX, b.normalX, weightB);
  let normalY = lerp(a.normalY, b.normalY, weightB);
  const normalLength = Math.max(EPSILON, Math.hypot(normalX, normalY));
  normalX /= normalLength;
  normalY /= normalLength;

  const widths = options?.widths;
  const boneBIndex = Math.min(ribs.length - 1, boneB);
  const widthA = widths?.[boneA] ?? a.width;
  const widthB = widths?.[boneBIndex] ?? b.width;
  const width = lerp(widthA, widthB, weightB) * (options?.lateralScale ?? 1);

  const forwardX = -normalY;
  const forwardY = normalX;

  const lateral = clamp(coord.v, -1, 1) * width;

  return {
    x: centerX + normalX * lateral,
    y: centerY + normalY * lateral,
    normalX,
    normalY,
    width,
    forwardX,
    forwardY,
  };
}
