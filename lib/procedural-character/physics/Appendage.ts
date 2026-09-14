import type { AppendageSpec, Vec2Like } from "../types";
import { clamp, copy, fromAngle, rotate, vec2 } from "../math/Vec2";
import {
  createFabrikChain,
  solveFabrik,
  type FabrikSolverOptions,
} from "./FabrikSolver";
import { SoftChain } from "./SoftChain";

/**
 * Mutable per-leg state. One instance is created at engine initialization and
 * then reused for every fixed simulation step and render frame.
 */
export class AppendageRuntime {
  readonly index: number;
  readonly spec: AppendageSpec;
  readonly segmentLengths: number[];
  readonly baseSegmentLengths: number[];
  readonly baseMaxReach: number;

  readonly anchor = vec2();
  readonly idealFootTarget = vec2();
  readonly lockedFootPosition = vec2();
  readonly foot = vec2();
  readonly stepStart = vec2();
  readonly stepDestination = vec2();
  readonly points: Vec2Like[];
  readonly softPoints: readonly Vec2Like[];

  stepping = false;
  stepProgress = 1;
  stepDuration = 0;
  stepHeight = 0;
  timeSinceStep = Number.POSITIVE_INFINITY;
  stepCount = 0;
  error = 0;
  triggerThreshold = 0;
  stepDemand = 0;
  phaseDistance = 1;
  triggerReason = "planted";
  reachScale = 1;

  private readonly solverOptions: FabrikSolverOptions;
  private readonly softChain: SoftChain;
  private readonly scratchDirection = vec2();
  private readonly scratchOffset = vec2();

  constructor(
    spec: AppendageSpec,
    index: number,
    bodyPosition: Vec2Like,
    bodyFacing: number,
    bodyRadius: number,
    scale: number,
    solverIterations: number,
  ) {
    this.spec = spec;
    this.index = index;
    this.baseSegmentLengths = spec.segmentLengths.map((value) => value * scale);
    this.segmentLengths = [...this.baseSegmentLengths];
    this.baseMaxReach = spec.maxReach * scale;
    this.solverOptions = {
      iterations: solverIterations,
      tolerance: 0.08,
      preferredBendDirection: spec.preferredBendDirection,
    };

    this.placeAnchor(bodyPosition, bodyFacing, bodyRadius, scale);
    this.placeInitialFoot(bodyPosition, bodyFacing, scale);
    this.points = createFabrikChain(
      this.segmentLengths,
      this.anchor,
      this.foot,
      spec.preferredBendDirection,
    );
    this.solve(solverIterations);
    this.softChain = new SoftChain(this.points, this.segmentLengths);
    this.softPoints = this.softChain.points;
  }

  placeAnchor(
    bodyPosition: Vec2Like,
    bodyFacing: number,
    bodyRadius: number,
    scale: number,
  ): void {
    fromAngle(
      this.scratchDirection,
      bodyFacing + this.spec.anchor.angle,
      bodyRadius * this.spec.anchor.radius * scale,
    );
    this.anchor.x = bodyPosition.x + this.scratchDirection.x;
    this.anchor.y = bodyPosition.y + this.scratchDirection.y;
  }

  private placeInitialFoot(
    bodyPosition: Vec2Like,
    bodyFacing: number,
    scale: number,
  ): void {
    fromAngle(
      this.scratchDirection,
      bodyFacing + this.spec.preferredFoot.angle,
      this.spec.preferredFoot.radius * scale,
    );
    this.scratchOffset.x = this.spec.preferredFoot.offsetX * scale;
    this.scratchOffset.y = this.spec.preferredFoot.offsetY * scale;
    rotate(this.scratchOffset, this.scratchOffset, bodyFacing);
    this.foot.x =
      bodyPosition.x + this.scratchDirection.x + this.scratchOffset.x;
    this.foot.y =
      bodyPosition.y + this.scratchDirection.y + this.scratchOffset.y;
    copy(this.idealFootTarget, this.foot);
    copy(this.lockedFootPosition, this.foot);
    copy(this.stepStart, this.foot);
    copy(this.stepDestination, this.foot);
  }

  solve(iterations: number): number {
    this.solverOptions.iterations = iterations;
    return solveFabrik(
      this.points,
      this.segmentLengths,
      this.anchor,
      this.foot,
      this.solverOptions,
    );
  }

  get maxReach(): number {
    return this.baseMaxReach * this.reachScale;
  }

  /**
   * Smoothly changes the physical chain length. The same mutable segment
   * array is shared by FABRIK and the Verlet ribbon, so the visible arm and
   * its reach constraint can never disagree during an elastic grab.
   */
  updateReachScale(targetScale: number, dt: number, response: number): void {
    const target = clamp(targetScale, 1, 6);
    const blend = 1 - Math.exp(-Math.max(0.1, response) * Math.max(0, dt));
    this.reachScale += (target - this.reachScale) * blend;
    if (
      Math.abs(this.reachScale - target) < 0.0005 ||
      (target === 1 && this.reachScale < 1.002)
    ) {
      this.reachScale = target;
    }
    for (let index = 0; index < this.segmentLengths.length; index += 1) {
      this.segmentLengths[index] =
        this.baseSegmentLengths[index] * this.reachScale;
    }
  }

  updateSecondaryMotion(
    dt: number,
    elapsedTime: number,
    reducedMotion: boolean,
    tension = 0,
  ): void {
    this.softChain.update(this.points, this.anchor, this.foot, {
      dt,
      elapsedTime,
      phase: this.spec.gaitPhase,
      reducedMotion,
      tension,
      spring: this.spec.spring,
    });
  }

  reset(
    bodyPosition: Vec2Like,
    bodyFacing: number,
    bodyRadius: number,
    scale: number,
  ): void {
    this.reachScale = 1;
    for (let index = 0; index < this.segmentLengths.length; index += 1) {
      this.segmentLengths[index] = this.baseSegmentLengths[index];
    }
    this.placeAnchor(bodyPosition, bodyFacing, bodyRadius, scale);
    this.placeInitialFoot(bodyPosition, bodyFacing, scale);
    this.stepping = false;
    this.stepProgress = 1;
    this.timeSinceStep = Number.POSITIVE_INFINITY;
    this.solve(this.solverOptions.iterations);
    this.softChain.reset(this.points);
  }

  translate(dx: number, dy: number): void {
    const vectors: Vec2Like[] = [
      this.anchor,
      this.idealFootTarget,
      this.lockedFootPosition,
      this.foot,
      this.stepStart,
      this.stepDestination,
      ...this.points,
    ];
    for (const point of vectors) {
      point.x += dx;
      point.y += dy;
    }
    this.softChain.translate(dx, dy);
  }
}
