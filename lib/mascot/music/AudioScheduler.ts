import { MASCOT_CONFIG } from "../MascotConfig";

/**
 * Schedules audio against `audioContext.currentTime`, never a visual
 * timestamp (`performance.now()`/`Date.now()`). Two paths:
 *
 *  - `scheduleNow()` — direct contacts: play at "now + a small safety
 *    offset" so the note is never scheduled in the past.
 *  - `enqueue()` / the internal look-ahead timer — future strums/phrases: a
 *    bounded queue drained on a short interval, so a later strum-recognition
 *    workstream has somewhere to schedule into even though nothing calls it
 *    yet this pass.
 *
 * The queue math (`drainDue`) is a pure, directly-testable method — the
 * `setInterval`-driven `tick()` is a thin wrapper around it so tests don't
 * need real timers or a real `AudioContext`. See
 * tests/mascot/music/AudioScheduler.test.ts.
 */

export interface ScheduledNote {
  /** Absolute `audioContext.currentTime`-based time this note should sound at. */
  time: number;
  play: (time: number) => void;
}

export interface AudioSchedulerOptions {
  getCurrentTime: () => number;
  lookaheadIntervalMs?: number;
  scheduleAheadSeconds?: number;
  maxQueueLength?: number;
}

export class AudioScheduler {
  private readonly getCurrentTime: () => number;
  private readonly lookaheadIntervalMs: number;
  private readonly scheduleAheadSeconds: number;
  private readonly maxQueueLength: number;
  private queue: ScheduledNote[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(options: AudioSchedulerOptions) {
    this.getCurrentTime = options.getCurrentTime;
    this.lookaheadIntervalMs =
      options.lookaheadIntervalMs ??
      MASCOT_CONFIG.audio.scheduler.lookaheadIntervalMs;
    this.scheduleAheadSeconds =
      options.scheduleAheadSeconds ??
      MASCOT_CONFIG.audio.scheduler.scheduleAheadSeconds;
    this.maxQueueLength =
      options.maxQueueLength ?? MASCOT_CONFIG.audio.scheduler.maxQueueLength;
  }

  /** Direct-contact path: plays immediately at `currentTime + safetyOffset`, bypassing the look-ahead queue entirely. */
  scheduleNow(
    play: (time: number) => void,
    safetyOffsetSeconds: number = MASCOT_CONFIG.audio
      .gestureSafetyOffsetSeconds,
  ): number {
    const time = this.getCurrentTime() + Math.max(0, safetyOffsetSeconds);
    play(time);
    return time;
  }

  /**
   * Sequence path: queues a note for a future look-ahead tick. Bounded — if
   * the queue is already at capacity, the furthest-future (least urgent)
   * note is dropped to make room rather than growing unbounded.
   */
  enqueue(note: ScheduledNote): void {
    this.insertSorted(note);
    if (this.queue.length > this.maxQueueLength) {
      this.queue.pop(); // last = furthest in the future after sorting
    }
    this.ensureTimerRunning();
  }

  /**
   * Pure/testable core: removes and returns, in time order, every queued
   * note whose time falls within `currentTime + scheduleAheadSeconds`. Does
   * not call `play()` — callers (including the internal timer) decide that.
   */
  drainDue(currentTime: number): ScheduledNote[] {
    const horizon = currentTime + this.scheduleAheadSeconds;
    const due: ScheduledNote[] = [];
    while (this.queue.length > 0 && this.queue[0].time <= horizon) {
      due.push(this.queue.shift() as ScheduledNote);
    }
    return due;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isRunning(): boolean {
    return this.timer !== null;
  }

  /** Drops every queued note without playing it and stops the look-ahead timer. */
  clear(): void {
    this.queue = [];
    this.stopTimer();
  }

  destroy(): void {
    this.clear();
  }

  private insertSorted(note: ScheduledNote): void {
    let index = this.queue.length;
    while (index > 0 && this.queue[index - 1].time > note.time) index -= 1;
    this.queue.splice(index, 0, note);
  }

  private ensureTimerRunning(): void {
    if (this.timer !== null || typeof setInterval === "undefined") return;
    this.timer = setInterval(() => this.tick(), this.lookaheadIntervalMs);
  }

  private stopTimer(): void {
    if (this.timer === null) return;
    clearInterval(this.timer);
    this.timer = null;
  }

  private tick(): void {
    const due = this.drainDue(this.getCurrentTime());
    for (const note of due) note.play(note.time);
    if (this.queue.length === 0) this.stopTimer();
  }
}
