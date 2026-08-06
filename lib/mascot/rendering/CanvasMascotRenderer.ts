import { clamp } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type { SpineJoint } from "../motion/SpineSolver";
import type { MascotObstacle } from "../types";
import { CanvasDotRenderer, type DotLayerStyle } from "./CanvasDotRenderer";
import type { Particle, ParticleCategory, ParticlePool } from "./ParticlePool";

/**
 * Owns the canvas's backing-store sizing (CSS size vs DPR-scaled backing
 * size, transform reset on every resize — see spec correction #3) and every
 * draw call. Simulation state is read-only input here; this class never
 * mutates rig/behavior state.
 */

export interface CanvasMascotRendererOptions {
  canvas: HTMLCanvasElement;
}

export class CanvasMascotRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private cssWidth = 0;
  private cssHeight = 0;
  private dpr = 1;

  readonly dotRenderer = new CanvasDotRenderer();

  constructor(options: CanvasMascotRendererOptions) {
    this.canvas = options.canvas;
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("CanvasMascotRenderer: 2D context unavailable");
    }
    this.ctx = ctx;
  }

  /** cssWidth/cssHeight are CSS pixels; dpr is already capped by the caller (RenderQuality). */
  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    this.cssWidth = Math.max(0, cssWidth);
    this.cssHeight = Math.max(0, cssHeight);
    this.dpr = Math.max(0.5, dpr);

    this.canvas.style.width = `${this.cssWidth}px`;
    this.canvas.style.height = `${this.cssHeight}px`;

    const backingWidth = Math.round(this.cssWidth * this.dpr);
    const backingHeight = Math.round(this.cssHeight * this.dpr);
    if (this.canvas.width !== backingWidth) this.canvas.width = backingWidth;
    if (this.canvas.height !== backingHeight)
      this.canvas.height = backingHeight;

    // setTransform (not scale()) so repeated resizes never compound.
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.cssWidth, this.cssHeight);
  }

  getContext(): CanvasRenderingContext2D {
    return this.ctx;
  }

  drawSilhouette(
    ribs: readonly RibPoint[],
    fillStyle: string,
    opacity = 1,
  ): void {
    if (ribs.length < 2) return;
    const ctx = this.ctx;
    ctx.fillStyle = fillStyle;
    ctx.globalAlpha = opacity;
    ctx.beginPath();
    ctx.moveTo(ribs[0].left.x, ribs[0].left.y);
    for (let i = 1; i < ribs.length; i += 1)
      ctx.lineTo(ribs[i].left.x, ribs[i].left.y);
    for (let i = ribs.length - 1; i >= 0; i -= 1)
      ctx.lineTo(ribs[i].right.x, ribs[i].right.y);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawCore(
    x: number,
    y: number,
    radius: number,
    glowIntensity: number,
    color: string,
  ): void {
    const ctx = this.ctx;
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (glowIntensity > 0) {
      ctx.globalAlpha = clamp(glowIntensity, 0, 1) * 0.35;
      ctx.beginPath();
      ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawParticles(
    pool: ParticlePool,
    styles: Partial<Record<ParticleCategory, DotLayerStyle>>,
  ): void {
    const ctx = this.ctx;
    const categories = Object.keys(styles) as ParticleCategory[];

    for (const category of categories) {
      const style = styles[category];
      if (!style) continue;

      ctx.fillStyle = style.color;
      ctx.beginPath();
      let any = false;

      pool.forEachActive((particle: Particle) => {
        if (particle.category !== category) return;
        any = true;
        const alpha = clamp(particle.life, 0, 1);
        const radius = particle.radius * alpha;
        if (radius <= 0) return;
        ctx.moveTo(particle.x + radius, particle.y);
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      });

      if (any) {
        ctx.globalAlpha = style.opacity;
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  drawDebugSpine(joints: readonly SpineJoint[], color = "#00ff88"): void {
    if (joints.length < 2) return;
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(joints[0].x, joints[0].y);
    for (let i = 1; i < joints.length; i += 1)
      ctx.lineTo(joints[i].x, joints[i].y);
    ctx.stroke();

    for (const joint of joints) {
      ctx.beginPath();
      ctx.arc(joint.x, joint.y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  drawDebugNormals(
    ribs: readonly RibPoint[],
    length = 10,
    color = "#ff00aa",
  ): void {
    if (ribs.length === 0) return;
    const ctx = this.ctx;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const rib of ribs) {
      ctx.moveTo(rib.center.x, rib.center.y);
      ctx.lineTo(
        rib.center.x + rib.normalX * length,
        rib.center.y + rib.normalY * length,
      );
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawDebugObstacles(obstacles: readonly MascotObstacle[]): void {
    const ctx = this.ctx;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    for (const obstacle of obstacles) {
      ctx.strokeStyle =
        obstacle.mode === "hard"
          ? "#ff3355"
          : obstacle.mode === "soft"
            ? "#ffaa33"
            : "#33ddff";
      ctx.strokeRect(
        obstacle.left,
        obstacle.top,
        obstacle.right - obstacle.left,
        obstacle.bottom - obstacle.top,
      );
    }
    ctx.globalAlpha = 1;
  }

  getCssSize(): { width: number; height: number; dpr: number } {
    return { width: this.cssWidth, height: this.cssHeight, dpr: this.dpr };
  }
}
