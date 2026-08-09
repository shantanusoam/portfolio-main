/**
 * Wraps document visibility and `prefers-reduced-motion` so the engine can
 * pause invisible work and respect accessibility settings without polling.
 */

export type VisibilityListener = (visible: boolean) => void;
export type ReducedMotionListener = (reduced: boolean) => void;

/** Safari < 14 / old browsers exposed the deprecated add/removeListener pair. */
type LegacyMediaQuery = {
  addListener(listener: (event: MediaQueryListEvent) => void): void;
  removeListener(listener: (event: MediaQueryListEvent) => void): void;
};

export class VisibilityController {
  private visible = true;
  private reducedMotion = false;
  private readonly visibilityListeners = new Set<VisibilityListener>();
  private readonly reducedMotionListeners = new Set<ReducedMotionListener>();
  private mediaQuery: MediaQueryList | null = null;
  private attached = false;

  private readonly handleVisibilityChange = (): void => {
    this.visible = document.visibilityState === "visible";
    this.visibilityListeners.forEach((listener) => listener(this.visible));
  };

  private readonly handleReducedMotionChange = (
    event: MediaQueryListEvent,
  ): void => {
    this.reducedMotion = event.matches;
    this.reducedMotionListeners.forEach((listener) =>
      listener(this.reducedMotion),
    );
  };

  attach(): void {
    if (this.attached || typeof document === "undefined") return;
    this.attached = true;
    this.visible = document.visibilityState === "visible";
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      this.mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      this.reducedMotion = this.mediaQuery.matches;
      if (typeof this.mediaQuery.addEventListener === "function") {
        this.mediaQuery.addEventListener(
          "change",
          this.handleReducedMotionChange,
        );
      } else if (
        typeof (this.mediaQuery as LegacyMediaQuery).addListener === "function"
      ) {
        (this.mediaQuery as LegacyMediaQuery).addListener(
          this.handleReducedMotionChange,
        );
      }
    }
  }

  detach(): void {
    if (!this.attached) return;
    document.removeEventListener(
      "visibilitychange",
      this.handleVisibilityChange,
    );
    if (this.mediaQuery) {
      if (typeof this.mediaQuery.removeEventListener === "function") {
        this.mediaQuery.removeEventListener(
          "change",
          this.handleReducedMotionChange,
        );
      } else if (
        typeof (this.mediaQuery as LegacyMediaQuery).removeListener ===
        "function"
      ) {
        (this.mediaQuery as LegacyMediaQuery).removeListener(
          this.handleReducedMotionChange,
        );
      }
      this.mediaQuery = null;
    }
    this.attached = false;
  }

  isVisible(): boolean {
    return this.visible;
  }

  isReducedMotion(): boolean {
    return this.reducedMotion;
  }

  onVisibilityChange(listener: VisibilityListener): () => void {
    this.visibilityListeners.add(listener);
    return () => this.visibilityListeners.delete(listener);
  }

  onReducedMotionChange(listener: ReducedMotionListener): () => void {
    this.reducedMotionListeners.add(listener);
    return () => this.reducedMotionListeners.delete(listener);
  }
}
