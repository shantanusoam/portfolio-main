/**
 * Resonance Weaver gameplay orchestrator (V2 §20–34, §48).
 * Owns fracture transition handoff + player root + weave strings + collect/restore.
 * Zero React — overlay reads getSnapshot() and drains musicalEvents.
 */

import { FixedStepLoop } from "../../core/FixedStepLoop";
import { clamp, lerp } from "../../core/NumericGuards";
import type { BodyDeformation, MusicalEvent } from "../../types";
import { drawGameMascot } from "../GameMascotRenderer";
import { getAppearancePreset } from "../../appearance/AppearancePresets";
import {
  HeroFractureTransition,
  type FractureEntryMode,
  type HeroFractureTransitionOptions,
} from "./HeroFractureTransition";
import { FragmentCollector } from "./FragmentCollector";
import { WeaveStringSystem, type WeaveString } from "./WeaveStringSystem";
import {
  bounceRootOffSegment,
  createGameRoot,
  integrateGameRoot,
  type GameRoot,
} from "./WeaverPhysics";
import { WEAVER_CONFIG } from "./WeaverConfig";
import type { FracturePhase, HeroProxyObject, WeaverGameState } from "./types";
import { createEmptyWeaverState } from "./types";

export interface ResonanceWeaverRuntimeOptions {
  heroRoot: HeroFractureTransitionOptions["heroRoot"];
  fractureTarget?: HeroFractureTransitionOptions["fractureTarget"];
  seed?: number;
  reducedMotion?: boolean;
  isMobile?: boolean;
  viewportWidth: number;
  viewportHeight: number;
  onPhaseChange?: (phase: FracturePhase) => void;
  onPlaying?: () => void;
  onRestoreComplete?: () => void;
  onRender?: (alpha: number) => void;
}

export interface WeaverSnapshot {
  phase: FracturePhase;
  player: GameRoot;
  proxies: readonly HeroProxyObject[];
  strings: readonly WeaveString[];
  preview: ReturnType<WeaveStringSystem["getPreview"]>;
  score: number;
  combo: number;
  collectedCount: number;
  targetCollectCount: number;
  deformation: BodyDeformation;
  viewportWidth: number;
  viewportHeight: number;
  hintAge: number;
  muted: boolean;
}

function neutralDeformation(): BodyDeformation {
  return {
    longitudinalScale: 1,
    lateralScale: 1,
    headSquash: 0,
    tailStretch: 0,
    finSpread: 0,
    impactWave: 0,
    tumbleRotation: 0,
  };
}

export class ResonanceWeaverRuntime {
  private readonly transition: HeroFractureTransition;
  private readonly weaves = new WeaveStringSystem();
  private readonly collector = new FragmentCollector();
  private readonly loop: FixedStepLoop;

  private player: GameRoot;
  private inputX = 0;
  private pointerX = 0;
  private usePointerSteer = false;
  private viewportWidth: number;
  private viewportHeight: number;
  private readonly reducedMotion: boolean;
  private deformation: BodyDeformation = neutralDeformation();
  private targetCollect = 0;
  private hintAge = 0;
  private muted = false;
  private gameplayActive = false;
  private winLatched = false;

  /** Bounded per-frame audio events for the overlay to drain. */
  musicalEvents: MusicalEvent[] = [];

  constructor(options: ResonanceWeaverRuntimeOptions) {
    this.viewportWidth = options.viewportWidth;
    this.viewportHeight = options.viewportHeight;
    this.reducedMotion = options.reducedMotion ?? false;
    this.player = createGameRoot(
      options.viewportWidth * 0.5,
      options.viewportHeight * 0.28,
    );

    this.transition = new HeroFractureTransition({
      heroRoot: options.heroRoot,
      fractureTarget: options.fractureTarget,
      seed: options.seed,
      reducedMotion: this.reducedMotion,
      isMobile: options.isMobile,
      onPhaseChange: (phase) => {
        if (phase === "playing") this.onEnterPlaying();
        options.onPhaseChange?.(phase);
      },
      onPlaying: () => {
        this.onEnterPlaying();
        options.onPlaying?.();
      },
      onRestoreComplete: options.onRestoreComplete,
    });
    this.transition.setExternalGameplay(true);
    this.transition.setViewport(this.viewportWidth, this.viewportHeight);

    this.loop = new FixedStepLoop({
      update: (dt) => this.update(dt),
      render: (alpha) => options.onRender?.(alpha),
    });
  }

  start(): void {
    this.loop.start();
  }

  stop(): void {
    this.loop.stop();
  }

  destroy(): void {
    this.loop.stop();
    this.transition.reset();
    this.weaves.clear();
    this.collector.reset();
  }

  begin(mode: FractureEntryMode): boolean {
    this.winLatched = false;
    this.gameplayActive = false;
    this.collector.reset();
    this.weaves.clear();
    this.musicalEvents = [];
    this.hintAge = 0;
    this.player = createGameRoot(
      this.viewportWidth * 0.5,
      this.viewportHeight * 0.28,
    );
    return mode === "slingshot"
      ? this.transition.beginFromSlingshot()
      : this.transition.beginFromAccessibleTrigger();
  }

  setViewport(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.transition.setViewport(width, height);
  }

  setSteer(inputX: number): void {
    this.inputX = clamp(inputX, -1, 1);
    this.usePointerSteer = false;
  }

  setPointerSteer(x: number, active: boolean): void {
    this.pointerX = x;
    this.usePointerSteer = active;
  }

  beginWeave(ax: number, ay: number): void {
    if (!this.gameplayActive) return;
    this.weaves.beginPreview(ax, ay);
  }

  updateWeave(bx: number, by: number): void {
    if (!this.gameplayActive) return;
    this.weaves.updatePreview(bx, by);
  }

  endWeave(): void {
    if (!this.gameplayActive) return;
    this.weaves.commitPreview();
  }

  cancelWeave(): void {
    this.weaves.cancelPreview();
  }

  requestExit(): void {
    this.transition.beginRestore();
    this.gameplayActive = false;
  }

  interrupt(): void {
    this.transition.interrupt();
    this.gameplayActive = false;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
  }

  getPhase(): FracturePhase {
    return this.transition.getPhase();
  }

  getWeaverState(): WeaverGameState {
    const base = this.transition.getWeaverState();
    return {
      ...createEmptyWeaverState(),
      ...base,
      score: this.collector.getScore(),
      combo: this.collector.getCombo(),
      collectedCount: this.collector.getCollectedCount(),
      targetCollectCount: this.targetCollect || base.targetCollectCount,
    };
  }

  getSnapshot(): WeaverSnapshot {
    return {
      phase: this.transition.getPhase(),
      player: { ...this.player },
      proxies: this.transition.getProxies(),
      strings: this.weaves.getStrings(),
      preview: this.weaves.getPreview(),
      score: this.collector.getScore(),
      combo: this.collector.getCombo(),
      collectedCount: this.collector.getCollectedCount(),
      targetCollectCount: this.targetCollect,
      deformation: { ...this.deformation },
      viewportWidth: this.viewportWidth,
      viewportHeight: this.viewportHeight,
      hintAge: this.hintAge,
      muted: this.muted,
    };
  }

  /**
   * Full-frame draw: proxies + weave strings + player mascot.
   */
  draw(ctx: CanvasRenderingContext2D): void {
    const phase = this.transition.getPhase();
    if (
      phase === "falling" ||
      phase === "playing" ||
      phase === "restore" ||
      phase === "unlock"
    ) {
      // Reason: ProxyDrawContext is a structural subset; DOM ctx is wider on fillStyle.
      this.transition.draw(
        ctx as unknown as import("./DomShadowProxyWorld").ProxyDrawContext,
      );
    } else {
      ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
    }

    this.drawStrings(ctx);

    if (phase === "playing" || phase === "falling") {
      const palette = getAppearancePreset("cute-bean").palette;
      drawGameMascot(ctx, {
        x: this.player.x,
        y: this.player.y,
        velocityX: this.player.velocityX,
        velocityY: this.player.velocityY,
        deformation: this.deformation,
        palette,
        radius: this.player.radius,
        reducedMotion: this.reducedMotion,
      });
    }
  }

  private onEnterPlaying(): void {
    if (this.gameplayActive) return;
    this.gameplayActive = true;
    this.hintAge = 0;
    const proxies = this.transition.getProxies();
    this.targetCollect = FragmentCollector.winTarget(proxies.length);
    // Seed player near viewport center-top of hero arena.
    this.player = createGameRoot(
      this.viewportWidth * 0.5,
      Math.min(this.viewportHeight * 0.35, 220),
    );
    this.player.velocityY = 80;
  }

  private update(dt: number): void {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    if (step <= 0) return;

    this.transition.update(step);
    const phase = this.transition.getPhase();

    if (phase === "playing" && this.gameplayActive) {
      this.hintAge += step;
      this.updateGameplay(step);
    }

    this.updateDeformation(step);
  }

  private updateGameplay(dt: number): void {
    let steer = this.inputX;
    if (this.usePointerSteer) {
      const dx = this.pointerX - this.player.x;
      steer = clamp(dx / 120, -1, 1);
    }

    integrateGameRoot(this.player, dt, steer, {
      arenaWidth: this.viewportWidth,
      arenaHeight: this.viewportHeight,
      gravity: this.reducedMotion
        ? WEAVER_CONFIG.gravity * 0.55
        : WEAVER_CONFIG.gravity,
    });

    this.weaves.update(dt);
    this.musicalEvents = [];

    for (const s of this.weaves.getStrings()) {
      if (!s.active) continue;
      const bounced = bounceRootOffSegment(
        this.player,
        s.ax,
        s.ay,
        s.bx,
        s.by,
        WEAVER_CONFIG.stringThickness,
      );
      if (bounced) {
        this.collector.registerBounce();
        this.deformation.impactWave = 1;
        if (!this.muted) {
          this.musicalEvents.push(
            this.weaves.makeImpactEvent(s, this.player.velocityY, 0),
          );
        }
      }
    }

    this.collector.updateComboDecay(dt);
    this.collector.collectOverlapping(
      this.player,
      this.transition.getProxies(),
      0,
    );
    if (!this.muted) {
      for (const ev of this.collector.drainMusicalEvents()) {
        this.musicalEvents.push(ev);
      }
    }
    // Drain visual events so the buffer doesn't grow unbounded.
    this.collector.drainCollectionEvents();

    // World still simulates uncollected fragments (external gameplay).
    this.transition.getWorld().update(dt);

    if (
      !this.winLatched &&
      this.targetCollect > 0 &&
      this.collector.getCollectedCount() >= this.targetCollect
    ) {
      this.winLatched = true;
      this.gameplayActive = false;
      this.transition.beginRestore();
    }
  }

  private updateDeformation(dt: number): void {
    const speed = Math.hypot(this.player.velocityX, this.player.velocityY);
    const fall = Math.max(0, this.player.velocityY);
    const rate = clamp(dt * 6, 0, 1);
    const target: BodyDeformation = {
      longitudinalScale: 1 + clamp(fall / 1200, 0, 0.2),
      lateralScale: 1 - clamp(fall / 1600, 0, 0.1),
      headSquash: this.deformation.impactWave * 0.4,
      tailStretch: clamp(speed / 800, 0, 0.5),
      finSpread: clamp(Math.abs(this.player.velocityX) / 600, 0, 0.5),
      impactWave: 0,
      tumbleRotation: clamp(this.player.velocityX / 2000, -0.35, 0.35),
    };
    this.deformation = {
      longitudinalScale: lerp(
        this.deformation.longitudinalScale,
        target.longitudinalScale,
        rate,
      ),
      lateralScale: lerp(
        this.deformation.lateralScale,
        target.lateralScale,
        rate,
      ),
      headSquash: lerp(this.deformation.headSquash, target.headSquash, rate),
      tailStretch: lerp(this.deformation.tailStretch, target.tailStretch, rate),
      finSpread: lerp(this.deformation.finSpread, target.finSpread, rate),
      impactWave: lerp(this.deformation.impactWave, 0, clamp(dt * 4, 0, 1)),
      tumbleRotation: lerp(
        this.deformation.tumbleRotation,
        target.tumbleRotation,
        rate,
      ),
    };
  }

  private drawStrings(ctx: CanvasRenderingContext2D): void {
    const palette = getAppearancePreset("cute-bean").palette;
    for (const s of this.weaves.getStrings()) {
      if (!s.active) continue;
      ctx.save();
      ctx.globalAlpha = 0.35 + s.energy * 0.55;
      ctx.strokeStyle = palette.printPrimary;
      ctx.lineWidth = WEAVER_CONFIG.stringThickness * (0.5 + s.tension * 0.5);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(s.ax, s.ay);
      ctx.lineTo(s.bx, s.by);
      ctx.stroke();
      ctx.restore();
    }

    const preview = this.weaves.getPreview();
    if (preview) {
      ctx.save();
      ctx.globalAlpha = preview.valid ? 0.7 : 0.3;
      ctx.strokeStyle = preview.valid ? palette.highlight : palette.shadow;
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(preview.ax, preview.ay);
      ctx.lineTo(preview.bx, preview.by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();
    }
  }
}
