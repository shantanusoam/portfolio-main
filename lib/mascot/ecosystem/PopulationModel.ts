import type { MascotEcosystemStatus } from "../types";
import { MEALS_TO_FISSION } from "./AnatomyGrowth";

export const MAX_ADULT_FISH = 4;
/** How many tiny fish one egg click scatters across the page. */
export const FRY_SCHOOL_SIZE = 5;
export const MAX_ACTIVE_FRY = 8;

export type FeedOutcome = "growth" | "fission" | "bloom" | "ignored";

/**
 * Pure population bookkeeping for Signal Shoal. Per-adult meal counters and
 * anatomy live on EcosystemAdult; this class only tracks fry locks, fission
 * locks, and the 1–4 adult cap.
 */
export class PopulationModel {
  private population = 1;
  private activeFryCount = 0;
  private fissionPending = false;

  requestSchool(count: number): number {
    if (this.activeFryCount > 0 || this.fissionPending) return 0;
    const allowed = Math.max(
      0,
      Math.min(MAX_ACTIVE_FRY, Math.floor(count)),
    );
    if (allowed <= 0) return 0;
    this.activeFryCount = allowed;
    return allowed;
  }

  /** @deprecated Prefer requestSchool — kept for single-fry call sites/tests. */
  requestFry(): boolean {
    return this.requestSchool(1) === 1;
  }

  cancelFry(): void {
    this.activeFryCount = 0;
  }

  /**
   * Clears one active fry. `eaterMealsAfterFeed` is the eater's meal count
   * after incrementing; `canSplit` is true when replacing that one adult with
   * two children would stay within the population cap.
   */
  consumeFry(eaterMealsAfterFeed: number, canSplit: boolean): FeedOutcome {
    if (this.activeFryCount <= 0) return "ignored";
    this.activeFryCount -= 1;

    if (this.population >= MAX_ADULT_FISH) return "bloom";

    if (eaterMealsAfterFeed >= MEALS_TO_FISSION && canSplit) {
      this.fissionPending = true;
      return "fission";
    }
    return "growth";
  }

  /**
   * Replaces one dividing adult with two children (+1 population).
   */
  completeFission(): number {
    if (!this.fissionPending) return this.population;
    this.population = Math.min(MAX_ADULT_FISH, this.population + 1);
    this.fissionPending = false;
    return this.population;
  }

  getPopulation(): number {
    return this.population;
  }

  isFissionPending(): boolean {
    return this.fissionPending;
  }

  hasActiveFry(): boolean {
    return this.activeFryCount > 0;
  }

  getActiveFryCount(): number {
    return this.activeFryCount;
  }

  canSplitOneAdult(): boolean {
    return this.population < MAX_ADULT_FISH;
  }

  getStatus(
    canReleaseFry = this.activeFryCount === 0 && !this.fissionPending,
    growthStage = 0,
    mealsToNextFission = MEALS_TO_FISSION,
  ): MascotEcosystemStatus {
    const capped = this.population >= MAX_ADULT_FISH;
    return {
      population: this.population,
      activeFry: this.activeFryCount > 0,
      activeFryCount: this.activeFryCount,
      growthStage,
      mealsToNextFission: capped ? 0 : mealsToNextFission,
      fissionPhase: null,
      capped,
      canReleaseFry,
    };
  }
}
