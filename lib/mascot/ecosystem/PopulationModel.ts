import type { MascotEcosystemStatus } from "../types";

export const MAX_ADULT_FISH = 4;
export const FIRST_FISSION_MEALS = 3;
export const SECOND_FISSION_MEALS = 4;

export type FeedOutcome = "growth" | "fission" | "bloom" | "ignored";

/**
 * Pure population bookkeeping for Signal Shoal. Spatial simulation and
 * choreography live in FishEcosystem; this class keeps spawn/fission rules
 * deterministic and independently testable.
 */
export class PopulationModel {
  private population: 1 | 2 | 4 = 1;
  private stageMeals = 0;
  private activeFry = false;
  private fissionPending = false;

  requestFry(): boolean {
    if (this.activeFry || this.fissionPending) return false;
    this.activeFry = true;
    return true;
  }

  cancelFry(): void {
    this.activeFry = false;
  }

  consumeFry(): FeedOutcome {
    if (!this.activeFry) return "ignored";
    this.activeFry = false;

    if (this.population === MAX_ADULT_FISH) return "bloom";

    this.stageMeals += 1;
    if (this.stageMeals >= this.threshold()) {
      this.fissionPending = true;
      return "fission";
    }
    return "growth";
  }

  completeFission(): 2 | 4 {
    if (!this.fissionPending) return this.population === 1 ? 2 : 4;
    this.population = this.population === 1 ? 2 : 4;
    this.stageMeals = 0;
    this.fissionPending = false;
    return this.population;
  }

  getPopulation(): 1 | 2 | 4 {
    return this.population;
  }

  getStageMeals(): number {
    return this.stageMeals;
  }

  isFissionPending(): boolean {
    return this.fissionPending;
  }

  hasActiveFry(): boolean {
    return this.activeFry;
  }

  getStatus(
    canReleaseFry = !this.activeFry && !this.fissionPending,
  ): MascotEcosystemStatus {
    const capped = this.population === MAX_ADULT_FISH;
    return {
      population: this.population,
      activeFry: this.activeFry,
      growthStage: this.stageMeals,
      mealsToNextFission: capped
        ? 0
        : Math.max(0, this.threshold() - this.stageMeals),
      fissionPhase: null,
      capped,
      canReleaseFry,
    };
  }

  private threshold(): number {
    return this.population === 1 ? FIRST_FISSION_MEALS : SECOND_FISSION_MEALS;
  }
}
