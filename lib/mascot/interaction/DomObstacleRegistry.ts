import type { MascotObstacle, ObstacleMode } from "../types";
import { SpatialGrid } from "./SpatialGrid";

/**
 * Caches rectangles for every `[data-mascot-obstacle]` / `[data-mascot-interest]`
 * element. Measurement (`getBoundingClientRect`) only ever happens inside
 * `refresh()`, which runs on mount, resize, a throttled scroll tick, and
 * explicit invalidation — never inside the animation loop.
 */

const MODE_SELECTOR = "[data-mascot-obstacle], [data-mascot-interest]";

/**
 * Dispatch this on `window` after a section opens/closes or otherwise
 * changes obstacle-relevant layout outside of resize/scroll (e.g. a mobile
 * nav overlay toggling) — see spec "explicit registry invalidation".
 */
export const OBSTACLE_INVALIDATE_EVENT = "mascot:invalidate-obstacles";

/**
 * The `Document`/`Element` subset this registry needs. Named locally
 * instead of using the ambient `ParentNode` interface because the base
 * ESLint no-undef rule here isn't TypeScript-type-aware and doesn't
 * recognize that global name.
 */
interface QueryRoot {
  querySelectorAll(selectors: string): ArrayLike<Element>;
}

export function resolveObstacleMode(element: {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
}): ObstacleMode | null {
  const obstacleAttr = element.getAttribute("data-mascot-obstacle");
  if (obstacleAttr === "hard" || obstacleAttr === "soft") return obstacleAttr;
  if (element.hasAttribute("data-mascot-interest")) return "interest";
  return null;
}

export interface DomObstacleRegistryOptions {
  root?: QueryRoot;
  hardPadding?: number;
  softPadding?: number;
  interestPadding?: number;
  hardInfluence?: number;
  softInfluence?: number;
  interestInfluence?: number;
  gridCellSize?: number;
  scrollThrottleMs?: number;
}

interface ResolvedOptions {
  root: QueryRoot | null;
  hardPadding: number;
  softPadding: number;
  interestPadding: number;
  hardInfluence: number;
  softInfluence: number;
  interestInfluence: number;
  gridCellSize: number;
  scrollThrottleMs: number;
}

export class DomObstacleRegistry {
  private obstacles = new Map<string, MascotObstacle>();
  private readonly grid: SpatialGrid<MascotObstacle>;
  private readonly options: ResolvedOptions;
  private resizeObserver: ResizeObserver | null = null;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;
  private idCounter = 0;
  private readonly elementIds = new WeakMap<Element, string>();
  private attached = false;

  constructor(options: DomObstacleRegistryOptions = {}) {
    this.options = {
      root: options.root ?? (typeof document !== "undefined" ? document : null),
      hardPadding: options.hardPadding ?? 12,
      softPadding: options.softPadding ?? 6,
      interestPadding: options.interestPadding ?? 24,
      hardInfluence: options.hardInfluence ?? 90,
      softInfluence: options.softInfluence ?? 50,
      interestInfluence: options.interestInfluence ?? 140,
      gridCellSize: options.gridCellSize ?? 200,
      scrollThrottleMs: options.scrollThrottleMs ?? 120,
    };
    this.grid = new SpatialGrid({ cellSize: this.options.gridCellSize });
  }

  private readonly handleScroll = (): void => {
    if (this.scrollTimer !== null) return;
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      this.refresh();
    }, this.options.scrollThrottleMs);
  };

  private readonly handleResize = (): void => {
    this.refresh();
  };

  private readonly handleObservedResize = (): void => {
    this.refresh();
  };

  private readonly handleInvalidate = (): void => {
    this.refresh();
  };

  attach(): void {
    if (this.attached || typeof window === "undefined") return;
    this.attached = true;

    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(this.handleObservedResize);
    }

    this.refresh();
    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });
    window.addEventListener(OBSTACLE_INVALIDATE_EVENT, this.handleInvalidate);
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleScroll);
    window.removeEventListener(
      OBSTACLE_INVALIDATE_EVENT,
      this.handleInvalidate,
    );
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.attached = false;
  }

  private idFor(element: Element): string {
    let id = this.elementIds.get(element);
    if (!id) {
      id = `mascot-obstacle-${this.idCounter}`;
      this.idCounter += 1;
      this.elementIds.set(element, id);
    }
    return id;
  }

  /** Re-measures every marked element. Safe to call from mount/resize/scroll/route handlers — never from RAF. */
  refresh(): void {
    const root = this.options.root;
    if (!root || typeof root.querySelectorAll !== "function") return;

    const elements = Array.from(
      root.querySelectorAll(MODE_SELECTOR),
    ) as HTMLElement[];
    const next = new Map<string, MascotObstacle>();

    for (const element of elements) {
      const mode = resolveObstacleMode(element);
      if (!mode) continue;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      const id = this.idFor(element);
      const padding =
        mode === "hard"
          ? this.options.hardPadding
          : mode === "soft"
            ? this.options.softPadding
            : this.options.interestPadding;
      const influence =
        mode === "hard"
          ? this.options.hardInfluence
          : mode === "soft"
            ? this.options.softInfluence
            : this.options.interestInfluence;

      next.set(id, {
        id,
        element,
        mode,
        left: rect.left - padding,
        top: rect.top - padding,
        right: rect.right + padding,
        bottom: rect.bottom + padding,
        centerX: rect.left + rect.width / 2,
        centerY: rect.top + rect.height / 2,
        padding,
        influence,
        priority: mode === "hard" ? 2 : mode === "soft" ? 1 : 0,
      });

      this.resizeObserver?.observe(element);
    }

    this.obstacles = next;
    this.grid.rebuild(Array.from(this.obstacles.values()));
  }

  getAll(): MascotObstacle[] {
    return Array.from(this.obstacles.values());
  }

  getByMode(mode: ObstacleMode): MascotObstacle[] {
    return this.getAll().filter((obstacle) => obstacle.mode === mode);
  }

  queryNearby(x: number, y: number, radius: number): MascotObstacle[] {
    return this.grid.queryNearby(x, y, radius);
  }
}
