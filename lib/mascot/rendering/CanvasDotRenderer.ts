/**
 * Batched per-group dot drawing: one beginPath()/fill() per visual layer,
 * never per dot. Depends only on this narrow Canvas2DLike surface so it can
 * be unit tested with a fake recorder instead of a real Canvas.
 */

export interface Canvas2DLike {
  beginPath(): void;
  moveTo(x: number, y: number): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
  ): void;
  closePath(): void;
  fill(): void;
  fillStyle: string | CanvasGradient | CanvasPattern;
  globalAlpha: number;
}

export interface DotLayerStyle {
  color: string;
  opacity: number;
}

interface DotSlot {
  x: number;
  y: number;
  radius: number;
}

export class CanvasDotRenderer {
  private readonly buffers = new Map<number, DotSlot[]>();
  private readonly counts = new Map<number, number>();

  registerGroup(group: number, capacity: number): void {
    this.buffers.set(
      group,
      Array.from({ length: Math.max(0, capacity) }, () => ({
        x: 0,
        y: 0,
        radius: 0,
      })),
    );
    this.counts.set(group, 0);
  }

  beginFrame(): void {
    Array.from(this.counts.keys()).forEach((key) => {
      this.counts.set(key, 0);
    });
  }

  /** Silently drops the dot once a group's registered capacity is exhausted. */
  push(group: number, x: number, y: number, radius: number): void {
    const buffer = this.buffers.get(group);
    if (!buffer) return;
    const count = this.counts.get(group) ?? 0;
    if (count >= buffer.length) return;

    const slot = buffer[count];
    slot.x = x;
    slot.y = y;
    slot.radius = radius;
    this.counts.set(group, count + 1);
  }

  flushGroup(ctx: Canvas2DLike, group: number, style: DotLayerStyle): void {
    const buffer = this.buffers.get(group);
    const count = this.counts.get(group) ?? 0;
    if (!buffer || count === 0) return;

    ctx.fillStyle = style.color;
    ctx.globalAlpha = style.opacity;
    ctx.beginPath();
    for (let i = 0; i < count; i += 1) {
      const dot = buffer[i];
      if (dot.radius <= 0) continue;
      ctx.moveTo(dot.x + dot.radius, dot.y);
      ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    }
    ctx.closePath();
    ctx.fill();
  }

  getCount(group: number): number {
    return this.counts.get(group) ?? 0;
  }

  getRegisteredGroups(): number[] {
    return Array.from(this.buffers.keys());
  }
}
