const COMBO_WINDOW_MS = 650;

export class ScoreSystem {
  score = 0;
  combo = 0;
  bestCombo = 0;
  private lastSliceAt = -Infinity;

  registerSlice(basePoints: number, nowMs: number): { gained: number; combo: number; comboBroken: boolean } {
    const comboBroken = nowMs - this.lastSliceAt > COMBO_WINDOW_MS;
    this.combo = comboBroken ? 1 : this.combo + 1;
    this.lastSliceAt = nowMs;
    this.bestCombo = Math.max(this.bestCombo, this.combo);

    const multiplier = 1 + (this.combo - 1) * 0.5;
    const gained = Math.round(basePoints * multiplier);
    this.score += gained;

    return { gained, combo: this.combo, comboBroken };
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    this.bestCombo = 0;
    this.lastSliceAt = -Infinity;
  }
}
