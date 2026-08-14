import type {
  CharacterKinematics,
  CharacterLocomotionSpec,
  CharacterManualControl,
  EnvironmentSurface,
  Vec2Like,
} from "../types";
import { EPSILON, clamp } from "../math/Vec2";

export interface PlatformLocomotionResult {
  landed: boolean;
  impactSpeed: number;
  jumped: boolean;
}

/** Gravity-driven root motion for characters that walk on page surfaces. */
export class PlatformLocomotionController {
  grounded = false;
  surfaceId: string | null = null;
  groundY = Number.POSITIVE_INFINITY;
  groundLeft = Number.NEGATIVE_INFINITY;
  groundRight = Number.POSITIVE_INFINITY;

  private surfaces: readonly EnvironmentSurface[] = [];
  private viewportWidth = 1;
  private viewportHeight = 1;
  private coyoteTimer = 0;
  private hopTimer = 0;
  private readonly result: PlatformLocomotionResult = {
    landed: false,
    impactSpeed: 0,
    jumped: false,
  };

  setSurfaces(surfaces: readonly EnvironmentSurface[]): void {
    this.surfaces = surfaces;
  }

  resize(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
  }

  reset(): void {
    this.grounded = false;
    this.surfaceId = null;
    this.groundY = Number.POSITIVE_INFINITY;
    this.groundLeft = Number.NEGATIVE_INFINITY;
    this.groundRight = Number.POSITIVE_INFINITY;
    this.coyoteTimer = 0;
    this.hopTimer = 0;
  }

  translateSupport(dx: number, dy: number): void {
    if (Number.isFinite(this.groundY)) this.groundY += dy;
    if (Number.isFinite(this.groundLeft)) this.groundLeft += dx;
    if (Number.isFinite(this.groundRight)) this.groundRight += dx;
  }

  update(
    dt: number,
    body: CharacterKinematics,
    target: Vec2Like,
    spec: CharacterLocomotionSpec,
    scale: number,
    manual: CharacterManualControl | null = null,
  ): PlatformLocomotionResult {
    const result = this.result;
    result.landed = false;
    result.impactSpeed = 0;
    result.jumped = false;
    if (!Number.isFinite(dt) || dt <= 0) return result;

    this.hopTimer = Math.max(0, this.hopTimer - dt);
    this.coyoteTimer = Math.max(0, this.coyoteTimer - dt);
    const previousX = body.position.x;
    const previousY = body.position.y;
    const previousVelocityX = body.velocity.x;
    const previousVelocityY = body.velocity.y;
    body.previousPosition.x = previousX;
    body.previousPosition.y = previousY;

    const horizontalDelta = target.x - previousX;
    const maximumHorizontalSpeed = spec.maxHorizontalSpeed * scale;
    const manualSpeedScale = manual?.grab ? 0.08 : manual?.crouch ? 0.48 : 1;
    const desiredVelocityX = manual?.enabled
      ? clamp(manual.horizontal, -1, 1) *
        maximumHorizontalSpeed *
        manualSpeedScale
      : clamp(
          horizontalDelta * 3.4,
          -maximumHorizontalSpeed,
          maximumHorizontalSpeed,
        );
    const accelerationStep = spec.horizontalAcceleration * scale * dt;
    const velocityDelta = desiredVelocityX - body.velocity.x;
    body.velocity.x =
      Math.abs(velocityDelta) <= accelerationStep
        ? desiredVelocityX
        : body.velocity.x + Math.sign(velocityDelta) * accelerationStep;
    if (
      manual?.enabled
        ? Math.abs(manual.horizontal) < 0.01
        : Math.abs(horizontalDelta) < 8 * scale
    ) {
      body.velocity.x *= Math.max(0, 1 - spec.horizontalDrag * dt);
    }

    if (this.grounded && !this.hasCurrentSupport(previousX, spec, scale)) {
      this.leaveGround(spec);
    }
    const wantsHeight = target.y < previousY - spec.hopHeightBias * scale;
    const wantsTravel =
      Math.abs(horizontalDelta) > spec.hopDistance * scale &&
      Math.abs(body.velocity.x) > maximumHorizontalSpeed * 0.28;
    const wantsManualJump = Boolean(manual?.enabled && manual.jump);
    if (
      (this.grounded || this.coyoteTimer > 0) &&
      this.hopTimer <= 0 &&
      (wantsManualJump || (!manual?.enabled && (wantsHeight || wantsTravel)))
    ) {
      body.velocity.y = -spec.jumpSpeed * scale;
      this.grounded = false;
      this.surfaceId = null;
      this.groundY = Number.POSITIVE_INFINITY;
      this.hopTimer = spec.hopCooldown;
      this.coyoteTimer = 0;
      result.jumped = true;
    }

    if (this.grounded) {
      body.position.y = this.groundY - spec.bodyGroundOffset * scale;
      body.velocity.y = 0;
    } else {
      body.velocity.y = Math.min(
        body.velocity.y + spec.gravity * scale * dt,
        spec.maxFallSpeed * scale,
      );
      body.position.y += body.velocity.y * dt;
    }
    body.position.x = clamp(
      previousX + body.velocity.x * dt,
      spec.bodyGroundOffset * 0.45 * scale,
      this.viewportWidth - spec.bodyGroundOffset * 0.45 * scale,
    );

    if (!this.grounded && body.velocity.y >= 0) {
      const landing = this.findLandingSurface(
        previousY + spec.bodyGroundOffset * scale,
        body.position.y + spec.bodyGroundOffset * scale,
        body.position.x,
        spec.surfaceInset * scale,
      );
      if (landing) {
        result.landed = true;
        result.impactSpeed = Math.max(0, body.velocity.y);
        this.landOn(landing, body, spec, scale);
      }
    }

    const floorY = this.viewportHeight - 12;
    const bodyBottom = body.position.y + spec.bodyGroundOffset * scale;
    if (!this.grounded && body.velocity.y >= 0 && bodyBottom >= floorY) {
      result.landed = true;
      result.impactSpeed = Math.max(result.impactSpeed, body.velocity.y);
      this.grounded = true;
      this.surfaceId = "viewport-floor";
      this.groundY = floorY;
      this.groundLeft = 0;
      this.groundRight = this.viewportWidth;
      body.position.y = floorY - spec.bodyGroundOffset * scale;
      body.velocity.y = 0;
      this.coyoteTimer = spec.coyoteTime;
    }

    body.acceleration.x =
      (body.velocity.x - previousVelocityX) / Math.max(EPSILON, dt);
    body.acceleration.y =
      (body.velocity.y - previousVelocityY) / Math.max(EPSILON, dt);
    return result;
  }

  private hasCurrentSupport(
    x: number,
    spec: CharacterLocomotionSpec,
    scale: number,
  ): boolean {
    const inset = spec.surfaceInset * scale;
    return x >= this.groundLeft + inset && x <= this.groundRight - inset;
  }

  private leaveGround(spec: CharacterLocomotionSpec): void {
    this.grounded = false;
    this.surfaceId = null;
    this.groundY = Number.POSITIVE_INFINITY;
    this.coyoteTimer = spec.coyoteTime;
  }

  private findLandingSurface(
    previousBottom: number,
    nextBottom: number,
    x: number,
    inset: number,
  ): EnvironmentSurface | null {
    let selected: EnvironmentSurface | null = null;
    for (let index = 0; index < this.surfaces.length; index += 1) {
      const surface = this.surfaces[index];
      if (x < surface.left + inset || x > surface.right - inset) continue;
      if (previousBottom > surface.top + 2 || nextBottom < surface.top)
        continue;
      if (!selected || surface.top < selected.top) selected = surface;
    }
    return selected;
  }

  private landOn(
    surface: EnvironmentSurface,
    body: CharacterKinematics,
    spec: CharacterLocomotionSpec,
    scale: number,
  ): void {
    this.grounded = true;
    this.surfaceId = surface.id;
    this.groundY = surface.top;
    this.groundLeft = surface.left;
    this.groundRight = surface.right;
    body.position.y = surface.top - spec.bodyGroundOffset * scale;
    body.velocity.y = 0;
    this.coyoteTimer = spec.coyoteTime;
  }
}
