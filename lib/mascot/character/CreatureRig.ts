import { clamp, EPSILON, lerp } from "../core/NumericGuards";
import type { SpineJoint } from "../motion/SpineSolver";
import { bodyWidth } from "./BodyProfile";
import type { BodyProfileConfig, Point } from "../types";

/**
 * Symmetric rib generation from spine tangents/normals — see spec section
 * "Symmetric Rib and Fin Generation". Controlled asymmetry (turn lean) is a
 * single shared signal applied afterward, never independent per-side noise.
 */

export interface RibPoint {
  center: Point;
  left: Point;
  right: Point;
  normalX: number;
  normalY: number;
  width: number;
}

export interface CreatureRigConfig {
  bodyProfile: BodyProfileConfig;
  /** 0..0.95, how much of the previous frame's normal is blended in. */
  normalSmoothing: number;
}

export function computeRibs(
  joints: readonly SpineJoint[],
  config: CreatureRigConfig,
  previousNormalX = 0,
  previousNormalY = -1,
): RibPoint[] {
  const count = joints.length;
  const ribs: RibPoint[] = new Array(count);
  let prevNormalX = previousNormalX;
  let prevNormalY = previousNormalY;
  const smoothing = clamp(config.normalSmoothing, 0, 0.95);

  for (let i = 0; i < count; i += 1) {
    const prev = joints[Math.max(0, i - 1)];
    const next = joints[Math.min(count - 1, i + 1)];

    const tangentX = next.x - prev.x;
    const tangentY = next.y - prev.y;
    const inverseLength = 1 / Math.max(EPSILON, Math.hypot(tangentX, tangentY));

    let normalX = -tangentY * inverseLength;
    let normalY = tangentX * inverseLength;

    normalX = lerp(normalX, prevNormalX, smoothing);
    normalY = lerp(normalY, prevNormalY, smoothing);
    const normalLength = Math.max(EPSILON, Math.hypot(normalX, normalY));
    normalX /= normalLength;
    normalY /= normalLength;

    prevNormalX = normalX;
    prevNormalY = normalY;

    const t = count > 1 ? i / (count - 1) : 0;
    const width = bodyWidth(t, config.bodyProfile);

    const centerX = joints[i].x;
    const centerY = joints[i].y;

    ribs[i] = {
      center: { x: centerX, y: centerY },
      left: { x: centerX + normalX * width, y: centerY + normalY * width },
      right: { x: centerX - normalX * width, y: centerY - normalY * width },
      normalX,
      normalY,
      width,
    };
  }

  return ribs;
}

/**
 * Applies one signed lean (-1 .. 1) to an already-symmetric rib set, in
 * place: outside widens, inside compresses. One shared source of asymmetry
 * per spec ("do not add unrelated random noise separately to each side").
 */
export function applyRibLean(
  ribs: RibPoint[],
  lean: number,
  strength = 0.35,
): void {
  const clampedLean = clamp(lean, -1, 1);
  for (const rib of ribs) {
    const leftScale = 1 + clampedLean * strength;
    const rightScale = 1 - clampedLean * strength;
    rib.left.x = rib.center.x + rib.normalX * rib.width * leftScale;
    rib.left.y = rib.center.y + rib.normalY * rib.width * leftScale;
    rib.right.x = rib.center.x - rib.normalX * rib.width * rightScale;
    rib.right.y = rib.center.y - rib.normalY * rib.width * rightScale;
  }
}
