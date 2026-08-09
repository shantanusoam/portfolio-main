import { clamp, normalize } from "../core/NumericGuards";

/**
 * Maps behavior/motion state to the core-and-eye's visual expression:
 * glow, breathing scale, and where the "pupil" looks. The core looks at an
 * interest target when one exists, otherwise it looks along the heading.
 */

export interface ExpressionState {
  glowIntensity: number;
  coreScale: number;
  pupilOffsetX: number;
  pupilOffsetY: number;
}

export interface ExpressionInput {
  behaviorGlow: number;
  headingX: number;
  headingY: number;
  interestX?: number;
  interestY?: number;
  coreX: number;
  coreY: number;
  breathingPhase: number;
  breathingAmount?: number;
}

const MAX_PUPIL_OFFSET = 0.35;

export function computeExpression(input: ExpressionInput): ExpressionState {
  const glowIntensity = clamp(input.behaviorGlow, 0, 1);
  const breathingAmount = input.breathingAmount ?? 0.04;
  const coreScale = 1 + Math.sin(input.breathingPhase) * breathingAmount;

  let lookX = input.headingX;
  let lookY = input.headingY;

  if (input.interestX !== undefined && input.interestY !== undefined) {
    const dx = input.interestX - input.coreX;
    const dy = input.interestY - input.coreY;
    const look = normalize(dx, dy);
    lookX = look.x;
    lookY = look.y;
  }

  return {
    glowIntensity,
    coreScale,
    pupilOffsetX: clamp(lookX, -1, 1) * MAX_PUPIL_OFFSET,
    pupilOffsetY: clamp(lookY, -1, 1) * MAX_PUPIL_OFFSET,
  };
}
