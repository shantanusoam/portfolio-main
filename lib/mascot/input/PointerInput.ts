/**
 * Window-level pointer tracking shared by mouse, touch, and stylus through
 * Pointer Events. Emits {x, y, active} in viewport (client) coordinates —
 * the mascot's canonical coordinate system, matching a fixed full-viewport
 * canvas and `getBoundingClientRect()` obstacle geometry.
 *
 * "active" decays a short debounce window after the last movement so the
 * engine can distinguish "pointer currently moving" from "pointer merely
 * present" without polling every frame.
 */

export interface PointerInputState {
  x: number;
  y: number;
  active: boolean;
}

export type PointerInputListener = (state: PointerInputState) => void;

export interface PointerInputOptions {
  activeTimeoutMs?: number;
}

const DEFAULT_ACTIVE_TIMEOUT_MS = 220;

export class PointerInput {
  private x = 0;
  private y = 0;
  private active = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activeTimeoutMs: number;
  private readonly listeners = new Set<PointerInputListener>();
  private target: Window | null = null;
  private attached = false;

  constructor(options: PointerInputOptions = {}) {
    this.activeTimeoutMs = options.activeTimeoutMs ?? DEFAULT_ACTIVE_TIMEOUT_MS;
  }

  // Typed as `Event` (not `PointerEvent`) and narrowed inside, so
  // addEventListener/removeEventListener never need an `as EventListener`
  // cast — the base ESLint no-undef rule here isn't TypeScript-type-aware
  // and doesn't recognize the ambient `EventListener` interface name.
  private readonly handleMove = (event: Event): void => {
    const pointerEvent = event as PointerEvent;
    this.x = pointerEvent.clientX;
    this.y = pointerEvent.clientY;
    this.setActive(true);
  };

  private readonly handleDown = (event: Event): void => {
    this.handleMove(event);
  };

  private readonly handleInactive = (): void => {
    this.setActive(false);
  };

  private setActive(active: boolean): void {
    this.active = active;
    this.emit();

    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }

    if (active) {
      this.idleTimer = setTimeout(() => {
        this.idleTimer = null;
        this.active = false;
        this.emit();
      }, this.activeTimeoutMs);
    }
  }

  private emit(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => listener(state));
  }

  attach(target: Window = window): void {
    if (this.attached) return;
    this.attached = true;
    this.target = target;
    target.addEventListener("pointermove", this.handleMove, {
      passive: true,
    });
    target.addEventListener("pointerdown", this.handleDown, {
      passive: true,
    });
    target.addEventListener("pointerup", this.handleInactive, {
      passive: true,
    });
    target.addEventListener("pointercancel", this.handleInactive, {
      passive: true,
    });
  }

  detach(): void {
    if (!this.attached || !this.target) return;
    this.target.removeEventListener("pointermove", this.handleMove);
    this.target.removeEventListener("pointerdown", this.handleDown);
    this.target.removeEventListener("pointerup", this.handleInactive);
    this.target.removeEventListener("pointercancel", this.handleInactive);
    if (this.idleTimer !== null) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    this.attached = false;
    this.target = null;
  }

  onChange(listener: PointerInputListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getState(): PointerInputState {
    return { x: this.x, y: this.y, active: this.active };
  }
}
