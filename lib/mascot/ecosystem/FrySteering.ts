import { clamp, EPSILON } from "../core/NumericGuards";
import type { Point } from "../types";

/**
 * Pure steering helpers for shy fry. Kept free of runtime state so the
 * escape math can be unit-tested without spinning the full ecosystem.
 */

export interface ThreatSample {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface FrySteerInput {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  fatigue: number;
  dodgeSign: 1 | -1;
  reducedMotion: boolean;
  threats: readonly ThreatSample[];
  pointer: { x: number; y: number; active: boolean } | null;
  hideTarget: Point | null;
  neighbors: readonly Point[];
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface FrySteerOutput {
  desiredVx: number;
  desiredVy: number;
  maxSpeed: number;
  burst: boolean;
  nearestThreatDistance: number;
}

export const FRY_THREAT_RADIUS = 168;
export const FRY_BURST_RADIUS = 92;
export const FRY_POINTER_RADIUS = 88;
export const FRY_SEPARATION_RADIUS = 36;

/**
 * Predict where a threat will be when the fry could meet it, then flee that
 * future point — classic pursuit evasion rather than fleeing the current root.
 */
export function predictedThreatPoint(
  fry: Point,
  threat: ThreatSample,
  fryEscapeSpeed: number,
): Point {
  const dx = threat.x - fry.x;
  const dy = threat.y - fry.y;
  const distance = Math.hypot(dx, dy);
  const closing = Math.max(40, fryEscapeSpeed + Math.hypot(threat.vx, threat.vy));
  const lookAhead = clamp(distance / closing, 0.05, 0.55);
  return {
    x: threat.x + threat.vx * lookAhead,
    y: threat.y + threat.vy * lookAhead,
  };
}

/**
 * When the predator is closing head-on, add a perpendicular dodge so the fry
 * cuts sideways instead of running straight into the adult's mouth.
 */
export function tangentialDodge(
  fromThreatX: number,
  fromThreatY: number,
  relativeVx: number,
  relativeVy: number,
  dodgeSign: 1 | -1,
): Point {
  const fleeLen = Math.max(EPSILON, Math.hypot(fromThreatX, fromThreatY));
  const nx = fromThreatX / fleeLen;
  const ny = fromThreatY / fleeLen;
  // Relative velocity of the threat toward the fry along the flee axis.
  // Positive means the predator is closing the gap from behind/alongside.
  const closing = relativeVx * nx + relativeVy * ny;
  if (closing < 18) return { x: 0, y: 0 };
  const strength = clamp((closing - 18) / 80, 0, 1) * 70;
  return {
    x: -ny * strength * dodgeSign,
    y: nx * strength * dodgeSign,
  };
}

export function computeFryDesiredVelocity(input: FrySteerInput): FrySteerOutput {
  const fatigue = clamp(input.fatigue, 0, 1);
  const baseSpeed = input.reducedMotion
    ? 8
    : lerp(48, 18, fatigue);
  const burstSpeed = input.reducedMotion
    ? 12
    : lerp(128, 46, fatigue);

  let desiredX = Math.cos(input.age * 1.3) * baseSpeed * 0.22;
  let desiredY = Math.sin(input.age * 1.1) * baseSpeed * 0.18;
  let nearestThreatDistance = Number.POSITIVE_INFINITY;
  let burst = false;

  let bestThreat: ThreatSample | null = null;
  let bestPredicted: Point | null = null;

  for (const threat of input.threats) {
    const predicted = predictedThreatPoint(
      { x: input.x, y: input.y },
      threat,
      burstSpeed,
    );
    const dx = input.x - predicted.x;
    const dy = input.y - predicted.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    if (distance < nearestThreatDistance) {
      nearestThreatDistance = distance;
      bestThreat = threat;
      bestPredicted = predicted;
    }

    const radius = lerp(FRY_THREAT_RADIUS, 70, fatigue);
    if (distance < radius) {
      const weight = (1 - distance / radius) * lerp(120, 36, fatigue);
      desiredX += (dx / distance) * weight;
      desiredY += (dy / distance) * weight;
    }
  }

  if (bestThreat && bestPredicted) {
    const fromX = input.x - bestPredicted.x;
    const fromY = input.y - bestPredicted.y;
    const relativeVx = bestThreat.vx - input.vx;
    const relativeVy = bestThreat.vy - input.vy;
    const dodge = tangentialDodge(
      fromX,
      fromY,
      relativeVx,
      relativeVy,
      input.dodgeSign,
    );
    desiredX += dodge.x;
    desiredY += dodge.y;
    if (nearestThreatDistance < FRY_BURST_RADIUS && fatigue < 0.92) {
      burst = !input.reducedMotion;
    }
  }

  if (input.pointer?.active) {
    const dx = input.x - input.pointer.x;
    const dy = input.y - input.pointer.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    if (distance < FRY_POINTER_RADIUS) {
      const strength =
        (1 - distance / FRY_POINTER_RADIUS) * lerp(52, 14, fatigue);
      desiredX += (dx / distance) * strength;
      desiredY += (dy / distance) * strength;
    }
  }

  if (input.hideTarget && fatigue < 0.88) {
    const cover = scoreCoverSteering(
      { x: input.x, y: input.y },
      input.hideTarget,
      bestPredicted,
    );
    desiredX += cover.x;
    desiredY += cover.y;
  }

  for (const neighbor of input.neighbors) {
    const dx = input.x - neighbor.x;
    const dy = input.y - neighbor.y;
    const distance = Math.max(EPSILON, Math.hypot(dx, dy));
    if (distance < FRY_SEPARATION_RADIUS) {
      const push = (FRY_SEPARATION_RADIUS - distance) * 2.4;
      desiredX += (dx / distance) * push;
      desiredY += (dy / distance) * push;
    }
  }

  const edge = 52;
  if (input.x < input.bounds.minX + edge) desiredX += 70;
  if (input.x > input.bounds.maxX - edge) desiredX -= 70;
  if (input.y < input.bounds.minY + edge) desiredY += 70;
  if (input.y > input.bounds.maxY - edge) desiredY -= 70;

  const maxSpeed = burst ? burstSpeed : baseSpeed * (input.reducedMotion ? 1 : 1.15);
  return {
    desiredVx: desiredX,
    desiredVy: desiredY,
    maxSpeed,
    burst,
    nearestThreatDistance,
  };
}

/**
 * Prefer cover that sits opposite the predicted predator — dart "behind"
 * soft obstacles instead of into the hunter's path.
 */
export function scoreCoverSteering(
  fry: Point,
  cover: Point,
  threat: Point | null,
): Point {
  const toCoverX = cover.x - fry.x;
  const toCoverY = cover.y - fry.y;
  const coverDist = Math.max(EPSILON, Math.hypot(toCoverX, toCoverY));
  if (coverDist < 10) return { x: 0, y: 0 };

  let weight = 28;
  if (threat) {
    const awayX = fry.x - threat.x;
    const awayY = fry.y - threat.y;
    const awayLen = Math.max(EPSILON, Math.hypot(awayX, awayY));
    const alignment =
      (toCoverX / coverDist) * (awayX / awayLen) +
      (toCoverY / coverDist) * (awayY / awayLen);
    // Stronger pull when cover lies away from the predator.
    weight = lerp(10, 46, clamp((alignment + 1) * 0.5, 0, 1));
  }

  return {
    x: (toCoverX / coverDist) * weight,
    y: (toCoverY / coverDist) * weight,
  };
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
