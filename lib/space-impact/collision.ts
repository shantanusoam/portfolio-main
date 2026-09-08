import { clamp } from "./config";
import type { Point } from "./types";

/** Segment against a circle, including initial overlap and a zero-length segment. */
export function segmentCircle(
  a: Point,
  b: Point,
  center: Point,
  radius: number,
): boolean {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = dx * dx + dy * dy;
  const t = length
    ? clamp(((center.x - a.x) * dx + (center.y - a.y) * dy) / length, 0, 1)
    : 0;
  return (
    (a.x + dx * t - center.x) ** 2 + (a.y + dy * t - center.y) ** 2 <=
    radius ** 2
  );
}
export function circleRect(
  center: Point,
  radius: number,
  rect: Point & { w: number; h: number },
): boolean {
  const x = clamp(center.x, rect.x, rect.x + rect.w);
  const y = clamp(center.y, rect.y, rect.y + rect.h);
  return (x - center.x) ** 2 + (y - center.y) ** 2 <= radius * radius;
}
