import { clamp } from "../core/NumericGuards";
import type { Point } from "../types";
import type { BodyContourPoints } from "./BodyContour";
import { sampleCatmullRomRail } from "./ContourPath";
import type { AppearancePalette } from "./AppearancePresets";

/**
 * Stable edge treatment replacing the old noisy dot-edge — upgrade spec
 * "EDGE AND RIM DESIGN": an offset highlight stroke along the contour rails,
 * thinner near the face, at most two `stroke()` calls per rail (no per-frame
 * blur, no per-segment draw calls).
 */

export interface RimConfig {
  /** Full-body rim stroke width, px. */
  baseWidth: number;
  /** 0..1 fraction of body length where the "near face" thin segment ends. */
  faceThinningEnd: number;
  /** 0..1 multiplier applied to baseWidth within the near-face segment. */
  faceThinningFactor: number;
}

export const DEFAULT_RIM_CONFIG: RimConfig = {
  baseWidth: 2.4,
  faceThinningEnd: 0.22,
  faceThinningFactor: 0.4,
};

/** Pure width lookup — thinner near the face (small t), full width elsewhere. */
export function computeRimWidthAt(
  t: number,
  config: RimConfig = DEFAULT_RIM_CONFIG,
  widthMultiplier = 1,
): number {
  const clampedT = clamp(t, 0, 1);
  const nearFace = clampedT < config.faceThinningEnd;
  const factor = nearFace
    ? config.faceThinningFactor +
      (1 - config.faceThinningFactor) *
        (clampedT / Math.max(1e-6, config.faceThinningEnd))
    : 1;
  return config.baseWidth * factor * Math.max(0, widthMultiplier);
}

function drawRail(
  ctx: CanvasRenderingContext2D,
  rail: readonly Point[],
  config: RimConfig,
  widthMultiplier: number,
): void {
  // Match silhouette smoothing so the rim doesn't reintroduce polygonal facets.
  const smooth = sampleCatmullRomRail(rail, 4);
  const count = smooth.length;
  if (count < 2) return;

  const splitIndex = clamp(
    Math.round(config.faceThinningEnd * (count - 1)),
    1,
    count - 1,
  );

  ctx.lineWidth = computeRimWidthAt(0, config, widthMultiplier);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(smooth[0].x, smooth[0].y);
  for (let i = 1; i <= splitIndex; i += 1) ctx.lineTo(smooth[i].x, smooth[i].y);
  ctx.stroke();

  if (splitIndex < count - 1) {
    ctx.lineWidth = computeRimWidthAt(1, config, widthMultiplier);
    ctx.beginPath();
    ctx.moveTo(smooth[splitIndex].x, smooth[splitIndex].y);
    for (let i = splitIndex + 1; i < count; i += 1)
      ctx.lineTo(smooth[i].x, smooth[i].y);
    ctx.stroke();
  }
}

/** Draws the rim as (at most) two stroked segments per rail — cheap and stable at small sizes. */
export function drawRim(
  ctx: CanvasRenderingContext2D,
  contour: BodyContourPoints,
  palette: AppearancePalette,
  config: RimConfig = DEFAULT_RIM_CONFIG,
  widthMultiplier = 1,
): void {
  if (contour.left.length < 2) return;

  ctx.save();
  ctx.strokeStyle = palette.rim;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.55;

  drawRail(ctx, contour.left, config, widthMultiplier);
  drawRail(ctx, contour.right, config, widthMultiplier);

  ctx.restore();
}
