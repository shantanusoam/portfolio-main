/**
 * Shared type contracts for the procedural mascot subsystem.
 * Extended incrementally as each subsystem lands — see docs/mascot/ARCHITECTURE.md.
 */

export interface Point {
  x: number;
  y: number;
}

/**
 * A physical contact between the mascot and a homepage guitar string
 * (`lib/mascot/music/StringContactDetector.ts`). Semantic and DSP-free —
 * the musical/audio layer converts this into a `MusicalEvent` separately,
 * per the upgrade spec's "keep physical collision independent from DSP
 * implementation."
 */
export interface StringPluckEvent {
  stringId: string;
  stringIndex: number;
  contactType: "core" | "tail" | "fin" | "landing" | "drag";
  /** 0..1 position along the string. */
  contactPosition: number;
  /** 0..1 perceptual intensity, already curved — never raw velocity. */
  velocity: number;
  direction: -1 | 1;
  worldX: number;
  worldY: number;
  gameMode: boolean;
  combo: number;
  /** Seconds, MascotRuntime's simulation clock. */
  timestamp: number;
}

export type MascotQuality = "reduced" | "low" | "medium" | "high";

export interface QualityPreset {
  dotCount: number;
  particles: number;
  solverIterations: number;
  dprCap: number;
  targetFps: number;
}

export interface PerformanceState {
  averageFrameMs: number;
  p95FrameMs: number;
  worstFrameMs: number;
  slowFrames: number;
  droppedSimulationTime: number;
  quality: MascotQuality;
  lastQualityChange: number;
}

export type MascotBehavior =
  | "dormant"
  | "wake"
  | "follow"
  | "wander"
  | "inspect"
  | "orbit"
  | "avoid"
  | "sprint"
  | "rest"
  | "scatter"
  | "reform"
  | "reducedMotion";

export type AdvancedMascotBehavior =
  | "crawl"
  | "land"
  | "step"
  | "hide"
  | "sleep"
  | "celebrate"
  | "textFeed";

export interface MotionRecipe {
  frequency: number;
  damping: number;
  response: number;
}

export type MascotAction =
  | { type: "click"; x: number; y: number }
  | { type: "releaseFry"; x?: number; y?: number }
  | { type: "callFish" }
  | { type: "scatter" }
  | { type: "reform" }
  | { type: "wake" }
  | { type: "rest" };

/**
 * Body-local squash/stretch/tumble performance parameters — see the upgrade
 * spec's "SQUASH, STRETCH, AND TUMBLE" and V2 §8 CharacterDeformation.
 * Field mapping from V2 CharacterDeformation:
 *   scaleForward → longitudinalScale
 *   scaleNormal  → lateralScale
 *   headScaleX/Y → headSquash (derived squash amount)
 *   tailStretch / finSpread / impactWave / rotation(tumbleRotation) — same names
 *
 * Computed once per frame in `MascotRuntime.update()` (via
 * `BodyDeformationController`) from behavior/velocity/drag/collision/string
 * signals, then applied when resolving rib/silhouette geometry — never
 * mutates spine joints directly, only how ribs/contour are drawn.
 */
export interface BodyDeformation {
  /** 1 = neutral, >1 stretched along the spine (sprint/drag), <1 compressed (impact). Alias: scaleForward. */
  longitudinalScale: number;
  /** 1 = neutral, >1 widened (impact squash), <1 narrowed (stretch). Alias: scaleNormal. */
  lateralScale: number;
  /** 0 = neutral, >0 head compresses/widens (impact reaction). */
  headSquash: number;
  /** 0 = neutral, >0 tail elongates (sprint trail), <0 tail curls (rest). */
  tailStretch: number;
  /** 0 = neutral, signed spread of the fin/antennae silhouette. */
  finSpread: number;
  /** 0..1 pulse intensity from a recent impact/dodge, decays over time. */
  impactWave: number;
  /** Bounded rotation offset (radians) for controlled tumble — never a constant spin. */
  tumbleRotation: number;
}

/**
 * Velocity/interaction drivers for the facial acting matrix (V2 §5).
 * Filled each frame by `MascotRuntime` from pose velocity, pointer drag,
 * obstacle force, and string-contact impulses.
 */
export interface FacialMotionInput {
  velocityX: number;
  velocityY: number;
  accelerationX: number;
  accelerationY: number;

  speed: number;
  fallingSpeed: number;

  dragTension: number;
  collisionImpulse: number;
  stringTension: number;

  targetDirectionX: number;
  targetDirectionY: number;
}

/**
 * Continuous face pose produced by `FacialMotionMatrix` (V2 §5). Blended into
 * `ExpressionVisualState` so eyes/mouth respond to motion, not only behavior timers.
 */
export interface FacialPose {
  pupilX: number;
  pupilY: number;

  eyeScaleX: number;
  eyeScaleY: number;

  eyelid: number;
  mouthOpen: number;
  mouthCurve: number;

  headLean: number;
  cheekIntensity: number;
}

export type MascotExpression =
  | "neutral"
  | "curious"
  | "happy"
  | "focused"
  | "surprised"
  | "squint"
  | "sleepy"
  | "dizzy"
  | "determined";

export type AppearanceLayerName =
  | "silhouette"
  | "print"
  | "rim"
  | "dots"
  | "face";

export type AppearancePresetName =
  | "cute-bean"
  | "signal-manta"
  | "velvet-comet";

export type AppearancePatternRecipeName =
  | "terrazzo-confetti"
  | "constellation-freckles"
  | "soft-stripes";

/** Continuous appearance-lab tuning knobs — see MascotAppearancePanel.tsx. */
export interface AppearanceTuningOverrides {
  /** 0..1 multiplier on how many sparse accent dots render (quality tier still gates whether dots render at all). */
  dotDensity: number;
  /** 0..1 opacity of the base silhouette fill. */
  bodyOpacity: number;
  /** 0..2 multiplier on rim stroke width. */
  rimWidth: number;
  /** 0..2 multiplier on face/glow luminosity. */
  glowIntensity: number;
  /** 0.4..2.2 multiplier on procedural print mark size. */
  patternScale: number;
  /** 0..1 print opacity/contrast. */
  patternContrast: number;
}

/**
 * What a harmony/quantization layer derives from a `StringPluckEvent`
 * before handing bounded, clamped parameters to a voice. Keep physical
 * collision independent from DSP implementation: nothing in
 * `lib/mascot/music` should construct a `StringPluckEvent`, and nothing
 * outside `lib/mascot/music` should need to know about voice pools,
 * buffers, or `AudioContext`.
 */
export interface MusicalEvent {
  midiNote: number;
  frequency: number;
  /** 0-1, already perceptually curved — never raw linear speed. */
  velocity: number;
  /** 0-1, maps to filter brightness/pick position. */
  brightness: number;
  /** 0-1, higher damps the pluck's high end faster. */
  damping: number;
  /** -1 (left) to 1 (right). */
  pan: number;
  /** 0-1 send level to an optional reverb/delay bus. */
  reverbSend: number;
  articulation: "pluck" | "harmonic" | "muted" | "strum" | "bass";
  /** `audioContext.currentTime`-based, not a visual timestamp. */
  scheduledTime: number;
}

export interface MascotStatus {
  behavior: MascotBehavior;
  quality: MascotQuality;
  fps: number;
  performance: PerformanceState;
}

export type EcosystemFissionPhase =
  | "settle"
  | "round"
  | "seam"
  | "separate"
  | "recover";

/** Low-frequency public state for the hidden Signal Shoal interaction. */
export interface MascotEcosystemStatus {
  /** Adult count in the shoal (1–4). */
  population: number;
  activeFry: boolean;
  /** How many tiny prey fish are currently swimming. */
  activeFryCount: number;
  /** Meals eaten by the current leader toward the next fission. */
  growthStage: number;
  mealsToNextFission: number;
  fissionPhase: EcosystemFissionPhase | null;
  capped: boolean;
  canReleaseFry: boolean;
}

export interface MascotDebugSnapshot {
  behavior: MascotBehavior;
  quality: MascotQuality;
  performance: PerformanceState;
  rootPosition: Point;
  spinePoints: readonly Point[];
  timestamp: number;
  /** 0..1 — hard-obstacle drag stretch (Phase 4). */
  dragTension?: number;
  /** 0..1 — string pull tension (Phase 5). */
  stringTension?: number;
  /** True when a slingshot release is latched awaiting consume. */
  slingshotReady?: boolean;
  ecosystem?: MascotEcosystemStatus;
}

/**
 * V2 Phase 5 slingshot gate snapshot — see
 * `lib/mascot/music/StringTensionGate.ts`. Transition choreography polls
 * `consumeSlingshotTrigger()` rather than reading this every frame.
 */
export interface ResonanceGateState {
  attachedToString: boolean;
  pullTension: number;
  releaseVelocity: number;
  pointerReleased: boolean;
  triggerCooldown: number;
}

export interface MascotEngineOptions {
  canvas: HTMLCanvasElement;
  seed: number;
  quality: MascotQuality;
  debug?: boolean;
  reducedMotion?: boolean;
  onStatus?: (status: MascotStatus) => void;
  onEcosystemStatus?: (status: MascotEcosystemStatus) => void;
}

export interface MascotEngine {
  start(): void;
  pause(reason?: string): void;
  resume(): void;
  resize(width: number, height: number, dpr: number): void;
  setPointer(x: number, y: number, active: boolean): void;
  /** While true, the leader ignores user pointer follow (roe egg hover). */
  setPointerSuppressed(suppressed: boolean): void;
  setScrollVelocity(value: number): void;
  setQuality(quality: MascotQuality): void;
  setEnabled(enabled: boolean): void;
  setReducedMotion(reduced: boolean): void;
  trigger(action: MascotAction): void;
  getEcosystemStatus(): MascotEcosystemStatus;
  getDebugSnapshot(): MascotDebugSnapshot;
  destroy(): void;
  /** Dev/motion-lab only: live toggle for the spine/normals/obstacle debug overlay. */
  setDebug(enabled: boolean): void;
  /** Dev/motion-lab only: simulation speed multiplier for slow-motion review. */
  setTimeScale(scale: number): void;
  /**
   * Enables or mutes the mascot's own string-contact audio. Turning sound ON
   * lazily creates/resumes its independent `AudioContext` — callers MUST
   * invoke this only from inside a real user-gesture event handler (click,
   * tap, keydown), never from an effect, timer, or on mount. Turning sound
   * OFF is always safe to call from anywhere. Never rejects; resolves once
   * activation has settled (including a no-op resolve when unsupported).
   */
  setSoundEnabled(enabled: boolean): Promise<void>;
  /** Sets the master output level (0-1) for the mascot's own audio bus. */
  setMasterVolume(value: number): void;
  /**
   * Feeds a physical string-contact event into the mascot's audio system.
   * Uses a minimal built-in note mapping (see lib/mascot/music/DefaultNoteMapping.ts)
   * until the harmony/quantization layer lands — see docs/mascot/AUDIO_ARCHITECTURE.md.
   */
  triggerStringPluck(event: StringPluckEvent): void;
  /**
   * Plays an already-resolved `MusicalEvent` directly through the mascot's
   * voice pool, bypassing `DefaultNoteMapping`'s guitar-chord lookup.
   * Strumrise (which quantizes its own portfolio-mode/pentatonic notes via
   * `lib/mascot/music/HarmonyMap.ts`) uses this instead of
   * `triggerStringPluck` so the game reuses the same voice-capped audio
   * engine without duplicating it — see docs/mascot/STRUMRISE_DESIGN.md.
   */
  triggerMusicalEvent(event: MusicalEvent): void;
  /** Dev/motion-lab only: appearance lab palette + pattern recipe preset. */
  setAppearancePreset(preset: AppearancePresetName): void;
  /** Dev/motion-lab only: per-layer render toggles (silhouette/print/rim/dots/face). */
  setAppearanceLayers(
    layers: Partial<Record<AppearanceLayerName, boolean>>,
  ): void;
  /** Dev/motion-lab only: continuous appearance tuning (dot density, opacity, rim width, etc). */
  setAppearanceTuning(tuning: Partial<AppearanceTuningOverrides>): void;
  /** Dev/motion-lab only: forces a specific expression instead of the behavior-driven one; null resumes automatic mapping. */
  setExpressionOverride(expression: MascotExpression | null): void;
  /** Dev/motion-lab only: forces specific squash/stretch/tumble fields instead of the computed ones; null (or omitted keys) resumes automatic behavior-driven deformation. */
  setDeformationOverride(deformation: Partial<BodyDeformation> | null): void;
  /** 0..1 drag resistance stretch while pulling into hard UI (V2 Phase 4). */
  getDragTension(): number;
  /** 0..1 string pull tension while attached to a hero string (V2 Phase 5). */
  getStringTension(): number;
  /** Resonance / slingshot gate fields for transition choreography. */
  getResonanceGateState(): ResonanceGateState;
  /**
   * Returns true once when a high-tension string release armed the
   * slingshot — clears the latch. Does not start fracture itself.
   */
  consumeSlingshotTrigger(): boolean;
}

export type ObstacleMode = "hard" | "soft" | "interest" | "perch";

export interface MascotObstacle {
  id: string;
  element: HTMLElement;
  mode: ObstacleMode;
  left: number;
  top: number;
  right: number;
  bottom: number;
  centerX: number;
  centerY: number;
  padding: number;
  influence: number;
  priority: number;
  /** Value of `data-mascot-interest` when mode is interest (e.g. "hero", "project"). */
  interestTag?: string;
}

export type WanderPathKind =
  | "wide-loop"
  | "figure-eight"
  | "lazy-sweep"
  | "card-orbit"
  | "edge-cruise"
  | "diagonal-sprint"
  | "curiosity-circle"
  | "rest-curl";

export type SpeedCurve = "ease-in-out" | "linear" | "ease-out" | "hold";

export interface WanderSegment {
  kind: WanderPathKind;
  startTime: number;
  duration: number;
  controlPoints: readonly Point[];
  speedCurve: SpeedCurve;
  nextBehavior?: MascotBehavior;
}

export interface SkinPoint {
  longitudinal: number;
  lateral: number;
  radius: number;
  opacity: number;
  boneA: number;
  boneB: number;
  weightB: number;
  noiseSeed: number;
  group: number;
}

export interface BodyProfileConfig {
  maxWidth: number;
  headScale: number;
  shoulderPosition: number;
  tailExponent: number;
  bellyBias: number;
}

export interface VerletNode {
  x: number;
  y: number;
  previousX: number;
  previousY: number;
  pinned: boolean;
}

export interface LegState {
  side: "left" | "right";
  rootJoint: number;
  upperLength: number;
  lowerLength: number;
  root: Point;
  knee: Point;
  foot: Point;
  startFoot: Point;
  targetFoot: Point;
  planted: boolean;
  stepProgress: number;
  cooldown: number;
}

export type ScenarioName =
  | "follow-horizontal"
  | "follow-circle"
  | "hard-turn"
  | "sprint-stop"
  | "wander-loop"
  | "rectangle-corner"
  | "inspect-card"
  | "scatter-reform"
  | "fry-chase"
  | "ecosystem-growth"
  | "egg-hover"
  | "sibling-independence"
  | "resize"
  | "reduced-motion";
