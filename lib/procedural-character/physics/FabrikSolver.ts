import type { Vec2Like } from "../types";
import { EPSILON, distance, isFiniteVec2, vec2 } from "../math/Vec2";

export interface FabrikSolverOptions {
  iterations: number;
  tolerance: number;
  preferredBendDirection?: 1 | -1;
}

const MAX_ITERATIONS = 16;

export function totalChainLength(segmentLengths: readonly number[]): number {
  let total = 0;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    total += segmentLengths[index];
  }
  return total;
}

/** Creates a non-degenerate warm start with every joint on one stable bend side. */
export function createFabrikChain(
  segmentLengths: readonly number[],
  root: Vec2Like,
  target: Vec2Like,
  bendDirection: 1 | -1 = 1,
): Vec2Like[] {
  const points: Vec2Like[] = [vec2(root.x, root.y)];
  const targetAngle = Math.atan2(target.y - root.y, target.x - root.x);
  const divisor = Math.max(1, segmentLengths.length - 1);
  let x = root.x;
  let y = root.y;

  for (let index = 0; index < segmentLengths.length; index += 1) {
    const normalized = index / divisor;
    const arc = (0.72 - normalized * 1.08) * bendDirection;
    const angle = targetAngle + arc;
    x += Math.cos(angle) * segmentLengths[index];
    y += Math.sin(angle) * segmentLengths[index];
    points.push(vec2(x, y));
  }

  return points;
}

function preservePreferredBend(
  points: Vec2Like[],
  root: Vec2Like,
  target: Vec2Like,
  preferredDirection: 1 | -1,
): void {
  const directionX = target.x - root.x;
  const directionY = target.y - root.y;
  const directionLength = Math.hypot(directionX, directionY);
  if (directionLength <= EPSILON || points.length <= 2) return;

  let signedArea = 0;
  for (let index = 1; index < points.length - 1; index += 1) {
    const relativeX = points[index].x - root.x;
    const relativeY = points[index].y - root.y;
    signedArea += directionX * relativeY - directionY * relativeX;
  }

  if (signedArea * preferredDirection >= 0) return;

  // Reflect the entire internal chain across root->target. Because both
  // endpoints lie on the reflection axis, all segment lengths stay exact.
  const axisX = directionX / directionLength;
  const axisY = directionY / directionLength;
  for (let index = 1; index < points.length - 1; index += 1) {
    const relativeX = points[index].x - root.x;
    const relativeY = points[index].y - root.y;
    const projection = relativeX * axisX + relativeY * axisY;
    const projectedX = root.x + axisX * projection;
    const projectedY = root.y + axisY * projection;
    points[index].x = projectedX * 2 - points[index].x;
    points[index].y = projectedY * 2 - points[index].y;
  }
}

/**
 * In-place FABRIK. The root and target are fixed; segment lengths are never
 * relaxed. The points array is intentionally warm-started between frames.
 * Returns the final end-effector error in CSS pixels.
 */
export function solveFabrik(
  points: Vec2Like[],
  segmentLengths: readonly number[],
  root: Vec2Like,
  target: Vec2Like,
  options: FabrikSolverOptions,
): number {
  const pointCount = points.length;
  if (pointCount === 0) return 0;
  if (segmentLengths.length !== pointCount - 1) {
    throw new Error(
      "FABRIK requires exactly one segment length between each pair of points",
    );
  }

  points[0].x = root.x;
  points[0].y = root.y;
  if (pointCount === 1) return distance(root, target);

  const totalLength = totalChainLength(segmentLengths);
  const targetDeltaX = target.x - root.x;
  const targetDeltaY = target.y - root.y;
  const rootTargetDistance = Math.hypot(targetDeltaX, targetDeltaY);

  if (rootTargetDistance >= totalLength - EPSILON) {
    const inverseDistance = 1 / Math.max(EPSILON, rootTargetDistance);
    const directionX = targetDeltaX * inverseDistance;
    const directionY = targetDeltaY * inverseDistance;
    let x = root.x;
    let y = root.y;
    for (let index = 1; index < pointCount; index += 1) {
      x += directionX * segmentLengths[index - 1];
      y += directionY * segmentLengths[index - 1];
      points[index].x = x;
      points[index].y = y;
    }
    return Math.max(0, rootTargetDistance - totalLength);
  }

  const iterationLimit = Math.max(
    1,
    Math.min(MAX_ITERATIONS, Math.floor(options.iterations)),
  );
  const tolerance = Math.max(0.001, options.tolerance);

  for (let iteration = 0; iteration < iterationLimit; iteration += 1) {
    const end = points[pointCount - 1];
    end.x = target.x;
    end.y = target.y;

    // Backward reaching pass: the foot pulls every parent toward it.
    for (let index = pointCount - 2; index >= 0; index -= 1) {
      const current = points[index];
      const child = points[index + 1];
      const deltaX = current.x - child.x;
      const deltaY = current.y - child.y;
      const inverseDistance =
        segmentLengths[index] / Math.max(EPSILON, Math.hypot(deltaX, deltaY));
      current.x = child.x + deltaX * inverseDistance;
      current.y = child.y + deltaY * inverseDistance;
    }

    // Forward reaching pass: pin the body anchor and propagate outward.
    points[0].x = root.x;
    points[0].y = root.y;
    for (let index = 1; index < pointCount; index += 1) {
      const parent = points[index - 1];
      const current = points[index];
      const deltaX = current.x - parent.x;
      const deltaY = current.y - parent.y;
      const inverseDistance =
        segmentLengths[index - 1] /
        Math.max(EPSILON, Math.hypot(deltaX, deltaY));
      current.x = parent.x + deltaX * inverseDistance;
      current.y = parent.y + deltaY * inverseDistance;
    }

    const solvedEnd = points[pointCount - 1];
    if (
      Math.hypot(solvedEnd.x - target.x, solvedEnd.y - target.y) <= tolerance
    ) {
      break;
    }
  }

  if (options.preferredBendDirection !== undefined) {
    preservePreferredBend(points, root, target, options.preferredBendDirection);
  }

  for (let index = 0; index < pointCount; index += 1) {
    if (!isFiniteVec2(points[index])) {
      points[index].x = root.x;
      points[index].y = root.y;
    }
  }

  const end = points[pointCount - 1];
  return Math.hypot(end.x - target.x, end.y - target.y);
}

export function signedBendSide(
  root: Vec2Like,
  target: Vec2Like,
  joint: Vec2Like,
): number {
  return (
    (target.x - root.x) * (joint.y - root.y) -
    (target.y - root.y) * (joint.x - root.x)
  );
}
