import { clamp } from "./NumericGuards";
import type { MascotQuality, PerformanceState } from "../types";

/**
 * Tracks frame-time statistics and decides quality-tier changes. Downgrades
 * readily, upgrades at most once per session, and never changes quality
 * while `blocked` (e.g. mid-sprint/scatter) is true — see
 * .claude/skills/rendering-dot-creatures/references/quality-tiers.md.
 */

const QUALITY_ORDER: readonly MascotQuality[] = [
  "reduced",
  "low",
  "medium",
  "high",
];

const DOWNGRADE_COOLDOWN_MS = 4000;
const UPGRADE_COOLDOWN_MS = 8000;
const SAMPLE_WINDOW = 90; // ~1.5s at 60fps
const SLOW_FRAME_MS = 20;
const UPGRADE_CANDIDATE_AVERAGE_MS = 10;

export interface PerformanceGovernorOptions {
  initialQuality: MascotQuality;
  allowUpgrade?: boolean;
  now?: () => number;
}

export class PerformanceGovernor {
  private samples: number[] = [];
  private quality: MascotQuality;
  private readonly allowUpgrade: boolean;
  private hasUpgraded = false;
  private lastQualityChange = 0;
  private droppedSimulationTime = 0;
  private readonly now: () => number;

  constructor(options: PerformanceGovernorOptions) {
    this.quality = options.initialQuality;
    this.allowUpgrade = options.allowUpgrade ?? true;
    this.now = options.now ?? (() => Date.now());
  }

  recordFrame(ms: number): void {
    if (!Number.isFinite(ms) || ms < 0) return;
    this.samples.push(ms);
    if (this.samples.length > SAMPLE_WINDOW) {
      this.samples.shift();
    }
  }

  recordDroppedSimulationTime(): void {
    this.droppedSimulationTime += 1;
  }

  /**
   * Evaluates current stats and returns a new quality if a change should
   * happen this frame, or null otherwise. `blocked` should be true during
   * sprint/scatter/inspect-lock states.
   */
  evaluate(blocked: boolean): MascotQuality | null {
    if (this.samples.length < SAMPLE_WINDOW / 3) return null;

    const state = this.getState();
    const nowMs = this.now();
    const sinceChange = nowMs - this.lastQualityChange;

    if (blocked) return null;

    const currentIndex = QUALITY_ORDER.indexOf(this.quality);

    if (
      state.averageFrameMs > SLOW_FRAME_MS &&
      sinceChange > DOWNGRADE_COOLDOWN_MS
    ) {
      if (currentIndex > 0) {
        const next = QUALITY_ORDER[currentIndex - 1];
        this.applyQuality(next, nowMs);
        return next;
      }
    } else if (
      this.allowUpgrade &&
      !this.hasUpgraded &&
      state.averageFrameMs < UPGRADE_CANDIDATE_AVERAGE_MS &&
      state.worstFrameMs < SLOW_FRAME_MS &&
      sinceChange > UPGRADE_COOLDOWN_MS
    ) {
      if (currentIndex < QUALITY_ORDER.length - 1) {
        const next = QUALITY_ORDER[currentIndex + 1];
        this.applyQuality(next, nowMs);
        this.hasUpgraded = true;
        return next;
      }
    }

    return null;
  }

  private applyQuality(quality: MascotQuality, nowMs: number): void {
    this.quality = quality;
    this.lastQualityChange = nowMs;
  }

  setQuality(quality: MascotQuality): void {
    this.quality = quality;
    this.lastQualityChange = this.now();
  }

  getState(): PerformanceState {
    const count = this.samples.length;
    const averageFrameMs =
      count === 0 ? 0 : this.samples.reduce((a, b) => a + b, 0) / count;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const p95Index = clamp(
      Math.floor(sorted.length * 0.95),
      0,
      Math.max(0, sorted.length - 1),
    );
    const p95FrameMs = sorted.length === 0 ? 0 : sorted[p95Index];
    const worstFrameMs = sorted.length === 0 ? 0 : sorted[sorted.length - 1];
    const slowFrames = this.samples.filter((ms) => ms > SLOW_FRAME_MS).length;

    return {
      averageFrameMs,
      p95FrameMs,
      worstFrameMs,
      slowFrames,
      droppedSimulationTime: this.droppedSimulationTime,
      quality: this.quality,
      lastQualityChange: this.lastQualityChange,
    };
  }
}
