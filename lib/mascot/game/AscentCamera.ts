import { clamp, lerp } from "../core/NumericGuards";
import { STRUMRISE_CONFIG } from "./StrumriseConfig";

/**
 * Soft upward-only camera — spec: "camera follows only after player
 * reaches upper threshold... platforms move downward in view while world
 * coordinates remain stable... Do not mutate every platform's world Y
 * simply because the camera scrolls." World Y decreases going up; the
 * camera Y only ever decreases (never scrolls back down, even during a
 * temporary dip), so a `Math.min` against the previous value is the whole
 * "only follows once past the threshold" rule.
 */
export class AscentCamera {
  private cameraY: number;

  constructor(startY: number) {
    this.cameraY = startY;
  }

  update(playerY: number, viewportHeight: number, dt: number): number {
    const cfg = STRUMRISE_CONFIG.camera;
    const target = Math.min(
      this.cameraY,
      playerY - viewportHeight * cfg.followFraction,
    );
    this.cameraY = lerp(this.cameraY, target, clamp(dt * cfg.smoothing, 0, 1));
    return this.cameraY;
  }

  getY(): number {
    return this.cameraY;
  }

  reset(startY: number): void {
    this.cameraY = startY;
  }
}
