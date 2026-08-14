import type { AppendageSpec, Vec2Like } from "../types";
import { copy, fromAngle, rotate, vec2 } from "../math/Vec2";
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
  readonly maxReach: number;

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
    this.segmentLengths = spec.segmentLengths.map((value) => value * scale);
    this.maxReach = spec.maxReach * scale;
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

  updateSecondaryMotion(
    dt: number,
    elapsedTime: number,
    reducedMotion: boolean,
  ): void {
    this.softChain.update(this.points, this.anchor, this.foot, {
      dt,
      elapsedTime,
      phase: this.spec.gaitPhase,
      reducedMotion,
      spring: this.spec.spring,
    });
  }

  reset(
    bodyPosition: Vec2Like,
    bodyFacing: number,
    bodyRadius: number,
    scale: number,
  ): void {
    this.placeAnchor(bodyPosition, bodyFacing, bodyRadius, scale);
    this.placeInitialFoot(bodyPosition, bodyFacing, scale);
    this.stepping = false;
    this.stepProgress = 1;
    this.timeSinceStep = Number.POSITIVE_INFINITY;
    this.solve(this.solverOptions.iterations);
    this.softChain.reset(this.points);
  }
}
