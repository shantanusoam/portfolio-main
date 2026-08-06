import { resolveSkinPointPosition } from "./character/DotSkin";
import { FixedStepLoop } from "./core/FixedStepLoop";
import { PerformanceGovernor } from "./core/PerformanceGovernor";
import type { WanderBounds } from "./behavior/WanderPlanner";
import { VisibilityController } from "./input/VisibilityController";
import { DomObstacleRegistry } from "./interaction/DomObstacleRegistry";
import { MASCOT_CONFIG } from "./MascotConfig";
import { MascotRuntime } from "./MascotRuntime";
import { CanvasMascotRenderer } from "./rendering/CanvasMascotRenderer";
import { QUALITY_PRESETS } from "./rendering/RenderQuality";
import type {
  MascotAction,
  MascotDebugSnapshot,
  MascotEngine as MascotEngineContract,
  MascotEngineOptions,
  MascotQuality,
  MascotStatus,
} from "./types";

/**
 * Assembles every subsystem (fixed-step loop, runtime simulation, Canvas
 * renderer, DOM obstacle registry, visibility/reduced-motion, performance
 * governor) behind the documented imperative MascotEngine contract. React
 * never reaches past this class — see components/mascot/ProceduralMascotCanvas.tsx.
 */

const now = (): number =>
  typeof performance !== "undefined" ? performance.now() : Date.now();

function computeBounds(width: number, height: number): WanderBounds {
  const margin = MASCOT_CONFIG.wanderBoundsMargin;
  return {
    minX: margin,
    minY: margin,
    maxX: Math.max(margin + 1, width - margin),
    maxY: Math.max(margin + 1, height - margin),
  };
}

export class MascotEngine implements MascotEngineContract {
  private readonly renderer: CanvasMascotRenderer;
  private readonly runtime: MascotRuntime;
  private readonly loop: FixedStepLoop;
  private readonly visibility = new VisibilityController();
  private readonly governor: PerformanceGovernor;
  private readonly obstacles: DomObstacleRegistry;
  private readonly onStatus?: (status: MascotStatus) => void;
  private debug: boolean;
  private timeScale = 1;
  private readonly scratchDot = { x: 0, y: 0 };

  private userEnabled = true;
  private destroyed = false;
  private lastStatusAt = 0;
  private simMsAccumulator = 0;
  private cssWidth: number;
  private cssHeight: number;

  constructor(options: MascotEngineOptions) {
    this.debug = options.debug ?? false;
    this.onStatus = options.onStatus;

    this.renderer = new CanvasMascotRenderer({ canvas: options.canvas });
    for (const group of [0, 1, 2]) {
      this.renderer.dotRenderer.registerGroup(
        group,
        QUALITY_PRESETS.high.dotCount,
      );
    }

    const rect = options.canvas.getBoundingClientRect();
    this.cssWidth = rect.width || 1;
    this.cssHeight = rect.height || 1;

    this.obstacles = new DomObstacleRegistry();

    this.runtime = new MascotRuntime({
      seed: options.seed,
      quality: options.quality,
      originX: this.cssWidth / 2,
      originY: this.cssHeight / 2,
      bounds: computeBounds(this.cssWidth, this.cssHeight),
      obstacles: this.obstacles,
    });

    this.governor = new PerformanceGovernor({
      initialQuality: options.quality,
    });

    this.loop = new FixedStepLoop({
      update: (dt) => {
        const t0 = now();
        this.runtime.update(dt * this.timeScale);
        this.simMsAccumulator += now() - t0;
      },
      render: () => {
        const t0 = now();
        this.render();
        const renderMs = now() - t0;
        this.governor.recordFrame(this.simMsAccumulator + renderMs);
        this.simMsAccumulator = 0;
        this.maybeAdjustQuality();
        this.maybeReportStatus();
      },
      onDroppedSimulationTime: () =>
        this.governor.recordDroppedSimulationTime(),
    });

    this.visibility.attach();
    this.visibility.onVisibilityChange((visible) => {
      if (visible) this.resume();
      else this.loop.stop();
    });
    this.visibility.onReducedMotionChange((reduced) =>
      this.runtime.setReducedMotion(reduced),
    );
    this.runtime.setReducedMotion(
      options.reducedMotion ?? this.visibility.isReducedMotion(),
    );

    this.obstacles.attach();
  }

  start(): void {
    if (this.destroyed || !this.userEnabled) return;
    if (!this.visibility.isVisible()) return;
    this.loop.start();
  }

  pause(_reason?: string): void {
    this.loop.stop();
  }

  resume(): void {
    if (this.destroyed || !this.userEnabled) return;
    if (!this.visibility.isVisible()) return;
    this.loop.start();
  }

  resize(width: number, height: number, dpr: number): void {
    this.cssWidth = Math.max(1, width);
    this.cssHeight = Math.max(1, height);
    this.renderer.resize(this.cssWidth, this.cssHeight, dpr);
    this.runtime.setBounds(computeBounds(this.cssWidth, this.cssHeight));
    this.obstacles.refresh();
  }

  setPointer(x: number, y: number, active: boolean): void {
    this.runtime.setPointer(x, y, active);
  }

  setScrollVelocity(value: number): void {
    this.runtime.setScrollVelocity(value);
  }

  setQuality(quality: MascotQuality): void {
    this.runtime.setQuality(quality);
    this.governor.setQuality(quality);
  }

  setEnabled(enabled: boolean): void {
    this.userEnabled = enabled;
    this.runtime.setEnabled(enabled);
    if (enabled) this.resume();
    else this.pause("disabled");
  }

  setReducedMotion(reduced: boolean): void {
    this.runtime.setReducedMotion(reduced);
  }

  trigger(action: MascotAction): void {
    this.runtime.trigger(action);
  }

  /** Dev/motion-lab only: toggles the spine/normals/obstacle debug overlay live. */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /** Dev/motion-lab only: scales simulation dt for slow-motion review (1 = normal speed). */
  setTimeScale(scale: number): void {
    if (Number.isFinite(scale) && scale >= 0) this.timeScale = scale;
  }

  getDebugSnapshot(): MascotDebugSnapshot {
    return {
      behavior: this.runtime.behaviorMachine.getCurrent(),
      quality: this.runtime.quality,
      performance: this.governor.getState(),
      rootPosition: this.runtime.pose.getRoot(),
      spinePoints: this.runtime.pose.joints.map((joint) => ({
        x: joint.x,
        y: joint.y,
      })),
      timestamp: now(),
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loop.stop();
    this.visibility.detach();
    this.obstacles.detach();
  }

  private maybeAdjustQuality(): void {
    const behavior = this.runtime.behaviorMachine.getCurrent();
    const blocked =
      behavior === "sprint" || behavior === "scatter" || behavior === "reform";
    const next = this.governor.evaluate(blocked);
    if (next) this.setQuality(next);
  }

  private maybeReportStatus(): void {
    if (!this.onStatus) return;
    const t = now();
    if (t - this.lastStatusAt < MASCOT_CONFIG.statusUpdateIntervalMs) return;
    this.lastStatusAt = t;
    const state = this.governor.getState();
    this.onStatus({
      behavior: this.runtime.behaviorMachine.getCurrent(),
      quality: this.runtime.quality,
      fps: state.averageFrameMs > 0 ? 1000 / state.averageFrameMs : 0,
      performance: state,
    });
  }

  private render(): void {
    this.renderer.clear();
    if (!this.runtime.enabled) return;

    const dotRenderer = this.renderer.dotRenderer;
    dotRenderer.beginFrame();

    const deformation = this.runtime.getDotDeformation();
    for (const point of this.runtime.skinPoints) {
      resolveSkinPointPosition(
        point,
        this.runtime.ribs,
        deformation,
        this.scratchDot,
      );
      dotRenderer.push(
        point.group,
        this.scratchDot.x,
        this.scratchDot.y,
        point.radius,
      );
    }

    const ctx = this.renderer.getContext();
    dotRenderer.flushGroup(ctx, 0, { color: "#f5fbff", opacity: 0.95 });
    dotRenderer.flushGroup(ctx, 1, { color: "#38f2d8", opacity: 0.85 });
    dotRenderer.flushGroup(ctx, 2, { color: "#ff3ec9", opacity: 0.8 });

    const root = this.runtime.pose.getRoot();
    this.renderer.drawCore(
      root.x,
      root.y,
      MASCOT_CONFIG.creature.coreRadius,
      this.runtime.expression.glowIntensity,
      "#ffffff",
    );

    this.renderer.drawParticles(this.runtime.particles, {
      clickScatter: { color: "#ff3ec9", opacity: 0.8 },
      spark: { color: "#38f2d8", opacity: 0.7 },
      reformTrail: { color: "#f5fbff", opacity: 0.5 },
      impactRipple: { color: "#ffffff", opacity: 0.4 },
      inspectGlint: { color: "#ffe36e", opacity: 0.8 },
      sleepPulse: { color: "#8ea7ff", opacity: 0.5 },
    });

    if (this.debug) {
      this.renderer.drawDebugSpine(this.runtime.pose.joints);
      this.renderer.drawDebugNormals(this.runtime.ribs);
      this.renderer.drawDebugObstacles(this.obstacles.getAll());
    }
  }
}
