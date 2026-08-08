/**
 * Canvas-authoritative proxy simulation after hero fracture (V2 §12, §39).
 * update/draw never read the DOM — only fields filled at snapshot time.
 */

import { clamp, lerp } from "../../core/NumericGuards";
import type { HeroProxyObject } from "./types";

export interface DomShadowProxyWorldOptions {
  gravity?: number;
  drag?: number;
  reducedMotion?: boolean;
}

/** Minimal 2D draw surface — compatible with CanvasRenderingContext2D. */
export interface ProxyDrawContext {
  clearRect(x: number, y: number, w: number, h: number): void;
  save(): void;
  restore(): void;
  translate(x: number, y: number): void;
  rotate(angle: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  beginPath(): void;
  arc(x: number, y: number, r: number, a0: number, a1: number): void;
  fill(): void;
  fillText(text: string, x: number, y: number): void;
  fillStyle: string;
  globalAlpha: number;
  font: string;
  textAlign: "left" | "right" | "center" | "start" | "end";
  textBaseline:
    | "top"
    | "hanging"
    | "middle"
    | "alphabetic"
    | "ideographic"
    | "bottom";
  canvas?: { width: number; height: number };
}

interface LabelCacheEntry {
  label: string;
  font: string;
}

/**
 * Holds hero proxies after snapshot. Physics + restore + simple canvas draw.
 */
export class DomShadowProxyWorld {
  private proxies: HeroProxyObject[] = [];
  private readonly gravity: number;
  private readonly drag: number;
  private readonly reducedMotion: boolean;
  private readonly labelCache = new Map<string, LabelCacheEntry>();
  private viewWidth = 0;
  private viewHeight = 0;

  constructor(options: DomShadowProxyWorldOptions = {}) {
    this.gravity = options.gravity ?? 520;
    this.drag = options.drag ?? 0.992;
    this.reducedMotion = options.reducedMotion ?? false;
  }

  setViewport(width: number, height: number): void {
    this.viewWidth = Math.max(0, width);
    this.viewHeight = Math.max(0, height);
  }

  /**
   * Adopt proxies from `snapshotHeroProxies`. Clears prior simulation.
   * Optionally nulls `sourceElement` so update cannot touch layout APIs.
   */
  adopt(proxies: readonly HeroProxyObject[], detachDom = true): void {
    this.proxies = proxies as HeroProxyObject[];
    this.labelCache.clear();
    for (let i = 0; i < this.proxies.length; i += 1) {
      const p = this.proxies[i];
      if (detachDom) p.sourceElement = null;
      if (p.label) {
        const fontSize = Math.max(10, Math.min(p.height * 0.9, 64));
        this.labelCache.set(p.id, {
          label: p.label,
          font: `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`,
        });
      }
      if (this.reducedMotion) {
        p.velocityX *= 0.15;
        p.velocityY *= 0.2;
        p.angularVelocity *= 0.1;
      }
    }
  }

  getProxies(): readonly HeroProxyObject[] {
    return this.proxies;
  }

  getActiveCount(): number {
    return this.proxies.length;
  }

  clear(): void {
    this.proxies = [];
    this.labelCache.clear();
  }

  /**
   * Gravity / drift / rotation. No DOM reads. No measureText.
   */
  update(dt: number): void {
    const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.05) : 0;
    if (step <= 0 || this.proxies.length === 0) return;

    const g = this.reducedMotion ? this.gravity * 0.35 : this.gravity;

    for (let i = 0; i < this.proxies.length; i += 1) {
      const p = this.proxies[i];
      if (p.collected) continue;

      p.previousX = p.x;
      p.previousY = p.y;

      p.velocityY += g * step;
      p.velocityX *= this.drag;
      p.velocityY *= this.drag;
      p.x += p.velocityX * step;
      p.y += p.velocityY * step;
      p.rotation += p.angularVelocity * step;

      // Soft floor so fragments stay in play without bouncing physics yet.
      if (this.viewHeight > 0 && p.y > this.viewHeight + p.height) {
        p.y = this.viewHeight + p.height;
        p.velocityY *= -0.25;
        p.velocityX *= 0.85;
      }
    }
  }

  /**
   * Interpolate proxies toward home positions for exit restore (V2 §33).
   * Returns max remaining distance so callers can detect convergence.
   */
  restoreTowardHome(dt: number, rate: number): number {
    const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.05) : 0;
    const t = clamp((Number.isFinite(rate) ? rate : 4) * step, 0, 1);
    let maxDist = 0;

    for (let i = 0; i < this.proxies.length; i += 1) {
      const p = this.proxies[i];
      p.previousX = p.x;
      p.previousY = p.y;
      p.x = lerp(p.x, p.homeX, t);
      p.y = lerp(p.y, p.homeY, t);
      p.rotation = lerp(p.rotation, 0, t);
      p.velocityX = 0;
      p.velocityY = 0;
      p.angularVelocity = 0;
      p.opacity = lerp(p.opacity, 1, t);
      const dist = Math.hypot(p.x - p.homeX, p.y - p.homeY);
      if (dist > maxDist) maxDist = dist;
    }
    return maxDist;
  }

  /**
   * Simple canvas rects / letters. Uses fonts cached at adopt time —
   * no measureText thrash (measureText allowed only at snapshot adopt).
   */
  draw(ctx: ProxyDrawContext): void {
    const w = this.viewWidth || ctx.canvas?.width || 0;
    const h = this.viewHeight || ctx.canvas?.height || 0;
    if (w > 0 && h > 0) {
      ctx.clearRect(0, 0, w, h);
    }

    for (let i = 0; i < this.proxies.length; i += 1) {
      const p = this.proxies[i];
      if (p.opacity <= 0.01) continue;

      ctx.save();
      ctx.globalAlpha = clamp(p.opacity, 0, 1);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.fillStyle;

      if (p.type === "dot") {
        const r = Math.max(2, Math.min(p.width, p.height) * 0.5);
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === "letter" || p.type === "word") {
        const cached = this.labelCache.get(p.id);
        if (cached && cached.label) {
          ctx.font = cached.font;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(cached.label, 0, 0);
        } else {
          ctx.fillRect(-p.width * 0.5, -p.height * 0.5, p.width, p.height);
        }
      } else {
        // bars / strings / decorative lines / button edges
        const thickness =
          p.type === "bar" || p.type === "decorativeLine"
            ? Math.max(1, Math.min(p.height, 3))
            : p.height;
        ctx.fillRect(-p.width * 0.5, -thickness * 0.5, p.width, thickness);
      }

      ctx.restore();
    }
  }
}
