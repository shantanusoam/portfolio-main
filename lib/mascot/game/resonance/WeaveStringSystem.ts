/**
 * Temporary player-woven musical strings (V2 §24, §49).
 * Cap at WEAVER_CONFIG.maxActiveStrings.
 */

import { clamp } from "../../core/NumericGuards";
import { resolvePortfolioModeNote } from "../../music/HarmonyMap";
import type { MusicalEvent } from "../../types";
import { WEAVER_CONFIG } from "./WeaverConfig";

export interface WeaveString {
  id: string;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  lifetime: number;
  maxLifetime: number;
  tension: number;
  midiNote: number;
  frequency: number;
  energy: number;
  active: boolean;
}

export interface WeavePreview {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  valid: boolean;
}

let nextStringId = 1;

export function resetWeaveStringIdsForTests(): void {
  nextStringId = 1;
}

export class WeaveStringSystem {
  private readonly strings: WeaveString[] = [];
  private preview: WeavePreview | null = null;
  private readonly maxActive: number;
  private readonly lifetime: number;
  private readonly rootMidi: number;

  constructor(
    options: {
      maxActive?: number;
      lifetime?: number;
      rootMidi?: number;
    } = {},
  ) {
    this.maxActive = options.maxActive ?? WEAVER_CONFIG.maxActiveStrings;
    this.lifetime = options.lifetime ?? WEAVER_CONFIG.stringLifetime;
    this.rootMidi = options.rootMidi ?? WEAVER_CONFIG.rootMidi;
  }

  getStrings(): readonly WeaveString[] {
    return this.strings;
  }

  getActiveCount(): number {
    return this.strings.reduce((n, s) => n + (s.active ? 1 : 0), 0);
  }

  getPreview(): WeavePreview | null {
    return this.preview;
  }

  beginPreview(ax: number, ay: number): void {
    this.preview = { ax, ay, bx: ax, by: ay, valid: false };
  }

  updatePreview(bx: number, by: number): void {
    if (!this.preview) return;
    this.preview.bx = bx;
    this.preview.by = by;
    const len = Math.hypot(bx - this.preview.ax, by - this.preview.ay);
    this.preview.valid =
      len >= WEAVER_CONFIG.minStringLength &&
      len <= WEAVER_CONFIG.maxStringLength &&
      this.getActiveCount() < this.maxActive;
  }

  cancelPreview(): void {
    this.preview = null;
  }

  /** Commit preview if valid; returns the new string or null. */
  commitPreview(): WeaveString | null {
    const preview = this.preview;
    this.preview = null;
    if (!preview?.valid) return null;
    return this.createString(preview.ax, preview.ay, preview.bx, preview.by);
  }

  createString(
    ax: number,
    ay: number,
    bx: number,
    by: number,
  ): WeaveString | null {
    if (this.getActiveCount() >= this.maxActive) return null;
    const len = Math.hypot(bx - ax, by - ay);
    if (
      len < WEAVER_CONFIG.minStringLength ||
      len > WEAVER_CONFIG.maxStringLength
    ) {
      return null;
    }

    // Evict oldest if somehow over capacity.
    while (this.getActiveCount() >= this.maxActive) {
      const oldest = this.strings.find((s) => s.active);
      if (!oldest) break;
      oldest.active = false;
    }

    const midY = (ay + by) * 0.5;
    const degree = Math.floor(clamp(midY / 80, 0, 8));
    const note = resolvePortfolioModeNote(this.rootMidi, degree, 0);
    const midi = this.rootMidi + (degree % 5) * 2;

    const woven: WeaveString = {
      id: `weave-${nextStringId++}`,
      ax,
      ay,
      bx,
      by,
      lifetime: this.lifetime,
      maxLifetime: this.lifetime,
      tension: clamp(len / WEAVER_CONFIG.maxStringLength, 0.15, 1),
      midiNote: midi,
      frequency: note.frequency,
      energy: 1,
      active: true,
    };
    this.strings.push(woven);
    // Bound array growth — drop inactive tails.
    if (this.strings.length > this.maxActive * 3) {
      const kept = this.strings.filter((s) => s.active);
      this.strings.length = 0;
      this.strings.push(...kept);
    }
    return woven;
  }

  update(dt: number): void {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    for (let i = 0; i < this.strings.length; i += 1) {
      const s = this.strings[i];
      if (!s.active) continue;
      s.lifetime -= step;
      s.energy = clamp(s.lifetime / s.maxLifetime, 0, 1);
      if (s.lifetime <= 0) s.active = false;
    }
  }

  /**
   * Build a MusicalEvent for a string bounce impact (caller schedules audio).
   */
  makeImpactEvent(
    string: WeaveString,
    impactVelocity: number,
    audioTime: number,
  ): MusicalEvent {
    const velocity = clamp(Math.abs(impactVelocity) / 900, 0.12, 0.95);
    return {
      midiNote: string.midiNote,
      frequency: string.frequency,
      velocity,
      brightness: 0.35 + string.tension * 0.45,
      damping: 0.35 + (1 - string.energy) * 0.4,
      pan: clamp((string.ax + string.bx) / 2000 - 0.5, -1, 1),
      reverbSend: 0.12 + string.tension * 0.2,
      articulation: "pluck",
      scheduledTime: audioTime,
    };
  }

  clear(): void {
    this.strings.length = 0;
    this.preview = null;
  }
}
