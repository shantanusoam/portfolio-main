import { EPSILON } from "../core/NumericGuards";
import type { Point } from "../types";

/**
 * FABRIK (Forward And Backward Reaching Inverse Kinematics) for a short
 * chain — the gated leg system (spec: "do not implement legs before body
 * motion is approved"). Math is real and tested here; nothing in the
 * default creature rig calls it yet.
 *
 * `points` is mutated in place and expected to be warm-started (the same
 * array reused frame to frame): FABRIK's bend direction for an
 * underdetermined chain follows wherever the points already are, so
 * persisting `points` across calls — rather than rebuilding a straight
 * chain every frame — is what keeps the bend stable. Use
 * `createFabrikChain` once with a `bendSign` to seed the initial pose.
 */

export interface FabrikChainConfig {
  /** One length per segment; length N-1 for N points. */
  segmentLengths: readonly number[];
  iterations: number;
  tolerance: number;
}

const MAX_ITERATIONS = 16;

export function createFabrikChain(
  segmentLengths: readonly number[],
  rootX: number,
  rootY: number,
  bendSign: 1 | -1 = 1,
  initialAngle = -Math.PI / 2,
): Point[] {
  const points: Point[] = [{ x: rootX, y: rootY }];
  let x = rootX;
  let y = rootY;
  let angle = initialAngle;

  for (let i = 0; i < segmentLengths.length; i += 1) {
    // Alternate a slight bend per joint so the chain starts non-degenerate
    // (a perfectly straight chain has no defined bend side to warm-start from).
    if (i > 0) angle += bendSign * 0.5;
    x += Math.cos(angle) * segmentLengths[i];
    y += Math.sin(angle) * segmentLengths[i];
    points.push({ x, y });
  }

  return points;
}

export function solveFabrik(
  points: Point[],
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  config: FabrikChainConfig,
): void {
  const n = points.length;
  if (n === 0) return;
  if (n === 1) {
    points[0].x = rootX;
    points[0].y = rootY;
    return;
  }

  const lengths = config.segmentLengths;
  let totalLength = 0;
  for (const length of lengths) totalLength += length;

  const dxRootTarget = targetX - rootX;
  const dyRootTarget = targetY - rootY;
  const distRootTarget = Math.max(
    EPSILON,
    Math.hypot(dxRootTarget, dyRootTarget),
  );

  if (distRootTarget >= totalLength) {
    // Unreachable: fully extend straight toward the target so segment
    // lengths stay exact rather than snapping the end effector short.
    const dirX = dxRootTarget / distRootTarget;
    const dirY = dyRootTarget / distRootTarget;
    points[0].x = rootX;
    points[0].y = rootY;
    let x = rootX;
    let y = rootY;
    for (let i = 1; i < n; i += 1) {
      x += dirX * lengths[i - 1];
      y += dirY * lengths[i - 1];
      points[i].x = x;
      points[i].y = y;
    }
    return;
  }

  const boundedIterations = Math.max(
    1,
    Math.min(MAX_ITERATIONS, config.iterations),
  );
  const tolerance = Math.max(0.01, config.tolerance);

  for (let iter = 0; iter < boundedIterations; iter += 1) {
    const end = points[n - 1];
    if (Math.hypot(end.x - targetX, end.y - targetY) < tolerance) break;

    // Backward pass: end effector snaps to target, chain pulls back toward root.
    points[n - 1] = { x: targetX, y: targetY };
    for (let i = n - 2; i >= 0; i -= 1) {
      const next = points[i + 1];
      const current = points[i];
      const dx = current.x - next.x;
      const dy = current.y - next.y;
      const dist = Math.max(EPSILON, Math.hypot(dx, dy));
      const ratio = lengths[i] / dist;
      current.x = next.x + dx * ratio;
      current.y = next.y + dy * ratio;
    }

    // Forward pass: root snaps back to its pinned position, chain follows.
    points[0].x = rootX;
    points[0].y = rootY;
    for (let i = 1; i < n; i += 1) {
      const prev = points[i - 1];
      const current = points[i];
      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      const dist = Math.max(EPSILON, Math.hypot(dx, dy));
      const ratio = lengths[i - 1] / dist;
      current.x = prev.x + dx * ratio;
      current.y = prev.y + dy * ratio;
    }
  }

  points[0].x = rootX;
  points[0].y = rootY;

  for (const point of points) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) {
      point.x = rootX;
      point.y = rootY;
    }
  }
}

/** Which side of the root->target line a point sits on; used to detect a knee/bend flip. */
export function sideOfLine(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  pointX: number,
  pointY: number,
): number {
  return (
    (targetX - rootX) * (pointY - rootY) - (targetY - rootY) * (pointX - rootX)
  );
}
