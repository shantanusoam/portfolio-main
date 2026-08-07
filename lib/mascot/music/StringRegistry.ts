/**
 * Discovers and caches the homepage guitar strings
 * (`components/IntrectiveComponents/StringInstrument.tsx`) as physical,
 * musical entities the mascot can contact — mirrors
 * `lib/mascot/interaction/DomObstacleRegistry.ts`'s exact caching
 * discipline: `getBoundingClientRect()` only ever runs inside `refresh()`
 * (mount/resize/throttled-scroll/explicit invalidation), never inside the
 * animation loop.
 *
 * Triggering a contact doesn't reach into React or hold a component ref —
 * it dispatches a `CustomEvent` on the cached DOM node
 * (`STRING_CONTACT_EVENT`), the same decoupled pattern this codebase
 * already uses for `OBSTACLE_INVALIDATE_EVENT`. `StringInstrument.tsx`
 * listens for it on each string's own path element and reuses its
 * existing (already fully working, tuned) pluck/bend logic — so a mascot
 * contact gets real visual bend *and* real Karplus-Strong audio for free,
 * with zero duplication of that component's internals.
 */

export const STRING_CONTACT_EVENT = "mascot:string-contact";

export interface StringContactEventDetail {
  /** 0..1, perceptual loudness — never raw velocity. */
  intensity: number;
  /** 0..1 position along the string, left to right. */
  normalizedX: number;
  direction: 1 | -1;
}

export type StringRole = "bass" | "mid" | "treble";

export interface MusicalStringGeometry {
  id: string;
  index: number;
  role: StringRole;
  element: Element;
  left: number;
  right: number;
  /** Screen-space Y of the string's rest line (viewport/client coordinates, matching the rest of lib/mascot's coordinate system). */
  restY: number;
}

const SELECTOR = "[data-mascot-string-index]";
const SCROLL_THROTTLE_MS = 120;

/**
 * The `Document`/`Element` subset this registry needs. Named locally
 * instead of using the ambient `ParentNode` interface because the base
 * ESLint no-undef rule here isn't TypeScript-type-aware and doesn't
 * recognize that global name (same fix as `DomObstacleRegistry`'s
 * `QueryRoot`).
 */
interface QueryRoot {
  querySelectorAll(selectors: string): ArrayLike<Element>;
}

function resolveRole(element: Element): StringRole {
  const role = element.getAttribute("data-mascot-string-role");
  if (role === "bass" || role === "mid" || role === "treble") return role;
  return "mid";
}

export class StringRegistry {
  private strings: MusicalStringGeometry[] = [];
  private readonly root: QueryRoot | null;
  private attached = false;
  private scrollTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    root: QueryRoot | null = typeof document !== "undefined" ? document : null,
  ) {
    this.root = root;
  }

  private readonly handleResize = (): void => {
    this.refresh();
  };

  private readonly handleScroll = (): void => {
    if (this.scrollTimer !== null) return;
    this.scrollTimer = setTimeout(() => {
      this.scrollTimer = null;
      this.refresh();
    }, SCROLL_THROTTLE_MS);
  };

  attach(): void {
    if (this.attached || typeof window === "undefined") return;
    this.attached = true;
    this.refresh();
    window.addEventListener("resize", this.handleResize, { passive: true });
    window.addEventListener("scroll", this.handleScroll, { passive: true });
  }

  detach(): void {
    if (!this.attached) return;
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("scroll", this.handleScroll);
    if (this.scrollTimer !== null) {
      clearTimeout(this.scrollTimer);
      this.scrollTimer = null;
    }
    this.attached = false;
  }

  /** Re-measures every marked string. Safe to call from mount/resize/scroll handlers — never from RAF. */
  refresh(): void {
    const root = this.root;
    if (!root || typeof root.querySelectorAll !== "function") return;

    const elements = Array.from(root.querySelectorAll(SELECTOR));
    const next: MusicalStringGeometry[] = [];

    for (const element of elements) {
      const indexAttr = element.getAttribute("data-mascot-string-index");
      const index = indexAttr === null ? NaN : Number(indexAttr);
      if (!Number.isFinite(index)) continue;

      const rect = element.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;

      next.push({
        id: `mascot-string-${index}`,
        index,
        role: resolveRole(element),
        element,
        left: rect.left,
        right: rect.right,
        restY: rect.top + rect.height / 2,
      });
    }

    next.sort((a, b) => a.index - b.index);
    this.strings = next;
  }

  getAll(): readonly MusicalStringGeometry[] {
    return this.strings;
  }

  /**
   * Dispatches a contact event on the real string element. `normalizedX`
   * is 0..1 across the string's own on-screen width — the listener
   * converts it back into its own internal coordinate system, so this
   * registry never needs to know that system's units.
   */
  triggerContact(
    index: number,
    intensity: number,
    normalizedX: number,
    direction: 1 | -1,
  ): boolean {
    const string = this.strings.find((s) => s.index === index);
    if (!string) return false;

    const detail: StringContactEventDetail = {
      intensity,
      normalizedX,
      direction,
    };
    string.element.dispatchEvent(
      new CustomEvent(STRING_CONTACT_EVENT, { detail }),
    );
    return true;
  }
}
