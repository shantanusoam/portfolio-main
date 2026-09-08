import { STEP } from "./config";

/** A frame-independent clock, also used by headless deterministic tests. */
export class FixedClock {
  private previous: number | null = null;
  private accumulator = 0;
  droppedSeconds = 0;
  reset(): void {
    this.previous = null;
    this.accumulator = 0;
  }

  advance(milliseconds: number, update: () => void): number {
    if (this.previous === null) {
      this.previous = milliseconds;
      return 0;
    }
    const elapsed = Math.max(0, (milliseconds - this.previous) / 1000);
    this.previous = milliseconds;
    const bounded = Math.min(0.25, elapsed);
    this.droppedSeconds += elapsed - bounded;
    this.accumulator += bounded;
    let steps = 0;
    while (this.accumulator + 1e-9 >= STEP && steps < 15) {
      update();
      this.accumulator -= STEP;
      steps++;
    }
    return steps;
  }
}
export function createRuntime(
  update: () => void,
  draw: () => void,
): { start: () => void; reset: () => void; dispose: () => void } {
  const clock = new FixedClock();
  let frame: number | null = null;
  let disposed = false;
  const tick = (now: number) => {
    if (disposed) return;
    clock.advance(now, update);
    draw();
    frame = requestAnimationFrame(tick);
  };
  return {
    start: () => {
      if (frame === null && !disposed) {
        clock.reset();
        frame = requestAnimationFrame(tick);
      }
    },
    reset: () => clock.reset(),
    dispose: () => {
      disposed = true;
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      clock.reset();
    },
  };
}
