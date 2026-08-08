import { clamp, lerp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import { SecondOrderDynamics } from "../motion/SecondOrderDynamics";
import type {
  FacialMotionInput,
  FacialPose,
  MascotBehavior,
  MascotExpression,
} from "../types";
import { computeFacialPose, neutralFacialPose } from "./FacialMotionMatrix";

/**
 * The 9 required expressions (upgrade spec "EXPRESSIONS"), mapped from the
 * existing 12-state `MascotBehavior`, with bounded/smoothed transitions
 * (never a per-frame snap) and deterministic, state-aware blinking.
 * V2 §5–6: also blends a velocity-driven `FacialPose` from FacialMotionMatrix
 * so eyes/mouth act on drag/fall/impact — not only behavior timers.
 */

export interface ExpressionVisualState {
  expression: MascotExpression;
  /** 0 = just left the previous expression, 1 = fully settled into the current one. */
  transitionBlend: number;
  /** 0..1, product of the expression's resting eye openness and the current blink. */
  eyeOpenness: number;
  /** Lateral eye squash/stretch from the facial matrix (1 = neutral). */
  eyeScaleX: number;
  /** Vertical eye squash/stretch from the facial matrix (1 = neutral). */
  eyeScaleY: number;
  /** -1..1, negative = soft/worried, positive = focused/determined. */
  browTilt: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
  /** 0..1 cheek highlight intensity. */
  cheekIntensity: number;
  glowIntensity: number;
  coreScale: number;
  /** 0..1 mouth aperture from FacialPose.mouthOpen. */
  mouthOpen: number;
  /** -1..1 frown↔smile from FacialPose.mouthCurve. */
  mouthCurve: number;
  /** -1..1 head lean into motion (applied to face-frame rotation). */
  headLean: number;
  /** Latest smoothed facial pose (debug / lab). */
  facialPose: FacialPose;
}

export interface ExpressionUpdateInput {
  behavior: MascotBehavior;
  headingX: number;
  headingY: number;
  interestX?: number;
  interestY?: number;
  coreX: number;
  coreY: number;
  breathingPhase: number;
  /** 0..1 — suppresses blinking on a high-impact frame (spec: "no blink during a high-impact contact frame"). */
  impactWave: number;
  /** Dev/appearance-lab manual override; null resumes automatic behavior mapping. */
  overrideExpression?: MascotExpression | null;
  /** Velocity/interaction drivers for FacialMotionMatrix (V2 §5). */
  facialMotion?: FacialMotionInput | null;
}

const TRANSITION_SECONDS = 0.35;
const MAX_PUPIL_OFFSET = 0.4;
const GAZE_DYNAMICS_CONFIG = { frequency: 3, damping: 0.9, response: 0 };
const IMPACT_SUPPRESS_BLINK_THRESHOLD = 0.6;
const BLINK_CLOSE_SECONDS = 0.06;
const BLINK_OPEN_SECONDS = 0.12;
const BLINK_INTERVAL_MIN = 2.5;
const BLINK_INTERVAL_MAX = 6;
const INITIAL_BLINK_INTERVAL_MIN = 1.5;
const INITIAL_BLINK_INTERVAL_MAX = 4;

const EXPRESSION_EYE_OPENNESS: Record<MascotExpression, number> = {
  neutral: 0.82,
  curious: 0.95,
  happy: 0.75,
  focused: 0.7,
  surprised: 1,
  squint: 0.35,
  sleepy: 0.25,
  dizzy: 0.6,
  determined: 0.55,
};

const EXPRESSION_BROW_TILT: Record<MascotExpression, number> = {
  neutral: 0,
  curious: 0.15,
  happy: 0.1,
  focused: 0.4,
  surprised: -0.2,
  squint: 0.25,
  sleepy: -0.1,
  dizzy: -0.3,
  determined: 0.6,
};

const EXPRESSION_CHEEK: Record<MascotExpression, number> = {
  neutral: 0,
  curious: 0.1,
  happy: 0.8,
  focused: 0,
  surprised: 0.15,
  squint: 0.2,
  sleepy: 0,
  dizzy: 0.1,
  determined: 0.1,
};

const EXPRESSION_GLOW: Record<MascotExpression, number> = {
  neutral: 0.35,
  curious: 0.55,
  happy: 0.7,
  focused: 0.65,
  surprised: 0.75,
  squint: 0.6,
  sleepy: 0.12,
  dizzy: 0.5,
  determined: 0.7,
};

/**
 * Behavior -> expression mapping. Only a few are dictated verbatim by the
 * spec (dormant->sleepy, wake->surprised, follow->curious, sprint->squint,
 * rest->sleepy); the remaining 12-state behaviors get a reasonable mapping
 * per the spec's own allowance ("map... others reasonable").
 */
export function mapBehaviorToExpression(
  behavior: MascotBehavior,
): MascotExpression {
  switch (behavior) {
    case "dormant":
    case "reducedMotion":
    case "rest":
      return "sleepy";
    case "wake":
      return "surprised";
    case "follow":
    case "wander":
    case "orbit":
      return "curious";
    case "inspect":
      return "focused";
    case "sprint":
      return "squint";
    case "avoid":
      return "determined";
    case "scatter":
      return "dizzy";
    case "reform":
      return "happy";
    default:
      return "neutral";
  }
}

type BlinkPhase = "open" | "closing" | "closed" | "opening";

const FACIAL_BLEND_RATE = 10;

export class ExpressionController {
  private current: MascotExpression = "neutral";
  private previous: MascotExpression = "neutral";
  private transitionT = 1;
  private readonly rng: SeededRandom;
  private readonly gazeX: SecondOrderDynamics;
  private readonly gazeY: SecondOrderDynamics;
  private blinkTimer: number;
  private blinkPhase: BlinkPhase = "open";
  private blinkProgress = 0;
  private smoothedFacial: FacialPose = neutralFacialPose();

  constructor(seed: number) {
    this.rng = new SeededRandom(seed);
    this.gazeX = new SecondOrderDynamics(GAZE_DYNAMICS_CONFIG, 0);
    this.gazeY = new SecondOrderDynamics(GAZE_DYNAMICS_CONFIG, 0);
    this.blinkTimer = this.rng.range(
      INITIAL_BLINK_INTERVAL_MIN,
      INITIAL_BLINK_INTERVAL_MAX,
    );
  }

  update(dt: number, input: ExpressionUpdateInput): ExpressionVisualState {
    const target =
      input.overrideExpression ?? mapBehaviorToExpression(input.behavior);
    if (target !== this.current) {
      this.previous = this.current;
      this.current = target;
      this.transitionT = 0;
    }
    this.transitionT = clamp(this.transitionT + dt / TRANSITION_SECONDS, 0, 1);

    const stateEyeOpenness = lerp(
      EXPRESSION_EYE_OPENNESS[this.previous],
      EXPRESSION_EYE_OPENNESS[this.current],
      this.transitionT,
    );
    const browTilt = lerp(
      EXPRESSION_BROW_TILT[this.previous],
      EXPRESSION_BROW_TILT[this.current],
      this.transitionT,
    );
    const expressionCheek = lerp(
      EXPRESSION_CHEEK[this.previous],
      EXPRESSION_CHEEK[this.current],
      this.transitionT,
    );
    const glowIntensity = lerp(
      EXPRESSION_GLOW[this.previous],
      EXPRESSION_GLOW[this.current],
      this.transitionT,
    );

    this.updateBlink(dt, input.impactWave);

    const facialTarget = input.facialMotion
      ? computeFacialPose(input.facialMotion)
      : neutralFacialPose();
    const facialRate = clamp(dt * FACIAL_BLEND_RATE, 0, 1);
    this.smoothedFacial = blendFacialPose(
      this.smoothedFacial,
      facialTarget,
      facialRate,
    );
    const facial = this.smoothedFacial;

    let lookX = input.headingX;
    let lookY = input.headingY;
    if (input.interestX !== undefined && input.interestY !== undefined) {
      const dx = input.interestX - input.coreX;
      const dy = input.interestY - input.coreY;
      const len = Math.max(1e-6, Math.hypot(dx, dy));
      lookX = dx / len;
      lookY = dy / len;
    }
    // Gaze from interest/heading, then pull toward facial-matrix pupil targets.
    const gazeTargetX = clamp(
      lookX * MAX_PUPIL_OFFSET + facial.pupilX * 0.55,
      -1,
      1,
    );
    const gazeTargetY = clamp(
      lookY * MAX_PUPIL_OFFSET + facial.pupilY * 0.55,
      -1,
      1,
    );
    const pupilOffsetX = this.gazeX.update(dt, gazeTargetX);
    const pupilOffsetY = this.gazeY.update(dt, gazeTargetY);

    const coreScale =
      (1 + Math.sin(input.breathingPhase) * 0.04) *
      (1 + facial.cheekIntensity * 0.04 + facial.mouthOpen * 0.03);

    const eyelidClose = facial.eyelid * 0.65;
    const eyeOpenness = clamp(
      stateEyeOpenness *
        (1 - this.blinkProgress) *
        (1 - eyelidClose) *
        facial.eyeScaleY,
      0,
      1,
    );

    // Happy expression still contributes a smile bias when the matrix is calm.
    const expressionMouthBias =
      this.current === "happy" ? 0.45 : this.current === "surprised" ? 0.2 : 0;

    return {
      expression: this.current,
      transitionBlend: this.transitionT,
      eyeOpenness,
      eyeScaleX: facial.eyeScaleX,
      eyeScaleY: facial.eyeScaleY,
      browTilt,
      pupilOffsetX,
      pupilOffsetY,
      cheekIntensity: clamp(
        Math.max(expressionCheek, facial.cheekIntensity),
        0,
        1,
      ),
      glowIntensity: clamp(
        glowIntensity + facial.cheekIntensity * 0.15 + facial.mouthOpen * 0.1,
        0,
        1,
      ),
      coreScale,
      mouthOpen: clamp(facial.mouthOpen + expressionMouthBias * 0.15, 0, 1),
      mouthCurve: clamp(facial.mouthCurve + expressionMouthBias, -1, 1),
      headLean: facial.headLean,
      facialPose: facial,
    };
  }

  private updateBlink(dt: number, impactWave: number): void {
    if (impactWave > IMPACT_SUPPRESS_BLINK_THRESHOLD) {
      this.blinkPhase = "open";
      this.blinkProgress = 0;
      return;
    }

    const closeSpeed = 1 / BLINK_CLOSE_SECONDS;
    const openSpeed = 1 / BLINK_OPEN_SECONDS;

    switch (this.blinkPhase) {
      case "open":
        this.blinkTimer -= dt;
        if (this.blinkTimer <= 0) this.blinkPhase = "closing";
        break;
      case "closing":
        this.blinkProgress = clamp(this.blinkProgress + dt * closeSpeed, 0, 1);
        if (this.blinkProgress >= 1) this.blinkPhase = "closed";
        break;
      case "closed":
        this.blinkPhase = "opening";
        break;
      case "opening":
        this.blinkProgress = clamp(this.blinkProgress - dt * openSpeed, 0, 1);
        if (this.blinkProgress <= 0) {
          this.blinkPhase = "open";
          // Bounded but never a perfectly fixed interval (spec rule).
          this.blinkTimer = this.rng.range(
            BLINK_INTERVAL_MIN,
            BLINK_INTERVAL_MAX,
          );
        }
        break;
      default:
        break;
    }
  }
}

function blendFacialPose(
  current: FacialPose,
  target: FacialPose,
  t: number,
): FacialPose {
  return {
    pupilX: lerp(current.pupilX, target.pupilX, t),
    pupilY: lerp(current.pupilY, target.pupilY, t),
    eyeScaleX: lerp(current.eyeScaleX, target.eyeScaleX, t),
    eyeScaleY: lerp(current.eyeScaleY, target.eyeScaleY, t),
    eyelid: lerp(current.eyelid, target.eyelid, t),
    mouthOpen: lerp(current.mouthOpen, target.mouthOpen, t),
    mouthCurve: lerp(current.mouthCurve, target.mouthCurve, t),
    headLean: lerp(current.headLean, target.headLean, t),
    cheekIntensity: lerp(current.cheekIntensity, target.cheekIntensity, t),
  };
}
