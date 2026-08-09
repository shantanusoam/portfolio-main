import type { BladeFrame, BladePointer, InputAdapter, InputAdapterStatus, InputSource } from './InputAdapter';

/**
 * Reads mouse/touch/stylus via native Pointer Events on a target element.
 * Coordinates are normalized to the element's bounding box, not the window,
 * so it stays correct under Phaser's RESIZE scale mode.
 */
export class PointerAdapter implements InputAdapter {
  readonly source: InputSource = 'pointer';

  private target: HTMLElement;
  private pending: BladePointer[] = [];
  private activeIds = new Set<number>();
  private started = false;

  constructor(target: HTMLElement) {
    this.target = target;
  }

  start(): void {
    if (this.started) return;
    this.started = true;
    this.target.style.touchAction = 'none';
    this.target.addEventListener('pointerdown', this.onDown);
    this.target.addEventListener('pointermove', this.onMove);
    this.target.addEventListener('pointerup', this.onUp);
    this.target.addEventListener('pointercancel', this.onCancel);
    this.target.addEventListener('pointerleave', this.onCancel);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;
    this.target.removeEventListener('pointerdown', this.onDown);
    this.target.removeEventListener('pointermove', this.onMove);
    this.target.removeEventListener('pointerup', this.onUp);
    this.target.removeEventListener('pointercancel', this.onCancel);
    this.target.removeEventListener('pointerleave', this.onCancel);
    this.activeIds.clear();
  }

  read(timestamp: number): BladeFrame {
    const pointers = this.pending;
    this.pending = [];
    return { timestamp, pointers };
  }

  getStatus(): InputAdapterStatus {
    return {
      connected: this.started,
      label: 'Touch / Mouse',
      detail: `${this.activeIds.size} active pointer(s)`
    };
  }

  private toNormalized(e: PointerEvent): { x: number; y: number } {
    const rect = this.target.getBoundingClientRect();
    const x = rect.width > 0 ? (e.clientX - rect.left) / rect.width : 0;
    const y = rect.height > 0 ? (e.clientY - rect.top) / rect.height : 0;
    return { x: clamp01(x), y: clamp01(y) };
  }

  private push(e: PointerEvent, phase: BladePointer['phase'], active: boolean): void {
    const { x, y } = this.toNormalized(e);
    this.pending.push({
      id: `pointer-${e.pointerId}`,
      x,
      y,
      timestamp: e.timeStamp,
      phase,
      source: this.source,
      active,
      confidence: 1,
      pressure: e.pressure > 0 ? e.pressure : undefined
    });
  }

  private onDown = (e: PointerEvent): void => {
    this.activeIds.add(e.pointerId);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    this.push(e, 'start', true);
  };

  private onMove = (e: PointerEvent): void => {
    if (!this.activeIds.has(e.pointerId)) return;
    const events = e.getCoalescedEvents?.() ?? [e];
    for (const ce of events) {
      this.push(ce, 'move', true);
    }
  };

  private onUp = (e: PointerEvent): void => {
    if (!this.activeIds.has(e.pointerId)) return;
    this.activeIds.delete(e.pointerId);
    this.push(e, 'end', false);
  };

  private onCancel = (e: PointerEvent): void => {
    if (!this.activeIds.has(e.pointerId)) return;
    this.activeIds.delete(e.pointerId);
    this.push(e, 'cancel', false);
  };
}

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}
