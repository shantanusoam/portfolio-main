import type { MascotBehavior, MotionRecipe } from "../types";

/**
 * Starting per-behavior second-order dynamics values. Tune from actual
 * motion-lab review and record the visual reasoning in
 * docs/mascot/MOTION_RECIPES.md — these are not permanent magic constants.
 */
export const MOTION_RECIPES: Record<MascotBehavior, MotionRecipe> = {
  dormant: { frequency: 0.35, damping: 1.0, response: 0 },
  wake: { frequency: 0.95, damping: 0.96, response: 0.04 },
  follow: { frequency: 1.34, damping: 0.88, response: 0.02 },
  wander: { frequency: 1.05, damping: 0.62, response: -0.12 },
  inspect: { frequency: 1.3, damping: 0.86, response: 0 },
  orbit: { frequency: 1.2, damping: 0.75, response: 0.05 },
  avoid: { frequency: 2.6, damping: 0.78, response: 0.15 },
  sprint: { frequency: 2.4, damping: 0.52, response: 0.3 },
  rest: { frequency: 0.5, damping: 1.15, response: 0 },
  scatter: { frequency: 3.2, damping: 0.4, response: 0.4 },
  reform: { frequency: 1.4, damping: 0.9, response: 0 },
  reducedMotion: { frequency: 0.25, damping: 1.2, response: 0 },
};

/**
 * Deliberate prey chase — slower than pointer follow so shy fry get a real
 * escape window before the adult closes in.
 */
export const HUNT_MOTION_RECIPE: MotionRecipe = {
  frequency: 0.68,
  damping: 1.08,
  response: -0.05,
};

export function getMotionRecipe(behavior: MascotBehavior): MotionRecipe {
  return MOTION_RECIPES[behavior];
}
