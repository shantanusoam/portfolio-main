import { clamp, normalize } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type { BodyDeformation, Point } from "../types";

export interface PaddleTailFrame {
  attach: Point;
  directionX: number;
  directionY: number;
  normalX: number;
  normalY: number;
  length: number;
  halfWidth: number;
}

/**
 * Stable local frame for the separate paddle tail. Rendering the tail as its
 * own rounded part prevents the body's final zero-width rib from becoming a
 * long needle. The frame remains finite for degenerate/lab poses.
 */
export function computePaddleTailFrame(
  ribs: readonly RibPoint[],
  deformation?: BodyDeformation,
): PaddleTailFrame | null {
  if (ribs.length < 2) return null;

  const tip = ribs[ribs.length - 1].center;
  const base = ribs[Math.max(0, ribs.length - 4)].center;
  const direction = normalize(tip.x - base.x, tip.y - base.y);
  const stretch = clamp(deformation?.tailStretch ?? 0, -0.6, 1);
  const lateral = clamp(deformation?.lateralScale ?? 1, 0.7, 1.4);

  return {
    attach: { x: tip.x, y: tip.y },
    directionX: direction.x,
    directionY: direction.y,
    normalX: -direction.y,
    normalY: direction.x,
    length: 19 * (1 + stretch * 0.12),
    halfWidth: 13 * lateral * (1 - Math.max(0, stretch) * 0.06),
  };
}
