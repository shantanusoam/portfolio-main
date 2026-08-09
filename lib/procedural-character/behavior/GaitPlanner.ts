import type {
  GaitSpec,
  ProceduralCharacterCallbacks,
  Vec2Like,
} from "../types";
import {
  TAU,
  circularDistance,
  clamp,
  copy,
  distance,
  smoothstep,
} from "../math/Vec2";
import type { AppendageRuntime } from "../physics/Appendage";

export interface GaitSignals {
  normalizedSpeed: number;
  velocity: Vec2Like;
  scale: number;
  reducedMotion: boolean;
}

const MAX_GAIT_GROUPS = 32;

function deterministicUnit(seed: number): number {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Coordinates independent IK feet. It never rotates joints directly: it only
 * decides when a planted foot may move and where that step should land.
 */
export class GaitPlanner {
  phase = 0;
  activeSteps = 0;

  private readonly seed: number;
  private readonly callbacks: ProceduralCharacterCallbacks;
  private readonly candidateIndices: number[] = [];
  private readonly groupCounts = new Uint8Array(MAX_GAIT_GROUPS);

  constructor(seed: number, callbacks: ProceduralCharacterCallbacks = {}) {
    this.seed = seed;
    this.callbacks = callbacks;
  }

  update(
    dt: number,
    appendages: readonly AppendageRuntime[],
    gait: GaitSpec,
    signals: GaitSignals,
  ): void {
    const normalizedSpeed = clamp(signals.normalizedSpeed, 0, 1);
    const cadenceMultiplier = 0.35 + normalizedSpeed * 1.35;
    this.phase = (this.phase + dt * gait.cadence * cadenceMultiplier) % 1;

    this.groupCounts.fill(0);
    this.candidateIndices.length = 0;
    this.activeSteps = 0;

    let plantedCount = 0;
    for (let index = 0; index < appendages.length; index += 1) {
      const appendage = appendages[index];
      appendage.timeSinceStep += dt;

      if (appendage.spec.mode !== "planted") {
        this.advanceTrailingAppendage(dt, appendage);
        continue;
      }

      plantedCount += 1;
      if (appendage.stepping) {
        this.advanceStep(dt, appendage);
      } else {
        copy(appendage.foot, appendage.lockedFootPosition);
      }

      if (appendage.stepping) {
        this.activeSteps += 1;
        const group = Math.abs(appendage.spec.gaitGroup) % MAX_GAIT_GROUPS;
        this.groupCounts[group] += 1;
      }
    }

    for (let index = 0; index < appendages.length; index += 1) {
      const appendage = appendages[index];
      if (appendage.spec.mode !== "planted" || appendage.stepping) continue;

      const speedThresholdScale = 1 - normalizedSpeed * 0.24;
      appendage.triggerThreshold =
        appendage.spec.step.threshold * signals.scale * speedThresholdScale;
      appendage.error = distance(
        appendage.lockedFootPosition,
        appendage.idealFootTarget,
      );
      appendage.stepDemand =
        appendage.error / Math.max(0.001, appendage.triggerThreshold);

      const phaseOffset = gait.phaseOffsets[index] ?? appendage.spec.gaitPhase;
      appendage.phaseDistance = circularDistance(this.phase, phaseOffset);

      if (appendage.stepDemand <= 1) {
        appendage.triggerReason = "inside threshold";
        continue;
      }
      if (appendage.timeSinceStep < appendage.spec.step.cooldown) {
        appendage.triggerReason = "step cooldown";
        continue;
      }

      const emergency = appendage.stepDemand >= gait.emergencyStretchRatio;
      const inPhase = appendage.phaseDistance <= gait.phaseWindow * 0.5;
      if (!emergency && !inPhase) {
        appendage.triggerReason = "waiting for gait phase";
        continue;
      }

      appendage.triggerReason = emergency
        ? "emergency reach"
        : "threshold + gait phase";
      this.candidateIndices.push(index);
    }

    this.candidateIndices.sort((leftIndex, rightIndex) => {
      const left = appendages[leftIndex];
      const right = appendages[rightIndex];
      const leftScore = left.stepDemand * 2 - left.phaseDistance;
      const rightScore = right.stepDemand * 2 - right.phaseDistance;
      return rightScore - leftScore;
    });

    const maximumConcurrent =
      normalizedSpeed >= gait.runningSpeed
        ? gait.maxConcurrentStepsRunning
        : gait.maxConcurrentSteps;
    let supportingFeet = plantedCount - this.activeSteps;

    for (
      let candidate = 0;
      candidate < this.candidateIndices.length;
      candidate += 1
    ) {
      if (this.activeSteps >= maximumConcurrent) break;
      if (supportingFeet - 1 < gait.minPlantedFeet) break;

      const appendage = appendages[this.candidateIndices[candidate]];
      const group = Math.abs(appendage.spec.gaitGroup) % MAX_GAIT_GROUPS;
      const emergency = appendage.stepDemand >= gait.emergencyStretchRatio;
      if (!emergency && this.groupCounts[group] >= gait.maxConcurrentPerGroup) {
        appendage.triggerReason = "waiting for gait group";
        continue;
      }

      this.startStep(appendage, normalizedSpeed, signals);
      this.groupCounts[group] += 1;
      this.activeSteps += 1;
      supportingFeet -= 1;
    }
  }

  private advanceTrailingAppendage(
    dt: number,
    appendage: AppendageRuntime,
  ): void {
    const response = 1 - Math.exp(-Math.max(0.1, appendage.spec.drag * 9) * dt);
    appendage.foot.x +=
      (appendage.idealFootTarget.x - appendage.foot.x) * response;
    appendage.foot.y +=
      (appendage.idealFootTarget.y - appendage.foot.y) * response;
    copy(appendage.lockedFootPosition, appendage.foot);
    appendage.triggerReason = "secondary motion";
  }

  private advanceStep(dt: number, appendage: AppendageRuntime): void {
    appendage.stepProgress = Math.min(
      1,
      appendage.stepProgress + dt / Math.max(0.001, appendage.stepDuration),
    );
    const easedProgress = smoothstep(appendage.stepProgress);
    const lift =
      Math.sin(appendage.stepProgress * Math.PI) * appendage.stepHeight;

    appendage.foot.x =
      appendage.stepStart.x +
      (appendage.stepDestination.x - appendage.stepStart.x) * easedProgress;
    appendage.foot.y =
      appendage.stepStart.y +
      (appendage.stepDestination.y - appendage.stepStart.y) * easedProgress -
      lift;

    if (appendage.stepProgress < 1) return;

    appendage.stepping = false;
    // Cooldown begins on contact, so this leg cannot land and immediately
    // request another step later in the same fixed simulation tick.
    appendage.timeSinceStep = 0;
    copy(appendage.lockedFootPosition, appendage.stepDestination);
    copy(appendage.foot, appendage.stepDestination);
    appendage.triggerReason = "landed";
    this.callbacks.onLand?.(appendage.spec.id, {
      x: appendage.foot.x,
      y: appendage.foot.y,
    });
  }

  private startStep(
    appendage: AppendageRuntime,
    normalizedSpeed: number,
    signals: GaitSignals,
  ): void {
    appendage.stepping = true;
    appendage.stepProgress = 0;
    appendage.timeSinceStep = 0;
    appendage.stepCount += 1;
    copy(appendage.stepStart, appendage.foot);
    copy(appendage.stepDestination, appendage.idealFootTarget);

    const randomBase =
      this.seed + appendage.index * 101 + appendage.stepCount * 977;
    const variationAngle = deterministicUnit(randomBase) * TAU;
    const variationAmount =
      (deterministicUnit(randomBase + 17) * 2 - 1) *
      appendage.spec.step.variation *
      signals.scale;
    appendage.stepDestination.x += Math.cos(variationAngle) * variationAmount;
    appendage.stepDestination.y += Math.sin(variationAngle) * variationAmount;

    const anchorDeltaX = appendage.stepDestination.x - appendage.anchor.x;
    const anchorDeltaY = appendage.stepDestination.y - appendage.anchor.y;
    const anchorDistance = Math.hypot(anchorDeltaX, anchorDeltaY);
    const safeReach = appendage.maxReach * 0.94;
    if (anchorDistance > safeReach) {
      const reachRatio = safeReach / anchorDistance;
      appendage.stepDestination.x =
        appendage.anchor.x + anchorDeltaX * reachRatio;
      appendage.stepDestination.y =
        appendage.anchor.y + anchorDeltaY * reachRatio;
    }

    const durationVariation = 0.94 + deterministicUnit(randomBase + 31) * 0.12;
    appendage.stepDuration =
      appendage.spec.step.duration *
      (1 - normalizedSpeed * 0.36) *
      durationVariation;
    appendage.stepHeight =
      appendage.spec.step.height *
      signals.scale *
      (1 + normalizedSpeed * 0.7) *
      (signals.reducedMotion ? 0.22 : 1);

    this.callbacks.onStep?.(appendage.spec.id, {
      x: appendage.stepDestination.x,
      y: appendage.stepDestination.y,
    });
  }
}
