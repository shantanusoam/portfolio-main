import { SecondOrderDynamics as ScalarSecondOrderDynamics } from "@/lib/mascot/motion/SecondOrderDynamics";
import type { SecondOrderDynamicsConfig } from "@/lib/mascot/motion/SecondOrderDynamics";
import type { Vec2Like } from "../types";
import { copy, length, set, vec2 } from "./Vec2";

/** Reuse the repository's already stress-tested scalar implementation. */
export { ScalarSecondOrderDynamics as SecondOrderDynamics };
export type { SecondOrderDynamicsConfig };

export interface SecondOrderDynamics2DState {
  readonly position: Vec2Like;
  readonly previousPosition: Vec2Like;
  readonly velocity: Vec2Like;
  readonly acceleration: Vec2Like;
}

/**
 * Allocation-free X/Y composition around the scalar second-order filter.
 * It also applies a radial speed cap and resets the internal filter to the
 * capped state, preventing hidden energy from accumulating behind the cap.
 */
export class SecondOrderDynamics2D implements SecondOrderDynamics2DState {
  readonly position = vec2();
  readonly previousPosition = vec2();
  readonly velocity = vec2();
  readonly acceleration = vec2();

  private readonly previousVelocity = vec2();
  private readonly previousTarget = vec2();
  private readonly estimatedTargetVelocity = vec2();
  private readonly x: ScalarSecondOrderDynamics;
  private readonly y: ScalarSecondOrderDynamics;

  constructor(config: SecondOrderDynamicsConfig, initial: Vec2Like) {
    this.x = new ScalarSecondOrderDynamics(config, initial.x);
    this.y = new ScalarSecondOrderDynamics(config, initial.y);
    copy(this.position, initial);
    copy(this.previousPosition, initial);
    copy(this.previousTarget, initial);
  }

  configure(config: SecondOrderDynamicsConfig): void {
    this.x.configure(config);
    this.y.configure(config);
  }

  reset(value: Vec2Like, velocity?: Vec2Like): void {
    const velocityX = velocity?.x ?? 0;
    const velocityY = velocity?.y ?? 0;
    this.x.reset(value.x, velocityX);
    this.y.reset(value.y, velocityY);
    copy(this.position, value);
    copy(this.previousPosition, value);
    copy(this.previousTarget, value);
    set(this.velocity, velocityX, velocityY);
    copy(this.previousVelocity, this.velocity);
    set(this.acceleration, 0, 0);
  }

  update(
    dt: number,
    target: Vec2Like,
    maximumSpeed = Number.POSITIVE_INFINITY,
    targetVelocity?: Vec2Like,
  ): Vec2Like {
    if (!Number.isFinite(dt) || dt <= 0) return this.position;

    copy(this.previousPosition, this.position);
    copy(this.previousVelocity, this.velocity);

    const resolvedTargetVelocity =
      targetVelocity ?? this.estimatedTargetVelocity;
    if (targetVelocity === undefined) {
      this.estimatedTargetVelocity.x = (target.x - this.previousTarget.x) / dt;
      this.estimatedTargetVelocity.y = (target.y - this.previousTarget.y) / dt;
    }
    copy(this.previousTarget, target);

    // Always pass an explicit target velocity. The scalar filters may be reset
    // when the radial speed cap engages; letting them estimate after that reset
    // would mistake a stationary target for a fast-moving one.
    const rawX = this.x.update(dt, target.x, resolvedTargetVelocity.x);
    const rawY = this.y.update(dt, target.y, resolvedTargetVelocity.y);
    let deltaX = rawX - this.previousPosition.x;
    let deltaY = rawY - this.previousPosition.y;

    if (Number.isFinite(maximumSpeed) && maximumSpeed > 0) {
      const maximumDelta = maximumSpeed * dt;
      const deltaLength = Math.hypot(deltaX, deltaY);
      // A value that is only floating-point noise above the cap must not reset
      // the filters: doing so would discard the deceleration they calculated
      // for the next step and could hold the body at terminal speed forever.
      if (deltaLength > maximumDelta + 1e-9) {
        const ratio = maximumDelta / deltaLength;
        deltaX *= ratio;
        deltaY *= ratio;
        const cappedX = this.previousPosition.x + deltaX;
        const cappedY = this.previousPosition.y + deltaY;
        const cappedVelocityX = deltaX / dt;
        const cappedVelocityY = deltaY / dt;
        this.x.reset(cappedX, cappedVelocityX);
        this.y.reset(cappedY, cappedVelocityY);
      }
    }

    this.position.x = this.previousPosition.x + deltaX;
    this.position.y = this.previousPosition.y + deltaY;
    this.velocity.x = deltaX / dt;
    this.velocity.y = deltaY / dt;
    this.acceleration.x = (this.velocity.x - this.previousVelocity.x) / dt;
    this.acceleration.y = (this.velocity.y - this.previousVelocity.y) / dt;

    if (
      !Number.isFinite(this.position.x) ||
      !Number.isFinite(this.position.y) ||
      !Number.isFinite(length(this.velocity))
    ) {
      this.reset(target);
    }

    return this.position;
  }
}
