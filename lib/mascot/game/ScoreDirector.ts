import { clamp } from "../core/NumericGuards";
import { STRUMRISE_CONFIG } from "./StrumriseConfig";
import type { StringPlatformKind } from "./GameTypes";

/**
 * Score/combo tracking — spec's "SCORE AND COMBO". This MVP implements
 * height + landing + kind bonuses and a combo multiplier; chord
 * completion, rhythm accuracy, collected glyphs, and risky-edge bonuses
 * are documented backlog (docs/mascot/STRUMRISE_DESIGN.md).
 */

export interface LandingScoreResult {
  pointsAwarded: number;
  combo: number;
}

export class ScoreDirector {
  private score = 0;
  private combo = 0;
  private timeSinceLastLanding = Infinity;

  registerLanding(
    kind: StringPlatformKind,
    heightClimbed: number,
  ): LandingScoreResult {
    const cfg = STRUMRISE_CONFIG.score;
    this.combo = clamp(this.combo + 1, 0, cfg.comboCap);
    this.timeSinceLastLanding = 0;

    const comboMultiplier = 1 + this.combo * cfg.comboStepBonus;
    const heightBonus = Math.max(0, heightClimbed) * cfg.heightPointsPerUnit;
    const kindBonus = cfg.kindBonus[kind];
    const points = Math.round(
      (cfg.basePoints + heightBonus + kindBonus) * comboMultiplier,
    );

    this.score += points;
    return { pointsAwarded: points, combo: this.combo };
  }

  /** Called once per fixed step; decays the combo after a beat of silence. */
  tick(dt: number): void {
    this.timeSinceLastLanding += dt;
    if (this.timeSinceLastLanding > STRUMRISE_CONFIG.score.comboResetSeconds) {
      this.combo = 0;
    }
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  /** Breaks the streak (e.g. a missed landing/respawn) without zeroing the run's total score. */
  resetCombo(): void {
    this.combo = 0;
    this.timeSinceLastLanding = Infinity;
  }

  reset(): void {
    this.score = 0;
    this.resetCombo();
  }
}
