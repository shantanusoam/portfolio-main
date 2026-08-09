import { EPSILON, normalize } from "../core/NumericGuards";
import { angleLimitForRegion, clampAngleDelta } from "./AngleConstraint";
import type { Point } from "../types";

/**
 * Root-to-tail spine chain: distance constraints keep segment length exact,
 * angle constraints (softer toward the tail) stop folding and zigzagging.
 * One sweep is already a fixed point for an undisturbed chain; `iterations`
 * exists so external perturbations (rib/asymmetry offsets, DOM steering
 * nudges applied directly to a joint) get pulled back onto valid geometry
 * before render.
 */

export interface SpineJoint extends Point {
  /** Orientation in radians, derived from the incoming segment direction. */
  angle: number;
}

export interface SpineSolverConfig {
  jointCount: number;
  segmentLength: number;
  headAngleLimitRadians: number;
  tailAngleLimitRadians: number;
  iterations: number;
}

const MAX_ITERATIONS = 8;

export function createSpineJoints(
  config: SpineSolverConfig,
  originX: number,
  originY: number,
): SpineJoint[] {
  return Array.from({ length: config.jointCount }, (_, i) => ({
    x: originX,
    y: originY - i * config.segmentLength,
    angle: -Math.PI / 2,
  }));
}

export function solveSpine(
  joints: SpineJoint[],
  rootX: number,
  rootY: number,
  config: SpineSolverConfig,
): void {
  const jointCount = joints.length;
  if (jointCount === 0) return;

  const { segmentLength, headAngleLimitRadians, tailAngleLimitRadians } =
    config;
  const boundedIterations = Math.max(
    1,
    Math.min(MAX_ITERATIONS, config.iterations),
  );

  joints[0].x = Number.isFinite(rootX) ? rootX : joints[0].x;
  joints[0].y = Number.isFinite(rootY) ? rootY : joints[0].y;

  for (let iter = 0; iter < boundedIterations; iter += 1) {
    let previousAngle = joints[0].angle;

    for (let i = 1; i < jointCount; i += 1) {
      const prev = joints[i - 1];
      const current = joints[i];

      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      const distSq = dx * dx + dy * dy;

      let dirX: number;
      let dirY: number;
      if (distSq < EPSILON * EPSILON) {
        // Coincident joints (e.g. freshly spawned or teleported chain):
        // fall back to the previous segment's heading instead of dividing
        // by (near) zero, so the chain unfolds smoothly next frame.
        dirX = Math.cos(previousAngle);
        dirY = Math.sin(previousAngle);
      } else {
        const n = normalize(dx, dy);
        dirX = n.x;
        dirY = n.y;
      }

      let angle = Math.atan2(dirY, dirX);

      if (i >= 2) {
        const t = (i - 1) / Math.max(1, jointCount - 2);
        const limit = angleLimitForRegion(
          t,
          headAngleLimitRadians,
          tailAngleLimitRadians,
        );
        angle = clampAngleDelta(previousAngle, angle, limit);
      }

      current.x = prev.x + Math.cos(angle) * segmentLength;
      current.y = prev.y + Math.sin(angle) * segmentLength;
      current.angle = angle;
      previousAngle = angle;
    }
  }
}
