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
import type { FaceEyeAnchors, FaceFrame } from "./FaceRig";
import type { AppearancePalette } from "./AppearancePresets";
import type { GeneratedDecalAtlas } from "./GeneratedDecalAtlas";
import type { PatternMark, PatternRecipeName } from "./PatternRecipes";
import { drawProceduralPrint } from "./ProceduralPrint";
import { DEFAULT_RIM_CONFIG, drawRim } from "./RimRenderer";
import { computePaddleTailFrame } from "./SignalGuppyGeometry";

type MascotTextureSource = Parameters<CanvasRenderingContext2D["drawImage"]>[0];

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
  velvetMicrotexture?: MascotTextureSource | null;
}

const EYE_SPACING_FRACTION = 0.21;
const MOUTH_FORWARD_FRACTION = 0.46;
/** Half-width (px) at a fin's root — soft ear lobes at the shoulders. */
const FIN_BASE_WIDTH = 5.2;
/** Legacy lab-only velvet overlay opacity; production uses local marks. */
const VELVET_OVERLAY_OPACITY = 0.035;

export function drawAppearance(
  ctx: CanvasRenderingContext2D,
  input: AppearanceRenderInput,
): void {
  if (input.ribs.length < 2) return;

  const contour = buildBodyContourPoints(input.ribs, input.contourWidths);

  if (input.layers.silhouette) {
    drawPaddleTail(ctx, input.ribs, input.deformation, input.palette);
    drawFin(ctx, input.fins.left, FIN_BASE_WIDTH, input.palette);
    drawFin(ctx, input.fins.right, FIN_BASE_WIDTH, input.palette);
    // The body covers each fin's inner half, producing a clean attachment
    // instead of an oval ring floating on top of the silhouette.
    drawSilhouetteFill(ctx, contour, input.palette, input.tuning.bodyOpacity);
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

/** Rounded two-lobe paddle attached behind the body's zero-width tail rib. */
function drawPaddleTail(
  ctx: CanvasRenderingContext2D,
  ribs: readonly RibPoint[],
  deformation: BodyDeformation,
  palette: AppearancePalette,
): void {
  const frame = computePaddleTailFrame(ribs, deformation);
  if (!frame) return;

  const {
    attach,
    directionX: ux,
    directionY: uy,
    normalX: nx,
    normalY: ny,
    length,
    halfWidth,
  } = frame;
  const point = (along: number, across: number): Point => ({
    x: attach.x + ux * along + nx * across,
    y: attach.y + uy * along + ny * across,
  });

  const upperShoulder = point(length * 0.48, halfWidth);
  const upperTip = point(length * 0.98, halfWidth * 0.42);
  const notch = point(length * 0.84, 0);
  const lowerTip = point(length * 0.98, -halfWidth * 0.42);
  const lowerShoulder = point(length * 0.48, -halfWidth);

  ctx.save();
  const gradient = ctx.createLinearGradient(
    attach.x,
    attach.y,
    notch.x,
    notch.y,
  );
  gradient.addColorStop(0, palette.base);
  gradient.addColorStop(1, palette.highlight);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(attach.x, attach.y);
  ctx.bezierCurveTo(
    point(length * 0.2, halfWidth * 0.2).x,
    point(length * 0.2, halfWidth * 0.2).y,
    upperShoulder.x,
    upperShoulder.y,
    upperTip.x,
    upperTip.y,
  );
  ctx.quadraticCurveTo(
    point(length * 1.12, halfWidth * 0.18).x,
    point(length * 1.12, halfWidth * 0.18).y,
    notch.x,
    notch.y,
  );
  ctx.quadraticCurveTo(
    point(length * 1.12, -halfWidth * 0.18).x,
    point(length * 1.12, -halfWidth * 0.18).y,
    lowerTip.x,
    lowerTip.y,
  );
  ctx.bezierCurveTo(
    lowerShoulder.x,
    lowerShoulder.y,
    point(length * 0.2, -halfWidth * 0.2).x,
    point(length * 0.2, -halfWidth * 0.2).y,
    attach.x,
    attach.y,
  );
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = palette.rim;
  ctx.lineWidth = 1.1;
  ctx.lineJoin = "round";
  ctx.stroke();

  // A single quiet center fold makes the paddle readable without texture.
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = palette.face;
  ctx.beginPath();
  ctx.moveTo(point(length * 0.16, 0).x, point(length * 0.16, 0).y);
  ctx.lineTo(notch.x, notch.y);
  ctx.stroke();
  ctx.restore();
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
  texture: MascotTextureSource,
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
): void {
  if (points.length < 2) return;
  const root = points[0];
  const tip = points[points.length - 1];

  const tangentX = tip.x - root.x;
  const tangentY = tip.y - root.y;
  const tangentLength = Math.max(0.0001, Math.hypot(tangentX, tangentY));
  const displayLength = Math.min(tangentLength, baseWidth * 2.9);
  const ux = tangentX / tangentLength;
  const uy = tangentY / tangentLength;
  const centerX = root.x + ux * displayLength * 0.5;
  const centerY = root.y + uy * displayLength * 0.5;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(Math.atan2(uy, ux));
  const finGradient = ctx.createLinearGradient(
    -displayLength * 0.5,
    0,
    displayLength * 0.5,
    0,
  );
  finGradient.addColorStop(0, palette.base);
  finGradient.addColorStop(1, palette.highlight);
  ctx.fillStyle = finGradient;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    Math.max(baseWidth, displayLength * 0.55),
    baseWidth * 0.78,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  ctx.strokeStyle = palette.rim;
  ctx.globalAlpha = 0.34;
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
  const lean = clamp(expression.headLean, -1, 1) * 0.12;
  const leaned: FaceFrame = {
    ...frame,
    rotation: frame.rotation + lean,
    normalX: frame.normalX * Math.cos(lean) - frame.forwardX * Math.sin(lean),
    normalY: frame.normalY * Math.cos(lean) - frame.forwardY * Math.sin(lean),
  };

  const eyes = computeGuppyEyeAnchors(leaned);
  const mouth = {
    x:
      leaned.centerX +
      leaned.forwardX * leaned.height * MOUTH_FORWARD_FRACTION -
      leaned.normalX * leaned.width * 0.055,
    y:
      leaned.centerY +
      leaned.forwardY * leaned.height * MOUTH_FORWARD_FRACTION -
      leaned.normalY * leaned.width * 0.055,
  };
  const eyeRadius = Math.max(3.2, leaned.width * 0.205);

  // One centered coral signal replaces the old pale floating orb. It is small
  // enough to read as a forehead marking, not a third eye.
  drawSignalMark(ctx, leaned, expression, palette, glowMultiplier, eyeRadius);

  drawEye(ctx, eyes.left, eyeRadius, expression, palette, leaned, 1);
  drawEye(ctx, eyes.right, eyeRadius, expression, palette, leaned, -1);

  drawMouth(ctx, mouth, leaned, expression, palette);
}

/**
 * Side-profile face like the approved concept: both eyes live on the visible
 * side of the head and separate along the swimming axis. This avoids the old
 * top-down stack while still rotating coherently with the creature.
 */
function computeGuppyEyeAnchors(frame: FaceFrame): FaceEyeAnchors {
  const spacing = frame.height * EYE_SPACING_FRACTION;
  const faceSide = frame.width * 0.13;
  return {
    left: {
      x: frame.centerX - frame.forwardX * spacing + frame.normalX * faceSide,
      y: frame.centerY - frame.forwardY * spacing + frame.normalY * faceSide,
    },
    right: {
      x: frame.centerX + frame.forwardX * spacing + frame.normalX * faceSide,
      y: frame.centerY + frame.forwardY * spacing + frame.normalY * faceSide,
    },
  };
}

function drawSignalMark(
  ctx: CanvasRenderingContext2D,
  frame: FaceFrame,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
  glowMultiplier: number,
  eyeRadius: number,
): void {
  const coreX =
    frame.centerX -
    frame.forwardX * frame.height * 0.27 +
    frame.normalX * frame.width * 0.62;
  const coreY =
    frame.centerY -
    frame.forwardY * frame.height * 0.27 +
    frame.normalY * frame.width * 0.62;
  const radius = eyeRadius * 0.32 * expression.coreScale;
  const glow = clamp(expression.glowIntensity * glowMultiplier, 0, 1);

  ctx.save();
  ctx.globalAlpha = 0.52 + glow * 0.48;
  ctx.shadowColor = palette.printPrimary;
  ctx.shadowBlur = radius * (0.8 + glow * 1.8);
  ctx.fillStyle = palette.printPrimary;
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

  // Identical sockets keep the two-eye construction calm and intentional.
  ctx.fillStyle = palette.shadow;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.ellipse(
    0,
    0,
    radius * scaleX * 1.09,
    radius * openness * 1.09,
    0,
    0,
    Math.PI * 2,
  );
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = palette.face;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * scaleX, radius * openness, 0, 0, Math.PI * 2);
  ctx.fill();

  if (openness > 0.15) {
    const pupilX =
      clamp(expression.pupilOffsetX, -0.18, 0.18) * radius * scaleX;
    const pupilY =
      clamp(expression.pupilOffsetY, -0.14, 0.14) * radius * openness;
    const pupilRadius = radius * 0.36 * Math.min(1, 0.68 + openness * 0.32);
    ctx.fillStyle = palette.shadow;
    ctx.beginPath();
    ctx.arc(pupilX, pupilY, pupilRadius, 0, Math.PI * 2);
    ctx.fill();

    // Pinpoint catchlight carries gaze through fast movement without glow.
    ctx.fillStyle = palette.face;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(
      pupilX - radius * 0.12,
      pupilY - radius * 0.12,
      Math.max(0.6, radius * 0.1),
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  // Brow: a short arc above the eye, tilted per expression (focused/
  // determined lean in, surprised/dizzy lean out).
  if (Math.abs(expression.browTilt) > 0.22) {
    ctx.strokeStyle = palette.shadow;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(0.55, radius * 0.14);
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

function drawMouth(
  ctx: CanvasRenderingContext2D,
  mouth: Point,
  frame: FaceFrame,
  expression: ExpressionVisualState,
  palette: AppearancePalette,
): void {
  const size = Math.max(1.8, frame.width * 0.15);
  const mouthOpen = clamp(expression.mouthOpen ?? 0, 0, 1);
  const mouthCurve = clamp(expression.mouthCurve ?? 0, -1, 1);

  ctx.save();
  ctx.translate(mouth.x, mouth.y);
  // The eyes are vertical capsules, but the side-profile smile follows the
  // swimming axis. Rotating both the same way produced the old vertical dash.
  ctx.rotate(frame.rotation);
  ctx.strokeStyle = mouthOpen > 0.55 ? palette.shadow : palette.face;
  ctx.fillStyle = palette.shadow;
  ctx.lineWidth = Math.max(0.72, size * 0.2);
  ctx.lineCap = "round";
  ctx.globalAlpha = mouthOpen > 0.55 ? 0.9 : 0.72;

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
    const rx = size * (0.34 + mouthOpen * 0.16);
    const ry = size * (0.1 + mouthOpen * 0.18);
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
