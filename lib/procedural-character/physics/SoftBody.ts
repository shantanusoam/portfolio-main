import type { SoftBodySpec, Vec2Like } from "../types";
import { EPSILON, clamp, copy, vec2 } from "../math/Vec2";

export interface SoftBodyUpdateOptions {
  dt: number;
  elapsedTime: number;
  center: Vec2Like;
  rotation: number;
  radius: number;
  normalizedSpeed: number;
  reducedMotion: boolean;
}

/** Area-preserving Verlet polygon for broad, deformable creature bodies. */
export class SoftBodyRuntime {
  readonly points: Vec2Like[];
  readonly restTargets: Vec2Like[];
  readonly targetArea: number;
  currentArea: number;

  private readonly previous: Vec2Like[];
  private readonly predicted: Vec2Like[];
  private readonly boundary: readonly Vec2Like[];
  private readonly edgeLengths: Float32Array;
  private readonly bendLengths: Float32Array;
  private readonly spec: SoftBodySpec;
  private readonly centroid = vec2();

  constructor(
    spec: SoftBodySpec,
    center: Vec2Like,
    rotation: number,
    radius: number,
  ) {
    if (spec.boundary.length < 3) {
      throw new Error("Soft body polygons require at least three points");
    }
    this.spec = spec;
    this.boundary = spec.boundary.map((point) => ({ ...point }));
    this.points = this.boundary.map(() => vec2());
    this.previous = this.boundary.map(() => vec2());
    this.predicted = this.boundary.map(() => vec2());
    this.restTargets = this.boundary.map(() => vec2());
    this.edgeLengths = new Float32Array(this.boundary.length);
    this.bendLengths = new Float32Array(this.boundary.length);

    this.buildRestTargets(center, rotation, radius, 0, 0, true);
    for (let index = 0; index < this.points.length; index += 1) {
      copy(this.points[index], this.restTargets[index]);
      copy(this.previous[index], this.restTargets[index]);
    }
    // Initialize every vertex before measuring topology. Otherwise early
    // edges are measured against zeroed neighbours and fold the mesh.
    for (let index = 0; index < this.points.length; index += 1) {
      const next = (index + 1) % this.points.length;
      this.edgeLengths[index] = Math.hypot(
        this.points[next].x - this.points[index].x,
        this.points[next].y - this.points[index].y,
      );
      const bend = (index + 2) % this.points.length;
      this.bendLengths[index] = Math.hypot(
        this.points[bend].x - this.points[index].x,
        this.points[bend].y - this.points[index].y,
      );
    }
    this.targetArea = Math.abs(this.calculateSignedArea(this.points));
    this.currentArea = this.targetArea;
  }

  update(options: SoftBodyUpdateOptions): void {
    const dt = Math.min(Math.max(0, options.dt), 1 / 30);
    if (dt <= 0) return;
    this.buildRestTargets(
      options.center,
      options.rotation,
      options.radius,
      options.elapsedTime,
      options.normalizedSpeed,
      options.reducedMotion,
    );

    const referenceSteps = dt * 120;
    const damping = Math.pow(
      clamp(this.spec.damping, 0, 0.999),
      referenceSteps,
    );
    const guideBlend =
      1 -
      Math.pow(
        1 - clamp(this.spec.guideStrength, 0.001, 0.999),
        referenceSteps,
      );

    for (let index = 0; index < this.points.length; index += 1) {
      const point = this.points[index];
      const previous = this.previous[index];
      const currentX = point.x;
      const currentY = point.y;
      const velocityX = (currentX - previous.x) * damping;
      const velocityY = (currentY - previous.y) * damping;
      previous.x = currentX;
      previous.y = currentY;
      point.x =
        currentX +
        velocityX +
        (this.restTargets[index].x - currentX) * guideBlend;
      point.y =
        currentY +
        velocityY +
        (this.restTargets[index].y - currentY) * guideBlend;
      copy(this.predicted[index], point);
    }

    const iterations = Math.max(1, this.spec.constraintIterations);
    for (let iteration = 0; iteration < iterations; iteration += 1) {
      this.solveEdges();
      this.preserveArea();
      this.matchRestShape();
      this.alignCenter(options.center);
    }

    // Constraint corrections reshape the membrane but must not become
    // artificial velocity on the following Verlet frame.
    for (let index = 0; index < this.points.length; index += 1) {
      this.previous[index].x += this.points[index].x - this.predicted[index].x;
      this.previous[index].y += this.points[index].y - this.predicted[index].y;
    }
    this.currentArea = Math.abs(this.calculateSignedArea(this.points));
  }

  get areaRatio(): number {
    return this.currentArea / Math.max(EPSILON, this.targetArea);
  }

  private buildRestTargets(
    center: Vec2Like,
    rotation: number,
    radius: number,
    elapsedTime: number,
    normalizedSpeed: number,
    reducedMotion: boolean,
  ): void {
    const cosine = Math.cos(rotation);
    const sine = Math.sin(rotation);
    const motionScale = reducedMotion ? 0.2 : 1;
    const wave =
      Math.sin(elapsedTime * Math.PI * 2 * this.spec.deformationFrequency) *
      this.spec.deformationAmount *
      motionScale;

    for (let index = 0; index < this.boundary.length; index += 1) {
      const base = this.boundary[index];
      let localX = base.x * radius;
      let localY = base.y * radius;
      if (this.spec.deformationMode === "wing") {
        const wingWeight = Math.pow(Math.abs(base.y), 0.72);
        const travelingWave =
          Math.sin(
            elapsedTime * Math.PI * 2 * this.spec.deformationFrequency +
              Math.abs(base.y) * 1.35,
          ) *
          this.spec.deformationAmount *
          motionScale *
          (0.35 + normalizedSpeed * 0.65);
        localY *= 1 + travelingWave * wingWeight;
        localX -= travelingWave * wingWeight * radius * 0.22;
      } else if (this.spec.deformationMode === "pulse") {
        localX *= 1 + wave;
        localY *= 1 - wave * 0.72;
      }
      this.restTargets[index].x = center.x + localX * cosine - localY * sine;
      this.restTargets[index].y = center.y + localX * sine + localY * cosine;
    }
  }

  private solveEdges(): void {
    this.solveDistances(
      this.edgeLengths,
      1,
      clamp(this.spec.edgeStiffness, 0, 1),
    );
    this.solveDistances(
      this.bendLengths,
      2,
      clamp(this.spec.bendStiffness, 0, 1),
    );
  }

  private solveDistances(
    lengths: Float32Array,
    offset: number,
    stiffness: number,
  ): void {
    for (let index = 0; index < this.points.length; index += 1) {
      const next = (index + offset) % this.points.length;
      const left = this.points[index];
      const right = this.points[next];
      const deltaX = right.x - left.x;
      const deltaY = right.y - left.y;
      const distance = Math.max(EPSILON, Math.hypot(deltaX, deltaY));
      const correction =
        ((distance - lengths[index]) / distance) * stiffness * 0.5;
      left.x += deltaX * correction;
      left.y += deltaY * correction;
      right.x -= deltaX * correction;
      right.y -= deltaY * correction;
    }
  }

  private matchRestShape(): void {
    const stiffness = clamp(this.spec.shapeStiffness, 0, 1);
    for (let index = 0; index < this.points.length; index += 1) {
      this.points[index].x +=
        (this.restTargets[index].x - this.points[index].x) * stiffness;
      this.points[index].y +=
        (this.restTargets[index].y - this.points[index].y) * stiffness;
    }
  }

  private preserveArea(): void {
    const area = Math.abs(this.calculateSignedArea(this.points));
    if (area <= EPSILON) return;
    const centroid = this.calculateCentroid(this.points);
    const scaleError = clamp(
      Math.sqrt(this.targetArea / area) - 1,
      -0.18,
      0.18,
    );
    const correction = scaleError * clamp(this.spec.areaStiffness, 0, 1);
    for (let index = 0; index < this.points.length; index += 1) {
      const point = this.points[index];
      point.x += (point.x - centroid.x) * correction;
      point.y += (point.y - centroid.y) * correction;
    }
  }

  private alignCenter(center: Vec2Like): void {
    const centroid = this.calculateCentroid(this.points);
    const stiffness = clamp(this.spec.centerStiffness, 0, 1);
    const correctionX = (center.x - centroid.x) * stiffness;
    const correctionY = (center.y - centroid.y) * stiffness;
    for (let index = 0; index < this.points.length; index += 1) {
      this.points[index].x += correctionX;
      this.points[index].y += correctionY;
    }
  }

  private calculateSignedArea(points: readonly Vec2Like[]): number {
    let twiceArea = 0;
    for (let index = 0; index < points.length; index += 1) {
      const next = (index + 1) % points.length;
      twiceArea +=
        points[index].x * points[next].y - points[next].x * points[index].y;
    }
    return twiceArea * 0.5;
  }

  private calculateCentroid(points: readonly Vec2Like[]): Vec2Like {
    let x = 0;
    let y = 0;
    for (let index = 0; index < points.length; index += 1) {
      x += points[index].x;
      y += points[index].y;
    }
    this.centroid.x = x / points.length;
    this.centroid.y = y / points.length;
    return this.centroid;
  }
}
