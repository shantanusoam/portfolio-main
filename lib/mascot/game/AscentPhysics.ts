import { clamp } from "../core/NumericGuards";
import { STRUMRISE_CONFIG } from "./StrumriseConfig";
import type { AscentPlayerState } from "./GameTypes";

/**
 * Explicit velocity-integration physics for the Strumrise game root. Kept
 * fully separate from the homepage mascot's second-order pointer-follow
 * dynamics — spec: "Do not use the mascot's second-order pointer target as
 * the game physics root... This separation is mandatory."
 */

export function createInitialPlayerState(
  x: number,
  y: number,
): AscentPlayerState {
  return {
    x,
    y,
    previousX: x,
    previousY: y,
    velocityX: 0,
    velocityY: 0,
    groundedStringId: null,
    coyoteTimer: 0,
    inputX: 0,
    combo: 0,
    lives: STRUMRISE_CONFIG.lives.starting,
    energy: 0,
    invulnerableTimer: 0,
  };
}

/** One fixed-step physics update: horizontal accel+drag, gravity, position integration. Collision resolution happens separately (see LandingDetector). */
export function integratePlayer(
  state: AscentPlayerState,
  dt: number,
): AscentPlayerState {
  const cfg = STRUMRISE_CONFIG.physics;
  const previousX = state.x;
  const previousY = state.y;

  const controlMultiplier = state.groundedStringId
    ? 1
    : cfg.airControlMultiplier;
  const targetVelocityX =
    clamp(state.inputX, -1, 1) * cfg.maxHorizontalSpeed * controlMultiplier;
  const accelStep = cfg.horizontalAcceleration * dt;

  let velocityX = state.velocityX;
  const delta = targetVelocityX - velocityX;
  if (Math.abs(delta) <= accelStep) {
    velocityX = targetVelocityX;
  } else {
    velocityX += Math.sign(delta) * accelStep;
  }
  if (Math.abs(state.inputX) < 0.01) {
    velocityX *= Math.max(0, 1 - cfg.horizontalDragPerSecond * dt);
  }

  const velocityY = Math.min(
    state.velocityY + cfg.gravity * dt,
    cfg.maxFallSpeed,
  );

  const x = previousX + velocityX * dt;
  const y = previousY + velocityY * dt;

  return {
    ...state,
    previousX,
    previousY,
    x,
    y,
    velocityX,
    velocityY,
    coyoteTimer: Math.max(0, state.coyoteTimer - dt),
    invulnerableTimer: Math.max(0, state.invulnerableTimer - dt),
  };
}

/** Resolves a valid landing: sets the upward bounce impulse and grounded reference. Never called for upward collisions (see LandingDetector). */
export function applyBounce(
  state: AscentPlayerState,
  bounceSpeed: number,
  groundedStringId: string,
): AscentPlayerState {
  return {
    ...state,
    velocityY: -Math.abs(bounceSpeed),
    groundedStringId,
    coyoteTimer: STRUMRISE_CONFIG.physics.coyoteTimeSeconds,
  };
}

/** Apex height (world units) reachable from a given upward bounce speed under gravity. */
export function computeMaxJumpHeight(
  bounceSpeed: number,
  gravity: number,
): number {
  if (gravity <= 0) return 0;
  return (bounceSpeed * bounceSpeed) / (2 * gravity);
}

/**
 * Time (seconds) to first reach `deltaHeight` above the launch point under
 * projectile motion (v*t - 0.5*g*t^2 = deltaHeight, smaller positive root).
 * Returns null when `deltaHeight` exceeds the apex height (unreachable) or
 * inputs are invalid.
 */
export function computeTimeToHeight(
  bounceSpeed: number,
  gravity: number,
  deltaHeight: number,
): number | null {
  if (gravity <= 0 || bounceSpeed <= 0 || deltaHeight <= 0) return null;
  const discriminant = bounceSpeed * bounceSpeed - 2 * gravity * deltaHeight;
  if (discriminant < 0) return null;
  const t = (bounceSpeed - Math.sqrt(discriminant)) / gravity;
  return t > 0 ? t : null;
}

/**
 * Maximum horizontal distance coverable in `time` seconds under constant
 * acceleration up to `maxSpeed`, then constant speed — a real kinematic
 * bound (not `maxSpeed * time`, which would over-claim reach during the
 * acceleration ramp-up).
 */
export function computeHorizontalReach(
  maxSpeed: number,
  acceleration: number,
  time: number,
): number {
  if (time <= 0 || maxSpeed <= 0 || acceleration <= 0) return 0;
  const timeToMax = maxSpeed / acceleration;
  if (time <= timeToMax) {
    return 0.5 * acceleration * time * time;
  }
  return (
    0.5 * acceleration * timeToMax * timeToMax + maxSpeed * (time - timeToMax)
  );
}

/** True when a platform `dx` horizontally and `dy` above (positive = up) the launch point is physically reachable under the given bounce/physics constants. */
export function isReachable(
  dx: number,
  dy: number,
  bounceSpeed: number,
  gravity: number,
  maxSpeed: number,
  acceleration: number,
): boolean {
  const time = computeTimeToHeight(bounceSpeed, gravity, dy);
  if (time === null) return false;
  const reach = computeHorizontalReach(maxSpeed, acceleration, time);
  return Math.abs(dx) <= reach + 1e-6;
}
