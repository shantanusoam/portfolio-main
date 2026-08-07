import { clamp } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type {
  AppearanceTuningOverrides,
  BodyDeformation,
  MascotQuality,
  Point,
} from "../types";
import type { AppearanceLayerToggles } from "./AppearanceConfig";
import { buildBodyContourPoints, type BodyContourPoints } from "./BodyContour";
import type { ExpressionVisualState } from "./ExpressionController";
import {
  computeCheekAnchors,
  computeEyeAnchors,
  computeMouthAnchor,
  type FaceEyeAnchors,
  type FaceFrame,
} from "./FaceRig";
import type { AppearancePalette } from "./AppearancePresets";
import type { GeneratedDecalAtlas } from "./GeneratedDecalAtlas";
import type { PatternMark, PatternRecipeName } from "./PatternRecipes";
import { drawProceduralPrint } from "./ProceduralPrint";
import { DEFAULT_RIM_CONFIG, drawRim } from "./RimRenderer";

/**
 * Orchestrates the full layered appearance pipeline for one frame — upgrade
 * spec "APPEARANCE RENDER PIPELINE": base silhouette -> internal gradient ->
 * clipped procedural print -> rim -> face -> highlights. Structural dots and
 * temporary particles stay in `MascotEngine.render()` (they reuse the
 * existing `CanvasDotRenderer`/`ParticlePool` batching, which already lives
 * in `rendering/`). Called from `CanvasMascotRenderer.drawAppearance()`.
 */

export interface AppearanceRenderInput {
  ribs: readonly RibPoint[];
  contourWidths: readonly number[];
  faceFrame: FaceFrame;
  expression: ExpressionVisualState;
  deformation: BodyDeformation;
  patternMarks: readonly PatternMark[];
  palette: AppearancePalette;
  tuning: AppearanceTuningOverrides;
  layers: AppearanceLayerToggles;
  quality: MascotQuality;
  /** Root-to-tip point chains for the two expressive side fins/ears — see MASCOT_VISUAL_RESCUE spec "FIN / EAR DESIGN". Same Verlet nodes MascotRuntime already simulates for secondary motion; this is their first actual render. */
  fins: { left: readonly Point[]; right: readonly Point[] };
  /** Which pattern recipe produced `patternMarks` — lets the print layer pick the matching generated decal sheet, if any, once `generatedDecalAtlas` has loaded. */
  patternRecipe: PatternRecipeName;
  /** Optional — null/undefined/not-yet-loaded all safely fall back to the procedural print. */
  generatedDecalAtlas?: GeneratedDecalAtlas | null;
}

const EYE_SPACING_FRACTION = 0.34;
const EYE_FORWARD_FRACTION = 0.18;
const MOUTH_FORWARD_FRACTION = 0.55;
const CHEEK_OUTWARD_FRACTION = 0.12;
/** Half-width (px) at a fin's root — modest by design ("Use 1-2 procedural joints each"), scaled against the ~26px body maxWidth. */
const FIN_BASE_WIDTH = 3.4;

export function drawAppearance(
  ctx: CanvasRenderingContext2D,
  input: AppearanceRenderInput,
): void {
  if (input.ribs.length < 2) return;

  const contour = buildBodyContourPoints(input.ribs, input.contourWidths);

  if (input.layers.silhouette) {
    drawSilhouetteFill(ctx, contour, input.palette, input.tuning.bodyOpacity);
    drawFin(ctx, input.fins.left, FIN_BASE_WIDTH, input.palette, 1);
    drawFin(ctx, input.fins.right, FIN_BASE_WIDTH, input.palette, -1);
  }

  if (input.layers.print && input.patternMarks.length > 0) {
    const path = pathFromContour(contour);
    if (path) {
      ctx.save();
      ctx.clip(path);
      drawProceduralPrint(
        ctx,
        input.patternMarks,
        input.ribs,
        input.contourWidths,
        input.palette,
        input.tuning,
        input.generatedDecalAtlas,
        input.patternRecipe,
      );
      ctx.restore();
    }
  }

  if (input.layers.rim) {
    drawRim(
      ctx,
      contour,
      input.palette,
      DEFAULT_RIM_CONFIG,
      clamp(input.tuning.rimWidth, 0, 2),
    );
  }

  if (input.layers.face) {
    drawFace(
      ctx,
      input.faceFrame,
      input.expression,
      input.palette,
      input.tuning.glowIntensity,
    );
  }
}

function pathFromContour(contour: BodyContourPoints): Path2D | null {
  if (typeof Path2D === "undefined" || contour.left.length < 2) return null;
  const path = new Path2D();
  path.moveTo(contour.left[0].x, contour.left[0].y);
  for (let i = 1; i < contour.left.length; i += 1)
    path.lineTo(contour.left[i].x, contour.left[i].y);
  for (let i = contour.right.length - 1; i >= 0; i -= 1)
    path.lineTo(contour.right[i].x, contour.right[i].y);
  path.closePath();
  return path;
}

function drawSilhouetteFill(
  ctx: CanvasRenderingContext2D,
  contour: BodyContourPoints,
  palette: AppearancePalette,
  opacity: number,
): void {
  const path = pathFromContour(contour);
  if (!path) return;

  // Internal base gradient (pipeline step 3): highlight along the dorsal
  // rail, base colour toward the ventral rail — adds dimensionality to the
  // flat fill without a per-frame blur.
  const shoulderIndex = Math.floor((contour.left.length - 1) * 0.32);
  const from = contour.left[shoulderIndex] ?? contour.left[0];
  const to = contour.right[shoulderIndex] ?? contour.right[0];
  const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
  gradient.addColorStop(0, palette.highlight);
  gradient.addColorStop(1, palette.base);

  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0, 1);
  ctx.fillStyle = gradient;
  ctx.fill(path);
  ctx.restore();
}

/**
 * Draws one side fin/ear as a tapered teardrop from its Verlet chain's root
 * to tip — the chain's existing secondary-motion physics (gravity, drag,
 * and the behavior-driven spread bias `MascotRuntime` now applies to the
 * root pin) is the only thing that ever moves it; this function only
 * renders whatever shape it's already settled into. No FABRIK, no new
 * solver — see MASCOT_VISUAL_RESCUE spec "FIN / EAR DESIGN".
 */
function drawFin(
  ctx: CanvasRenderingContext2D,
  points: readonly Point[],
  baseWidth: number,
  palette: AppearancePalette,
  mirror: 1 | -1,
): void {
  if (points.length < 2) return;
  const root = points[0];
  const mid =
    points[Math.floor(points.length / 2)] ?? points[points.length - 1];
  const tip = points[points.length - 1];

  const tangentX = mid.x - root.x;
  const tangentY = mid.y - root.y;
  const tangentLength = Math.max(0.0001, Math.hypot(tangentX, tangentY));
  const normalX = (-tangentY / tangentLength) * mirror;
  const normalY = (tangentX / tangentLength) * mirror;

  const rootOuterX = root.x + normalX * baseWidth;
  const rootOuterY = root.y + normalY * baseWidth;
  const rootInnerX = root.x - normalX * baseWidth * 0.4;
  const rootInnerY = root.y - normalY * baseWidth * 0.4;
  const midOuterX = mid.x + normalX * baseWidth * 0.5;
  const midOuterY = mid.y + normalY * baseWidth * 0.5;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rootInnerX, rootInnerY);
  ctx.quadraticCurveTo(mid.x, mid.y, tip.x, tip.y);
  ctx.quadraticCurveTo(midOuterX, midOuterY, rootOuterX, rootOuterY);
  ctx.closePath();
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.strokeStyle = palette.rim;
  ctx.globalAlpha = 0.75;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawFace(
  ctx: CanvasRenderingContext2D,
  frame: FaceFrame,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
  glowMultiplier: number,
): void {
  const eyes = computeEyeAnchors(
    frame,
    EYE_SPACING_FRACTION,
    EYE_FORWARD_FRACTION,
  );
  const mouth = computeMouthAnchor(frame, MOUTH_FORWARD_FRACTION);
  const eyeRadius = Math.max(1.4, frame.width * 0.16);

  // Luminous core, anchored to the face frame — the old lone white circle's
  // role, now the face's glow rather than the whole face (skill:
  // "drawCore becomes the eye/face anchor, not the whole face").
  if (expression.glowIntensity > 0) {
    ctx.save();
    ctx.globalAlpha = clamp(
      expression.glowIntensity * glowMultiplier * 0.4,
      0,
      1,
    );
    ctx.fillStyle = palette.highlight;
    ctx.beginPath();
    ctx.arc(
      frame.centerX,
      frame.centerY,
      eyeRadius * 2.6 * expression.coreScale,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.restore();
  }

  if (expression.cheekIntensity > 0.02) {
    drawCheeks(ctx, frame, eyes, eyeRadius, expression.cheekIntensity, palette);
  }

  drawEye(ctx, eyes.left, eyeRadius, expression, palette, frame, 1);
  drawEye(ctx, eyes.right, eyeRadius, expression, palette, frame, -1);

  drawMouth(ctx, mouth, frame, expression, palette);
}

function drawEye(
  ctx: CanvasRenderingContext2D,
  anchor: Point,
  radius: number,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
  frame: FaceFrame,
  side: 1 | -1,
): void {
  const openness = clamp(expression.eyeOpenness, 0.04, 1);

  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate(frame.rotation - Math.PI / 2);
  ctx.fillStyle = palette.face;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius, radius * openness, 0, 0, Math.PI * 2);
  ctx.fill();

  if (openness > 0.15) {
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.arc(
      expression.pupilOffsetX * radius,
      expression.pupilOffsetY * radius * openness,
      radius * 0.42 * openness,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Brow: a short arc above the eye, tilted per expression (focused/
  // determined lean in, surprised/dizzy lean out).
  if (Math.abs(expression.browTilt) > 0.02) {
    ctx.strokeStyle = palette.shadow;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(0.6, radius * 0.18);
    ctx.lineCap = "round";
    ctx.beginPath();
    const browY = -radius * 1.35;
    const tilt = expression.browTilt * side * -1;
    ctx.moveTo(-radius * 0.8, browY - tilt * radius * 0.4);
    ctx.lineTo(radius * 0.8, browY + tilt * radius * 0.4);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCheeks(
  ctx: CanvasRenderingContext2D,
  frame: FaceFrame,
  eyes: FaceEyeAnchors,
  eyeRadius: number,
  intensity: number,
  palette: AppearancePalette,
): void {
  const anchors = computeCheekAnchors(frame, eyes, CHEEK_OUTWARD_FRACTION);
  const radius = eyeRadius * 0.7;

  ctx.save();
  ctx.globalAlpha = clamp(intensity, 0, 1) * 0.5;
  ctx.fillStyle = palette.printSecondary;
  for (const anchor of [anchors.left, anchors.right]) {
    ctx.beginPath();
    ctx.arc(anchor.x, anchor.y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawMouth(
  ctx: CanvasRenderingContext2D,
  mouth: Point,
  frame: FaceFrame,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
): void {
  const size = Math.max(1, frame.width * 0.12);

  ctx.save();
  ctx.translate(mouth.x, mouth.y);
  ctx.rotate(frame.rotation - Math.PI / 2);
  ctx.strokeStyle = palette.shadow;
  ctx.lineWidth = Math.max(0.6, size * 0.28);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.75;

  if (
    expression.expression === "surprised" ||
    expression.expression === "dizzy"
  ) {
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.45, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    const curve =
      expression.browTilt >= 0 || expression.expression === "happy" ? 1 : -0.4;
    ctx.beginPath();
    ctx.moveTo(-size * 0.6, 0);
    ctx.quadraticCurveTo(0, curve * size * 0.5, size * 0.6, 0);
    ctx.stroke();
  }

  ctx.restore();
}
