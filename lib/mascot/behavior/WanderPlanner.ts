import { clamp, lerp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import type {
  Point,
  SpeedCurve,
  WanderPathKind,
  WanderSegment,
} from "../types";

/**
 * Seeded autonomous path planner: picks a path family, lays down 2-4 safe
 * control points, and hands back a WanderSegment the caller samples with
 * sampleWanderSegment(). Never repeats the same path kind twice in a row,
 * and every generated point stays within `bounds` (with spline-overshoot
 * clamped at sample time, not just at control-point time).
 */

export const WANDER_PATH_KINDS: readonly WanderPathKind[] = [
  "wide-loop",
  "figure-eight",
  "lazy-sweep",
  "card-orbit",
  "edge-cruise",
  "diagonal-sprint",
  "curiosity-circle",
  "rest-curl",
];

export interface WanderBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface WanderPlannerConfig {
  bounds: WanderBounds;
  minSegmentDuration: number;
  maxSegmentDuration: number;
}

function pathKindSpeedCurve(kind: WanderPathKind): SpeedCurve {
  if (kind === "rest-curl") return "hold";
  if (kind === "diagonal-sprint") return "ease-out";
  return "ease-in-out";
}

function pathKindNextBehavior(
  kind: WanderPathKind,
): WanderSegment["nextBehavior"] {
  if (kind === "rest-curl") return "rest";
  if (kind === "card-orbit" || kind === "curiosity-circle") return "inspect";
  return undefined;
}

export class WanderPlanner {
  private readonly rng: SeededRandom;
  private readonly config: WanderPlannerConfig;
  private lastKind: WanderPathKind | null = null;
  private lastEndPoint: Point;

  constructor(seed: number, config: WanderPlannerConfig, startPoint: Point) {
    this.rng = new SeededRandom(seed);
    this.config = config;
    this.lastEndPoint = clampToBounds(startPoint, config.bounds);
  }

  private pickKind(): WanderPathKind {
    let candidate = this.rng.pick(WANDER_PATH_KINDS);
    let attempts = 0;
    while (candidate === this.lastKind && attempts < WANDER_PATH_KINDS.length) {
      candidate = this.rng.pick(WANDER_PATH_KINDS);
      attempts += 1;
    }
    this.lastKind = candidate;
    return candidate;
  }

  private randomPoint(): Point {
    const { bounds } = this.config;
    return {
      x: this.rng.range(bounds.minX, bounds.maxX),
      y: this.rng.range(bounds.minY, bounds.maxY),
    };
  }

  private generateControlPoints(kind: WanderPathKind, start: Point): Point[] {
    const { bounds } = this.config;
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    const centerX = bounds.minX + width / 2;
    const centerY = bounds.minY + height / 2;

    switch (kind) {
      case "wide-loop":
      case "curiosity-circle":
      case "card-orbit": {
        const radius =
          Math.min(width, height) * (kind === "wide-loop" ? 0.4 : 0.22);
        const angle0 = this.rng.angle();
        const steps = 4;
        const points: Point[] = [start];
        for (let i = 1; i <= steps; i += 1) {
          const angle = angle0 + (i / steps) * Math.PI * 2;
          points.push(
            clampToBounds(
              {
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius,
              },
              bounds,
            ),
          );
        }
        return points;
      }
      case "figure-eight": {
        const radius = Math.min(width, height) * 0.28;
        const points: Point[] = [start];
        for (let i = 1; i <= 5; i += 1) {
          const angle = (i / 5) * Math.PI * 2;
          const lobe = i % 2 === 0 ? 1 : -1;
          points.push(
            clampToBounds(
              {
                x:
                  centerX +
                  lobe * radius * 0.6 +
                  Math.cos(angle) * radius * 0.5,
                y: centerY + Math.sin(angle * 2) * radius * 0.5,
              },
              bounds,
            ),
          );
        }
        return points;
      }
      case "edge-cruise": {
        const margin = Math.min(width, height) * 0.12;
        const corners: Point[] = [
          { x: bounds.minX + margin, y: bounds.minY + margin },
          { x: bounds.maxX - margin, y: bounds.minY + margin },
          { x: bounds.maxX - margin, y: bounds.maxY - margin },
          { x: bounds.minX + margin, y: bounds.maxY - margin },
        ];
        const startIndex = this.rng.int(0, corners.length - 1);
        return [
          start,
          corners[startIndex],
          corners[(startIndex + 1) % corners.length],
        ];
      }
      case "diagonal-sprint": {
        const from = this.randomPoint();
        const to = this.randomPoint();
        return [start, from, to];
      }
      case "lazy-sweep":
      case "rest-curl":
      default: {
        return [start, this.randomPoint(), this.randomPoint()];
      }
    }
  }

  nextSegment(now: number): WanderSegment {
    const kind = this.pickKind();
    const duration = this.rng.range(
      this.config.minSegmentDuration,
      this.config.maxSegmentDuration,
    );
    const controlPoints = this.generateControlPoints(
      kind,
      this.lastEndPoint,
    ).map((p) => clampToBounds(p, this.config.bounds));

    const segment: WanderSegment = {
      kind,
      startTime: now,
      duration: Math.max(0.1, duration),
      controlPoints,
      speedCurve: pathKindSpeedCurve(kind),
      nextBehavior: pathKindNextBehavior(kind),
    };

    this.lastEndPoint = controlPoints[controlPoints.length - 1];
    return segment;
  }
}

function clampToBounds(point: Point, bounds: WanderBounds): Point {
  return {
    x: clamp(point.x, bounds.minX, bounds.maxX),
    y: clamp(point.y, bounds.minY, bounds.maxY),
  };
}

export function applySpeedCurve(curve: SpeedCurve, linearT: number): number {
  const t = clamp(linearT, 0, 1);
  switch (curve) {
    case "linear":
      return t;
    case "ease-in-out":
      return t * t * (3 - 2 * t);
    case "ease-out":
      return 1 - Math.pow(1 - t, 3);
    case "hold":
      return 0;
    default:
      return t;
  }
}

function catmullRom(
  p0: number,
  p1: number,
  p2: number,
  p3: number,
  t: number,
): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 +
      (-p0 + p2) * t +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

export function samplePath(
  controlPoints: readonly Point[],
  progress: number,
): Point {
  if (controlPoints.length === 0) return { x: 0, y: 0 };
  if (controlPoints.length === 1) return controlPoints[0];

  const clampedProgress = clamp(progress, 0, 1);

  if (controlPoints.length === 2) {
    return {
      x: lerp(controlPoints[0].x, controlPoints[1].x, clampedProgress),
      y: lerp(controlPoints[0].y, controlPoints[1].y, clampedProgress),
    };
  }

  const segmentCount = controlPoints.length - 1;
  const scaled = clampedProgress * segmentCount;
  const index = clamp(Math.floor(scaled), 0, segmentCount - 1);
  const localT = scaled - index;

  const p0 = controlPoints[Math.max(0, index - 1)];
  const p1 = controlPoints[index];
  const p2 = controlPoints[Math.min(controlPoints.length - 1, index + 1)];
  const p3 = controlPoints[Math.min(controlPoints.length - 1, index + 2)];

  return {
    x: catmullRom(p0.x, p1.x, p2.x, p3.x, localT),
    y: catmullRom(p0.y, p1.y, p2.y, p3.y, localT),
  };
}

/**
 * Samples a WanderSegment at absolute time `now` (seconds), applying the
 * segment's speed curve and clamping the result to `bounds` — Catmull-Rom
 * splines can overshoot their control points, so this is the actual safety
 * boundary, not just the control-point generation above.
 */
export function sampleWanderSegment(
  segment: WanderSegment,
  now: number,
  bounds: WanderBounds,
): Point {
  const linearT =
    segment.duration > 0 ? (now - segment.startTime) / segment.duration : 1;
  const easedT = applySpeedCurve(segment.speedCurve, linearT);
  const point = samplePath(segment.controlPoints, easedT);
  return clampToBounds(point, bounds);
}

export function isWanderSegmentFinished(
  segment: WanderSegment,
  now: number,
): boolean {
  return now - segment.startTime >= segment.duration;
}
