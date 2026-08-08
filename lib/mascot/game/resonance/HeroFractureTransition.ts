/**
 * Hero fracture choreography — V2 §17–19, §41, §47.
 * Beats: tension → snap → unlock → falling → playing (immediate, no Start modal).
 */

import { SeededRandom } from "../../core/SeededRandom";
import { DomShadowProxyWorld } from "./DomShadowProxyWorld";
import { snapshotHeroProxies } from "./HeroProxySnapshot";
import {
  createEmptyWeaverState,
  type FracturePhase,
  type HeroProxyObject,
  type WeaverGameState,
} from "./types";

export type FractureEntryMode = "accessible" | "slingshot";

export interface FractureAttrTarget {
  setAttribute(name: string, value: string): void;
  removeAttribute(name: string): void;
  hasAttribute(name: string): boolean;
}

export interface HeroFractureTransitionOptions {
  /** Hero section (or document fragment) to snapshot + mark fractured. */
  heroRoot: import("./HeroProxySnapshot").SnapshotRoot | null;
  /** Element that receives `data-resonance-fractured` (typically #hero). */
  fractureTarget?: FractureAttrTarget | null;
  seed?: number;
  reducedMotion?: boolean;
  isMobile?: boolean;
  maxProxies?: number;
  onPlaying?: () => void;
  onPhaseChange?: (phase: FracturePhase) => void;
  onRestoreComplete?: () => void;
}

const FRACTURE_ATTR = "data-resonance-fractured";

const TIMINGS = {
  accessible: {
    tension: 0.08,
    snap: 0.06,
    unlock: 0.05,
    fallingBeforePlay: 0.12,
  },
  slingshot: {
    tension: 0.28,
    snap: 0.1,
    unlock: 0.08,
    fallingBeforePlay: 0.18,
  },
  reduced: {
    tension: 0.02,
    snap: 0.02,
    unlock: 0.04,
    fallingBeforePlay: 0.06,
  },
} as const;

/**
 * Orchestrates fracture beats and owns DomShadowProxyWorld for the transition.
 * Gameplay loop (bounce/weave) stays out — `onPlaying` hands off immediately.
 */
export class HeroFractureTransition {
  private phase: FracturePhase = "idle";
  private entryMode: FractureEntryMode = "accessible";
  private phaseElapsed = 0;
  private readonly world: DomShadowProxyWorld;
  private readonly options: HeroFractureTransitionOptions;
  private weaver: WeaverGameState = createEmptyWeaverState();
  private playingFired = false;
  private shakeImpulse = 0;
  /** When true, `playing` skips world.update — ResonanceWeaverRuntime drives sim. */
  private externalGameplay = false;

  constructor(options: HeroFractureTransitionOptions) {
    this.options = options;
    this.world = new DomShadowProxyWorld({
      reducedMotion: options.reducedMotion ?? false,
    });
  }

  /**
   * Hand world simulation to Resonance Weaver during `playing`.
   * Fracture/falling/restore still update the world internally.
   */
  setExternalGameplay(enabled: boolean): void {
    this.externalGameplay = enabled;
  }

  getPhase(): FracturePhase {
    return this.phase;
  }

  getWorld(): DomShadowProxyWorld {
    return this.world;
  }

  getProxies(): readonly HeroProxyObject[] {
    return this.world.getProxies();
  }

  getWeaverState(): WeaverGameState {
    return this.weaver;
  }

  /** Screen shake amplitude for optional overlay CSS (0 when reduced motion). */
  getShakeImpulse(): number {
    return this.shakeImpulse;
  }

  isActive(): boolean {
    return (
      this.phase !== "idle" && this.phase !== "done" && this.phase !== "restore"
    );
  }

  beginFromAccessibleTrigger(): boolean {
    return this.begin("accessible");
  }

  beginFromSlingshot(): boolean {
    return this.begin("slingshot");
  }

  /**
   * Abort mid-transition (resize / route / Escape) without leaving a stuck
   * fractured hero — enters restore immediately.
   */
  interrupt(): void {
    if (this.phase === "idle" || this.phase === "done") return;
    this.setPhase("restore");
  }

  /** Soft exit: restore proxies toward home, then clear fracture attr. */
  beginRestore(): void {
    if (this.phase === "idle" || this.phase === "done") return;
    this.setPhase("restore");
  }

  setViewport(width: number, height: number): void {
    this.world.setViewport(width, height);
  }

  update(dt: number): void {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    if (step <= 0) return;

    this.shakeImpulse = Math.max(0, this.shakeImpulse - step * 8);
    this.weaver.elapsed += step;

    switch (this.phase) {
      case "tension":
        this.phaseElapsed += step;
        if (this.phaseElapsed >= this.timing().tension) {
          this.setPhase("snap");
          if (!this.options.reducedMotion) {
            this.shakeImpulse = this.entryMode === "slingshot" ? 1 : 0.35;
          }
        }
        break;
      case "snap":
        this.phaseElapsed += step;
        if (this.phaseElapsed >= this.timing().snap) {
          this.unlockProxies();
          this.setPhase("unlock");
        }
        break;
      case "unlock":
        this.phaseElapsed += step;
        if (this.phaseElapsed >= this.timing().unlock) {
          this.setPhase("falling");
        }
        break;
      case "falling":
        this.world.update(step);
        this.phaseElapsed += step;
        if (this.phaseElapsed >= this.timing().fallingBeforePlay) {
          this.enterPlaying();
        }
        break;
      case "playing":
        if (!this.externalGameplay) {
          this.world.update(step);
        }
        break;
      case "restore": {
        const remaining = this.world.restoreTowardHome(step, 5.5);
        if (remaining < 1.5 || this.phaseElapsed > 2.5) {
          this.finishRestore();
        }
        this.phaseElapsed += step;
        break;
      }
      default:
        break;
    }
  }

  draw(ctx: Parameters<DomShadowProxyWorld["draw"]>[0]): void {
    if (
      this.phase === "falling" ||
      this.phase === "playing" ||
      this.phase === "restore" ||
      this.phase === "unlock"
    ) {
      this.world.draw(ctx);
    }
  }

  reset(): void {
    this.clearFractureAttr();
    this.world.clear();
    this.phase = "idle";
    this.phaseElapsed = 0;
    this.playingFired = false;
    this.shakeImpulse = 0;
    this.weaver = createEmptyWeaverState();
  }

  private begin(mode: FractureEntryMode): boolean {
    if (this.phase !== "idle" && this.phase !== "done") return false;

    this.entryMode = mode;
    this.playingFired = false;
    this.phaseElapsed = 0;
    this.shakeImpulse = 0;
    this.weaver = createEmptyWeaverState();
    this.weaver.phase = "tension";

    // Reduced motion: soft detach — skip stretch/shake tension beat.
    if (this.options.reducedMotion) {
      this.unlockProxies();
      this.setPhase("falling");
      return true;
    }

    this.setPhase("tension");
    return true;
  }

  private timing() {
    if (this.options.reducedMotion) return TIMINGS.reduced;
    return TIMINGS[this.entryMode];
  }

  private unlockProxies(): void {
    const root = this.options.heroRoot;
    if (!root) {
      this.world.clear();
      return;
    }

    const rng = new SeededRandom(this.options.seed ?? 0x7e50_a11c);
    const proxies = snapshotHeroProxies(root, {
      rng,
      isMobile: this.options.isMobile,
      maxProxies: this.options.maxProxies,
    });

    // Soft detach: damp scatter when reduced or accessible entry.
    if (this.options.reducedMotion || this.entryMode === "accessible") {
      for (let i = 0; i < proxies.length; i += 1) {
        proxies[i].velocityX *= this.options.reducedMotion ? 0.12 : 0.45;
        proxies[i].velocityY *= this.options.reducedMotion ? 0.15 : 0.55;
        proxies[i].angularVelocity *= this.options.reducedMotion ? 0.05 : 0.4;
      }
    }

    this.world.adopt(proxies, true);
    this.weaver.targetCollectCount = proxies.length;
    this.applyFractureAttr();
  }

  private enterPlaying(): void {
    if (this.playingFired) return;
    this.playingFired = true;
    this.setPhase("playing");
    this.options.onPlaying?.();
  }

  private finishRestore(): void {
    this.clearFractureAttr();
    this.world.clear();
    this.setPhase("done");
    this.options.onRestoreComplete?.();
  }

  private setPhase(phase: FracturePhase): void {
    if (this.phase === phase) return;
    this.phase = phase;
    this.phaseElapsed = 0;
    this.weaver.phase = phase;
    this.options.onPhaseChange?.(phase);
  }

  private resolveFractureTarget(): FractureAttrTarget | null {
    if (this.options.fractureTarget) return this.options.fractureTarget;
    const root = this.options.heroRoot as FractureAttrTarget | null;
    if (
      root &&
      typeof root.setAttribute === "function" &&
      typeof root.removeAttribute === "function" &&
      typeof root.hasAttribute === "function"
    ) {
      return root;
    }
    return null;
  }

  private applyFractureAttr(): void {
    this.resolveFractureTarget()?.setAttribute(FRACTURE_ATTR, "");
  }

  private clearFractureAttr(): void {
    const target = this.resolveFractureTarget();
    if (target?.hasAttribute(FRACTURE_ATTR)) {
      target.removeAttribute(FRACTURE_ATTR);
    }
  }
}

export { FRACTURE_ATTR };
