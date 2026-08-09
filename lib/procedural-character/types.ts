/**
 * Renderer-agnostic contracts for the procedural character engine.
 *
 * Physics coordinates are CSS pixels. A renderer may use Canvas, WebGL, SVG,
 * or a test double without changing the simulation types below.
 */

export interface Vec2Like {
  x: number;
  y: number;
}

export type CharacterMode = "follow" | "wander" | "manual";
export type BodyShape = "radial" | "chain";
export type AppendageMode = "planted" | "trailing" | "free";
export type GaitStyle = "wave" | "alternating" | "diagonal" | "tripod" | "free";

export type BodyWidthProfile =
  | {
      kind: "sinusoidal" | "elliptical" | "head-heavy" | "tail-heavy";
      exponent?: number;
    }
  | {
      kind: "custom";
      sample: (normalizedPosition: number) => number;
    };

export interface BodySpec {
  shape: BodyShape;
  radius: number;
  squashAmount: number;
  segmentCount: number;
  segmentSpacing: number;
  stiffness: number;
  maxJointAngleDifference: number;
  widthProfile: BodyWidthProfile;
}

export interface BodyDynamicsSpec {
  frequency: number;
  damping: number;
  response: number;
  maxSpeed: number;
  maxAcceleration: number;
  facingResponsiveness: number;
  movementFrequency: number;
}

export interface IdleMovementSpec {
  delay: number;
  breathingFrequency: number;
  breathingAmount: number;
  lookAroundAmount: number;
  wanderRadius: number;
}

export interface AppendageAnchorSpec {
  /** Body-chain point for elongated creatures; ignored by radial bodies. */
  bodySegment: number;
  /** Radians in body-local space. */
  angle: number;
  /** Fraction of the local body radius. */
  radius: number;
}

export interface PreferredFootSpec {
  /** Radians in body-local space. */
  angle: number;
  /** Distance from the body center in CSS pixels before character scale. */
  radius: number;
  /** Optional body-local Cartesian bias for quadrupeds/crabs/etc. */
  offsetX: number;
  offsetY: number;
}

export interface StepSpec {
  threshold: number;
  duration: number;
  height: number;
  predictionTime: number;
  cooldown: number;
  variation: number;
}

export interface AppendageSpec {
  id: string;
  mode: AppendageMode;
  anchor: AppendageAnchorSpec;
  segmentLengths: readonly number[];
  maxReach: number;
  restingFootRadius: number;
  preferredFoot: PreferredFootSpec;
  step: StepSpec;
  gaitPhase: number;
  gaitGroup: number;
  /** Stable 2D pole direction used to stop knees from flipping. */
  preferredBendDirection: 1 | -1;
  stiffness: number;
  drag: number;
  thickness: number;
}

export interface GaitSpec {
  style: GaitStyle;
  phaseOffsets: readonly number[];
  cadence: number;
  phaseWindow: number;
  maxConcurrentSteps: number;
  maxConcurrentStepsRunning: number;
  maxConcurrentPerGroup: number;
  minPlantedFeet: number;
  runningSpeed: number;
  emergencyStretchRatio: number;
}

export interface EyeSpec {
  count: number;
  spacing: number;
  size: number;
  pupilSize: number;
  pupilTrackingStrength: number;
  velocityAnticipation: number;
  blink: {
    minimumInterval: number;
    maximumInterval: number;
    duration: number;
  };
}

export interface PersonalitySpec {
  curiosity: number;
  confidence: number;
  energy: number;
  elasticity: number;
  anticipation: number;
  overshoot: number;
  appendageStiffness: number;
  glowResponsiveness: number;
}

export interface CharacterRenderingSpec {
  bodyColor: string;
  appendageColor: string;
  eyeColor: string;
  pupilColor: string;
  outlineColor: string;
  outlineWidth: number;
  glowColor: string;
  glow: number;
  appendageThickness: number;
  debugPalette: readonly string[];
}

export interface CharacterPerformanceSpec {
  fixedTimeStep: number;
  maxFrameDelta: number;
  maxSimulationSteps: number;
  solverIterations: number;
  lowPowerSolverIterations: number;
  dprCap: number;
}

/**
 * The complete morphology/behavior contract. New creature families should be
 * expressible by changing this object, not by adding animation timelines.
 */
export interface CharacterSpec {
  id: string;
  name: string;
  seed: number;
  scale: number;
  body: BodySpec;
  dynamics: BodyDynamicsSpec;
  idle: IdleMovementSpec;
  appendages: readonly AppendageSpec[];
  gait: GaitSpec;
  eyes: EyeSpec;
  personality: PersonalitySpec;
  rendering: CharacterRenderingSpec;
  performance: CharacterPerformanceSpec;
}

export interface CharacterKinematics {
  position: Vec2Like;
  previousPosition: Vec2Like;
  velocity: Vec2Like;
  acceleration: Vec2Like;
  movementDirection: Vec2Like;
  speed: number;
  normalizedSpeed: number;
  facingAngle: number;
  angularVelocity: number;
}

export interface CharacterPerformanceSnapshot {
  fps: number;
  solverTimeMs: number;
  activeSteps: number;
  gaitPhase: number;
}

export interface CharacterDebugSnapshot {
  target: Vec2Like;
  body: CharacterKinematics;
  performance: CharacterPerformanceSnapshot;
  appendages: ReadonlyArray<{
    id: string;
    gaitGroup: number;
    stepping: boolean;
    stepProgress: number;
    error: number;
    triggerThreshold: number;
    triggerReason: string;
    anchor: Vec2Like;
    foot: Vec2Like;
    lockedFootPosition: Vec2Like;
    idealFootTarget: Vec2Like;
    stepDestination: Vec2Like;
  }>;
}

export interface ProceduralCharacterCallbacks {
  onStep?: (appendageId: string, destination: Vec2Like) => void;
  onLand?: (appendageId: string, position: Vec2Like) => void;
}
