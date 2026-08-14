import type { CharacterMode, Vec2Like } from "./types";
import { copy, set, vec2 } from "./math/Vec2";

/**
 * Low-frequency input boundary. Pointer events write here; the fixed-step
 * simulation only reads the mutable target/velocity values.
 */
export class TargetDriver {
  readonly target = vec2();
  readonly velocity = vec2();
  mode: CharacterMode = "follow";
  active = false;

  private readonly previousTarget = vec2();
  private initialized = false;
  private previousInputTime = 0;

  constructor(initial: Vec2Like) {
    copy(this.target, initial);
    copy(this.previousTarget, initial);
  }

  setMode(mode: CharacterMode): void {
    this.mode = mode;
  }

  setTarget(x: number, y: number, active: boolean, timeSeconds: number): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;

    if (this.initialized) {
      const elapsed = timeSeconds - this.previousInputTime;
      if (elapsed > 0.003 && elapsed < 0.3) {
        const rawVelocityX = (x - this.target.x) / elapsed;
        const rawVelocityY = (y - this.target.y) / elapsed;
        this.velocity.x += (rawVelocityX - this.velocity.x) * 0.35;
        this.velocity.y += (rawVelocityY - this.velocity.y) * 0.35;
      } else {
        set(this.velocity, 0, 0);
      }
    }

    copy(this.previousTarget, this.target);
    set(this.target, x, y);
    this.active = active;
    this.initialized = true;
    this.previousInputTime = timeSeconds;
  }

  update(dt: number): void {
    // Event velocity is anticipatory evidence, not a perpetual force.
    const decay = Math.exp(-10 * Math.max(0, dt));
    this.velocity.x *= decay;
    this.velocity.y *= decay;
  }

  reset(value: Vec2Like): void {
    copy(this.target, value);
    copy(this.previousTarget, value);
    set(this.velocity, 0, 0);
    this.initialized = false;
    this.active = false;
  }

  translate(dx: number, dy: number): void {
    if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
    this.target.x += dx;
    this.target.y += dy;
    this.previousTarget.x += dx;
    this.previousTarget.y += dy;
  }
}
