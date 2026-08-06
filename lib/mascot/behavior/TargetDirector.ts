import { clamp, lerp } from "../core/NumericGuards";
import type { Point } from "../types";

/**
 * Blends pointer and wander targets over ~0.4-0.8s instead of snapping —
 * spec: "Do not snap to a distant path when idle mode starts."
 */

export interface TargetDirectorConfig {
  blendDurationSeconds: number;
}

export class TargetDirector {
  private blend: number;
  private readonly config: TargetDirectorConfig;

  constructor(config: TargetDirectorConfig, initialBlend = 0) {
    this.config = config;
    this.blend = clamp(initialBlend, 0, 1);
  }

  /** Advances the blend factor toward `targetBlend` at a rate bounded by blendDurationSeconds. */
  update(dt: number, targetBlend: number): number {
    if (!Number.isFinite(dt) || dt <= 0) return this.blend;
    const rate =
      this.config.blendDurationSeconds > 0
        ? dt / this.config.blendDurationSeconds
        : 1;
    const delta = clamp(targetBlend - this.blend, -rate, rate);
    this.blend = clamp(this.blend + delta, 0, 1);
    return this.blend;
  }

  getBlend(): number {
    return this.blend;
  }

  reset(blend: number): void {
    this.blend = clamp(blend, 0, 1);
  }
}

/** blend=0 -> pointerTarget, blend=1 -> wanderTarget. */
export function blendTargets(
  pointerTarget: Point,
  wanderTarget: Point,
  blend: number,
): Point {
  const clampedBlend = clamp(blend, 0, 1);
  return {
    x: lerp(pointerTarget.x, wanderTarget.x, clampedBlend),
    y: lerp(pointerTarget.y, wanderTarget.y, clampedBlend),
  };
}
