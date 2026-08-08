import { clamp, lerp } from "../core/NumericGuards";
import type { MascotObstacle, Point } from "../types";
import {
  closestPointOnRectangle,
  isInsideRectangle,
  type Rectangle,
} from "./RectangleSteering";

/**
 * Sparse homepage physical interactions (V2 Phase 4): perch on decorative
 * bars / soft top edges, lateral slide while perched, drag resistance into
 * hard UI, and inspect bias toward marked interest targets.
 *
 * All geometry comes from cached `MascotObstacle` rectangles — never
 * measures the DOM. Pure math + small mutable state updated once per
 * fixed step by `MascotRuntime`.
 */

export interface HeroInteractionConfig {
  /** Vertical band above a perch/soft top edge that counts as "landing". */
  perchSnapDistance: number;
  /** How close to the top edge (below) still counts as perched. */
  perchSurfaceSlack: number;
  /** Horizontal inset so the creature does not sit past bar ends. */
  perchEdgeInset: number;
  /** px — stretch length that maps to dragTension = 1. */
  maxDragStretch: number;
  /** How strongly the resisted target is pulled back from the pointer. */
  dragResistGain: number;
  /** Minimum dragTension that can fire a release rebound. */
  reboundTensionThreshold: number;
  /** Multiplier converting last stretch into a rebound target offset (px). */
  reboundGain: number;
  /** Seconds the rebound target remains active after release. */
  reboundDuration: number;
  /** Prefer interest targets whose tag matches (e.g. "hero"). */
  preferredInterestTag: string;
  /** Extra weight for preferred interest tags during selection. */
  preferredInterestWeight: number;
}

export const DEFAULT_HERO_INTERACTION_CONFIG: HeroInteractionConfig = {
  perchSnapDistance: 36,
  perchSurfaceSlack: 14,
  perchEdgeInset: 18,
  maxDragStretch: 90,
  dragResistGain: 0.85,
  reboundTensionThreshold: 0.35,
  reboundGain: 55,
  reboundDuration: 0.28,
  preferredInterestTag: "hero",
  preferredInterestWeight: 2.5,
};

export type HeroSurfaceMode = "none" | "perch" | "slide";

export interface DragResistanceInput {
  rootX: number;
  rootY: number;
  pointerX: number;
  pointerY: number;
  pointerActive: boolean;
  hardObstacles: readonly Rectangle[];
  /** Combined hard steering force already computed for the root. */
  hardForceX: number;
  hardForceY: number;
  config?: Partial<HeroInteractionConfig>;
}

export interface DragResistanceResult {
  dragTension: number;
  /** Follow target after hard-obstacle resistance is applied. */
  adjustedPointer: Point;
  /** Stretch vector root → resisted pointer (for rebound / face). */
  stretchX: number;
  stretchY: number;
}

/**
 * When dragging toward a hard rectangle, the root resists: the follow
 * target is pulled back along the escape normal and dragTension rises
 * with penetration intent × stretch length.
 */
export function computeDragResistance(
  input: DragResistanceInput,
): DragResistanceResult {
  const config = { ...DEFAULT_HERO_INTERACTION_CONFIG, ...input.config };
  const pointer: Point = { x: input.pointerX, y: input.pointerY };

  if (!input.pointerActive) {
    return {
      dragTension: 0,
      adjustedPointer: pointer,
      stretchX: 0,
      stretchY: 0,
    };
  }

  const toPointerX = input.pointerX - input.rootX;
  const toPointerY = input.pointerY - input.rootY;
  const toPointerLen = Math.hypot(toPointerX, toPointerY);
  const forceMag = Math.hypot(input.hardForceX, input.hardForceY);

  // Dragging "into" the obstacle when the escape force opposes the pull.
  const intoObstacle =
    forceMag > 1e-3 &&
    toPointerLen > 1e-3 &&
    input.hardForceX * toPointerX + input.hardForceY * toPointerY < 0;

  let nearestPenetration = 0;
  for (const obstacle of input.hardObstacles) {
    if (isInsideRectangle(input.pointerX, input.pointerY, obstacle)) {
      nearestPenetration = 1;
      break;
    }
    const closest = closestPointOnRectangle(
      input.pointerX,
      input.pointerY,
      obstacle,
    );
    const gap = Math.hypot(
      input.pointerX - closest.x,
      input.pointerY - closest.y,
    );
    // Reason: only count near-misses as resistance pressure so distant
    // hard UI does not invent fake stretch while the pointer is free.
    if (gap < 48) {
      nearestPenetration = Math.max(nearestPenetration, 1 - gap / 48);
    }
  }

  if (!intoObstacle && nearestPenetration <= 0) {
    return {
      dragTension: 0,
      adjustedPointer: pointer,
      stretchX: toPointerX,
      stretchY: toPointerY,
    };
  }

  const stretchFactor = clamp(toPointerLen / config.maxDragStretch, 0, 1);
  const forceFactor = clamp(forceMag / 140, 0, 1);
  const dragTension = clamp(
    Math.max(forceFactor, nearestPenetration) * stretchFactor,
    0,
    1,
  );

  const escapeX = forceMag > 1e-3 ? input.hardForceX / forceMag : 0;
  const escapeY = forceMag > 1e-3 ? input.hardForceY / forceMag : 0;
  const pullBack = dragTension * config.dragResistGain * config.maxDragStretch;

  const adjustedPointer: Point = {
    x: input.pointerX + escapeX * pullBack,
    y: input.pointerY + escapeY * pullBack,
  };

  return {
    dragTension,
    adjustedPointer,
    stretchX: adjustedPointer.x - input.rootX,
    stretchY: adjustedPointer.y - input.rootY,
  };
}

export interface PerchCandidate {
  id: string;
  left: number;
  right: number;
  /** Y of the walkable top edge (viewport coords). */
  topY: number;
}

/** Soft and explicit perch rectangles expose their top edge as a perch line. */
export function collectPerchCandidates(
  obstacles: readonly MascotObstacle[],
): PerchCandidate[] {
  const out: PerchCandidate[] = [];
  for (const obstacle of obstacles) {
    if (obstacle.mode !== "perch" && obstacle.mode !== "soft") continue;
    out.push({
      id: obstacle.id,
      left: obstacle.left,
      right: obstacle.right,
      // Soft rectangles use padded top; perch sits on the visual top edge.
      topY: obstacle.top + obstacle.padding * 0.35,
    });
  }
  return out;
}

export function findNearestPerch(
  rootX: number,
  rootY: number,
  candidates: readonly PerchCandidate[],
  config: HeroInteractionConfig = DEFAULT_HERO_INTERACTION_CONFIG,
): PerchCandidate | null {
  let best: PerchCandidate | null = null;
  let bestScore = Infinity;

  for (const candidate of candidates) {
    const insetLeft = candidate.left + config.perchEdgeInset;
    const insetRight = candidate.right - config.perchEdgeInset;
    if (insetRight <= insetLeft) continue;

    const clampedX = clamp(rootX, insetLeft, insetRight);
    const dx = rootX - clampedX;
    const dy = rootY - candidate.topY;
    // Above the bar within snap distance, or just below within slack.
    const aboveOk = dy >= -config.perchSnapDistance && dy <= 0;
    const belowOk = dy > 0 && dy <= config.perchSurfaceSlack;
    if (!aboveOk && !belowOk) continue;

    const score = Math.hypot(dx, dy);
    if (score < bestScore) {
      bestScore = score;
      best = candidate;
    }
  }

  return best;
}

export function perchPointOnBar(
  rootX: number,
  candidate: PerchCandidate,
  config: HeroInteractionConfig = DEFAULT_HERO_INTERACTION_CONFIG,
): Point {
  const insetLeft = candidate.left + config.perchEdgeInset;
  const insetRight = candidate.right - config.perchEdgeInset;
  return {
    x: clamp(rootX, insetLeft, insetRight),
    y: candidate.topY,
  };
}

/**
 * Lateral slide: keep Y on the perch line, allow X to track a desired
 * horizontal target (pointer or wander) within the bar insets.
 */
export function slideAlongPerch(
  desiredX: number,
  candidate: PerchCandidate,
  config: HeroInteractionConfig = DEFAULT_HERO_INTERACTION_CONFIG,
): Point {
  const insetLeft = candidate.left + config.perchEdgeInset;
  const insetRight = candidate.right - config.perchEdgeInset;
  return {
    x: clamp(desiredX, insetLeft, insetRight),
    y: candidate.topY,
  };
}

export interface InterestWithTag {
  id: string;
  tag?: string | null;
  centerX: number;
  centerY: number;
}

/**
 * Weighted inspect pick: preferred tags (hero) get more tickets, then
 * proximity to the creature mildly biases the draw. Deterministic given
 * the same rng sample.
 */
export function pickWeightedInterest<T extends InterestWithTag>(
  candidates: readonly T[],
  rootX: number,
  rootY: number,
  unitSample: number,
  config: HeroInteractionConfig = DEFAULT_HERO_INTERACTION_CONFIG,
): T | null {
  if (candidates.length === 0) return null;
  const sample = clamp(unitSample, 0, 1);

  let total = 0;
  const weights: number[] = [];
  for (const candidate of candidates) {
    const dist = Math.hypot(
      candidate.centerX - rootX,
      candidate.centerY - rootY,
    );
    const proximity = 1 / (1 + dist / 280);
    const tagBonus =
      candidate.tag === config.preferredInterestTag
        ? config.preferredInterestWeight
        : 1;
    const weight = tagBonus * (0.55 + proximity);
    weights.push(weight);
    total += weight;
  }

  let ticket = sample * total;
  for (let i = 0; i < candidates.length; i += 1) {
    ticket -= weights[i];
    if (ticket <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

export interface HeroInteractionFrame {
  surfaceMode: HeroSurfaceMode;
  perched: boolean;
  surfaceTarget: Point | null;
  dragTension: number;
  adjustedPointer: Point | null;
  reboundOffset: Point | null;
  activePerchId: string | null;
}

/**
 * Owns perch/slide latch + drag tension smoothing + rebound timer.
 * Call `update()` once per fixed step with cached obstacle geometry.
 */
export class HeroInteractionDirector {
  private readonly config: HeroInteractionConfig;
  private activePerch: PerchCandidate | null = null;
  private dragTension = 0;
  private lastStretchX = 0;
  private lastStretchY = 0;
  private wasPointerActive = false;
  private reboundRemaining = 0;
  private reboundX = 0;
  private reboundY = 0;

  constructor(config: Partial<HeroInteractionConfig> = {}) {
    this.config = { ...DEFAULT_HERO_INTERACTION_CONFIG, ...config };
  }

  getDragTension(): number {
    return this.dragTension;
  }

  getConfig(): Readonly<HeroInteractionConfig> {
    return this.config;
  }

  clearPerch(): void {
    this.activePerch = null;
  }

  update(input: {
    dt: number;
    rootX: number;
    rootY: number;
    pointerX: number;
    pointerY: number;
    pointerActive: boolean;
    /** When true, perch/slide yields to pointer follow (except drag resist). */
    allowPerch: boolean;
    obstacles: readonly MascotObstacle[];
    hardForceX: number;
    hardForceY: number;
    desiredSlideX: number;
  }): HeroInteractionFrame {
    const dt = Number.isFinite(input.dt) && input.dt > 0 ? input.dt : 0;

    const hardObstacles = input.obstacles.filter((o) => o.mode === "hard");
    const drag = computeDragResistance({
      rootX: input.rootX,
      rootY: input.rootY,
      pointerX: input.pointerX,
      pointerY: input.pointerY,
      pointerActive: input.pointerActive,
      hardObstacles,
      hardForceX: input.hardForceX,
      hardForceY: input.hardForceY,
      config: this.config,
    });

    // Smooth tension so face/deform consumers do not flicker.
    const tensionTarget = drag.dragTension;
    const tensionRate = clamp(dt * 10, 0, 1);
    this.dragTension = lerp(this.dragTension, tensionTarget, tensionRate);

    if (input.pointerActive && this.dragTension > 0.05) {
      this.lastStretchX = drag.stretchX;
      this.lastStretchY = drag.stretchY;
    }

    let reboundOffset: Point | null = null;
    if (this.wasPointerActive && !input.pointerActive) {
      if (this.dragTension >= this.config.reboundTensionThreshold) {
        const len = Math.hypot(this.lastStretchX, this.lastStretchY) || 1;
        const nx = this.lastStretchX / len;
        const ny = this.lastStretchY / len;
        this.reboundX = -nx * this.config.reboundGain * this.dragTension;
        this.reboundY = -ny * this.config.reboundGain * this.dragTension;
        this.reboundRemaining = this.config.reboundDuration;
      }
      this.dragTension = 0;
    }
    this.wasPointerActive = input.pointerActive;

    if (this.reboundRemaining > 0 && dt > 0) {
      const t = clamp(
        this.reboundRemaining / this.config.reboundDuration,
        0,
        1,
      );
      reboundOffset = { x: this.reboundX * t, y: this.reboundY * t };
      this.reboundRemaining = Math.max(0, this.reboundRemaining - dt);
    }

    let surfaceMode: HeroSurfaceMode = "none";
    let surfaceTarget: Point | null = null;

    if (input.allowPerch && !input.pointerActive) {
      const candidates = collectPerchCandidates(input.obstacles);
      if (this.activePerch) {
        const still = candidates.find((c) => c.id === this.activePerch!.id);
        if (!still) {
          this.activePerch = null;
        } else {
          this.activePerch = still;
          const onBar =
            Math.abs(input.rootY - still.topY) <=
              this.config.perchSurfaceSlack + 8 &&
            input.rootX >= still.left &&
            input.rootX <= still.right;
          if (!onBar) {
            this.activePerch = null;
          }
        }
      }

      if (!this.activePerch) {
        this.activePerch = findNearestPerch(
          input.rootX,
          input.rootY,
          candidates,
          this.config,
        );
      }

      if (this.activePerch) {
        const sliding =
          Math.abs(input.desiredSlideX - input.rootX) > 6 ||
          Math.abs(input.pointerX - input.rootX) > 10;
        surfaceMode = sliding ? "slide" : "perch";
        surfaceTarget = slideAlongPerch(
          input.desiredSlideX,
          this.activePerch,
          this.config,
        );
      }
    } else if (input.pointerActive) {
      this.activePerch = null;
    }

    return {
      surfaceMode,
      perched: this.activePerch !== null && surfaceMode !== "none",
      surfaceTarget,
      dragTension: this.dragTension,
      adjustedPointer: input.pointerActive ? drag.adjustedPointer : null,
      reboundOffset,
      activePerchId: this.activePerch?.id ?? null,
    };
  }
}
