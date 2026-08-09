import { EPSILON, clamp, distance, lerp } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type { BodyDeformation, Point } from "../types";

/**
 * Builds a compact three-zone (head/torso/tail) silhouette width profile on
 * top of the rig's own ribs, then turns it into closed left/right contour
 * rails. Reuses the existing rib centers/normals/left-right asymmetry
 * (turn lean) rather than inventing new geometry — see upgrade spec
 * "CHARACTER SILHOUETTE REDESIGN".
 */

export interface BodyContourZones {
  /** Fraction of body length (0..1) where the head/shoulder zone ends. */
  headEnd: number;
  /** Fraction of body length (0..1) where the torso zone ends (tail is [torsoEnd, 1]). */
  torsoEnd: number;
}

export interface BodyContourConfig {
  zones: BodyContourZones;
  /** Extra width multiplier peaking at the head/shoulder boundary (0 = none). */
  headBulge: number;
  /** Extra taper shaping exponent applied within the tail zone (>0). */
  tailTaperPower: number;
  /** 0..1 fraction of the tail zone's natural width retained at the very tip — keeps the tail a readable point instead of a vanishing thread, and stops a stretch deformation from making it outrun the rest of the body. */
  tailVisualCap: number;
  /** Minimum contour half-width (px) inside the body, excluding the true nose/tail-tip endpoints which stay pinched to a point. */
  minWidth: number;
}

export const DEFAULT_BODY_CONTOUR_CONFIG: BodyContourConfig = {
  // BodyProfile already provides the guppy's round mass. These values add a
  // restrained shoulder lift and avoid sharpening the final taper twice.
  zones: { headEnd: 0.4, torsoEnd: 0.76 },
  headBulge: 0.08,
  tailTaperPower: 0.78,
  tailVisualCap: 0.82,
  minWidth: 3,
};

/**
 * Adjusted per-rib contour half-widths: the rig's natural front-weighted
 * profile (`BodyProfile.bodyWidth`, already baked into `rib.width`) reshaped
 * into the spec's three explicit zones, then scaled by `BodyDeformation`
 * (lateral squash/stretch, head squash, tail stretch). Never touches spine
 * geometry — only how wide the silhouette draws at each rib.
 */
export function computeContourWidths(
  ribs: readonly RibPoint[],
  config: BodyContourConfig = DEFAULT_BODY_CONTOUR_CONFIG,
  deformation?: BodyDeformation,
): number[] {
  const count = ribs.length;
  const widths = new Array<number>(count);
  if (count === 0) return widths;

  const { zones, headBulge, tailTaperPower, tailVisualCap, minWidth } = config;
  const lateralScale = deformation
    ? Math.max(0.1, deformation.lateralScale)
    : 1;
  const headSquash = deformation ? deformation.headSquash : 0;
  const tailStretch = deformation ? deformation.tailStretch : 0;

  for (let i = 0; i < count; i += 1) {
    const t = count > 1 ? i / (count - 1) : 0;
    let widthMultiplier = 1;

    if (t <= zones.headEnd) {
      const localT = zones.headEnd > 0 ? t / zones.headEnd : 0;
      widthMultiplier +=
        headBulge * Math.sin(clamp(localT, 0, 1) * Math.PI * 0.5);
      widthMultiplier *= 1 + headSquash * 0.5;
    } else if (t <= zones.torsoEnd) {
      // Smooth hand-off from the head bulge — the torso keeps a little of
      // it rather than stepping down abruptly at the zone boundary.
      widthMultiplier += headBulge * 0.4;
    } else {
      const tailSpan = Math.max(EPSILON, 1 - zones.torsoEnd);
      const tailT = clamp((t - zones.torsoEnd) / tailSpan, 0, 1);
      const taper = Math.pow(1 - tailT, Math.max(0.1, tailTaperPower));
      widthMultiplier = lerp(tailVisualCap, 1, taper);
      widthMultiplier *= 1 + tailStretch * 0.3 * (1 - tailT);
    }

    const rawWidth =
      ribs[i].width * Math.max(0, widthMultiplier) * lateralScale;
    // The true nose (i=0) and tail-tip (i=count-1) already taper to ~0 via
    // BodyProfile — keep that natural point closure instead of flooring it.
    widths[i] =
      i === 0 || i === count - 1
        ? Math.max(0, rawWidth)
        : Math.max(minWidth, rawWidth);
  }

  return widths;
}

export interface BodyContourPoints {
  left: Point[];
  right: Point[];
}

/**
 * Turns adjusted contour widths into left/right point rails, preserving
 * whatever asymmetry `applyRibLean` already baked into `rib.left`/`rib.right`
 * (reverse-engineered as a per-side scale ratio) so a hard turn still reads
 * correctly with the new width profile.
 */
export function buildBodyContourPoints(
  ribs: readonly RibPoint[],
  widths: readonly number[],
): BodyContourPoints {
  const left: Point[] = new Array(ribs.length);
  const right: Point[] = new Array(ribs.length);

  for (let i = 0; i < ribs.length; i += 1) {
    const rib = ribs[i];
    const targetWidth = widths[i] ?? rib.width;
    const baseWidth = rib.width > EPSILON ? rib.width : EPSILON;

    const leftDist = distance(
      rib.center.x,
      rib.center.y,
      rib.left.x,
      rib.left.y,
    );
    const rightDist = distance(
      rib.center.x,
      rib.center.y,
      rib.right.x,
      rib.right.y,
    );
    const leftScale = leftDist / baseWidth;
    const rightScale = rightDist / baseWidth;

    left[i] = {
      x: rib.center.x + rib.normalX * targetWidth * leftScale,
      y: rib.center.y + rib.normalY * targetWidth * leftScale,
    };
    right[i] = {
      x: rib.center.x - rib.normalX * targetWidth * rightScale,
      y: rib.center.y - rib.normalY * targetWidth * rightScale,
    };
  }

  return { left, right };
}
