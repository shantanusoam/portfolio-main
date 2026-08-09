/**
 * Second-order dynamics filter (t3ssel8r formulation, with the k2 stability
 * fix so the filter never explodes at low frame rates or after a large dt).
 *
 * frequency  — response speed (Hz-ish). Higher = snappier.
 * damping    — 0 rings forever, 1 is critically damped, >1 is sluggish.
 * response   — anticipation. Negative overshoots before settling, positive
 *              anticipates (overshoots toward, then settles), 0 = none.
 *
 * Used for root following, head orientation, core tracking, squash targets,
 * glow response — see MotionRecipes.ts for per-behavior tuning.
 */

export interface SecondOrderDynamicsConfig {
  frequency: number;
  damping: number;
  response: number;
}

const MAX_DT = 1;
const MAX_SUBSTEPS = 8;

export class SecondOrderDynamics {
  private previousTarget: number;
  private y: number;
  private yd: number;
  private frequency = 1;
  private damping = 1;
  private response = 0;
  private k1 = 0;
  private k2 = 0;
  private k3 = 0;

  constructor(
    config: SecondOrderDynamicsConfig,
    initialValue = 0,
    initialVelocity = 0,
  ) {
    this.configure(config);
    this.previousTarget = initialValue;
    this.y = initialValue;
    this.yd = Number.isFinite(initialVelocity) ? initialVelocity : 0;
  }

  configure(config: SecondOrderDynamicsConfig): void {
    const { frequency, damping, response } = config;
    if (!Number.isFinite(frequency) || frequency <= 0) {
      throw new Error(
        `SecondOrderDynamics: frequency must be a finite number > 0, received ${frequency}`,
      );
    }
    if (!Number.isFinite(damping) || damping < 0) {
      throw new Error(
        `SecondOrderDynamics: damping must be a finite number >= 0, received ${damping}`,
      );
    }
    if (!Number.isFinite(response)) {
      throw new Error(
        `SecondOrderDynamics: response must be finite, received ${response}`,
      );
    }

    this.frequency = frequency;
    this.damping = damping;
    this.response = response;

    const angular = 2 * Math.PI * frequency;
    this.k1 = damping / (Math.PI * frequency);
    this.k2 = 1 / (angular * angular);
    this.k3 = (response * damping) / angular;
  }

  reset(value: number, velocity = 0): void {
    this.previousTarget = value;
    this.y = value;
    this.yd = Number.isFinite(velocity) ? velocity : 0;
  }

  /**
   * Advances the filter by dt seconds toward targetValue. Pass
   * targetVelocity when it is known (e.g. a moving pointer) to avoid
   * estimating it from consecutive targets, which is noisier.
   */
  update(dt: number, targetValue: number, targetVelocity?: number): number {
    if (!Number.isFinite(targetValue)) return this.y;
    if (!Number.isFinite(dt) || dt <= 0) return this.y;

    const clampedDt = Math.min(dt, MAX_DT);

    let estimatedVelocity: number;
    if (targetVelocity !== undefined && Number.isFinite(targetVelocity)) {
      estimatedVelocity = targetVelocity;
    } else {
      estimatedVelocity = (targetValue - this.previousTarget) / clampedDt;
      this.previousTarget = targetValue;
    }

    // Substep when dt is large relative to the filter's natural period so
    // the explicit integration below stays close to the continuous solution.
    const naturalPeriod = 1 / (this.frequency * 8);
    const steps =
      clampedDt > naturalPeriod
        ? Math.min(MAX_SUBSTEPS, Math.ceil(clampedDt / naturalPeriod))
        : 1;
    const stepDt = clampedDt / steps;

    for (let i = 0; i < steps; i += 1) {
      const k2Stable = Math.max(
        this.k2,
        (stepDt * stepDt) / 2 + (stepDt * this.k1) / 2,
        stepDt * this.k1,
      );
      this.y += stepDt * this.yd;
      this.yd +=
        (stepDt *
          (targetValue +
            this.k3 * estimatedVelocity -
            this.y -
            this.k1 * this.yd)) /
        k2Stable;
    }

    if (!Number.isFinite(this.y) || !Number.isFinite(this.yd)) {
      this.y = targetValue;
      this.yd = 0;
    }

    return this.y;
  }

  get value(): number {
    return this.y;
  }

  get velocity(): number {
    return this.yd;
  }

  getConfig(): SecondOrderDynamicsConfig {
    return {
      frequency: this.frequency,
      damping: this.damping,
      response: this.response,
    };
  }
}
