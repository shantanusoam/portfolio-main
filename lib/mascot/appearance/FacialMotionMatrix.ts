import { clamp } from "../core/NumericGuards";
import type { FacialMotionInput, FacialPose } from "../types";

/**
 * Velocity-driven facial acting matrix (V2 §5–6). Pure and allocation-light:
 * maps `FacialMotionInput` → `FacialPose` with hard clamps. Temporal decay of
 * collision/string impulses lives in `MascotRuntime`; this module is
 * stateless so tests can assert each rule in isolation.
 */

const SPEED_REF = 220;
const FALL_REF = 180;
const ACCEL_REF = 900;
const HORIZONTAL_REF = 160;

export function neutralFacialPose(): FacialPose {
  return {
    pupilX: 0,
    pupilY: 0,
    eyeScaleX: 1,
    eyeScaleY: 1,
    eyelid: 0,
    mouthOpen: 0,
    mouthCurve: 0,
    headLean: 0,
    cheekIntensity: 0,
  };
}

export function sanitizeFacialMotionInput(
  input: FacialMotionInput,
): FacialMotionInput {
  const finite = (value: number, fallback = 0): number =>
    Number.isFinite(value) ? value : fallback;

  return {
    velocityX: finite(input.velocityX),
    velocityY: finite(input.velocityY),
    accelerationX: finite(input.accelerationX),
    accelerationY: finite(input.accelerationY),
    speed: Math.max(0, finite(input.speed)),
    fallingSpeed: Math.max(0, finite(input.fallingSpeed)),
    dragTension: clamp(finite(input.dragTension), 0, 1),
    collisionImpulse: clamp(finite(input.collisionImpulse), 0, 1),
    stringTension: clamp(finite(input.stringTension), 0, 1),
    targetDirectionX: clamp(finite(input.targetDirectionX), -1, 1),
    targetDirectionY: clamp(finite(input.targetDirectionY), -1, 1),
  };
}

export function clampFacialPose(pose: FacialPose): FacialPose {
  return {
    pupilX: clamp(pose.pupilX, -1, 1),
    pupilY: clamp(pose.pupilY, -1, 1),
    eyeScaleX: clamp(pose.eyeScaleX, 0.35, 1.6),
    eyeScaleY: clamp(pose.eyeScaleY, 0.25, 1.6),
    eyelid: clamp(pose.eyelid, 0, 1),
    mouthOpen: clamp(pose.mouthOpen, 0, 1),
    mouthCurve: clamp(pose.mouthCurve, -1, 1),
    headLean: clamp(pose.headLean, -1, 1),
    cheekIntensity: clamp(pose.cheekIntensity, 0, 1),
  };
}

/**
 * Art-direction rules from V2 §6, layered and clamped. Later rules may
 * override earlier ones when their drivers are stronger.
 */
export function computeFacialPose(rawInput: FacialMotionInput): FacialPose {
  const input = sanitizeFacialMotionInput(rawInput);
  const pose = neutralFacialPose();

  const speedFactor = clamp(input.speed / SPEED_REF, 0, 1.4);
  const fallFactor = clamp(input.fallingSpeed / FALL_REF, 0, 1.2);
  const horizFactor = clamp(Math.abs(input.velocityX) / HORIZONTAL_REF, 0, 1.2);
  const horizSign =
    Math.abs(input.velocityX) > 8 ? Math.sign(input.velocityX) : 0;
  const accelMag = Math.hypot(input.accelerationX, input.accelerationY);
  const accelFactor = clamp(accelMag / ACCEL_REF, 0, 1);

  // --- Rest (low motion, no drag/impact) --------------------------------
  const restFactor =
    (1 - clamp(speedFactor, 0, 1)) *
    (1 - input.dragTension) *
    (1 - input.collisionImpulse) *
    (1 - clamp(fallFactor, 0, 1));
  if (restFactor > 0.2) {
    pose.eyelid += restFactor * 0.35;
    pose.mouthCurve += restFactor * 0.05;
    pose.pupilX += input.targetDirectionX * restFactor * 0.12;
    pose.pupilY += input.targetDirectionY * restFactor * 0.1;
  }

  // --- Fast horizontal drag --------------------------------------------
  // eyes look ahead, eyelids narrow, head leans into motion, mouth tightens
  if (horizFactor > 0.25 && fallFactor < 0.55) {
    const w = horizFactor * (0.55 + input.dragTension * 0.45);
    pose.pupilX += horizSign * w * 0.55;
    pose.pupilY += clamp(input.velocityY / SPEED_REF, -0.35, 0.35) * w * 0.35;
    pose.eyelid += w * 0.28;
    pose.eyeScaleY *= 1 - w * 0.18;
    pose.eyeScaleX *= 1 + w * 0.08;
    pose.headLean += horizSign * w * 0.55;
    pose.mouthCurve -= w * 0.25;
    pose.mouthOpen *= 1 - w * 0.4;
  }

  // --- Fast falling ----------------------------------------------------
  // eyes widen, pupils look down, mouth opens slightly
  if (fallFactor > 0.2) {
    const w = fallFactor;
    pose.eyeScaleX *= 1 + w * 0.2;
    pose.eyeScaleY *= 1 + w * 0.28;
    pose.eyelid = Math.max(0, pose.eyelid - w * 0.45);
    pose.pupilY += w * 0.55;
    pose.mouthOpen += w * 0.35;
    pose.mouthCurve -= w * 0.1;
    pose.headLean *= 1 - w * 0.35;
  }

  // --- Strong collision / pluck impact ---------------------------------
  // Driven by collisionImpulse (string contacts also raise it in runtime).
  // Pure high stringTension with low collision is a successful chord (below),
  // not an impact compress.
  if (input.collisionImpulse > 0.65) {
    const w = input.collisionImpulse;
    pose.eyeScaleY *= 1 - w * 0.45;
    pose.eyeScaleX *= 1 + w * 0.15;
    pose.eyelid += w * 0.2;
    pose.mouthOpen += w * 0.55;
    pose.mouthCurve -= w * 0.15;
    pose.cheekIntensity += w * 0.25;
  } else if (input.collisionImpulse > 0.25) {
    const w = input.collisionImpulse;
    pose.eyeScaleY *= 1 + w * 0.35;
    pose.eyeScaleX *= 1 + w * 0.2;
    pose.eyelid = Math.max(0, pose.eyelid - w * 0.3);
    pose.mouthOpen += w * 0.2;
  }

  // --- High drag tension -----------------------------------------------
  // eyes squint, stretch toward pointer, head stays relatively anchored
  if (input.dragTension > 0.35) {
    const w = input.dragTension;
    pose.eyelid += w * 0.4;
    pose.eyeScaleY *= 1 - w * 0.25;
    pose.eyeScaleX *= 1 + w * 0.12;
    pose.pupilX += input.targetDirectionX * w * 0.45;
    pose.pupilY += input.targetDirectionY * w * 0.3;
    pose.headLean += input.targetDirectionX * w * 0.2;
    pose.mouthCurve -= w * 0.35;
    pose.mouthOpen = Math.max(0, pose.mouthOpen - w * 0.2);
  }

  // --- Successful musical chord (high string tension, low collision) ---
  // eyes brighten/widen gently, small smile, cheek flush
  if (input.stringTension > 0.4 && input.collisionImpulse < 0.35) {
    const w = input.stringTension * (1 - input.collisionImpulse);
    pose.eyeScaleX *= 1 + w * 0.18;
    pose.eyeScaleY *= 1 + w * 0.22;
    pose.eyelid = Math.max(0, pose.eyelid - w * 0.35);
    pose.mouthCurve += w * 0.65;
    pose.mouthOpen += w * 0.12;
    pose.cheekIntensity += w * 0.55;
  }

  // Acceleration accent — brief startled widen on sharp direction changes.
  if (accelFactor > 0.45 && input.collisionImpulse < 0.2) {
    const w = (accelFactor - 0.45) / 0.55;
    pose.eyeScaleY *= 1 + w * 0.12;
    pose.mouthOpen += w * 0.08;
  }

  return clampFacialPose(pose);
}
