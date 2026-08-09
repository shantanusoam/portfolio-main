import { resolveSkinPointPosition } from "./character/DotSkin";
import { clamp } from "./core/NumericGuards";
import { FixedStepLoop } from "./core/FixedStepLoop";
import { PerformanceGovernor } from "./core/PerformanceGovernor";
import { resolveLayersForQuality } from "./appearance/AppearanceConfig";
import type { WanderBounds } from "./behavior/WanderPlanner";
import { VisibilityController } from "./input/VisibilityController";
import { shouldDisableMascotStringContacts } from "./input/MobileStringContacts";
import { DomObstacleRegistry } from "./interaction/DomObstacleRegistry";
import { StringRegistry } from "./music/StringRegistry";
import { AudioDirector } from "./music/AudioDirector";
import { AudioGestureGate } from "./music/AudioGestureGate";
import { resolveDefaultMusicalEvent } from "./music/DefaultNoteMapping";
import { MascotPluckVoicePool } from "./music/MascotPluckVoice";
import { MASCOT_CONFIG } from "./MascotConfig";
import { MascotRuntime } from "./MascotRuntime";
import { FishEcosystem, type EcosystemAdult } from "./ecosystem/FishEcosystem";
import { CanvasMascotRenderer } from "./rendering/CanvasMascotRenderer";
import { QUALITY_PRESETS } from "./rendering/RenderQuality";
import type {
  AppearanceLayerName,
  AppearancePresetName,
  AppearanceTuningOverrides,
  BodyDeformation,
  MascotAction,
  MascotDebugSnapshot,
  MascotEcosystemStatus,
  MascotEngine as MascotEngineContract,
  MascotEngineOptions,
  MascotExpression,
  MascotQuality,
  MascotStatus,
  MusicalEvent,
  ResonanceGateState,
  StringPluckEvent,
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
  private readonly ecosystem: FishEcosystem;
  private readonly loop: FixedStepLoop;
  private readonly visibility = new VisibilityController();
  private readonly governor: PerformanceGovernor;
  private readonly obstacles: DomObstacleRegistry;
  private readonly stringRegistry: StringRegistry;
  private stringRegistryListening = false;
  private coarsePointerQuery: MediaQueryList | null = null;
  private readonly audioDirector: AudioDirector;
  private readonly audioGestureGate: AudioGestureGate;
  private readonly pluckVoices: MascotPluckVoicePool;
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
    this.stringRegistry = new StringRegistry();

    this.runtime = new MascotRuntime({
      seed: options.seed,
      quality: options.quality,
      originX: this.cssWidth / 2,
      originY: this.cssHeight / 2,
      bounds: computeBounds(this.cssWidth, this.cssHeight),
      obstacles: this.obstacles,
      strings: this.stringRegistry,
    });

    const initialBounds = computeBounds(this.cssWidth, this.cssHeight);
    this.ecosystem = new FishEcosystem({
      leader: this.runtime,
      seed: options.seed,
      quality: options.quality,
      bounds: initialBounds,
      onStatus: options.onEcosystemStatus,
      getHideTargets: () =>
        this.obstacles
          .getAll()
          .filter((obstacle) => obstacle.mode !== "hard")
          .map((obstacle) => ({
            x: obstacle.centerX,
            y: obstacle.centerY,
          })),
      createRuntime: (seed, originX, originY, index) =>
        new MascotRuntime({
          seed: seed ^ (index * 0x9e3779b9),
          quality: options.quality,
          originX,
          originY,
          bounds: initialBounds,
          obstacles: this.obstacles,
          // Keep string/audio ownership with the leader so a four-fish school
          // cannot multiply contact voices or slingshot state.
          strings: null,
        }),
    });

    this.governor = new PerformanceGovernor({
      initialQuality: options.quality,
    });

    this.loop = new FixedStepLoop({
      update: (dt) => {
        const t0 = now();
        this.ecosystem.update(dt * this.timeScale);
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
      this.ecosystem.setReducedMotion(reduced),
    );
    this.ecosystem.setReducedMotion(
      options.reducedMotion ?? this.visibility.isReducedMotion(),
    );

    this.obstacles.attach();
    this.syncStringContactsForViewport();
    this.attachMobileStringContactWatcher();

    // Independent audio subsystem: its own AudioContext, created lazily and
    // only from a real user gesture (see AudioGestureGate). Reuses this
    // engine's own VisibilityController instance instead of registering a
    // second document-level listener.
    this.audioDirector = new AudioDirector({
      visibility: this.visibility,
      quality: options.quality,
    });
    this.audioGestureGate = new AudioGestureGate(() =>
      this.audioDirector.activate(),
    );
    this.pluckVoices = new MascotPluckVoicePool({
      director: this.audioDirector,
      quality: options.quality,
    });
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
    this.ecosystem.setBounds(computeBounds(this.cssWidth, this.cssHeight));
    this.obstacles.refresh();
    this.syncStringContactsForViewport();
  }

  setPointer(x: number, y: number, active: boolean): void {
    this.ecosystem.setPointer(x, y, active);
  }

  setPointerSuppressed(suppressed: boolean): void {
    this.ecosystem.setPointerSuppressed(suppressed);
  }

  setScrollVelocity(value: number): void {
    this.ecosystem.setScrollVelocity(value);
  }

  setQuality(quality: MascotQuality): void {
    this.ecosystem.setQuality(quality);
    this.governor.setQuality(quality);
    this.audioDirector.setQuality(quality);
    this.pluckVoices.setQuality(quality);
  }

  setEnabled(enabled: boolean): void {
    this.userEnabled = enabled;
    this.ecosystem.setEnabled(enabled);
    if (enabled) this.resume();
    else this.pause("disabled");
  }

  setReducedMotion(reduced: boolean): void {
    this.ecosystem.setReducedMotion(reduced);
  }

  trigger(action: MascotAction): void {
    this.ecosystem.trigger(action);
  }

  getEcosystemStatus(): MascotEcosystemStatus {
    return this.ecosystem.getStatus();
  }

  /** Dev/motion-lab only: toggles the spine/normals/obstacle debug overlay live. */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /** Dev/motion-lab only: scales simulation dt for slow-motion review (1 = normal speed). */
  setTimeScale(scale: number): void {
    if (Number.isFinite(scale) && scale >= 0) this.timeScale = scale;
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    this.audioDirector.setMuted(!enabled);
    if (enabled) {
      await this.audioGestureGate.requestActivation();
    }
  }

  setMasterVolume(value: number): void {
    this.audioDirector.setMasterVolume(value);
  }

  triggerStringPluck(event: StringPluckEvent): void {
    const musical = resolveDefaultMusicalEvent(event);
    this.pluckVoices.play({
      frequency: musical.frequency,
      intensity: musical.velocity,
      pan: musical.pan,
    });
  }

  triggerMusicalEvent(event: MusicalEvent): void {
    this.pluckVoices.play({
      frequency: event.frequency,
      intensity: event.velocity,
      pan: event.pan,
    });
  }

  /** Dev/motion-lab only: appearance lab palette + pattern recipe preset. */
  setAppearancePreset(preset: AppearancePresetName): void {
    this.runtime.setAppearancePreset(preset);
  }

  /** Dev/motion-lab only: per-layer render toggles (silhouette/print/rim/dots/face). */
  setAppearanceLayers(
    layers: Partial<Record<AppearanceLayerName, boolean>>,
  ): void {
    this.runtime.setAppearanceLayers(layers);
  }

  /** Dev/motion-lab only: continuous appearance tuning (dot density, opacity, rim width, etc). */
  setAppearanceTuning(tuning: Partial<AppearanceTuningOverrides>): void {
    this.runtime.setAppearanceTuning(tuning);
  }

  /** Dev/motion-lab only: forces a specific expression; null resumes automatic behavior mapping. */
  setExpressionOverride(expression: MascotExpression | null): void {
    this.runtime.setExpressionOverride(expression);
  }

  /** Dev/motion-lab only: forces specific squash/stretch/tumble fields; null resumes computed deformation. */
  setDeformationOverride(deformation: Partial<BodyDeformation> | null): void {
    this.runtime.setDeformationOverride(deformation);
  }

  getDragTension(): number {
    return this.runtime.getDragTension();
  }

  getStringTension(): number {
    return this.runtime.getStringTension();
  }

  getResonanceGateState(): ResonanceGateState {
    return this.runtime.getResonanceGateState();
  }

  /**
   * Pollable slingshot-ready latch (V2 Phase 5). Returns true once per
   * armed high-tension string release — does not start hero fracture.
   */
  consumeSlingshotTrigger(): boolean {
    return this.runtime.consumeSlingshotTrigger();
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
      dragTension: this.runtime.getDragTension(),
      stringTension: 0,
      slingshotReady: false,
      ecosystem: this.ecosystem.getStatus(),
    };
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loop.stop();
    this.detachMobileStringContactWatcher();
    this.visibility.detach();
    this.obstacles.detach();
    this.stringRegistry.detach();
    this.stringRegistryListening = false;
    this.pluckVoices.destroy();
    this.audioDirector.destroy();
  }

  private readonly handleMobileStringContactChange = (): void => {
    this.syncStringContactsForViewport();
  };

  private attachMobileStringContactWatcher(): void {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }
    try {
      this.coarsePointerQuery = window.matchMedia(
        "(hover: none) and (pointer: coarse)",
      );
      if (typeof this.coarsePointerQuery.addEventListener === "function") {
        this.coarsePointerQuery.addEventListener(
          "change",
          this.handleMobileStringContactChange,
        );
      }
    } catch {
      this.coarsePointerQuery = null;
    }
  }

  private detachMobileStringContactWatcher(): void {
    if (!this.coarsePointerQuery) return;
    if (typeof this.coarsePointerQuery.removeEventListener === "function") {
      this.coarsePointerQuery.removeEventListener(
        "change",
        this.handleMobileStringContactChange,
      );
    }
    this.coarsePointerQuery = null;
  }

  /**
   * Mobile: fish never plucks hero strings. Desktop: registry stays attached
   * so body contacts can still play the instrument.
   */
  private syncStringContactsForViewport(): void {
    const disable = shouldDisableMascotStringContacts(this.cssWidth);
    this.runtime.setStringContactsEnabled(!disable);
    if (disable) {
      if (this.stringRegistryListening) {
        this.stringRegistry.detach();
        this.stringRegistryListening = false;
      }
      return;
    }
    if (!this.stringRegistryListening) {
      this.stringRegistry.attach();
      this.stringRegistryListening = true;
    } else {
      this.stringRegistry.refresh();
    }
  }

  private maybeAdjustQuality(): void {
    const behavior = this.runtime.behaviorMachine.getCurrent();
    const blocked =
      behavior === "sprint" ||
      behavior === "scatter" ||
      behavior === "reform" ||
      this.ecosystem.getStatus().fissionPhase !== null;
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

    for (const fry of this.ecosystem.getAllFry()) {
      this.renderer.drawFry(fry);
    }

    const adults = this.ecosystem.getAdults();
    for (const adult of adults) this.renderAdult(adult, adults.length);

    const fission = this.ecosystem.getFissionVisual();
    if (fission) {
      for (const adult of adults) {
        const root = adult.runtime.pose.getRoot();
        this.renderer.drawFissionSeam(
          root.x,
          root.y,
          adult.runtime.pose.getHeading(),
          adult.scale,
          fission.phase,
          fission.progress,
        );
      }
    }

    this.renderer.drawEcosystemBloom(
      adults.map((adult) => adult.runtime.pose.getRoot()),
      this.ecosystem.getBloomStrength(),
    );

    if (this.debug) this.renderer.drawDebugObstacles(this.obstacles.getAll());
  }

  private renderAdult(adult: EcosystemAdult, population: number): void {
    const runtime = adult.runtime;
    const quality = runtime.quality;
    const layers = resolveLayersForQuality(
      quality,
      runtime.appearanceLayerOverrides,
    );
    const root = runtime.pose.getRoot();
    const ctx = this.renderer.getContext();
    ctx.save();
    ctx.translate(root.x, root.y);
    ctx.scale(adult.scale, adult.scale);
    ctx.translate(-root.x, -root.y);

    // Silhouette -> internal gradient -> clipped print -> rim -> face —
    // upgrade spec "APPEARANCE RENDER PIPELINE". Structural dots and
    // particles stay batched through the existing renderers below.
    this.renderer.drawAppearance({
      ribs: runtime.ribs,
      contourWidths: runtime.contourWidths,
      faceFrame: runtime.faceFrame,
      expression: runtime.expressionVisual,
      deformation: runtime.bodyDeformation,
      patternMarks: runtime.patternMarks,
      palette: runtime.appearancePalette,
      tuning: runtime.appearanceTuning,
      layers,
      quality,
      fins: {
        left: runtime.antennaeLeft,
        right: runtime.antennaeRight,
      },
      patternRecipe: runtime.patternRecipe,
      // Production material is intentionally local/procedural; this prevents
      // generated decals or a world-tiled texture from sliding across the
      // moving homepage character.
      generatedDecalAtlas: null,
      velvetMicrotexture: null,
    });

    if (layers.dots) {
      this.renderSparseDots(runtime, population);
    }

    this.renderer.drawParticles(runtime.particles, {
      clickScatter: { color: "#ff6b3d", opacity: 0.72 },
      spark: { color: "#f3ede4", opacity: 0.68 },
      reformTrail: { color: "#c8bbae", opacity: 0.46 },
      impactRipple: { color: "#ffffff", opacity: 0.4 },
      inspectGlint: { color: "#ff8a61", opacity: 0.76 },
      sleepPulse: { color: "#a69b91", opacity: 0.42 },
    });

    if (this.debug) {
      this.renderer.drawDebugSpine(runtime.pose.joints);
      this.renderer.drawDebugNormals(runtime.ribs);
    }
    ctx.restore();
  }

  /**
   * Sparse structural-dot accent layer (upgrade spec Problem 1/Option C):
   * stride-samples the existing skin-point cloud instead of pushing every
   * point, and colours groups from the active palette instead of hardcoded
   * equal-brightness cyan/magenta — the exact "uniform visual static"
   * failure mode the upgrade spec calls out. Still exactly one fill() per
   * group per frame via CanvasDotRenderer.
   */
  private renderSparseDots(runtime: MascotRuntime, population: number): void {
    const dotRenderer = this.renderer.dotRenderer;
    dotRenderer.beginFrame();

    const deformation = runtime.getDotDeformation();
    const density = clamp(runtime.appearanceTuning.dotDensity, 0, 1);
    // Keep the existing quality budget fleet-wide instead of multiplying it
    // by the number of visible siblings.
    const fraction =
      (density * MASCOT_CONFIG.appearance.sparseDotFraction) /
      Math.max(1, population);
    const stride =
      fraction > 0 ? Math.max(1, Math.round(1 / fraction)) : Infinity;

    const points = runtime.skinPoints;
    if (Number.isFinite(stride)) {
      for (let i = 0; i < points.length; i += stride) {
        const point = points[i];
        resolveSkinPointPosition(
          point,
          runtime.ribs,
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
    }

    const ctx = this.renderer.getContext();
    const palette = runtime.appearancePalette;
    dotRenderer.flushGroup(ctx, 0, { color: palette.highlight, opacity: 0.5 });
    dotRenderer.flushGroup(ctx, 1, {
      color: palette.printPrimary,
      opacity: 0.32,
    });
    dotRenderer.flushGroup(ctx, 2, {
      color: palette.printSecondary,
      opacity: 0.28,
    });
  }
}
