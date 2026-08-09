import type { Vec2Like } from "../types";

export const EPSILON = 1e-8;
export const TAU = Math.PI * 2;

export function vec2(x = 0, y = 0): Vec2Like {
  return { x, y };
}

export function set(out: Vec2Like, x: number, y: number): Vec2Like {
  out.x = x;
  out.y = y;
  return out;
}

export function copy(out: Vec2Like, value: Vec2Like): Vec2Like {
  out.x = value.x;
  out.y = value.y;
  return out;
}

export function add(out: Vec2Like, a: Vec2Like, b: Vec2Like): Vec2Like {
  out.x = a.x + b.x;
  out.y = a.y + b.y;
  return out;
}

export function subtract(out: Vec2Like, a: Vec2Like, b: Vec2Like): Vec2Like {
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

export function scale(
  out: Vec2Like,
  value: Vec2Like,
  scalar: number,
): Vec2Like {
  out.x = value.x * scalar;
  out.y = value.y * scalar;
  return out;
}

export function multiplyAdd(
  out: Vec2Like,
  origin: Vec2Like,
  direction: Vec2Like,
  amount: number,
): Vec2Like {
  out.x = origin.x + direction.x * amount;
  out.y = origin.y + direction.y * amount;
  return out;
}

export function dot(a: Vec2Like, b: Vec2Like): number {
  return a.x * b.x + a.y * b.y;
}

export function cross(a: Vec2Like, b: Vec2Like): number {
  return a.x * b.y - a.y * b.x;
}

export function lengthSquared(value: Vec2Like): number {
  return value.x * value.x + value.y * value.y;
}

export function length(value: Vec2Like): number {
  return Math.hypot(value.x, value.y);
}

export function distance(a: Vec2Like, b: Vec2Like): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function normalize(
  out: Vec2Like,
  value: Vec2Like,
  fallbackX = 1,
  fallbackY = 0,
): Vec2Like {
  const magnitude = Math.hypot(value.x, value.y);
  if (magnitude <= EPSILON) {
    out.x = fallbackX;
    out.y = fallbackY;
    return out;
  }
  const inverse = 1 / magnitude;
  out.x = value.x * inverse;
  out.y = value.y * inverse;
  return out;
}

export function clampLength(
  out: Vec2Like,
  value: Vec2Like,
  maximum: number,
): Vec2Like {
  const magnitudeSquared = lengthSquared(value);
  if (magnitudeSquared <= maximum * maximum) return copy(out, value);
  const amount = maximum / Math.max(EPSILON, Math.sqrt(magnitudeSquared));
  out.x = value.x * amount;
  out.y = value.y * amount;
  return out;
}

export function rotate(
  out: Vec2Like,
  value: Vec2Like,
  radians: number,
): Vec2Like {
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const x = value.x;
  const y = value.y;
  out.x = x * cosine - y * sine;
  out.y = x * sine + y * cosine;
  return out;
}

export function fromAngle(
  out: Vec2Like,
  radians: number,
  magnitude = 1,
): Vec2Like {
  out.x = Math.cos(radians) * magnitude;
  out.y = Math.sin(radians) * magnitude;
  return out;
}

export function lerp(
  out: Vec2Like,
  a: Vec2Like,
  b: Vec2Like,
  t: number,
): Vec2Like {
  out.x = a.x + (b.x - a.x) * t;
  out.y = a.y + (b.y - a.y) * t;
  return out;
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}

export function saturate(value: number): number {
  return clamp(value, 0, 1);
}

export function smoothstep(value: number): number {
  const t = saturate(value);
  return t * t * (3 - 2 * t);
}

export function shortestAngleDelta(from: number, to: number): number {
  let difference = (to - from) % TAU;
  if (difference > Math.PI) difference -= TAU;
  if (difference < -Math.PI) difference += TAU;
  return difference;
}

export function circularDistance(a: number, b: number): number {
  const difference = Math.abs(a - b) % 1;
  return Math.min(difference, 1 - difference);
}

export function isFiniteVec2(value: Vec2Like): boolean {
  return Number.isFinite(value.x) && Number.isFinite(value.y);
}
