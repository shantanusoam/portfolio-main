import { clamp } from "./NumericGuards";

/**
 * One requestAnimationFrame loop, decoupled from real time via a fixed
 * simulation step and a bounded catch-up accumulator. `tick()` is a pure
 * function of (previous state, now) so it can be driven manually and
 * deterministically in tests without a real rAF/clock.
 */

export interface FixedStepLoopOptions {
  fixedDt?: number;
  maxFrameDt?: number;
  maxSteps?: number;
  update: (dt: number) => void;
  render: (interpolationAlpha: number) => void;
  onDroppedSimulationTime?: () => void;
  requestFrame?: (callback: (time: number) => void) => number;
  cancelFrame?: (handle: number) => void;
}

const defaultRequestFrame =
  typeof requestAnimationFrame === "function"
    ? requestAnimationFrame.bind(globalThis)
    : (callback: (time: number) => void) =>
        setTimeout(() => callback(Date.now()), 16) as unknown as number;

const defaultCancelFrame =
  typeof cancelAnimationFrame === "function"
    ? cancelAnimationFrame.bind(globalThis)
    : (handle: number) => clearTimeout(handle);

export class FixedStepLoop {
  readonly fixedDt: number;
  private readonly maxFrameDt: number;
  private readonly maxSteps: number;
  private readonly update: (dt: number) => void;
  private readonly render: (interpolationAlpha: number) => void;
  private readonly onDroppedSimulationTime?: () => void;
  private readonly requestFrame: (callback: (time: number) => void) => number;
  private readonly cancelFrame: (handle: number) => void;

  private accumulator = 0;
  private previousNow: number | null = null;
  private frameHandle: number | null = null;
  private running = false;
  private lastFrameMs = 0;

  constructor(options: FixedStepLoopOptions) {
    this.fixedDt = options.fixedDt ?? 1 / 60;
    this.maxFrameDt = options.maxFrameDt ?? 0.05;
    this.maxSteps = options.maxSteps ?? 3;
    this.update = options.update;
    this.render = options.render;
    this.onDroppedSimulationTime = options.onDroppedSimulationTime;
    this.requestFrame = options.requestFrame ?? defaultRequestFrame;
    this.cancelFrame = options.cancelFrame ?? defaultCancelFrame;
  }

  isRunning(): boolean {
    return this.running;
  }

  /** Clears accumulated time so the next tick doesn't produce a huge jump. */
  resetTiming(): void {
    this.previousNow = null;
    this.accumulator = 0;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.resetTiming();
    this.scheduleNext();
  }

  stop(): void {
    this.running = false;
    if (this.frameHandle !== null) {
      this.cancelFrame(this.frameHandle);
      this.frameHandle = null;
    }
  }

  private scheduleNext(): void {
    this.frameHandle = this.requestFrame((now) => {
      if (!this.running) return;
      this.tick(now);
      this.scheduleNext();
    });
  }

  /**
   * Advances the loop to `now` (milliseconds). Exposed publicly so tests and
   * deterministic scenarios can drive the loop without real timers.
   */
  tick(now: number): void {
    if (this.previousNow === null) {
      // First observed timestamp only establishes the baseline: computing a
      // frame delta against "loop creation time" would otherwise fabricate
      // a huge first-frame jump.
      this.previousNow = now;
      return;
    }

    const rawFrameDt = (now - this.previousNow) / 1000;
    this.previousNow = now;
    this.lastFrameMs = Math.max(0, rawFrameDt * 1000);

    const frameDt = clamp(rawFrameDt, 0, this.maxFrameDt);
    this.accumulator += frameDt;

    let steps = 0;
    while (this.accumulator >= this.fixedDt && steps < this.maxSteps) {
      this.update(this.fixedDt);
      this.accumulator -= this.fixedDt;
      steps += 1;
    }

    if (steps === this.maxSteps && this.accumulator >= this.fixedDt) {
      this.accumulator = 0;
      this.onDroppedSimulationTime?.();
    }

    this.render(clamp(this.accumulator / this.fixedDt, 0, 1));
  }

  getLastFrameMs(): number {
    return this.lastFrameMs;
  }
}
