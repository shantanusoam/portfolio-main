/**
 * Shared type contracts for the procedural mascot subsystem.
 * Extended incrementally as each subsystem lands — see docs/mascot/ARCHITECTURE.md.
 */

export interface Point {
  x: number;
  y: number;
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
  | { type: "scatter" }
  | { type: "reform" }
  | { type: "wake" }
  | { type: "rest" };

export interface MascotStatus {
  behavior: MascotBehavior;
  quality: MascotQuality;
  fps: number;
  performance: PerformanceState;
}

export interface MascotDebugSnapshot {
  behavior: MascotBehavior;
  quality: MascotQuality;
  performance: PerformanceState;
  rootPosition: Point;
  spinePoints: readonly Point[];
  timestamp: number;
}

export interface MascotEngineOptions {
  canvas: HTMLCanvasElement;
  seed: number;
  quality: MascotQuality;
  debug?: boolean;
  reducedMotion?: boolean;
  onStatus?: (status: MascotStatus) => void;
}

export interface MascotEngine {
  start(): void;
  pause(reason?: string): void;
  resume(): void;
  resize(width: number, height: number, dpr: number): void;
  setPointer(x: number, y: number, active: boolean): void;
  setScrollVelocity(value: number): void;
  setQuality(quality: MascotQuality): void;
  setEnabled(enabled: boolean): void;
  setReducedMotion(reduced: boolean): void;
  trigger(action: MascotAction): void;
  getDebugSnapshot(): MascotDebugSnapshot;
  destroy(): void;
  /** Dev/motion-lab only: live toggle for the spine/normals/obstacle debug overlay. */
  setDebug(enabled: boolean): void;
  /** Dev/motion-lab only: simulation speed multiplier for slow-motion review. */
  setTimeScale(scale: number): void;
}

export type ObstacleMode = "hard" | "soft" | "interest";

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
  | "resize"
  | "reduced-motion";
