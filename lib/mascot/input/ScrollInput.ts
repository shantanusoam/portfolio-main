import { clamp, lerp } from "../core/NumericGuards";

/**
 * Smoothed scroll velocity from a passive `scroll` listener. Reads
 * `window.scrollY` only inside the (passive, non-RAF) scroll handler, never
 * inside the simulation loop, so it never forces layout during a frame.
 */

export type ScrollInputListener = (velocity: number) => void;

export interface ScrollInputOptions {
  /** 0..1, higher smooths more aggressively. */
  smoothing?: number;
  /** Clamp on instantaneous velocity, px/s. */
  maxVelocity?: number;
  now?: () => number;
}

const DEFAULT_SMOOTHING = 0.2;
const DEFAULT_MAX_VELOCITY = 4000;

export class ScrollInput {
  private lastScrollY = 0;
  private lastTimestamp = 0;
  private smoothedVelocity = 0;
  private readonly smoothing: number;
  private readonly maxVelocity: number;
  private readonly now: () => number;
  private readonly listeners = new Set<ScrollInputListener>();
  private attached = false;

  constructor(options: ScrollInputOptions = {}) {
    this.smoothing = options.smoothing ?? DEFAULT_SMOOTHING;
    this.maxVelocity = options.maxVelocity ?? DEFAULT_MAX_VELOCITY;
    this.now =
      options.now ??
      (() =>
        typeof performance !== "undefined" ? performance.now() : Date.now());
  }

  private readonly handleScroll = (): void => {
    const now = this.now();
    const scrollY = window.scrollY;

    if (this.lastTimestamp === 0) {
      this.lastTimestamp = now;
      this.lastScrollY = scrollY;
      return;
    }

    const dt = (now - this.lastTimestamp) / 1000;
    this.lastTimestamp = now;
    if (dt <= 0) return;

    const rawVelocity = clamp(
      (scrollY - this.lastScrollY) / dt,
      -this.maxVelocity,
      this.maxVelocity,
    );
    this.lastScrollY = scrollY;
    this.smoothedVelocity = lerp(
      this.smoothedVelocity,
      rawVelocity,
      this.smoothing,
    );
    this.listeners.forEach((listener) => listener(this.smoothedVelocity));
  };

  attach(): void {
    if (this.attached || typeof window === "undefined") return;
    this.attached = true;
    this.lastScrollY = window.scrollY;
    this.lastTimestamp = 0;
    window.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener("scroll", this.handleScroll);
    this.attached = false;
  }

  onChange(listener: ScrollInputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getVelocity(): number {
    return this.smoothedVelocity;
  }
}
