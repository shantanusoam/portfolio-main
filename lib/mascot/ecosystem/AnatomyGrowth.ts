import type { SpineRegionBounds } from "../character/CreatureRecipe";
import type { BodyProfileConfig } from "../types";
import { clamp, lerp } from "../core/NumericGuards";

/** Meals an adult must eat before it can divide. */
export const MEALS_TO_FISSION = 20;

/** Topology rebuild milestones — width still eases every meal. */
export const JOINT_MILESTONE_MEALS = [0, 5, 10, 15, 20] as const;

export interface AnatomyMilestone {
  meals: number;
  jointCount: number;
  segmentLength: number;
  maxWidth: number;
  coreRadius: number;
  headScale: number;
  bellyBias: number;
  tailExponent: number;
  shoulderPosition: number;
}

/**
 * Long cute-fish growth up to ~60 joints. Length stays elegant (not a whip
 * ribbon); the head stays rounded rather than a flat wide wall; the tail
 * gets more of the spine so it reads as a flowing cute fin trail.
 */
export const ANATOMY_MILESTONES: readonly AnatomyMilestone[] = [
  {
    meals: 0,
    jointCount: 21,
    segmentLength: 6.4,
    maxWidth: 24.5,
    coreRadius: 11,
    headScale: 2.4,
    bellyBias: 0.12,
    tailExponent: 1.08,
    shoulderPosition: 0.28,
  },
  {
    meals: 5,
    jointCount: 23,
    segmentLength: 6.45,
    maxWidth: 26,
    coreRadius: 11.5,
    headScale: 2.38,
    bellyBias: 0.13,
    tailExponent: 1.06,
    shoulderPosition: 0.28,
  },
  {
    meals: 10,
    jointCount: 25,
    segmentLength: 6.5,
    maxWidth: 27.5,
    coreRadius: 12,
    headScale: 2.35,
    bellyBias: 0.14,
    tailExponent: 1.04,
    shoulderPosition: 0.27,
  },
  {
    meals: 15,
    jointCount: 27,
    segmentLength: 6.55,
    maxWidth: 29,
    coreRadius: 12.5,
    headScale: 2.32,
    bellyBias: 0.15,
    tailExponent: 1.02,
    shoulderPosition: 0.27,
  },
  {
    meals: 20,
    jointCount: 29,
    segmentLength: 6.6,
    maxWidth: 30.5,
    coreRadius: 13,
    headScale: 2.3,
    bellyBias: 0.16,
    tailExponent: 1,
    shoulderPosition: 0.26,
  },
];

export interface AnatomyState {
  mealsEaten: number;
  jointCount: number;
  segmentLength: number;
  bodyProfile: BodyProfileConfig;
  coreRadius: number;
  regions: {
    head: SpineRegionBounds;
    shoulders: SpineRegionBounds;
    torso: SpineRegionBounds;
    tailBase: SpineRegionBounds;
    tailTip: SpineRegionBounds;
  };
}

export interface AnatomyClampOptions {
  /** Maximum tip-to-tail length in CSS px. */
  maxSpineLength: number;
}

const BASE_PROFILE: BodyProfileConfig = {
  maxWidth: 24.5,
  headScale: 2.4,
  shoulderPosition: 0.28,
  tailExponent: 1.08,
  bellyBias: 0.12,
};

export function createBaseAnatomy(mealsEaten = 0): AnatomyState {
  return resolveAnatomyForMeals(mealsEaten);
}

export function resolveAnatomyForMeals(
  mealsEaten: number,
  clampOptions?: AnatomyClampOptions,
): AnatomyState {
  const meals = clamp(Math.floor(mealsEaten), 0, MEALS_TO_FISSION);
  const { lower, upper, t } = bracketMilestones(meals);

  let jointCount = lower.jointCount;
  // Reason: joint topology only jumps at milestones so we avoid rebuilding
  // every meal; width/segment still eases continuously for readable growth.
  for (const milestone of ANATOMY_MILESTONES) {
    if (meals >= milestone.meals) jointCount = milestone.jointCount;
  }

  let segmentLength = lerp(lower.segmentLength, upper.segmentLength, t);
  let maxWidth = lerp(lower.maxWidth, upper.maxWidth, t);
  let coreRadius = lerp(lower.coreRadius, upper.coreRadius, t);
  const headScale = lerp(lower.headScale, upper.headScale, t);
  const bellyBias = lerp(lower.bellyBias, upper.bellyBias, t);
  const tailExponent = lerp(lower.tailExponent, upper.tailExponent, t);
  const shoulderPosition = lerp(
    lower.shoulderPosition,
    upper.shoulderPosition,
    t,
  );

  if (clampOptions) {
    const rawLength = Math.max(1, jointCount - 1) * segmentLength;
    if (rawLength > clampOptions.maxSpineLength) {
      const lengthScale = clampOptions.maxSpineLength / Math.max(1, rawLength);
      segmentLength *= lengthScale;
      // Keep body plump when the viewport forces a shorter spine.
      maxWidth = Math.max(
        BASE_PROFILE.maxWidth * 0.92,
        maxWidth * Math.sqrt(Math.max(lengthScale, 0.6)),
      );
      coreRadius = Math.max(
        10,
        coreRadius * Math.sqrt(Math.max(lengthScale, 0.6)),
      );
    }
  }

  return {
    mealsEaten: meals,
    jointCount,
    segmentLength,
    coreRadius,
    bodyProfile: {
      maxWidth,
      headScale,
      shoulderPosition,
      tailExponent,
      bellyBias,
    },
    regions: {
      // Compact readable head, mid torso, long cute secondary tail (~42%).
      head: region(0, 0.2, jointCount),
      shoulders: region(0.16, 0.31, jointCount),
      torso: region(0.31, 0.64, jointCount),
      tailBase: region(0.64, 0.84, jointCount),
      tailTip: region(0.84, 1, jointCount),
    },
  };
}

/** Equal post-split anatomy — half the parent's meal progress, counters reset. */
export function anatomyAfterFission(parentMeals: number): AnatomyState {
  const inherited = Math.floor(clamp(parentMeals, 0, MEALS_TO_FISSION) / 2);
  const anatomy = resolveAnatomyForMeals(inherited);
  return { ...anatomy, mealsEaten: 0 };
}

export function spineLengthPx(anatomy: AnatomyState): number {
  return Math.max(0, anatomy.jointCount - 1) * anatomy.segmentLength;
}

export function maxSpineLengthForBounds(width: number, height: number): number {
  // Allow a long cute tail without filling half the viewport.
  return clamp(Math.min(width, height) * 0.4, 140, 320);
}

function bracketMilestones(meals: number): {
  lower: AnatomyMilestone;
  upper: AnatomyMilestone;
  t: number;
} {
  let lower = ANATOMY_MILESTONES[0];
  let upper = ANATOMY_MILESTONES[ANATOMY_MILESTONES.length - 1];
  for (let i = 0; i < ANATOMY_MILESTONES.length - 1; i += 1) {
    const a = ANATOMY_MILESTONES[i];
    const b = ANATOMY_MILESTONES[i + 1];
    if (meals >= a.meals && meals <= b.meals) {
      lower = a;
      upper = b;
      break;
    }
  }
  const span = Math.max(1, upper.meals - lower.meals);
  const t = clamp((meals - lower.meals) / span, 0, 1);
  return { lower, upper, t };
}

function region(
  startT: number,
  endT: number,
  jointCount: number,
): SpineRegionBounds {
  const last = Math.max(0, jointCount - 1);
  const start = clamp(Math.floor(startT * last), 0, last);
  const end = clamp(Math.floor(endT * last), start, last);
  return { start, end };
}
