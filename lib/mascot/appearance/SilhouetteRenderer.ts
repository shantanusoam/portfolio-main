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
import { pathFromContour } from "./ContourPath";
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
  /** Optional soft fabric overlay (velvet microtexture) — clipped to silhouette at low opacity. */
  velvetMicrotexture?: CanvasImageSource | null;
}

const EYE_SPACING_FRACTION = 0.28;
const EYE_FORWARD_FRACTION = 0.02;
const MOUTH_FORWARD_FRACTION = 0.32;
const CHEEK_OUTWARD_FRACTION = 0.1;
/** Half-width (px) at a fin's root — soft ear lobes at the shoulders. */
const FIN_BASE_WIDTH = 6.5;
/** Soft velvet overlay opacity — V2 §9 / visual-rescue texture hierarchy (8–15%). */
const VELVET_OVERLAY_OPACITY = 0.12;

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
      if (input.velvetMicrotexture) {
        drawVelvetOverlay(ctx, contour, input.velvetMicrotexture);
      }
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
  const shoulderIndex = Math.floor((contour.left.length - 1) * 0.28);
  const from = contour.left[shoulderIndex] ?? contour.left[0];
  const to = contour.right[shoulderIndex] ?? contour.right[0];
  const gradient = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
  gradient.addColorStop(0, palette.highlight);
  gradient.addColorStop(0.55, palette.base);
  gradient.addColorStop(1, palette.shadow);

  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0, 1);
  ctx.fillStyle = gradient;
  ctx.fill(path);
  ctx.restore();
}

/** Subtle tileable fabric grain clipped to the body — never world-space pasted. */
function drawVelvetOverlay(
  ctx: CanvasRenderingContext2D,
  contour: BodyContourPoints,
  texture: CanvasImageSource,
): void {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const rail of [contour.left, contour.right]) {
    for (const p of rail) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return;

  ctx.save();
  ctx.globalAlpha = VELVET_OVERLAY_OPACITY;
  ctx.globalCompositeOperation = "soft-light";
  // Reason: cover the AABB with a few tiled draws — microtexture is seamless.
  const tile = 128;
  for (let x = minX - tile; x < maxX + tile; x += tile) {
    for (let y = minY - tile; y < maxY + tile; y += tile) {
      ctx.drawImage(texture, x, y, tile, tile);
    }
  }
  ctx.restore();
}

/**
 * Draws one side fin/ear as a soft rounded lobe from its Verlet chain —
 * rooted at the shoulders (not the nose), so it never reads as fangs.
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

  const tangentX = tip.x - root.x;
  const tangentY = tip.y - root.y;
  const tangentLength = Math.max(0.0001, Math.hypot(tangentX, tangentY));
  // Cap fin length so secondary motion can't stretch ears into spikes.
  const maxLen = baseWidth * 3.2;
  const lenScale = Math.min(1, maxLen / tangentLength);
  const tipX = root.x + tangentX * lenScale;
  const tipY = root.y + tangentY * lenScale;
  const midX = root.x + (mid.x - root.x) * lenScale;
  const midY = root.y + (mid.y - root.y) * lenScale;

  const normalX = (-tangentY / tangentLength) * mirror;
  const normalY = (tangentX / tangentLength) * mirror;

  const rootOuterX = root.x + normalX * baseWidth;
  const rootOuterY = root.y + normalY * baseWidth;
  const rootInnerX = root.x - normalX * baseWidth * 0.45;
  const rootInnerY = root.y - normalY * baseWidth * 0.45;
  const midOuterX = midX + normalX * baseWidth * 0.7;
  const midOuterY = midY + normalY * baseWidth * 0.7;
  const midInnerX = midX - normalX * baseWidth * 0.2;
  const midInnerY = midY - normalY * baseWidth * 0.2;
  const tipPadX = tipX - (tangentX / tangentLength) * baseWidth * 0.35;
  const tipPadY = tipY - (tangentY / tangentLength) * baseWidth * 0.35;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(rootInnerX, rootInnerY);
  ctx.quadraticCurveTo(midInnerX, midInnerY, tipPadX, tipPadY);
  ctx.quadraticCurveTo(midOuterX, midOuterY, rootOuterX, rootOuterY);
  ctx.closePath();
  ctx.fillStyle = palette.base;
  ctx.fill();
  ctx.strokeStyle = palette.rim;
  ctx.globalAlpha = 0.4;
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
  // Apply velocity-driven head lean in local face space (V2 FacialPose.headLean).
  const lean = clamp(expression.headLean, -1, 1) * 0.22;
  const leaned: FaceFrame = {
    ...frame,
    rotation: frame.rotation + lean,
    normalX: frame.normalX * Math.cos(lean) - frame.forwardX * Math.sin(lean),
    normalY: frame.normalY * Math.cos(lean) - frame.forwardY * Math.sin(lean),
  };

  const eyes = computeEyeAnchors(
    leaned,
    EYE_SPACING_FRACTION,
    EYE_FORWARD_FRACTION,
  );
  const mouth = computeMouthAnchor(leaned, MOUTH_FORWARD_FRACTION);
  // Larger eyes so the face reads in still frames (visual rescue gate).
  const eyeRadius = Math.max(2.4, leaned.width * 0.22);

  // Embedded resonance core — small torso/head glow, never a floating white
  // orb that replaces the face (V2 §7 / §3 Phase 3).
  drawResonanceCore(
    ctx,
    leaned,
    expression,
    palette,
    glowMultiplier,
    eyeRadius,
  );

  if (expression.cheekIntensity > 0.02) {
    drawCheeks(
      ctx,
      leaned,
      eyes,
      eyeRadius,
      expression.cheekIntensity,
      palette,
    );
  }

  drawEye(ctx, eyes.left, eyeRadius, expression, palette, leaned, 1);
  drawEye(ctx, eyes.right, eyeRadius, expression, palette, leaned, -1);

  drawMouth(ctx, mouth, leaned, expression, palette);
}

function drawResonanceCore(
  ctx: CanvasRenderingContext2D,
  frame: FaceFrame,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
  glowMultiplier: number,
  eyeRadius: number,
): void {
  if (expression.glowIntensity <= 0.02) return;

  // Sit the core slightly behind the eye line (toward torso along -forward).
  const coreX = frame.centerX - frame.forwardX * frame.height * 0.22;
  const coreY = frame.centerY - frame.forwardY * frame.height * 0.22;
  const radius = eyeRadius * 0.75 * expression.coreScale;

  ctx.save();
  ctx.globalAlpha = clamp(
    expression.glowIntensity * glowMultiplier * 0.18,
    0,
    0.35,
  );
  ctx.fillStyle = palette.highlight;
  ctx.beginPath();
  ctx.arc(coreX, coreY, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
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
  const scaleX = clamp(expression.eyeScaleX ?? 1, 0.35, 1.6);

  ctx.save();
  ctx.translate(anchor.x, anchor.y);
  ctx.rotate(frame.rotation - Math.PI / 2);
  ctx.fillStyle = palette.face;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * scaleX, radius * openness, 0, 0, Math.PI * 2);
  ctx.fill();

  if (openness > 0.15) {
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.arc(
      expression.pupilOffsetX * radius * scaleX,
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
  const size = Math.max(1.6, frame.width * 0.14);
  const mouthOpen = clamp(expression.mouthOpen ?? 0, 0, 1);
  const mouthCurve = clamp(expression.mouthCurve ?? 0, -1, 1);

  ctx.save();
  ctx.translate(mouth.x, mouth.y);
  ctx.rotate(frame.rotation - Math.PI / 2);
  ctx.strokeStyle = palette.shadow;
  ctx.fillStyle = palette.shadow;
  ctx.lineWidth = Math.max(0.8, size * 0.22);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.7;

  // Keep a soft smile/curve by default — wide open ellipses read as fangs/teeth
  // at small sizes. Only gently open for strong mouthOpen.
  const curve =
    mouthCurve !== 0
      ? mouthCurve
      : expression.expression === "happy"
        ? 0.7
        : expression.browTilt >= 0
          ? 0.25
          : -0.2;

  if (mouthOpen > 0.55) {
    const rx = size * (0.4 + mouthOpen * 0.2);
    const ry = size * (0.12 + mouthOpen * 0.22);
    ctx.beginPath();
    ctx.ellipse(0, size * 0.08, rx, ry, 0, 0, Math.PI * 2);
    ctx.globalAlpha = 0.45;
    ctx.fill();
    ctx.globalAlpha = 0.75;
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-size * 0.55, 0);
    ctx.quadraticCurveTo(0, curve * size * 0.5, size * 0.55, 0);
    ctx.stroke();
  }

  ctx.restore();
}
