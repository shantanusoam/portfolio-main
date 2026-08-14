import type { AppendageSpringSpec, Vec2Like } from "../types";
import { EPSILON, clamp, copy, vec2 } from "../math/Vec2";

export interface SoftChainUpdateOptions {
  dt: number;
  elapsedTime: number;
  phase: number;
  reducedMotion: boolean;
  spring: AppendageSpringSpec;
}

/**
 * A lightweight Verlet ribbon that follows a collision-safe IK guide.
 *
 * FABRIK owns reach and foot placement. This layer adds inertia, curvature,
 * recoil and secondary motion without allowing either endpoint to drift.
 */
export class SoftChain {
  readonly points: Vec2Like[];

  private readonly previous: Vec2Like[];
  private readonly segmentLengths: readonly number[];

  constructor(guide: readonly Vec2Like[], segmentLengths: readonly number[]) {
    this.segmentLengths = segmentLengths;
    this.points = guide.map((point) => vec2(point.x, point.y));
    this.previous = guide.map((point) => vec2(point.x, point.y));
  }

  reset(guide: readonly Vec2Like[]): void {
    const count = Math.min(this.points.length, guide.length);
    for (let index = 0; index < count; index += 1) {
      copy(this.points[index], guide[index]);
      copy(this.previous[index], guide[index]);
    }
  }

  translate(dx: number, dy: number): void {
    for (let index = 0; index < this.points.length; index += 1) {
      this.points[index].x += dx;
      this.points[index].y += dy;
      this.previous[index].x += dx;
      this.previous[index].y += dy;
    }
  }

  update(
    guide: readonly Vec2Like[],
    anchor: Vec2Like,
    tip: Vec2Like,
    options: SoftChainUpdateOptions,
  ): void {
    const last = this.points.length - 1;
    if (last < 1 || options.dt <= 0) {
      this.reset(guide);
      return;
    }

    const dt = Math.min(options.dt, 1 / 30);
    const referenceSteps = dt * 120;
    const damping = Math.pow(
      clamp(options.spring.damping, 0, 0.999),
      referenceSteps,
    );
    const guideBlend =
      1 -
      Math.pow(
        1 - clamp(options.spring.guideStrength, 0.001, 0.999),
        referenceSteps,
      );
    const gravity =
      options.spring.gravity * dt * dt * (options.reducedMotion ? 0.25 : 1);
    const curlStrength =
      options.spring.curl * dt * dt * (options.reducedMotion ? 0.18 : 1);

    for (let index = 1; index < last; index += 1) {
      const point = this.points[index];
      const previous = this.previous[index];
      const currentX = point.x;
      const currentY = point.y;
      const velocityX = (currentX - previous.x) * damping;
      const velocityY = (currentY - previous.y) * damping;
      const before = guide[index - 1];
      const after = guide[index + 1];
      const tangentX = after.x - before.x;
      const tangentY = after.y - before.y;
      const tangentLength = Math.max(EPSILON, Math.hypot(tangentX, tangentY));
      const normalX = -tangentY / tangentLength;
      const normalY = tangentX / tangentLength;
      const normalizedIndex = index / last;
      const envelope = Math.sin(normalizedIndex * Math.PI);
      const curl =
        Math.sin(
          options.elapsedTime * 3.1 +
            options.phase * Math.PI * 2 +
            index * 0.82,
        ) *
        envelope *
        curlStrength;

      previous.x = currentX;
      previous.y = currentY;
      point.x =
        currentX +
        velocityX +
        (guide[index].x - currentX) * guideBlend +
        normalX * curl;
      point.y =
        currentY +
        velocityY +
        (guide[index].y - currentY) * guideBlend +
        normalY * curl +
        gravity * envelope;
    }

    const iterations = Math.max(1, options.spring.constraintIterations);
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      copy(this.points[0], anchor);
      copy(this.points[last], tip);

      for (let segment = 0; segment < last; segment += 1) {
        this.solveDistance(segment, segment + 1, this.segmentLengths[segment]);
      }
      for (let segment = last - 1; segment >= 0; segment -= 1) {
        this.solveDistance(segment, segment + 1, this.segmentLengths[segment]);
      }
    }

    copy(this.points[0], anchor);
    copy(this.points[last], tip);
  }

  private solveDistance(
    leftIndex: number,
    rightIndex: number,
    rest: number,
  ): void {
    const left = this.points[leftIndex];
    const right = this.points[rightIndex];
    const deltaX = right.x - left.x;
    const deltaY = right.y - left.y;
    const length = Math.max(EPSILON, Math.hypot(deltaX, deltaY));
    const correction = (length - rest) / length;
    const last = this.points.length - 1;

    if (leftIndex === 0) {
      right.x -= deltaX * correction;
      right.y -= deltaY * correction;
      return;
    }
    if (rightIndex === last) {
      left.x += deltaX * correction;
      left.y += deltaY * correction;
      return;
    }

    const half = correction * 0.5;
    left.x += deltaX * half;
    left.y += deltaY * half;
    right.x -= deltaX * half;
    right.y -= deltaY * half;
  }
}
