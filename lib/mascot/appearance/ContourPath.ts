import type { Point } from "../types";
import type { BodyContourPoints } from "./BodyContour";

/**
 * Builds a closed Catmull-Rom silhouette path from discrete rib rails.
 * Straight `lineTo` between ribs produces the visible polygonal facets that
 * made the familiar look janky — cubic sampling keeps the outline fluid
 * even on hard turns.
 */

const DEFAULT_SAMPLES_PER_SEGMENT = 6;

function catmullRom(
  p0: Point,
  p1: Point,
  p2: Point,
  p3: Point,
  t: number,
): Point {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

/**
 * Samples a Catmull-Rom spline through an open polyline. Endpoints are
 * duplicated so the first/last segments still get a smooth cubic.
 */
export function sampleCatmullRomRail(
  points: readonly Point[],
  samplesPerSegment = DEFAULT_SAMPLES_PER_SEGMENT,
): Point[] {
  const count = points.length;
  if (count === 0) return [];
  if (count === 1) return [{ x: points[0].x, y: points[0].y }];
  if (count === 2) {
    return [
      { x: points[0].x, y: points[0].y },
      { x: points[1].x, y: points[1].y },
    ];
  }

  const samples = Math.max(1, Math.floor(samplesPerSegment));
  const out: Point[] = [{ x: points[0].x, y: points[0].y }];

  for (let i = 0; i < count - 1; i += 1) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(count - 1, i + 2)];
    for (let s = 1; s <= samples; s += 1) {
      out.push(catmullRom(p0, p1, p2, p3, s / samples));
    }
  }

  return out;
}

/** Closed Path2D: left rail head→tail, then right rail tail→head. */
export function pathFromContour(
  contour: BodyContourPoints,
  samplesPerSegment = DEFAULT_SAMPLES_PER_SEGMENT,
): Path2D | null {
  if (typeof Path2D === "undefined") return null;
  if (contour.left.length < 2 || contour.right.length < 2) return null;

  const left = sampleCatmullRomRail(contour.left, samplesPerSegment);
  const right = sampleCatmullRomRail(contour.right, samplesPerSegment);
  if (left.length < 2 || right.length < 2) return null;

  const path = new Path2D();
  path.moveTo(left[0].x, left[0].y);
  for (let i = 1; i < left.length; i += 1) {
    path.lineTo(left[i].x, left[i].y);
  }
  for (let i = right.length - 1; i >= 0; i -= 1) {
    path.lineTo(right[i].x, right[i].y);
  }

  // Round the broad head closure. A straight right[0] -> left[0] seam made
  // any non-zero front width look mechanically chopped off; the forward
  // control point turns that same volume into a soft forehead/muzzle cap.
  const leftHead = left[0];
  const rightHead = right[0];
  const leftNext = left[1] ?? leftHead;
  const rightNext = right[1] ?? rightHead;
  const headMidX = (leftHead.x + rightHead.x) * 0.5;
  const headMidY = (leftHead.y + rightHead.y) * 0.5;
  const nextMidX = (leftNext.x + rightNext.x) * 0.5;
  const nextMidY = (leftNext.y + rightNext.y) * 0.5;
  const forwardX = headMidX - nextMidX;
  const forwardY = headMidY - nextMidY;
  const forwardLength = Math.max(0.0001, Math.hypot(forwardX, forwardY));
  const headHalfWidth =
    Math.hypot(leftHead.x - rightHead.x, leftHead.y - rightHead.y) * 0.5;
  path.quadraticCurveTo(
    headMidX + (forwardX / forwardLength) * headHalfWidth * 0.72,
    headMidY + (forwardY / forwardLength) * headHalfWidth * 0.72,
    leftHead.x,
    leftHead.y,
  );
  path.closePath();
  return path;
}
