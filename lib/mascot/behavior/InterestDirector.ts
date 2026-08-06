import { SeededRandom } from "../core/SeededRandom";

/**
 * Selects a project-card (or other "interest") target for the inspect
 * state: avoids reselecting the same target too soon and enforces a
 * cooldown between inspections so the mascot doesn't fixate on one card.
 */

export interface InterestCandidate {
  id: string;
}

export interface InterestDirectorConfig {
  cooldownSeconds: number;
  /** How many other selections must happen before an id can repeat. */
  minRevisitGap: number;
}

export class InterestDirector {
  private readonly rng: SeededRandom;
  private readonly config: InterestDirectorConfig;
  private recentIds: string[] = [];
  private cooldownRemaining = 0;

  constructor(seed: number, config: InterestDirectorConfig) {
    this.rng = new SeededRandom(seed);
    this.config = config;
  }

  tick(dt: number): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    this.cooldownRemaining = Math.max(0, this.cooldownRemaining - dt);
  }

  canSelect(): boolean {
    return this.cooldownRemaining <= 0;
  }

  getCooldownRemaining(): number {
    return this.cooldownRemaining;
  }

  select<T extends InterestCandidate>(candidates: readonly T[]): T | null {
    if (candidates.length === 0 || !this.canSelect()) return null;

    const gap = Math.max(0, this.config.minRevisitGap);
    const avoidSet = new Set(gap > 0 ? this.recentIds.slice(-gap) : []);
    let pool: readonly T[] = candidates.filter(
      (candidate) => !avoidSet.has(candidate.id),
    );
    if (pool.length === 0) pool = candidates;

    const chosen = this.rng.pick(pool);
    this.recentIds.push(chosen.id);
    if (this.recentIds.length > 16) this.recentIds.shift();
    this.cooldownRemaining = this.config.cooldownSeconds;
    return chosen;
  }
}
