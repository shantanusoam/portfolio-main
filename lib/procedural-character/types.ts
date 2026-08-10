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
export type CharacterLocomotionMode = "free" | "platform";
export type BodyShape = "radial" | "chain" | "soft-polygon";
export type BodyOrientationMode = "velocity" | "upright";
export type SoftBodyDeformationMode = "none" | "wing" | "pulse";
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

export interface SoftBodySpec {
  /** Ordered, normalized local-space outline. +X is the creature's front. */
  boundary: readonly Vec2Like[];
  deformationMode: SoftBodyDeformationMode;
  damping: number;
  guideStrength: number;
  edgeStiffness: number;
  bendStiffness: number;
  shapeStiffness: number;
  areaStiffness: number;
  centerStiffness: number;
  constraintIterations: number;
  deformationFrequency: number;
  deformationAmount: number;
}

export interface BodySpec {
  shape: BodyShape;
  orientationMode: BodyOrientationMode;
  /** Maximum world-space lean used by upright creatures. */
  maxLean: number;
  radius: number;
  squashAmount: number;
  segmentCount: number;
  segmentSpacing: number;
  stiffness: number;
  maxJointAngleDifference: number;
  widthProfile: BodyWidthProfile;
  softBody: SoftBodySpec;
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

export interface CharacterLocomotionSpec {
  mode: CharacterLocomotionMode;
  gravity: number;
  maxFallSpeed: number;
  maxHorizontalSpeed: number;
  horizontalAcceleration: number;
  horizontalDrag: number;
  jumpSpeed: number;
  hopDistance: number;
  hopHeightBias: number;
  hopCooldown: number;
  coyoteTime: number;
  /** Distance from body centre to the surface while standing. */
  bodyGroundOffset: number;
  surfaceInset: number;
}

/** Cached CSS-pixel rectangle. Physics never reads DOM layout directly. */
export interface EnvironmentSurface {
  id: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
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

export interface AppendageSpringSpec {
  /** Velocity retained by the Verlet particles at a 120 Hz reference step. */
  damping: number;
  /** Attraction to the collision-safe FABRIK guide, in the range 0..1. */
  guideStrength: number;
  /** World-space downward acceleration in CSS pixels per second squared. */
  gravity: number;
  /** Low-amplitude curl force used to keep a chain from looking mechanical. */
  curl: number;
  constraintIterations: number;
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
  spring: AppendageSpringSpec;
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
  /** Local-space face origin before character scale is applied. */
  offsetX: number;
  offsetY: number;
  /** Direction in local space along which multiple eyes are distributed. */
  spacingAngle: number;
  mouthOffsetX: number;
  mouthOffsetY: number;
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
  bodyHighlightColor: string;
  bodyShadowColor: string;
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
  locomotion: CharacterLocomotionSpec;
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

/** Continuously blended animation signals calculated outside the renderer. */
export interface CharacterPose {
  scaleX: number;
  scaleY: number;
  rotation: number;
  eyeOpen: number;
  breathingOffset: number;
  impact: number;
  wobble: number;
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
  softBody: {
    areaRatio: number;
    points: readonly Vec2Like[];
  } | null;
  performance: CharacterPerformanceSnapshot;
  locomotion: {
    grounded: boolean;
    surfaceId: string | null;
    groundY: number | null;
  };
  environmentSurfaces: readonly EnvironmentSurface[];
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
