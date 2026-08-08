/**
 * Explicit game-root velocity for Resonance Weaver (V2 §22).
 * Procedural homepage second-order follow is not used during play.
 */

import { clamp } from "../../core/NumericGuards";
import { WEAVER_CONFIG } from "./WeaverConfig";

export interface GameRoot {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  velocityX: number;
  velocityY: number;
  radius: number;
}

export function createGameRoot(
  x: number,
  y: number,
  radius?: number,
): GameRoot {
  const r = radius ?? WEAVER_CONFIG.playerRadius;
  return {
    x,
    y,
    previousX: x,
    previousY: y,
    velocityX: 0,
    velocityY: 0,
    radius: r,
  };
}

export function integrateGameRoot(
  root: GameRoot,
  dt: number,
  inputX: number,
  options: {
    gravity?: number;
    maxFallSpeed?: number;
    horizontalAccel?: number;
    horizontalDrag?: number;
    arenaWidth?: number;
    arenaHeight?: number;
  } = {},
): void {
  const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.05) : 0;
  if (step <= 0) return;

  const gravity = options.gravity ?? WEAVER_CONFIG.gravity;
  const maxFall = options.maxFallSpeed ?? WEAVER_CONFIG.maxFallSpeed;
  const accel = options.horizontalAccel ?? WEAVER_CONFIG.horizontalAccel;
  const drag = options.horizontalDrag ?? WEAVER_CONFIG.horizontalDrag;
  const steer = clamp(inputX, -1, 1);

  root.previousX = root.x;
  root.previousY = root.y;

  root.velocityX += steer * accel * step;
  root.velocityX *= Math.pow(drag, step * 60);
  root.velocityY += gravity * step;
  root.velocityY = clamp(root.velocityY, -maxFall * 1.2, maxFall);

  root.x += root.velocityX * step;
  root.y += root.velocityY * step;

  const width = options.arenaWidth ?? 0;
  const height = options.arenaHeight ?? 0;
  if (width > 0) {
    const minX = root.radius;
    const maxX = width - root.radius;
    if (root.x < minX) {
      root.x = minX;
      root.velocityX = Math.abs(root.velocityX) * 0.35;
    } else if (root.x > maxX) {
      root.x = maxX;
      root.velocityX = -Math.abs(root.velocityX) * 0.35;
    }
  }
  if (height > 0 && root.y > height - root.radius) {
    root.y = height - root.radius;
    if (root.velocityY > 0) {
      root.velocityY = -WEAVER_CONFIG.bounceImpulse * 0.55;
    }
  }
  if (root.y < root.radius) {
    root.y = root.radius;
    if (root.velocityY < 0) root.velocityY *= -0.2;
  }
}

/** Circle vs axis-aligned rect (proxy centered at x,y). V2 §27. */
export function circleVsCenteredRect(
  circleX: number,
  circleY: number,
  radius: number,
  rectX: number,
  rectY: number,
  rectW: number,
  rectH: number,
): boolean {
  const halfW = rectW * 0.5;
  const halfH = rectH * 0.5;
  const nearestX = clamp(circleX, rectX - halfW, rectX + halfW);
  const nearestY = clamp(circleY, rectY - halfH, rectY + halfH);
  const dx = circleX - nearestX;
  const dy = circleY - nearestY;
  return dx * dx + dy * dy <= radius * radius;
}

/**
 * Segment–circle bounce. Returns true if contact applied an impulse.
 * Uses closest point on segment; upward / away bounce for Weaver strings.
 */
export function bounceRootOffSegment(
  root: GameRoot,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  thickness: number,
  impulse: number = WEAVER_CONFIG.bounceImpulse,
): boolean {
  const abx = bx - ax;
  const aby = by - ay;
  const lenSq = abx * abx + aby * aby;
  if (lenSq < 1e-6) return false;

  const t = clamp(((root.x - ax) * abx + (root.y - ay) * aby) / lenSq, 0, 1);
  const cx = ax + abx * t;
  const cy = ay + aby * t;
  const dx = root.x - cx;
  const dy = root.y - cy;
  const dist = Math.hypot(dx, dy);
  const hitRadius = root.radius + thickness * 0.5;
  if (dist > hitRadius || dist < 1e-6) return false;

  // Only bounce when moving into the string (approaching).
  const approaching = root.velocityX * dx + root.velocityY * dy < 0;
  if (!approaching && root.velocityY < 40) return false;

  const nx = dx / dist;
  const ny = dy / dist;
  root.x = cx + nx * hitRadius;
  root.y = cy + ny * hitRadius;

  const vn = root.velocityX * nx + root.velocityY * ny;
  if (vn < 0) {
    root.velocityX -= 2 * vn * nx;
    root.velocityY -= 2 * vn * ny;
  }
  // Prefer an upward musical bounce when hitting from above.
  if (root.velocityY > -impulse * 0.4) {
    root.velocityY = -impulse;
  }
  root.velocityX += nx * impulse * 0.15;
  return true;
}
