import { clamp } from "../core/NumericGuards";
import type { RibPoint } from "../character/CreatureRig";
import type { SpineJoint } from "../motion/SpineSolver";
import type { EcosystemFissionPhase, MascotObstacle, Point } from "../types";
import {
  drawAppearance as drawAppearanceLayers,
  type AppearanceRenderInput,
} from "../appearance/SilhouetteRenderer";
import { CanvasDotRenderer, type DotLayerStyle } from "./CanvasDotRenderer";
import type { Particle, ParticleCategory, ParticlePool } from "./ParticlePool";
import type { EcosystemFry } from "../ecosystem/FishEcosystem";

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

  /**
   * Draws the full layered appearance pipeline (silhouette -> gradient ->
   * clipped print -> rim -> face) for one frame. Thin forwarder to
   * `appearance/SilhouetteRenderer.drawAppearance` — this class stays the
   * ctx owner, the actual layer logic lives in `lib/mascot/appearance/`.
   */
  drawAppearance(input: AppearanceRenderInput): void {
    drawAppearanceLayers(this.ctx, input);
  }

  drawTailWhisker(points: readonly Point[], color: string): void {
    if (points.length < 2) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let index = 1; index < points.length - 1; index += 1) {
      const next = points[index + 1];
      ctx.quadraticCurveTo(
        points[index].x,
        points[index].y,
        (points[index].x + next.x) * 0.5,
        (points[index].y + next.y) * 0.5,
      );
    }
    const tip = points[points.length - 1];
    ctx.lineTo(tip.x, tip.y);
    ctx.stroke();
    ctx.restore();
  }

  drawSpineAccent(joints: readonly SpineJoint[], color: string): void {
    if (joints.length < 8) return;
    const start = Math.floor(joints.length * 0.36);
    const end = Math.max(start + 2, Math.floor(joints.length * 0.78));
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = 1.15;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(joints[start].x, joints[start].y);
    for (let index = start + 1; index <= end; index += 1) {
      const next = joints[Math.min(end, index + 1)];
      ctx.quadraticCurveTo(
        joints[index].x,
        joints[index].y,
        (joints[index].x + next.x) * 0.5,
        (joints[index].y + next.y) * 0.5,
      );
    }
    ctx.stroke();
    ctx.restore();
  }

  /** @deprecated superseded by drawAppearance's contour+gradient fill; kept for any external/debug caller still passing raw ribs. */
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

  drawFry(fry: EcosystemFry): void {
    const ctx = this.ctx;
    const emerge = clamp(fry.age / 0.45, 0, 1);
    const tailWag = Math.sin(fry.tailPhase) * 2.2;
    ctx.save();
    ctx.translate(fry.x, fry.y);
    ctx.rotate(fry.heading);
    ctx.globalAlpha = emerge;

    ctx.shadowColor = fry.color;
    ctx.shadowBlur = 9;
    ctx.fillStyle = fry.color;
    ctx.beginPath();
    ctx.ellipse(0, 0, 7.5, 4.4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.moveTo(-6, 0);
    ctx.lineTo(-12, -4 + tailWag);
    ctx.lineTo(-11, 4 + tailWag);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#181312";
    ctx.beginPath();
    ctx.arc(3.2, -1.25, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawFissionSeam(
    x: number,
    y: number,
    heading: number,
    scale: number,
    phase: EcosystemFissionPhase,
    progress: number,
  ): void {
    if (phase === "settle") return;
    const ctx = this.ctx;
    const visibility = Math.sin(clamp(progress, 0, 1) * Math.PI);
    const normalX = -Math.sin(heading);
    const normalY = Math.cos(heading);
    const forwardX = Math.cos(heading);
    const forwardY = Math.sin(heading);
    const seamHalf = 22 * scale;
    const nucleusOffset =
      (phase === "separate" || phase === "recover" ? 13 : 8) * scale;

    ctx.save();
    ctx.globalAlpha = 0.25 + visibility * 0.65;
    ctx.strokeStyle = "#fff2df";
    ctx.lineWidth = 1.2;
    ctx.shadowColor = "#ff9c70";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(x - normalX * seamHalf, y - normalY * seamHalf);
    ctx.lineTo(x + normalX * seamHalf, y + normalY * seamHalf);
    ctx.stroke();

    ctx.fillStyle = "#fff2df";
    for (const side of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(
        x + forwardX * nucleusOffset * side,
        y + forwardY * nucleusOffset * side,
        2.5 + visibility * 1.5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.restore();
  }

  drawEcosystemBloom(points: readonly Point[], strength: number): void {
    if (strength <= 0) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.globalAlpha = strength * 0.5;
    ctx.strokeStyle = "#ffb178";
    ctx.lineWidth = 1.5;
    ctx.shadowColor = "#ff8a61";
    ctx.shadowBlur = 10;
    for (const point of points) {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 20 + (1 - strength) * 34, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
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
            : obstacle.mode === "perch"
              ? "#9d6bff"
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
