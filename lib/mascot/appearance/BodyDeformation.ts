import { clamp, lerp } from "../core/NumericGuards";
import type { BodyDeformation, MascotBehavior } from "../types";

/**
 * Squash/stretch/tumble performance driven by existing behavior/velocity
 * signals — upgrade spec "SQUASH, STRETCH, AND TUMBLE". No contact/landing
 * system exists yet (that's Phase 4+, string registry territory), so
 * `avoid` (the closest existing analogue to a sudden reactive dodge) stands
 * in for "impact" and drives `impactWave`/`headSquash`; `rest`/`dormant`
 * drive a gentle curl (negative `tailStretch`); `sprint` drives stretch.
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
  /** Dev/appearance-lab manual override — replaces individual fields outright for still-pose review; unset keys keep the computed value. */
  manualOverride?: Partial<BodyDeformation> | null;
}

/** Speed (px/s) treated as "fast" for stretch scaling — MOTION_RECIPES sprint targets move well above this. */
const SPEED_REFERENCE = 220;

function behaviorTarget(input: BodyDeformationInput): BodyDeformation {
  const speedFactor = clamp(input.speed / SPEED_REFERENCE, 0, 1.4);

  switch (input.behavior) {
    case "sprint":
      return {
        longitudinalScale: 1 + speedFactor * 0.18,
        lateralScale: 1 - speedFactor * 0.08,
        headSquash: 0,
        tailStretch: speedFactor * 0.6,
        finSpread: speedFactor * 0.3,
        impactWave: 0,
        tumbleRotation: 0,
      };
    case "avoid":
      return {
        longitudinalScale: 0.9,
        lateralScale: 1.12,
        headSquash: 0.55,
        tailStretch: 0.1,
        finSpread: 0.4,
        impactWave: 1,
        tumbleRotation: 0,
      };
    case "scatter":
      return {
        longitudinalScale: 0.85,
        lateralScale: 0.85,
        headSquash: 0.3,
        tailStretch: 0,
        finSpread: 0.6,
        impactWave: 0.6,
        // Bounded by turnRate, clamped hard — never a constant spin (spec rule).
        tumbleRotation: clamp(input.turnRate * 0.15, -0.6, 0.6),
      };
    case "reform":
      return {
        longitudinalScale: 1.05,
        lateralScale: 1.05,
        headSquash: 0,
        tailStretch: 0.15,
        finSpread: 0.1,
        impactWave: 0,
        tumbleRotation: 0,
      };
    case "rest":
    case "dormant":
      return {
        longitudinalScale: 0.96,
        lateralScale: 1.02,
        headSquash: 0.08,
        // Negative = tail curls inward rather than trailing straight.
        tailStretch: -0.35,
        finSpread: -0.2,
        impactWave: 0,
        tumbleRotation: 0,
      };
    default:
      return neutralBodyDeformation();
  }
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
