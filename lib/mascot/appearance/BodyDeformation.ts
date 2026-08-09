import { clamp, lerp } from "../core/NumericGuards";
import type { BodyDeformation, MascotBehavior } from "../types";

/**
 * Squash/stretch/tumble performance driven by behavior/velocity plus V2 §8
 * squash-matrix drivers (dragTension, collisionImpulse, stringTension,
 * falling). Maps CharacterDeformation semantics onto BodyDeformation:
 * scaleForward→longitudinalScale, scaleNormal→lateralScale.
 */

export function neutralBodyDeformation(): BodyDeformation {
  return {
    longitudinalScale: 1,
    lateralScale: 1,
    headSquash: 0,
    tailStretch: 0,
    finSpread: 0,
    impactWave: 0,
    tumbleRotation: 0,
  };
}

export interface BodyDeformationInput {
  behavior: MascotBehavior;
  /** Root velocity magnitude, px/s. */
  speed: number;
  /** Signed heading turn rate, rad/s. */
  turnRate: number;
  /** 0..1 scatter/reform progress, already tracked by MascotRuntime. */
  scatterProgress: number;
  dt: number;
  /** 0..1 pointer-drag stretch (V2 §8 drag tension). */
  dragTension?: number;
  /** 0..1 recent hard contact / avoid pulse. */
  collisionImpulse?: number;
  /** 0..1 recent string pluck / chord energy. */
  stringTension?: number;
  /** Downward speed (px/s), canvas Y-down. */
  fallingSpeed?: number;
  /** Dev/appearance-lab manual override — replaces individual fields outright for still-pose review; unset keys keep the computed value. */
  manualOverride?: Partial<BodyDeformation> | null;
}

/** Speed (px/s) treated as "fast" for stretch scaling — MOTION_RECIPES sprint targets move well above this. */
const SPEED_REFERENCE = 220;
const FALL_REFERENCE = 180;

function behaviorTarget(input: BodyDeformationInput): BodyDeformation {
  const speedFactor = clamp(input.speed / SPEED_REFERENCE, 0, 1.4);
  const drag = clamp(input.dragTension ?? 0, 0, 1);
  const collision = clamp(input.collisionImpulse ?? 0, 0, 1);
  const stringTension = clamp(input.stringTension ?? 0, 0, 1);
  const fallFactor = clamp((input.fallingSpeed ?? 0) / FALL_REFERENCE, 0, 1.2);

  let target: BodyDeformation;

  switch (input.behavior) {
    case "sprint":
      target = {
        longitudinalScale: 1 + speedFactor * 0.18,
        lateralScale: 1 - speedFactor * 0.08,
        headSquash: 0,
        tailStretch: speedFactor * 0.6,
        finSpread: speedFactor * 0.3,
        impactWave: 0,
        tumbleRotation: 0,
      };
      break;
    case "avoid":
      target = {
        longitudinalScale: 0.9,
        lateralScale: 1.12,
        headSquash: 0.55,
        tailStretch: 0.1,
        finSpread: 0.4,
        impactWave: 1,
        tumbleRotation: 0,
      };
      break;
    case "scatter":
      target = {
        longitudinalScale: 0.85,
        lateralScale: 0.85,
        headSquash: 0.3,
        tailStretch: 0,
        finSpread: 0.6,
        impactWave: 0.6,
        // Bounded by turnRate, clamped hard — never a constant spin (spec rule).
        tumbleRotation: clamp(input.turnRate * 0.15, -0.6, 0.6),
      };
      break;
    case "reform":
      target = {
        longitudinalScale: 1.05,
        lateralScale: 1.05,
        headSquash: 0,
        tailStretch: 0.15,
        finSpread: 0.1,
        impactWave: 0,
        tumbleRotation: 0,
      };
      break;
    case "rest":
    case "dormant":
      target = {
        longitudinalScale: 0.96,
        lateralScale: 1.02,
        headSquash: 0.08,
        // Negative = tail curls inward rather than trailing straight.
        tailStretch: -0.35,
        finSpread: -0.2,
        impactWave: 0,
        tumbleRotation: 0,
      };
      break;
    default:
      target = neutralBodyDeformation();
      break;
  }

  // V2 §8 — drag tension: scaleForward > 1, scaleNormal < 1, tailStretch up.
  if (drag > 0.05) {
    target = {
      ...target,
      longitudinalScale: target.longitudinalScale + drag * 0.22,
      lateralScale: target.lateralScale - drag * 0.12,
      tailStretch: target.tailStretch + drag * 0.45,
      finSpread: target.finSpread - drag * 0.25,
    };
  }

  // V2 §8 — collision: scaleForward down, scaleNormal up, head squash.
  if (collision > 0.05) {
    target = {
      ...target,
      longitudinalScale: target.longitudinalScale - collision * 0.18,
      lateralScale: target.lateralScale + collision * 0.16,
      headSquash: Math.max(target.headSquash, collision * 0.7),
      impactWave: Math.max(target.impactWave, collision),
      finSpread: target.finSpread + collision * 0.2,
    };
  }

  // Falling: slight longitudinal stretch + fins raise (positive finSpread).
  if (fallFactor > 0.15) {
    target = {
      ...target,
      longitudinalScale: target.longitudinalScale + fallFactor * 0.1,
      lateralScale: target.lateralScale - fallFactor * 0.04,
      tailStretch: target.tailStretch + fallFactor * 0.25,
      finSpread: target.finSpread + fallFactor * 0.35,
    };
  }

  // String energy: brief forward stretch + fin flutter after a pluck/chord.
  if (stringTension > 0.05 && collision < 0.4) {
    target = {
      ...target,
      longitudinalScale: target.longitudinalScale + stringTension * 0.06,
      finSpread: target.finSpread + Math.sin(stringTension * Math.PI) * 0.3,
      impactWave: Math.max(target.impactWave, stringTension * 0.35),
    };
  }

  return {
    longitudinalScale: clamp(target.longitudinalScale, 0.7, 1.45),
    lateralScale: clamp(target.lateralScale, 0.7, 1.4),
    headSquash: clamp(target.headSquash, 0, 1),
    tailStretch: clamp(target.tailStretch, -0.6, 1),
    finSpread: clamp(target.finSpread, -0.6, 1),
    impactWave: clamp(target.impactWave, 0, 1),
    tumbleRotation: clamp(target.tumbleRotation, -0.6, 0.6),
  };
}

function stripUndefined(
  partial: Partial<BodyDeformation>,
): Partial<BodyDeformation> {
  const result: Partial<BodyDeformation> = {};
  (Object.keys(partial) as (keyof BodyDeformation)[]).forEach((key) => {
    const value = partial[key];
    if (value !== undefined) result[key] = value;
  });
  return result;
}

/**
 * Smooths toward per-behavior deformation targets every frame (never
 * snaps) — `longitudinalScale`/`lateralScale`/`headSquash`/`tailStretch`/
 * `finSpread`/`tumbleRotation` at one rate, `impactWave` at a slower rate so
 * it reads as a decaying pulse rather than an instant step.
 */
export class BodyDeformationController {
  private state: BodyDeformation = neutralBodyDeformation();

  update(input: BodyDeformationInput): BodyDeformation {
    const target = behaviorTarget(input);
    const rate = clamp(input.dt * 5, 0, 1);
    const impactRate = clamp(input.dt * 3.5, 0, 1);

    this.state = {
      longitudinalScale: lerp(
        this.state.longitudinalScale,
        target.longitudinalScale,
        rate,
      ),
      lateralScale: lerp(this.state.lateralScale, target.lateralScale, rate),
      headSquash: lerp(this.state.headSquash, target.headSquash, rate),
      tailStretch: lerp(this.state.tailStretch, target.tailStretch, rate),
      finSpread: lerp(this.state.finSpread, target.finSpread, rate),
      impactWave: lerp(this.state.impactWave, target.impactWave, impactRate),
      tumbleRotation: lerp(
        this.state.tumbleRotation,
        target.tumbleRotation,
        rate,
      ),
    };

    if (input.manualOverride) {
      this.state = { ...this.state, ...stripUndefined(input.manualOverride) };
    }

    return this.state;
  }

  getState(): BodyDeformation {
    return this.state;
  }
}
