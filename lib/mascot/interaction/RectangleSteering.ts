import { clamp, EPSILON } from "../core/NumericGuards";
import type { Point } from "../types";

/**
 * Closest-point-on-rectangle steering: outward normal repulsion + a smaller
 * tangential component so the creature glides around corners instead of
 * jittering at the boundary. Explicit inside-rectangle handling exits
 * through the nearest side rather than dividing by (near) zero.
 */

export interface Rectangle {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface RectangleSteeringConfig {
  influenceRadius: number;
  maxForce: number;
  /** 0..1, how much of the force goes to the tangent vs. the normal. */
  tangentWeight: number;
}

export function expandRectangle(rect: Rectangle, padding: number): Rectangle {
  return {
    left: rect.left - padding,
    top: rect.top - padding,
    right: rect.right + padding,
    bottom: rect.bottom + padding,
  };
}

export function closestPointOnRectangle(
  px: number,
  py: number,
  rect: Rectangle,
): Point {
  return {
    x: clamp(px, rect.left, rect.right),
    y: clamp(py, rect.top, rect.bottom),
  };
}

export function isInsideRectangle(
  px: number,
  py: number,
  rect: Rectangle,
): boolean {
  return (
    px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom
  );
}

/** For a point already inside the rectangle: the normal pointing out the nearest side. */
export function outwardNormalForInsidePoint(
  px: number,
  py: number,
  rect: Rectangle,
): Point {
  const distLeft = px - rect.left;
  const distRight = rect.right - px;
  const distTop = py - rect.top;
  const distBottom = rect.bottom - py;
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist === distLeft) return { x: -1, y: 0 };
  if (minDist === distRight) return { x: 1, y: 0 };
  if (minDist === distTop) return { x: 0, y: -1 };
  return { x: 0, y: 1 };
}

export interface SteeringResult extends Point {
  inside: boolean;
}

const ZERO_STEERING: SteeringResult = { x: 0, y: 0, inside: false };

/**
 * Computes the steering force for one point against one rectangle. Pass the
 * point's current travel direction (need not be normalized, may be zero) so
 * the tangent aligned with existing motion is preferred for a stable glide.
 */
export function computeRectangleSteering(
  px: number,
  py: number,
  velocityX: number,
  velocityY: number,
  rect: Rectangle,
  config: RectangleSteeringConfig,
): SteeringResult {
  const inside = isInsideRectangle(px, py, rect);

  let normalX: number;
  let normalY: number;
  let strength: number;

  if (inside) {
    const normal = outwardNormalForInsidePoint(px, py, rect);
    normalX = normal.x;
    normalY = normal.y;
    strength = 1;
  } else {
    const closest = closestPointOnRectangle(px, py, rect);
    const dx = px - closest.x;
    const dy = py - closest.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    const influenceRadius = Math.max(EPSILON, config.influenceRadius);

    if (distance >= influenceRadius) return ZERO_STEERING;

    normalX = dx / distance;
    normalY = dy / distance;
    const normalizedDistance = clamp(distance / influenceRadius, 0, 1);
    strength = Math.pow(1 - normalizedDistance, 2);
  }

  const tangentA: Point = { x: -normalY, y: normalX };
  const tangentB: Point = { x: normalY, y: -normalX };

  const speed = Math.hypot(velocityX, velocityY);
  let tangentX = tangentA.x;
  let tangentY = tangentA.y;
  if (speed > EPSILON) {
    const dirX = velocityX / speed;
    const dirY = velocityY / speed;
    const dotA = dirX * tangentA.x + dirY * tangentA.y;
    const dotB = dirX * tangentB.x + dirY * tangentB.y;
    if (dotB > dotA) {
      tangentX = tangentB.x;
      tangentY = tangentB.y;
    }
  }

  const tangentWeight = clamp(config.tangentWeight, 0, 1);
  const normalForce = strength * (1 - tangentWeight) * config.maxForce;
  const tangentForce = strength * tangentWeight * config.maxForce;

  let forceX = normalX * normalForce + tangentX * tangentForce;
  let forceY = normalY * normalForce + tangentY * tangentForce;

  const magnitude = Math.hypot(forceX, forceY);
  if (magnitude > config.maxForce) {
    const scale = config.maxForce / magnitude;
    forceX *= scale;
    forceY *= scale;
  }

  return { x: forceX, y: forceY, inside };
}

/** Sums multiple steering forces and caps the combined magnitude. */
export function combineSteering(
  forces: readonly Point[],
  maxForce: number,
): Point {
  let x = 0;
  let y = 0;
  for (const force of forces) {
    x += force.x;
    y += force.y;
  }
  const magnitude = Math.hypot(x, y);
  if (magnitude > maxForce && magnitude > EPSILON) {
    const scale = maxForce / magnitude;
    x *= scale;
    y *= scale;
  }
  return { x, y };
}
