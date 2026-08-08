/**
 * Fragment collection + combo for Resonance Weaver (V2 §27–29).
 */

import { clamp } from "../../core/NumericGuards";
import type { MusicalEvent } from "../../types";
import { resolvePortfolioModeNote } from "../../music/HarmonyMap";
import type { HeroProxyObject } from "./types";
import { circleVsCenteredRect, type GameRoot } from "./WeaverPhysics";
import { WEAVER_CONFIG } from "./WeaverConfig";

export interface CollectionEvent {
  proxyId: string;
  x: number;
  y: number;
  combo: number;
  points: number;
}

export class FragmentCollector {
  private collectedCount = 0;
  private score = 0;
  private combo = 0;
  private comboTimer = 0;
  private readonly events: CollectionEvent[] = [];
  private readonly musicalEvents: MusicalEvent[] = [];
  private readonly rootMidi: number;

  constructor(rootMidi = WEAVER_CONFIG.rootMidi) {
    this.rootMidi = rootMidi;
  }

  getCollectedCount(): number {
    return this.collectedCount;
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  drainCollectionEvents(): CollectionEvent[] {
    const out = this.events.slice();
    this.events.length = 0;
    return out;
  }

  drainMusicalEvents(): MusicalEvent[] {
    const out = this.musicalEvents.slice();
    this.musicalEvents.length = 0;
    return out;
  }

  updateComboDecay(dt: number): void {
    if (this.combo <= 0) return;
    this.comboTimer -= dt;
    if (this.comboTimer <= 0) {
      this.combo = Math.max(0, this.combo - 1);
      this.comboTimer = WEAVER_CONFIG.comboDecaySeconds * 0.5;
    }
  }

  /**
   * Mark intersecting uncollected proxies as collected.
   * Uses circle vs centered rect; swept via previous/current root.
   */
  collectOverlapping(
    root: GameRoot,
    proxies: readonly HeroProxyObject[],
    audioTime = 0,
  ): number {
    let got = 0;
    for (let i = 0; i < proxies.length; i += 1) {
      const p = proxies[i];
      if (p.collected || p.opacity < 0.05) continue;

      const hitNow = circleVsCenteredRect(
        root.x,
        root.y,
        root.radius,
        p.x,
        p.y,
        p.width,
        p.height,
      );
      const hitPrev = circleVsCenteredRect(
        root.previousX,
        root.previousY,
        root.radius,
        p.x,
        p.y,
        p.width,
        p.height,
      );
      if (!hitNow && !hitPrev) continue;

      p.collected = true;
      p.opacity = 0;
      p.velocityX = 0;
      p.velocityY = 0;
      this.collectedCount += 1;
      this.combo += 1;
      this.comboTimer = WEAVER_CONFIG.comboDecaySeconds;
      const points = 100 + this.combo * 25;
      this.score += points;
      got += 1;

      this.events.push({
        proxyId: p.id,
        x: p.x,
        y: p.y,
        combo: this.combo,
        points,
      });

      if (this.events.length > 16) this.events.shift();

      const note = resolvePortfolioModeNote(
        this.rootMidi,
        this.combo % 5,
        this.combo >= 6 ? 1 : 0,
      );
      this.musicalEvents.push({
        midiNote: this.rootMidi + (this.combo % 5),
        frequency: note.frequency,
        velocity: clamp(0.35 + this.combo * 0.05, 0.2, 0.9),
        brightness: 0.5 + Math.min(0.4, this.combo * 0.04),
        damping: 0.3,
        pan: clamp(p.x / 1000 - 0.5, -1, 1),
        reverbSend: this.combo >= 4 ? 0.35 : 0.12,
        articulation: this.combo >= 8 ? "strum" : "pluck",
        scheduledTime: audioTime,
      });
      if (this.musicalEvents.length > 12) this.musicalEvents.shift();
    }
    return got;
  }

  registerBounce(): void {
    this.combo += 1;
    this.comboTimer = WEAVER_CONFIG.comboDecaySeconds;
    this.score += 15 * this.combo;
  }

  reset(): void {
    this.collectedCount = 0;
    this.score = 0;
    this.combo = 0;
    this.comboTimer = 0;
    this.events.length = 0;
    this.musicalEvents.length = 0;
  }

  static winTarget(totalProxies: number): number {
    const fraction = Math.ceil(totalProxies * WEAVER_CONFIG.collectWinFraction);
    return Math.min(
      totalProxies,
      Math.max(WEAVER_CONFIG.collectWinMin, fraction),
    );
  }
}
