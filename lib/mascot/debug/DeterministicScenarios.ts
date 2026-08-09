import type { MascotEngine, ScenarioName } from "../types";

/**
 * Scripted engine call sequences for visually reviewing and regression
 * testing specific motion situations from the motion lab. Each scenario is
 * a plain function of (engine, elapsedSeconds) so it can be driven by
 * either real rAF time or a scripted test clock — nothing here depends on
 * wall-clock Date.now().
 *
 * Implements a practical subset of the spec's scenario list; the rest
 * (rectangle-corner, inspect-card, scatter-reform as scripted sequences,
 * resize) are exercised manually today and are natural follow-ups once a
 * ReplayRecorder lands — see docs/mascot/ARCHITECTURE.md.
 */

export type ScenarioRunner = (
  engine: MascotEngine,
  elapsedSeconds: number,
  width: number,
  height: number,
) => void;

export const SCENARIOS: Partial<Record<ScenarioName, ScenarioRunner>> = {
  "follow-horizontal": (engine, t, width, height) => {
    const cycle = t % 4;
    const progress = cycle / 4;
    const x = width * 0.15 + progress * width * 0.7;
    engine.setPointer(x, height * 0.5, true);
  },

  "follow-circle": (engine, t, width, height) => {
    const angle = t * 1.2;
    const radius = Math.min(width, height) * 0.25;
    engine.setPointer(
      width / 2 + Math.cos(angle) * radius,
      height / 2 + Math.sin(angle) * radius,
      true,
    );
  },

  "hard-turn": (engine, t, width, height) => {
    const cycle = t % 2;
    const x = cycle < 1 ? width * 0.2 : width * 0.8;
    engine.setPointer(x, height * 0.4, true);
  },

  "wander-loop": (engine) => {
    engine.setPointer(0, 0, false);
  },

  "scatter-reform": (engine, t) => {
    const cycle = t % 3;
    if (cycle < 0.05) engine.trigger({ type: "scatter" });
    if (cycle > 1.2 && cycle < 1.25) engine.trigger({ type: "reform" });
  },

  "fry-chase": (engine, t, width, height) => {
    const cycle = t % 6;
    if (cycle < 0.05) {
      engine.trigger({
        type: "releaseFry",
        x: width * 0.72,
        y: height * 0.3,
      });
    }
    if (cycle > 0.4) engine.trigger({ type: "callFish" });
  },

  "ecosystem-growth": (engine, t, width, height) => {
    const cycle = t % 4.5;
    if (cycle < 0.05) {
      engine.trigger({
        type: "releaseFry",
        x: width * 0.68,
        y: height * 0.36,
      });
    }
    if (cycle > 0.35) engine.trigger({ type: "callFish" });
  },

  "reduced-motion": (engine) => {
    engine.setReducedMotion(true);
  },
};

export function playScenario(
  name: ScenarioName,
  engine: MascotEngine,
  elapsedSeconds: number,
  width: number,
  height: number,
): void {
  const runner = SCENARIOS[name];
  if (!runner) return;
  runner(engine, elapsedSeconds, width, height);
}

export function listScenarios(): ScenarioName[] {
  return Object.keys(SCENARIOS) as ScenarioName[];
}
