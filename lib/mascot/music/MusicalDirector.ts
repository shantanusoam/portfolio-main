import type { StringPluckEvent } from "../types";

/**
 * Strum recognition and combo tracking: groups recent
 * `StringPluckEvent`s into a "strum" once enough distinct strings have
 * been crossed in a short window with a consistent direction, and tracks
 * a decaying combo count. Pure event-in, state-out — no DSP, no DOM, per
 * the upgrade spec's "keep physical collision independent from DSP
 * implementation."
 */

export interface StrumResult {
  stringIndexes: number[];
  direction: -1 | 1;
}

export interface MusicalDirectorConfig {
  strumWindowSeconds: number;
  minStringsForStrum: number;
  comboResetSeconds: number;
}

export class MusicalDirector {
  private recentEvents: StringPluckEvent[] = [];
  private combo = 0;
  private lastEventAt = -Infinity;

  /** Call once per fixed step with this frame's new pluck events (may be empty). */
  process(
    now: number,
    events: readonly StringPluckEvent[],
    config: MusicalDirectorConfig,
  ): StrumResult | null {
    if (events.length === 0) {
      if (now - this.lastEventAt > config.comboResetSeconds) this.combo = 0;
      return null;
    }

    for (const event of events) {
      this.recentEvents.push(event);
      this.combo += 1;
      this.lastEventAt = now;
    }

    this.recentEvents = this.recentEvents.filter(
      (event) => now - event.timestamp <= config.strumWindowSeconds,
    );

    const distinctStrings = Array.from(
      new Set(this.recentEvents.map((event) => event.stringIndex)),
    );
    if (distinctStrings.length < config.minStringsForStrum) return null;

    const firstDirection = this.recentEvents[0]?.direction;
    const consistentDirection = this.recentEvents.every(
      (event) => event.direction === firstDirection,
    );
    if (!consistentDirection || firstDirection === undefined) return null;

    distinctStrings.sort((a, b) => a - b);
    this.recentEvents = [];

    return { stringIndexes: distinctStrings, direction: firstDirection };
  }

  getCombo(): number {
    return this.combo;
  }

  reset(): void {
    this.recentEvents = [];
    this.combo = 0;
    this.lastEventAt = -Infinity;
  }
}
