import { EPSILON, clamp, lerp, normalize } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type { SpineRegionBounds } from "../character/CreatureRecipe";
import type { BodyDeformation, Point } from "../types";

/**
 * A stable local coordinate frame for the head, derived from the head-region
 * ribs and the current heading — never world-space offsets. All face
 * features (eyes, cheeks, mouth) are positioned relative to this frame, so
 * they stay attached during turns, stretch, and tumble. See upgrade spec
 * "Stable face frame".
 */
export interface FaceFrame {
  centerX: number;
  centerY: number;
  forwardX: number;
  forwardY: number;
  normalX: number;
  normalY: number;
  width: number;
  height: number;
  rotation: number;
}

export interface FaceRigInput {
  ribs: readonly RibPoint[];
  headRegion: SpineRegionBounds;
  headingX: number;
  headingY: number;
  deformation?: BodyDeformation;
  /** Baseline head height/width ratio before deformation. */
  aspectRatio?: number;
}

const DEFAULT_ASPECT_RATIO = 0.9;
/** Bias toward nose tip — keep low so the face sits in the bulbous head mass, not on the pin tip. */
const NOSE_BIAS = 0.08;

function degenerateFrame(input: FaceRigInput): FaceFrame {
  const forward = normalize(input.headingX, input.headingY);
  return {
    centerX: 0,
    centerY: 0,
    forwardX: forward.x,
    forwardY: forward.y,
    normalX: -forward.y,
    normalY: forward.x,
    width: 1,
    height: 1,
    rotation: Math.atan2(forward.y, forward.x),
  };
}

/** Derives the stable head `FaceFrame` from the current rib set. */
export function computeFaceFrame(input: FaceRigInput): FaceFrame {
  const { ribs, headRegion } = input;
  if (ribs.length === 0) return degenerateFrame(input);

  const lo = clamp(
    Math.min(headRegion.start, headRegion.end),
    0,
    ribs.length - 1,
  );
  const hi = clamp(
    Math.max(headRegion.start, headRegion.end),
    0,
    ribs.length - 1,
  );

  let sumX = 0;
  let sumY = 0;
  let maxWidth = 0;
  let normalX = 0;
  let normalY = 0;
  let count = 0;

  for (let i = lo; i <= hi; i += 1) {
    const rib = ribs[i];
    if (!rib) continue;
    sumX += rib.center.x;
    sumY += rib.center.y;
    maxWidth = Math.max(maxWidth, rib.width);
    normalX += rib.normalX;
    normalY += rib.normalY;
    count += 1;
  }

  if (count === 0) return degenerateFrame(input);

  const centroidX = sumX / count;
  const centroidY = sumY / count;
  const frontRib = ribs[lo];
  const anchorX = lerp(centroidX, frontRib.center.x, NOSE_BIAS);
  const anchorY = lerp(centroidY, frontRib.center.y, NOSE_BIAS);

  const normalLength = Math.max(EPSILON, Math.hypot(normalX, normalY));
  normalX /= normalLength;
  normalY /= normalLength;

  const forward = normalize(input.headingX, input.headingY);

  const deformation = input.deformation;
  const headSquash = deformation ? deformation.headSquash : 0;
  const baseWidth = Math.max(1, maxWidth);
  const width = baseWidth * (1 + headSquash * 0.6);
  const aspect = input.aspectRatio ?? DEFAULT_ASPECT_RATIO;
  const height = Math.max(1, baseWidth * aspect * (1 - headSquash * 0.35));

  return {
    centerX: anchorX,
    centerY: anchorY,
    forwardX: forward.x,
    forwardY: forward.y,
    normalX,
    normalY,
    width,
    height,
    rotation: Math.atan2(forward.y, forward.x),
  };
}

export interface FaceEyeAnchors {
  left: Point;
  right: Point;
}

/** Eye positions derived purely from the frame's normal/forward axes. */
export function computeEyeAnchors(
  frame: FaceFrame,
  eyeSpacingFraction: number,
  forwardOffsetFraction: number,
): FaceEyeAnchors {
  const spacing = frame.width * eyeSpacingFraction;
  const forwardOffset = frame.height * forwardOffsetFraction;
  return {
    left: {
      x:
        frame.centerX +
        frame.normalX * spacing +
        frame.forwardX * forwardOffset,
      y:
        frame.centerY +
        frame.normalY * spacing +
        frame.forwardY * forwardOffset,
    },
    right: {
      x:
        frame.centerX -
        frame.normalX * spacing +
        frame.forwardX * forwardOffset,
      y:
        frame.centerY -
        frame.normalY * spacing +
        frame.forwardY * forwardOffset,
    },
  };
}

/** Mouth/core anchor, forward of the eyes along the frame's own forward axis. */
export function computeMouthAnchor(
  frame: FaceFrame,
  forwardOffsetFraction: number,
): Point {
  return {
    x: frame.centerX + frame.forwardX * frame.height * forwardOffsetFraction,
    y: frame.centerY + frame.forwardY * frame.height * forwardOffsetFraction,
  };
}

/** Cheek anchors, just outward and slightly behind the eyes along the frame axes. */
export function computeCheekAnchors(
  frame: FaceFrame,
  eyeAnchors: FaceEyeAnchors,
  outwardFraction: number,
): FaceEyeAnchors {
  const outward = frame.width * outwardFraction;
  return {
    left: {
      x: eyeAnchors.left.x + frame.normalX * outward,
      y: eyeAnchors.left.y + frame.normalY * outward,
    },
    right: {
      x: eyeAnchors.right.x - frame.normalX * outward,
      y: eyeAnchors.right.y - frame.normalY * outward,
    },
  };
}
