import { wrapAngle } from "../core/NumericGuards";
import type { MotionRecipe } from "../types";
import { SecondOrderDynamics } from "./SecondOrderDynamics";
import {
  createSpineJoints,
  solveSpine,
  type SpineJoint,
  type SpineSolverConfig,
} from "./SpineSolver";

/**
 * Composes root-following second-order dynamics, wrap-safe heading
 * smoothing, and the spine solver into one per-frame pose update. This is
 * the shared core the engine drives every fixed step; rendering and
 * behavior read `joints` and `getHeading()` but never own them.
 */

export interface PoseControllerConfig {
  spine: SpineSolverConfig;
  headingFrequency?: number;
  headingDamping?: number;
}

const HEADING_ACTIVATION_SPEED = 1;

export class PoseController {
  readonly joints: SpineJoint[];
  private rootFilterX: SecondOrderDynamics;
  private rootFilterY: SecondOrderDynamics;
  private headingFilter: SecondOrderDynamics;
  private headingContinuous: number;
  private spineConfig: SpineSolverConfig;

  constructor(
    config: PoseControllerConfig,
    originX: number,
    originY: number,
    recipe: MotionRecipe,
  ) {
    this.spineConfig = config.spine;
    this.joints = createSpineJoints(config.spine, originX, originY);
    this.rootFilterX = new SecondOrderDynamics(recipe, originX);
    this.rootFilterY = new SecondOrderDynamics(recipe, originY);
    this.headingContinuous = -Math.PI / 2;
    this.headingFilter = new SecondOrderDynamics(
      {
        frequency: config.headingFrequency ?? recipe.frequency,
        damping: config.headingDamping ?? recipe.damping,
        response: 0,
      },
      this.headingContinuous,
    );
    this.joints[0].angle = this.headingContinuous;
  }

  setRecipe(recipe: MotionRecipe): void {
    this.rootFilterX.configure(recipe);
    this.rootFilterY.configure(recipe);
  }

  setHeadingRecipe(frequency: number, damping: number): void {
    this.headingFilter.configure({ frequency, damping, response: 0 });
  }

  setSpineConfig(config: SpineSolverConfig): void {
    this.spineConfig = config;
  }

  teleport(x: number, y: number): void {
    this.rootFilterX.reset(x);
    this.rootFilterY.reset(y);
    for (const joint of this.joints) {
      joint.x = x;
      joint.y = y;
    }
  }

  update(dt: number, targetX: number, targetY: number): void {
    const rootX = this.rootFilterX.update(dt, targetX);
    const rootY = this.rootFilterY.update(dt, targetY);

    const vx = this.rootFilterX.velocity;
    const vy = this.rootFilterY.velocity;
    const speed = Math.hypot(vx, vy);

    if (speed > HEADING_ACTIVATION_SPEED) {
      const desiredHeading = Math.atan2(vy, vx);
      // Unwrap the target relative to the filter's continuous state so the
      // +-PI seam never causes a spin — SecondOrderDynamics has no notion
      // of angles, so this is done before handing it the target.
      const delta = wrapAngle(desiredHeading - this.headingContinuous);
      const targetUnwrapped = this.headingContinuous + delta;
      this.headingContinuous = this.headingFilter.update(dt, targetUnwrapped);
    }

    this.joints[0].angle = this.headingContinuous;
    solveSpine(this.joints, rootX, rootY, this.spineConfig);
  }

  getRoot(): { x: number; y: number } {
    return { x: this.joints[0].x, y: this.joints[0].y };
  }

  getVelocity(): { x: number; y: number } {
    return { x: this.rootFilterX.velocity, y: this.rootFilterY.velocity };
  }

  getHeading(): number {
    return wrapAngle(this.headingContinuous);
  }
}
