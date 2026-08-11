import type { EnvironmentSurface } from "../types";

interface QueryRoot {
  querySelectorAll(selectors: string): ArrayLike<Element>;
}

export interface EnvironmentSamplerOptions {
  root?: QueryRoot;
  selector?: string;
  scrollThrottleMs?: number;
  onChange?: (surfaces: readonly EnvironmentSurface[]) => void;
}

/** Caches DOM surface rectangles; layout is never queried from RAF. */
export class EnvironmentSampler {
  private readonly root: QueryRoot | null;
  private readonly selector: string;
  private readonly scrollThrottleMs: number;
  private readonly onChange?: (surfaces: readonly EnvironmentSurface[]) => void;
  private readonly ids = new WeakMap<Element, string>();
  private resizeObserver: ResizeObserver | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private idCounter = 0;
  private attached = false;
  private surfaces: EnvironmentSurface[] = [];

  constructor(options: EnvironmentSamplerOptions = {}) {
    this.root =
      options.root ?? (typeof document !== "undefined" ? document : null);
    this.selector = options.selector ?? "[data-character-platform]";
    this.scrollThrottleMs = options.scrollThrottleMs ?? 100;
    this.onChange = options.onChange;
  }

  attach(): void {
    if (this.attached || typeof window === "undefined") return;
    this.attached = true;
    if (typeof ResizeObserver === "function") {
      this.resizeObserver = new ResizeObserver(this.refresh);
    }
    window.addEventListener("resize", this.refresh, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    this.refresh();
  }

  detach(): void {
    if (!this.attached || typeof window === "undefined") return;
    window.removeEventListener("resize", this.refresh);
    window.removeEventListener("scroll", this.handleScroll);
    if (this.scrollTimer !== null) clearTimeout(this.scrollTimer);
    this.scrollTimer = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.attached = false;
  }

  getSurfaces(): readonly EnvironmentSurface[] {
    return this.surfaces;
  }

  readonly refresh = (): void => {
    if (!this.root) return;
    this.resizeObserver?.disconnect();
    const elements = Array.from(
      this.root.querySelectorAll(this.selector),
    ) as HTMLElement[];
    const next: EnvironmentSurface[] = [];
    for (let index = 0; index < elements.length; index += 1) {
      const element = elements[index];
      const rect = element.getBoundingClientRect();
      if (rect.width <= 0) continue;
      let id = this.ids.get(element);
      if (!id) {
        id = `character-surface-${this.idCounter}`;
        this.idCounter += 1;
        this.ids.set(element, id);
      }
      next.push({
        id,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
      });
      this.resizeObserver?.observe(element);
    }
    this.surfaces = next;
    this.onChange?.(this.surfaces);
  };

  private readonly handleScroll = (): void => {
    if (this.scrollTimer !== null) return;
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      this.refresh();
    }, this.scrollThrottleMs);
  };
}
