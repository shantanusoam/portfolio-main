import { FixedStepLoop } from "@/lib/mascot/core/FixedStepLoop";
import { GaitPlanner } from "./behavior/GaitPlanner";
import { PersonalityController } from "./behavior/PersonalityController";
import {
  SecondOrderDynamics2D,
  type SecondOrderDynamicsConfig,
} from "./math/SecondOrderDynamics";
import {
  EPSILON,
  clamp,
  clampLength,
  copy,
  shortestAngleDelta,
  vec2,
} from "./math/Vec2";
import { AppendageRuntime } from "./physics/Appendage";
import { TargetDriver } from "./TargetDriver";
import type {
  CharacterDebugSnapshot,
  CharacterKinematics,
  CharacterMode,
  CharacterPerformanceSnapshot,
  CharacterSpec,
  ProceduralCharacterCallbacks,
} from "./types";
import type {
  CharacterRenderer,
  CharacterRenderState,
} from "./rendering/CharacterRenderer";

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

export interface ProceduralCharacterEngineOptions
  extends ProceduralCharacterCallbacks {
  spec: CharacterSpec;
  renderer: CharacterRenderer;
  initialX: number;
  initialY: number;
  debug?: boolean;
  reducedMotion?: boolean;
  lowPower?: boolean;
}

/**
 * Owns the fixed-step character simulation. No React state, DOM reads, or
 * Canvas drawing occurs here; the renderer consumes solved mutable data.
 */
export class ProceduralCharacterEngine {
  readonly spec: CharacterSpec;
  readonly body: CharacterKinematics;
  readonly appendages: readonly AppendageRuntime[];
  readonly performance: CharacterPerformanceSnapshot = {
    fps: 0,
    solverTimeMs: 0,
    activeSteps: 0,
    gaitPhase: 0,
  };

  private readonly renderer: CharacterRenderer;
  private readonly targetDriver: TargetDriver;
  private readonly dynamics: SecondOrderDynamics2D;
  private readonly gaitPlanner: GaitPlanner;
  private readonly personalityController: PersonalityController;
  private readonly loop: FixedStepLoop;
  private readonly targetVelocity = vec2();
  private readonly movementIntentDirection = vec2(1, 0);
  private readonly renderState: CharacterRenderState;

  private debug: boolean;
  private reducedMotion: boolean;
  private lowPower: boolean;
  private destroyed = false;
  private elapsedTime = 0;
  private frameCount = 0;
  private frameWindowStartedAt = now();
  private normalizedMovementIntent = 0;

  constructor(options: ProceduralCharacterEngineOptions) {
    this.spec = options.spec;
    this.renderer = options.renderer;
    this.debug = options.debug ?? false;
    this.reducedMotion = options.reducedMotion ?? false;
    this.lowPower = options.lowPower ?? false;

    const initialPosition = vec2(options.initialX, options.initialY);
    const dynamicsConfig: SecondOrderDynamicsConfig = {
      frequency: this.spec.dynamics.frequency,
      damping: this.spec.dynamics.damping,
      response: this.spec.dynamics.response,
    };
    this.dynamics = new SecondOrderDynamics2D(dynamicsConfig, initialPosition);
    this.targetDriver = new TargetDriver(initialPosition);

    this.body = {
      position: this.dynamics.position,
      previousPosition: this.dynamics.previousPosition,
      velocity: this.dynamics.velocity,
      acceleration: this.dynamics.acceleration,
      movementDirection: vec2(1, 0),
      speed: 0,
      normalizedSpeed: 0,
      facingAngle: 0,
      angularVelocity: 0,
    };

    const solverIterations = this.resolveSolverIterations();
    this.appendages = this.spec.appendages.map(
      (appendage, index) =>
        new AppendageRuntime(
          appendage,
          index,
          this.body.position,
          this.body.facingAngle,
          this.spec.body.radius,
          this.spec.scale,
          solverIterations,
        ),
    );
    this.personalityController = new PersonalityController(this.spec.seed);
    this.gaitPlanner = new GaitPlanner(this.spec.seed, {
      onStep: options.onStep,
      onLand: (appendageId, position) => {
        const landingStrength = clamp(
          0.12 +
            this.body.normalizedSpeed * 0.5 +
            (Math.abs(this.body.acceleration.y) /
              Math.max(1, this.spec.dynamics.maxAcceleration)) *
              0.35,
          0,
          1,
        );
        this.personalityController.reactToLanding(
          landingStrength,
          this.body.velocity.x / Math.max(1, this.spec.dynamics.maxSpeed),
        );
        options.onLand?.(appendageId, position);
      },
    });

    this.renderState = {
      spec: this.spec,
      target: this.targetDriver.target,
      body: this.body,
      pose: this.personalityController.pose,
      appendages: this.appendages,
      performance: this.performance,
      elapsedTime: 0,
      debug: this.debug,
    };

    this.loop = new FixedStepLoop({
      fixedDt: this.spec.performance.fixedTimeStep,
      maxFrameDt: this.spec.performance.maxFrameDelta,
      maxSteps: this.spec.performance.maxSimulationSteps,
      update: (dt) => this.update(dt),
      render: () => this.render(),
    });
  }

  start(): void {
    if (!this.destroyed) this.loop.start();
  }

  pause(): void {
    this.loop.stop();
  }

  resize(width: number, height: number, dpr: number): void {
    const cappedDpr = Math.min(Math.max(1, dpr), this.spec.performance.dprCap);
    this.renderer.resize(Math.max(1, width), Math.max(1, height), cappedDpr);
  }

  setTarget(
    x: number,
    y: number,
    active = true,
    timeSeconds = now() / 1000,
  ): void {
    this.targetDriver.setTarget(x, y, active, timeSeconds);
  }

  setMode(mode: CharacterMode): void {
    this.targetDriver.setMode(mode);
  }

  setDebug(enabled: boolean): void {
    this.debug = enabled;
    this.renderState.debug = enabled;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  setLowPower(lowPower: boolean): void {
    this.lowPower = lowPower;
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loop.stop();
    this.renderer.destroy();
  }

  getDebugSnapshot(): CharacterDebugSnapshot {
    return {
      target: { ...this.targetDriver.target },
      body: {
        position: { ...this.body.position },
        previousPosition: { ...this.body.previousPosition },
        velocity: { ...this.body.velocity },
        acceleration: { ...this.body.acceleration },
        movementDirection: { ...this.body.movementDirection },
        speed: this.body.speed,
        normalizedSpeed: this.body.normalizedSpeed,
        facingAngle: this.body.facingAngle,
        angularVelocity: this.body.angularVelocity,
      },
      performance: { ...this.performance },
      appendages: this.appendages.map((appendage) => ({
        id: appendage.spec.id,
        gaitGroup: appendage.spec.gaitGroup,
        stepping: appendage.stepping,
        stepProgress: appendage.stepProgress,
        error: appendage.error,
        triggerThreshold: appendage.triggerThreshold,
        triggerReason: appendage.triggerReason,
        anchor: { ...appendage.anchor },
        foot: { ...appendage.foot },
        lockedFootPosition: { ...appendage.lockedFootPosition },
        idealFootTarget: { ...appendage.idealFootTarget },
        stepDestination: { ...appendage.stepDestination },
      })),
    };
  }

  private update(dt: number): void {
    this.elapsedTime += dt;
    this.targetDriver.update(dt);

    const maximumSpeed =
      this.spec.dynamics.maxSpeed *
      this.spec.scale *
      (this.reducedMotion ? 0.3 : 1);
    copy(this.targetVelocity, this.targetDriver.velocity);
    clampLength(this.targetVelocity, this.targetVelocity, maximumSpeed * 1.5);
    this.dynamics.update(
      dt,
      this.targetDriver.target,
      maximumSpeed,
      this.targetVelocity,
    );

    this.updateBodyKinematics(dt, maximumSpeed);
    this.updateMovementIntent();
    this.updateIdealFeet();

    this.gaitPlanner.update(dt, this.appendages, this.spec.gait, {
      normalizedSpeed: Math.max(
        this.body.normalizedSpeed,
        this.normalizedMovementIntent,
      ),
      velocity: this.body.velocity,
      scale: this.spec.scale,
      reducedMotion: this.reducedMotion,
    });

    this.personalityController.update(
      dt,
      this.elapsedTime,
      this.body,
      this.spec,
      this.gaitPlanner.activeSteps,
      this.reducedMotion,
    );

    const solverStartedAt = now();
    const solverIterations = this.resolveSolverIterations();
    for (let index = 0; index < this.appendages.length; index += 1) {
      this.enforceAppendageReach(this.appendages[index]);
      this.appendages[index].solve(solverIterations);
      this.appendages[index].updateSecondaryMotion(
        dt,
        this.elapsedTime,
        this.reducedMotion,
      );
    }
    this.performance.solverTimeMs = now() - solverStartedAt;
    this.performance.activeSteps = this.gaitPlanner.activeSteps;
    this.performance.gaitPhase = this.gaitPlanner.phase;
  }

  private updateBodyKinematics(dt: number, maximumSpeed: number): void {
    const previousFacing = this.body.facingAngle;
    this.body.speed = Math.hypot(this.body.velocity.x, this.body.velocity.y);
    this.body.normalizedSpeed = clamp(
      this.body.speed / Math.max(1, maximumSpeed),
      0,
      1,
    );

    if (this.body.speed > 1) {
      this.body.movementDirection.x = this.body.velocity.x / this.body.speed;
      this.body.movementDirection.y = this.body.velocity.y / this.body.speed;
      const desiredFacing =
        this.spec.body.orientationMode === "upright"
          ? clamp(
              (this.body.velocity.x / Math.max(1, maximumSpeed)) *
                this.spec.body.maxLean +
                (this.body.acceleration.x /
                  Math.max(1, this.spec.dynamics.maxAcceleration)) *
                  this.spec.body.maxLean *
                  0.38,
              -this.spec.body.maxLean,
              this.spec.body.maxLean,
            )
          : Math.atan2(
              this.body.movementDirection.y,
              this.body.movementDirection.x,
            );
      const response =
        1 - Math.exp(-this.spec.dynamics.facingResponsiveness * dt);
      this.body.facingAngle +=
        shortestAngleDelta(this.body.facingAngle, desiredFacing) * response;
    } else {
      if (this.spec.body.orientationMode === "upright") {
        const response =
          1 - Math.exp(-this.spec.dynamics.facingResponsiveness * dt);
        this.body.facingAngle +=
          shortestAngleDelta(this.body.facingAngle, 0) * response;
        this.body.movementDirection.x = 1;
        this.body.movementDirection.y = 0;
      } else {
        this.body.movementDirection.x = Math.cos(this.body.facingAngle);
        this.body.movementDirection.y = Math.sin(this.body.facingAngle);
      }
    }

    this.body.angularVelocity =
      shortestAngleDelta(previousFacing, this.body.facingAngle) /
      Math.max(EPSILON, dt);
  }

  private updateIdealFeet(): void {
    const { body, spec } = this;
    const speed = Math.max(body.normalizedSpeed, this.normalizedMovementIntent);

    for (let index = 0; index < this.appendages.length; index += 1) {
      const appendage = this.appendages[index];
      const appendageSpec = appendage.spec;
      appendage.placeAnchor(
        body.position,
        body.facingAngle,
        spec.body.radius,
        spec.scale,
      );

      const footAngle = body.facingAngle + appendageSpec.preferredFoot.angle;
      const radialX = Math.cos(footAngle);
      const radialY = Math.sin(footAngle);
      const cosine = Math.cos(body.facingAngle);
      const sine = Math.sin(body.facingAngle);
      const localOffsetX = appendageSpec.preferredFoot.offsetX * spec.scale;
      const localOffsetY = appendageSpec.preferredFoot.offsetY * spec.scale;
      const offsetX = localOffsetX * cosine - localOffsetY * sine;
      const offsetY = localOffsetX * sine + localOffsetY * cosine;
      const restingRadius = appendageSpec.preferredFoot.radius * spec.scale;
      const forwardness =
        radialX * this.movementIntentDirection.x +
        radialY * this.movementIntentDirection.y;
      const strideBias =
        appendageSpec.step.threshold *
        spec.scale *
        speed *
        (0.55 + forwardness * 0.45);
      const prediction =
        appendageSpec.step.predictionTime *
        (0.06 + Math.max(0, forwardness) * 0.14);
      const turnBias =
        clamp(body.angularVelocity, -5, 5) * restingRadius * 0.035;

      appendage.idealFootTarget.x =
        body.position.x +
        radialX * restingRadius +
        offsetX +
        this.movementIntentDirection.x * strideBias +
        body.velocity.x * prediction -
        radialY * turnBias;
      appendage.idealFootTarget.y =
        body.position.y +
        radialY * restingRadius +
        offsetY +
        this.movementIntentDirection.y * strideBias +
        body.velocity.y * prediction +
        radialX * turnBias;

      // An ideal target is a goal, not permission to violate morphology.
      const reachX = appendage.idealFootTarget.x - appendage.anchor.x;
      const reachY = appendage.idealFootTarget.y - appendage.anchor.y;
      const reach = Math.hypot(reachX, reachY);
      const safeReach = appendage.maxReach * 0.94;
      if (reach > safeReach) {
        const ratio = safeReach / reach;
        appendage.idealFootTarget.x = appendage.anchor.x + reachX * ratio;
        appendage.idealFootTarget.y = appendage.anchor.y + reachY * ratio;
      }
    }
  }

  private enforceAppendageReach(appendage: AppendageRuntime): void {
    const deltaX = appendage.foot.x - appendage.anchor.x;
    const deltaY = appendage.foot.y - appendage.anchor.y;
    const distance = Math.hypot(deltaX, deltaY);
    const safeReach = appendage.maxReach * 0.995;
    if (distance <= safeReach) return;

    const ratio = safeReach / Math.max(EPSILON, distance);
    appendage.foot.x = appendage.anchor.x + deltaX * ratio;
    appendage.foot.y = appendage.anchor.y + deltaY * ratio;
    if (!appendage.stepping) copy(appendage.lockedFootPosition, appendage.foot);
    appendage.triggerReason = "reach-limited toe slip";
  }

  private updateMovementIntent(): void {
    const deltaX = this.targetDriver.target.x - this.body.position.x;
    const deltaY = this.targetDriver.target.y - this.body.position.y;
    const targetDistance = Math.hypot(deltaX, deltaY);
    const targetStrength = clamp(
      targetDistance / Math.max(1, this.spec.body.radius * this.spec.scale * 8),
      0,
      1,
    );

    if (targetDistance > EPSILON) {
      const targetDirectionX = deltaX / targetDistance;
      const targetDirectionY = deltaY / targetDistance;
      const targetWeight = 0.45 + targetStrength * 0.4;
      this.movementIntentDirection.x =
        this.body.movementDirection.x * (1 - targetWeight) +
        targetDirectionX * targetWeight;
      this.movementIntentDirection.y =
        this.body.movementDirection.y * (1 - targetWeight) +
        targetDirectionY * targetWeight;
      const intentLength = Math.hypot(
        this.movementIntentDirection.x,
        this.movementIntentDirection.y,
      );
      this.movementIntentDirection.x /= Math.max(EPSILON, intentLength);
      this.movementIntentDirection.y /= Math.max(EPSILON, intentLength);
    } else {
      copy(this.movementIntentDirection, this.body.movementDirection);
    }

    this.normalizedMovementIntent = Math.max(
      this.body.normalizedSpeed,
      targetStrength * 0.85,
    );
  }

  private render(): void {
    this.frameCount += 1;
    const currentTime = now();
    const frameWindow = currentTime - this.frameWindowStartedAt;
    if (frameWindow >= 500) {
      this.performance.fps = (this.frameCount * 1000) / frameWindow;
      this.frameCount = 0;
      this.frameWindowStartedAt = currentTime;
    }

    this.renderState.elapsedTime = this.elapsedTime;
    this.renderer.render(this.renderState);
  }

  private resolveSolverIterations(): number {
    return this.lowPower || this.reducedMotion
      ? this.spec.performance.lowPowerSolverIterations
      : this.spec.performance.solverIterations;
  }
}
