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
    jointCount: 30,
    segmentLength: 3.9,
    maxWidth: 40,
    coreRadius: 14,
    headScale: 2.85,
    bellyBias: 0.18,
    tailExponent: 1.45,
    shoulderPosition: 0.24,
  },
  {
    meals: 5,
    jointCount: 38,
    segmentLength: 4.05,
    maxWidth: 44,
    coreRadius: 15,
    headScale: 2.75,
    bellyBias: 0.2,
    tailExponent: 1.4,
    shoulderPosition: 0.23,
  },
  {
    meals: 10,
    jointCount: 46,
    segmentLength: 4.2,
    maxWidth: 48,
    coreRadius: 16,
    headScale: 2.65,
    bellyBias: 0.22,
    tailExponent: 1.35,
    shoulderPosition: 0.22,
  },
  {
    meals: 15,
    jointCount: 54,
    segmentLength: 4.3,
    maxWidth: 52,
    coreRadius: 17,
    headScale: 2.55,
    bellyBias: 0.24,
    tailExponent: 1.3,
    shoulderPosition: 0.22,
  },
  {
    meals: 20,
    jointCount: 60,
    segmentLength: 4.4,
    maxWidth: 56,
    coreRadius: 18,
    headScale: 2.5,
    bellyBias: 0.26,
    tailExponent: 1.25,
    shoulderPosition: 0.21,
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
  maxWidth: 40,
  headScale: 2.85,
  shoulderPosition: 0.24,
  tailExponent: 1.45,
  bellyBias: 0.18,
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
        13,
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
      head: region(0, 0.24, jointCount),
      shoulders: region(0.2, 0.3, jointCount),
      torso: region(0.3, 0.58, jointCount),
      tailBase: region(0.58, 0.82, jointCount),
      tailTip: region(0.82, 1, jointCount),
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
