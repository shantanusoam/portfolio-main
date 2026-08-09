import { clamp, lerp, wrapAngle } from "./core/NumericGuards";
import { SeededRandom } from "./core/SeededRandom";
import { PoseController } from "./motion/PoseController";
import { MOTION_RECIPES, HUNT_MOTION_RECIPE } from "./motion/MotionRecipes";
import {
  createVerletNodes,
  integrateVerlet,
  pinVerletNode,
  solveVerletDistanceConstraints,
} from "./motion/VerletChain";
import {
  applyRibLean,
  computeRibs,
  type RibPoint,
} from "./character/CreatureRig";
import {
  generateSkinPoints,
  type DotDeformation,
  type DotSkinConfig,
} from "./character/DotSkin";
import {
  BodyDeformationController,
  neutralBodyDeformation,
} from "./appearance/BodyDeformation";
import { computeContourWidths } from "./appearance/BodyContour";
import { computeFaceFrame, type FaceFrame } from "./appearance/FaceRig";
import {
  ExpressionController,
  type ExpressionVisualState,
} from "./appearance/ExpressionController";
import {
  generatePatternMarks,
  type PatternMark,
} from "./appearance/PatternRecipes";
import {
  getAppearancePreset,
  type AppearancePalette,
} from "./appearance/AppearancePresets";
import {
  DEFAULT_APPEARANCE_LAYERS,
  DEFAULT_APPEARANCE_TUNING,
  type AppearanceLayerToggles,
} from "./appearance/AppearanceConfig";
import {
  BehaviorMachine,
  type BehaviorRegistry,
} from "./behavior/BehaviorMachine";
import {
  isWanderSegmentFinished,
  sampleWanderSegment,
  WanderPlanner,
  type WanderBounds,
} from "./behavior/WanderPlanner";
import { blendTargets, TargetDirector } from "./behavior/TargetDirector";
import { InterestDirector } from "./behavior/InterestDirector";
import type { DomObstacleRegistry } from "./interaction/DomObstacleRegistry";
import {
  combineSteering,
  computeRectangleSteering,
} from "./interaction/RectangleSteering";
import { HeroInteractionDirector } from "./interaction/HeroInteractionDirector";
import {
  StringContactDetector,
  type ContactPoint,
} from "./music/StringContactDetector";
import type { StringRegistry } from "./music/StringRegistry";
import {
  amplifyContactVelocity,
  StringTensionGate,
} from "./music/StringTensionGate";
import { MusicalDirector, type StrumResult } from "./music/MusicalDirector";
import { ParticlePool } from "./rendering/ParticlePool";
import {
  MASCOT_CONFIG,
  getQualityDotCapacity,
  getQualityParticleCapacity,
  getSpineConfigForQuality,
} from "./MascotConfig";
import {
  createBaseAnatomy,
  type AnatomyState,
} from "./ecosystem/AnatomyGrowth";
import type {
  AppearanceLayerName,
  AppearancePresetName,
  AppearanceTuningOverrides,
  BodyDeformation,
  FacialMotionInput,
  MascotAction,
  MascotBehavior,
  MascotExpression,
  MascotObstacle,
  MascotQuality,
  Point,
  ResonanceGateState,
  StringPluckEvent,
  VerletNode,
  WanderSegment,
} from "./types";

/**
 * All mutable simulation state lives here, owned exclusively by the fixed
 * step. React never touches this class; MascotEngine is the only caller.
 * No Canvas/DOM drawing — CanvasMascotRenderer reads runtime state, it
 * never writes it.
 */

export interface MascotRuntimeOptions {
  seed: number;
  quality: MascotQuality;
  originX: number;
  originY: number;
  bounds: WanderBounds;
  obstacles?: DomObstacleRegistry | null;
  strings?: StringRegistry | null;
}

function decideNextBehavior(
  current: MascotBehavior,
  runtime: MascotRuntime,
  elapsed: number,
): MascotBehavior | null {
  if (runtime.reducedMotion && current !== "reducedMotion")
    return "reducedMotion";
  if (!runtime.reducedMotion && current === "reducedMotion") return "wake";

  if (current !== "avoid" && current !== "scatter" && current !== "reform") {
    if (
      runtime.getHardObstacleForce() > MASCOT_CONFIG.steering.avoidTriggerForce
    ) {
      return "avoid";
    }
  }

  switch (current) {
    case "dormant":
      return runtime.pointerActive || elapsed > 3 ? "wake" : null;
    case "wake":
      return runtime.pointerActive ? "follow" : "wander";
    case "follow":
      return runtime.pointerIdleSeconds >
        MASCOT_CONFIG.pointerIdleThresholdSeconds
        ? "wander"
        : null;
    case "wander": {
      if (runtime.pointerActive) return "follow";
      if (runtime.pendingWanderHint === "rest") {
        runtime.pendingWanderHint = null;
        return "rest";
      }
      if (runtime.pendingWanderHint === "inspect") {
        runtime.pendingWanderHint = null;
        return runtime.trySelectInterest() ? "inspect" : null;
      }
      if (runtime.currentWanderSegment?.kind === "diagonal-sprint")
        return "sprint";
      return null;
    }
    case "sprint":
      if (runtime.pointerActive) return "follow";
      return runtime.currentWanderSegment &&
        isWanderSegmentFinished(runtime.currentWanderSegment, runtime.simTime)
        ? "wander"
        : null;
    case "rest":
      return runtime.pointerActive ? "follow" : null;
    case "inspect":
      return runtime.pointerActive ? "follow" : "orbit";
    case "orbit":
      return "wander";
    case "avoid":
      return runtime.getHardObstacleForce() <
        MASCOT_CONFIG.steering.avoidTriggerForce * 0.5
        ? "wander"
        : null;
    case "scatter":
      return "reform";
    case "reform":
      return runtime.pointerActive ? "follow" : "wander";
    default:
      return null;
  }
}

function createBehaviorRegistry(): BehaviorRegistry<MascotRuntime> {
  return {
    dormant: {
      name: "dormant",
      minimumDuration: 0.5,
      motion: MOTION_RECIPES.dormant,
    },
    wake: {
      name: "wake",
      minimumDuration: 0.4,
      maximumDuration: 1.2,
      motion: MOTION_RECIPES.wake,
    },
    follow: {
      name: "follow",
      minimumDuration: 0.4,
      motion: MOTION_RECIPES.follow,
    },
    wander: {
      name: "wander",
      minimumDuration: 0.5,
      maximumDuration: 40,
      motion: MOTION_RECIPES.wander,
      enter: (runtime) => {
        if (!runtime.currentWanderSegment) runtime.startWanderSegment();
      },
    },
    sprint: {
      name: "sprint",
      minimumDuration: 0.5,
      maximumDuration: 3,
      motion: MOTION_RECIPES.sprint,
    },
    rest: {
      name: "rest",
      minimumDuration: 2,
      maximumDuration: 12,
      motion: MOTION_RECIPES.rest,
    },
    inspect: {
      name: "inspect",
      minimumDuration: 1.2,
      maximumDuration: 3,
      motion: MOTION_RECIPES.inspect,
    },
    orbit: {
      name: "orbit",
      minimumDuration: 0.8,
      maximumDuration: 1.8,
      motion: MOTION_RECIPES.orbit,
      enter: (runtime) => {
        runtime.orbitAngle = 0;
      },
      exit: (runtime) => {
        runtime.currentInterest = null;
      },
    },
    avoid: {
      name: "avoid",
      minimumDuration: 0.3,
      maximumDuration: 2,
      motion: MOTION_RECIPES.avoid,
    },
    scatter: {
      name: "scatter",
      minimumDuration: 0.5,
      maximumDuration: 0.6,
      motion: MOTION_RECIPES.scatter,
      enter: (runtime) => {
        runtime.scatterProgress = 0;
      },
      update: (runtime, dt) => {
        runtime.scatterProgress = clamp(
          runtime.scatterProgress + dt / 0.5,
          0,
          1,
        );
      },
    },
    reform: {
      name: "reform",
      minimumDuration: 0.7,
      maximumDuration: 1.2,
      motion: MOTION_RECIPES.reform,
      update: (runtime, dt) => {
        runtime.scatterProgress = clamp(
          runtime.scatterProgress - dt / 0.9,
          0,
          1,
        );
      },
    },
    reducedMotion: {
      name: "reducedMotion",
      minimumDuration: 0,
      motion: MOTION_RECIPES.reducedMotion,
      canExit: (runtime) => !runtime.reducedMotion,
    },
  };
}

export class MascotRuntime {
  readonly pose: PoseController;
  ribs: RibPoint[] = [];
  private previousNormalX = 0;
  private previousNormalY = -1;
  private previousHeading = -Math.PI / 2;
  ribLean = 0;

  readonly antennaeLeft: VerletNode[];
  readonly antennaeRight: VerletNode[];
  readonly tailWhisker: VerletNode[];

  skinPoints: ReturnType<typeof generateSkinPoints> = [];

  // eslint-disable-next-line no-use-before-define -- self-referential generic; TS resolves this fine, base no-undef/no-use-before-define is not TS-type-aware.
  readonly behaviorMachine: BehaviorMachine<MascotRuntime>;
  readonly wanderPlanner: WanderPlanner;
  currentWanderSegment: WanderSegment | null = null;
  pendingWanderHint: MascotBehavior | null = null;
  readonly targetDirector: TargetDirector;
  readonly interestDirector: InterestDirector;
  readonly heroInteraction: HeroInteractionDirector;
  readonly stringTensionGate: StringTensionGate;
  currentInterest: MascotObstacle | null = null;

  pointerX: number;
  pointerY: number;
  pointerActive = false;
  pointerIdleSeconds = 999;
  /** Ecosystem-driven target that must not look like user pointer follow. */
  private autonomousTarget: Point | null = null;
  private autonomousChase = false;
  /** Per-runtime grown anatomy — defaults to the base creature recipe. */
  private anatomy: AnatomyState = createBaseAnatomy(0);

  /** 0..1 — hard-obstacle drag stretch for face / deformation consumers. */
  dragTension = 0;
  /** 0..1 — string pull tension for face / deformation consumers. */
  stringTension = 0;

  private heroSurfaceTarget: Point | null = null;
  private heroAdjustedPointer: Point | null = null;
  private heroReboundOffset: Point | null = null;
  private heroPerched = false;

  scrollVelocity = 0;

  obstacles: DomObstacleRegistry | null;

  strings: StringRegistry | null;
  private readonly stringContactDetector = new StringContactDetector();
  /** Events emitted this frame — bounded, cleared and replaced each `update()`. */
  stringPluckEvents: StringPluckEvent[] = [];
  private readonly musicalDirector = new MusicalDirector();
  /** Set only on the frame a strum was recognized; null otherwise. */
  lastStrum: StrumResult | null = null;
  musicalCombo = 0;

  particles: ParticlePool;

  breathingPhase = 0;

  simTime = 0;
  bounds: WanderBounds;

  quality: MascotQuality;
  dotSkinConfig: DotSkinConfig;

  reducedMotion = false;
  enabled = true;

  scatterProgress = 0;
  orbitAngle = 0;

  // --- Appearance state (silhouette/face/print/rim/dots) ---------------
  /** Squash/stretch/tumble performance, computed each frame from behavior/velocity signals. */
  bodyDeformation: BodyDeformation = neutralBodyDeformation();
  private readonly bodyDeformationController = new BodyDeformationController();
  private deformationOverride: Partial<BodyDeformation> | null = null;

  /** Stable head coordinate frame for face features — see appearance/FaceRig.ts. */
  faceFrame: FaceFrame;
  private readonly expressionController: ExpressionController;
  expressionVisual: ExpressionVisualState;
  private expressionOverride: MascotExpression | null = null;

  /** Previous root velocity — used to derive acceleration for FacialMotionMatrix. */
  private previousVelocityX = 0;
  private previousVelocityY = 0;
  /** Decaying 0..1 collision pulse for V2 facial/squash matrices. */
  private collisionImpulse = 0;
  /** Latest facial-matrix input (debug / coordinator visibility). */
  facialMotionInput: FacialMotionInput = {
    velocityX: 0,
    velocityY: 0,
    accelerationX: 0,
    accelerationY: 0,
    speed: 0,
    fallingSpeed: 0,
    dragTension: 0,
    collisionImpulse: 0,
    stringTension: 0,
    targetDirectionX: 0,
    targetDirectionY: 0,
  };

  /** Compact three-zone silhouette half-widths per rib — see appearance/BodyContour.ts. */
  contourWidths: number[] = [];

  appearancePresetId: AppearancePresetName;
  appearancePalette: AppearancePalette;
  patternRecipe: ReturnType<typeof getAppearancePreset>["patternRecipe"];
  patternMarks: PatternMark[] = [];
  appearanceLayerOverrides: AppearanceLayerToggles = {
    ...DEFAULT_APPEARANCE_LAYERS,
  };

  appearanceTuning: AppearanceTuningOverrides = {
    ...DEFAULT_APPEARANCE_TUNING,
  };

  private readonly rng: SeededRandom;

  constructor(options: MascotRuntimeOptions) {
    this.rng = new SeededRandom(options.seed);
    this.quality = options.quality;
    this.bounds = options.bounds;
    this.obstacles = options.obstacles ?? null;
    this.strings = options.strings ?? null;

    const recipe = MASCOT_CONFIG.creature;
    this.anatomy = createBaseAnatomy(0);
    this.pose = new PoseController(
      {
        spine: {
          ...getSpineConfigForQuality(this.quality),
          jointCount: this.anatomy.jointCount,
          segmentLength: this.anatomy.segmentLength,
        },
      },
      options.originX,
      options.originY,
      MOTION_RECIPES.dormant,
    );

    this.antennaeLeft = createVerletNodes(
      recipe.antennaeSegments,
      options.originX,
      options.originY,
    );
    this.antennaeRight = createVerletNodes(
      recipe.antennaeSegments,
      options.originX,
      options.originY,
    );
    this.tailWhisker = createVerletNodes(4, options.originX, options.originY);

    this.pointerX = options.originX;
    this.pointerY = options.originY;

    this.dotSkinConfig = {
      dotCount: getQualityDotCapacity(this.quality),
      seed: options.seed,
      coreDotRatio: MASCOT_CONFIG.dotSkin.coreDotRatio,
      accentDotRatio: MASCOT_CONFIG.dotSkin.accentDotRatio,
    };
    this.skinPoints = generateSkinPoints(
      this.anatomy.jointCount,
      this.dotSkinConfig,
    );

    this.wanderPlanner = new WanderPlanner(
      options.seed,
      {
        bounds: this.bounds,
        minSegmentDuration: MASCOT_CONFIG.wanderSegmentDuration.min,
        maxSegmentDuration: MASCOT_CONFIG.wanderSegmentDuration.max,
      },
      { x: options.originX, y: options.originY },
    );
    this.targetDirector = new TargetDirector(
      { blendDurationSeconds: MASCOT_CONFIG.targetBlendDurationSeconds },
      1,
    );
    this.interestDirector = new InterestDirector(options.seed + 1, {
      cooldownSeconds: MASCOT_CONFIG.interest.cooldownSeconds,
      minRevisitGap: MASCOT_CONFIG.interest.minRevisitGap,
    });
    this.heroInteraction = new HeroInteractionDirector(
      MASCOT_CONFIG.heroInteraction,
    );
    this.stringTensionGate = new StringTensionGate(MASCOT_CONFIG.stringTension);

    this.particles = new ParticlePool(getQualityParticleCapacity(this.quality));

    this.appearancePresetId = MASCOT_CONFIG.appearance.defaultPresetId;
    const initialPreset = getAppearancePreset(this.appearancePresetId);
    this.appearancePalette = initialPreset.palette;
    this.patternRecipe = initialPreset.patternRecipe;
    this.patternMarks = generatePatternMarks(
      this.patternRecipe,
      options.seed + MASCOT_CONFIG.appearance.patternSeedOffset,
      this.quality,
    );

    this.expressionController = new ExpressionController(
      options.seed + MASCOT_CONFIG.appearance.expressionSeedOffset,
    );
    this.expressionVisual = this.expressionController.update(1 / 60, {
      behavior: "dormant",
      headingX: 0,
      headingY: -1,
      coreX: options.originX,
      coreY: options.originY,
      breathingPhase: 0,
      impactWave: 0,
    });
    this.faceFrame = computeFaceFrame({
      ribs: [],
      headRegion: this.anatomy.regions.head,
      headingX: 0,
      headingY: -1,
    });

    this.behaviorMachine = new BehaviorMachine<MascotRuntime>({
      behaviors: createBehaviorRegistry(),
      initial: "dormant",
      decide: decideNextBehavior,
    });
    this.behaviorMachine.start(this);
  }

  getAnatomy(): AnatomyState {
    return this.anatomy;
  }

  /**
   * Applies per-adult anatomy growth. Rebuilds the spine when joint count
   * changes; segment-length-only updates reuse the existing joint array.
   */
  applyAnatomy(next: AnatomyState): void {
    const previousJointCount = this.anatomy.jointCount;
    this.anatomy = next;
    const spine = {
      ...getSpineConfigForQuality(this.quality),
      jointCount: next.jointCount,
      segmentLength: next.segmentLength,
    };
    if (next.jointCount !== previousJointCount) {
      this.pose.rebuildSpine(spine);
      this.skinPoints = generateSkinPoints(
        next.jointCount,
        this.dotSkinConfig,
      );
    } else {
      this.pose.setSpineConfig(spine);
    }
  }

  /**
   * Autonomous ecosystem steering. Does not mark the user pointer active, so
   * companions can chase prey or wander without entering user-follow mode.
   */
  setSteerTarget(x: number, y: number, chase = false): void {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    this.autonomousTarget = { x, y };
    this.autonomousChase = chase;
  }

  clearSteerTarget(): void {
    this.autonomousTarget = null;
    this.autonomousChase = false;
  }

  update(dt: number): void {
    if (!this.enabled || !Number.isFinite(dt) || dt <= 0) return;

    this.simTime += dt;
    this.breathingPhase += dt * MASCOT_CONFIG.breathingRateRadiansPerSecond;
    this.pointerIdleSeconds += dt;
    this.scrollVelocity = lerp(this.scrollVelocity, 0, clamp(dt * 3, 0, 1));

    this.interestDirector.tick(dt);
    this.particles.update(dt, MASCOT_CONFIG.particleDrag);

    this.updateHeroInteractions(dt);

    this.behaviorMachine.update(this, dt);
    if (this.behaviorMachine.getCurrent() === "orbit") {
      this.orbitAngle += dt * 1.6;
    }

    const recipe = this.autonomousChase
      ? HUNT_MOTION_RECIPE
      : this.behaviorMachine.getMotionRecipe();
    this.pose.setRecipe(recipe);
    this.pose.setHeadingRecipe(recipe.frequency * 0.75, recipe.damping);

    this.targetDirector.update(dt, this.getWanderBlendTarget());

    const rawTarget = this.computeRawTarget();
    const steered = this.applySteering(rawTarget);
    this.pose.update(dt, steered.x, steered.y);

    const heading = this.pose.getHeading();
    const headingDelta = wrapAngle(heading - this.previousHeading);
    const turnRate = headingDelta / dt;
    this.previousHeading = heading;
    const targetLean = clamp(turnRate / 3, -1, 1);
    this.ribLean = lerp(this.ribLean, targetLean, clamp(dt * 6, 0, 1));

    const velocity = this.pose.getVelocity();
    const accelerationX =
      (velocity.x - this.previousVelocityX) / Math.max(dt, 1e-4);
    const accelerationY =
      (velocity.y - this.previousVelocityY) / Math.max(dt, 1e-4);
    this.facialMotionInput = {
      ...this.facialMotionInput,
      accelerationX: Number.isFinite(accelerationX) ? accelerationX : 0,
      accelerationY: Number.isFinite(accelerationY) ? accelerationY : 0,
    };
    this.previousVelocityX = velocity.x;
    this.previousVelocityY = velocity.y;

    this.updateMotionImpulses(dt);

    const fallingSpeed = Math.max(0, velocity.y);
    const dragTension = this.computeDragTension(velocity);
    const speed = Math.hypot(velocity.x, velocity.y);

    this.bodyDeformation = this.bodyDeformationController.update({
      behavior: this.behaviorMachine.getCurrent(),
      speed,
      turnRate,
      scatterProgress: this.scatterProgress,
      dt,
      dragTension,
      collisionImpulse: this.collisionImpulse,
      stringTension: this.stringTension,
      fallingSpeed,
      manualOverride: this.deformationOverride,
    });
    this.applyTensionDeformation();

    this.ribs = computeRibs(
      this.pose.joints,
      {
        bodyProfile: this.anatomy.bodyProfile,
        normalSmoothing: MASCOT_CONFIG.normalSmoothing,
      },
      this.previousNormalX,
      this.previousNormalY,
    );
    if (this.ribs.length > 0) {
      this.previousNormalX = this.ribs[0].normalX;
      this.previousNormalY = this.ribs[0].normalY;
    }
    applyRibLean(this.ribs, this.ribLean);

    this.contourWidths = computeContourWidths(
      this.ribs,
      MASCOT_CONFIG.appearance.contour,
      this.bodyDeformation,
    );

    this.updateSecondaryMotion(dt);
    this.updateStringContacts(dt);
    this.updateAppearance(dt);
  }

  private updateHeroInteractions(dt: number): void {
    const root = this.pose.getRoot();
    const hardForce = this.computeHardSteeringForce(root);
    const behavior = this.behaviorMachine.getCurrent();
    const allowPerch =
      !this.pointerActive &&
      (behavior === "wander" ||
        behavior === "rest" ||
        behavior === "sprint" ||
        behavior === "wake" ||
        behavior === "dormant");

    const obstacles = this.obstacles?.getAll() ?? [];
    const frame = this.heroInteraction.update({
      dt,
      rootX: root.x,
      rootY: root.y,
      pointerX: this.pointerX,
      pointerY: this.pointerY,
      pointerActive: this.pointerActive,
      allowPerch,
      obstacles,
      hardForceX: hardForce.x,
      hardForceY: hardForce.y,
      // Gentle lateral cruise while perched — sin is deterministic in simTime.
      desiredSlideX: this.pointerActive
        ? this.pointerX
        : root.x + Math.sin(this.simTime * 0.65) * 48,
    });

    this.dragTension = frame.dragTension;
    this.heroSurfaceTarget = frame.surfaceTarget;
    this.heroAdjustedPointer = frame.adjustedPointer;
    this.heroReboundOffset = frame.reboundOffset;
    this.heroPerched = frame.perched;

    // Sparse: when we just latched a perch during wander, settle into rest.
    if (
      frame.perched &&
      frame.surfaceMode === "perch" &&
      behavior === "wander" &&
      this.behaviorMachine.getElapsed() > 1.2
    ) {
      this.pendingWanderHint = "rest";
    }
  }

  private applyTensionDeformation(): void {
    const tension = Math.max(this.dragTension, this.stringTension);
    if (tension < 0.04) return;
    this.bodyDeformation = {
      ...this.bodyDeformation,
      longitudinalScale:
        this.bodyDeformation.longitudinalScale * (1 + tension * 0.24),
      lateralScale: this.bodyDeformation.lateralScale * (1 - tension * 0.12),
      headSquash: Math.max(this.bodyDeformation.headSquash, tension * 0.4),
      finSpread: this.bodyDeformation.finSpread + tension * 0.25,
    };
  }

  private updateStringContacts(dt: number): void {
    if (!this.strings) {
      this.stringPluckEvents = [];
      this.stringTension = 0;
      return;
    }
    const strings = this.strings.getAll();
    if (strings.length === 0) {
      this.stringPluckEvents = [];
      this.stringTension = 0;
      return;
    }

    const joints = this.pose.joints;
    const contactPoints: ContactPoint[] = [];

    const root = this.pose.getRoot();
    contactPoints.push({ id: "core", type: "core", x: root.x, y: root.y });

    if (joints.length > 0) {
      const tail = joints[joints.length - 1];
      contactPoints.push({ id: "tail", type: "tail", x: tail.x, y: tail.y });
    }

    const leftTip = this.antennaeLeft[this.antennaeLeft.length - 1];
    const rightTip = this.antennaeRight[this.antennaeRight.length - 1];
    if (leftTip)
      contactPoints.push({
        id: "fin-left",
        type: "fin",
        x: leftTip.x,
        y: leftTip.y,
      });
    if (rightTip)
      contactPoints.push({
        id: "fin-right",
        type: "fin",
        x: rightTip.x,
        y: rightTip.y,
      });

    const events = this.stringContactDetector.detect(
      this.simTime,
      dt,
      strings,
      contactPoints,
      {
        cooldownSeconds: MASCOT_CONFIG.strings.cooldownSeconds,
        minSpeed: MASCOT_CONFIG.strings.minContactSpeed,
      },
    );

    this.stringTensionGate.update({
      dt,
      pointerActive: false,
      pointerX: this.pointerX,
      pointerY: this.pointerY,
      rootX: root.x,
      rootY: root.y,
      strings,
      contactThisFrame: false,
    });
    // Resonance Weaver / slingshot pull is retired — keep plucks musical but
    // never feed string-tension squash or slingshot latch into the body.
    this.stringTension = 0;

    const amplifiedEvents = events.map((event) => {
      const velocity = amplifyContactVelocity(event.velocity, 0);
      return { ...event, velocity };
    });

    for (const event of amplifiedEvents) {
      this.strings.triggerContact(
        event.stringIndex,
        event.velocity,
        event.contactPosition,
        event.direction,
        0,
      );
    }

    this.stringPluckEvents = amplifiedEvents;
    this.lastStrum = this.musicalDirector.process(
      this.simTime,
      amplifiedEvents,
      MASCOT_CONFIG.strings.strum,
    );
    this.musicalCombo = this.musicalDirector.getCombo();

    for (const event of amplifiedEvents) {
      this.collisionImpulse = Math.max(
        this.collisionImpulse,
        clamp(event.velocity * 0.9, 0, 1),
      );
    }
    if (this.lastStrum) {
      this.collisionImpulse = Math.min(this.collisionImpulse, 0.3);
    }
  }

  /**
   * Decays collision impulse and boosts it on avoid / hard-obstacle spikes
   * (V2 facial + squash drivers). `stringTension` / `dragTension` are owned
   * by StringTensionGate / HeroInteractionDirector respectively.
   */
  private updateMotionImpulses(dt: number): void {
    const decay = Math.exp(-dt * 4.5);
    this.collisionImpulse *= decay;

    const behavior = this.behaviorMachine.getCurrent();
    if (behavior === "avoid") {
      this.collisionImpulse = Math.max(this.collisionImpulse, 0.75);
    } else {
      const hardForce = this.getHardObstacleForce();
      if (hardForce > MASCOT_CONFIG.steering.avoidTriggerForce * 0.7) {
        this.collisionImpulse = Math.max(
          this.collisionImpulse,
          clamp(hardForce / (MASCOT_CONFIG.steering.maxForce + 1e-4), 0, 1),
        );
      }
    }
  }

  /**
   * Merges hero-interaction dragTension with pointer-follow stretch so the
   * facial/squash matrices still respond when the hero director is idle.
   */
  private computeDragTension(velocity: { x: number; y: number }): number {
    const heroDrag = clamp(this.dragTension, 0, 1);
    if (!this.pointerActive) return heroDrag;

    const root = this.pose.getRoot();
    const dx = this.pointerX - root.x;
    const dy = this.pointerY - root.y;
    const distanceFactor = clamp(Math.hypot(dx, dy) / 140, 0, 1);
    const speedFactor = clamp(Math.hypot(velocity.x, velocity.y) / 220, 0, 1);
    const followBoost =
      this.behaviorMachine.getCurrent() === "follow" ||
      this.behaviorMachine.getCurrent() === "sprint"
        ? 1
        : 0.55;
    const pointerDrag =
      clamp(distanceFactor * 0.75 + speedFactor * 0.35, 0, 1) * followBoost;
    return Math.max(heroDrag, pointerDrag);
  }

  private getWanderBlendTarget(): number {
    const behavior = this.behaviorMachine.getCurrent();
    if (this.pointerActive || this.autonomousChase) return 0;
    if (this.autonomousTarget) return 0.22;
    if (behavior === "follow" || behavior === "avoid") return 0;
    if (behavior === "wake") return this.pointerActive ? 0 : 1;
    return 1;
  }

  private computeRawTarget(): Point {
    const behavior = this.behaviorMachine.getCurrent();
    let target: Point;

    switch (behavior) {
      case "inspect":
      case "orbit":
        target = this.getInterestTarget(behavior === "orbit");
        break;
      case "avoid":
        target = this.getAvoidanceTarget();
        break;
      case "scatter":
      case "reform":
      case "dormant":
        target = this.pose.getRoot();
        break;
      case "rest":
        if (this.heroSurfaceTarget) {
          target = this.heroSurfaceTarget;
          break;
        }
      // falls through
      default: {
        const drivePoint = this.getDrivePoint();
        if (
          this.heroPerched &&
          this.heroSurfaceTarget &&
          !this.pointerActive &&
          !this.autonomousChase
        ) {
          // Slide/perch: hold the bar Y, allow lateral desired X from wander.
          const wanderPoint = this.sampleWander();
          target = {
            x: this.heroSurfaceTarget.x * 0.35 + wanderPoint.x * 0.65,
            y: this.heroSurfaceTarget.y,
          };
          // Re-clamp through the surface target's Y; X was already inset.
          target = {
            x: clamp(
              target.x,
              this.heroSurfaceTarget.x - 80,
              this.heroSurfaceTarget.x + 80,
            ),
            y: this.heroSurfaceTarget.y,
          };
        } else {
          const wanderPoint = this.sampleWander();
          target = blendTargets(
            drivePoint,
            wanderPoint,
            this.targetDirector.getBlend(),
          );
        }
        break;
      }
    }

    if (this.heroReboundOffset) {
      target = {
        x: target.x + this.heroReboundOffset.x,
        y: target.y + this.heroReboundOffset.y,
      };
    }
    return target;
  }

  private getDrivePoint(): Point {
    if (this.pointerActive) {
      return (
        this.heroAdjustedPointer ?? {
          x: this.pointerX,
          y: this.pointerY,
        }
      );
    }
    if (this.autonomousTarget) {
      return { x: this.autonomousTarget.x, y: this.autonomousTarget.y };
    }
    return { x: this.pointerX, y: this.pointerY };
  }

  private sampleWander(): Point {
    if (!this.currentWanderSegment) {
      this.startWanderSegment();
    }
    const segment = this.currentWanderSegment as WanderSegment;
    if (isWanderSegmentFinished(segment, this.simTime)) {
      this.pendingWanderHint = segment.nextBehavior ?? null;
      this.startWanderSegment();
    }
    return sampleWanderSegment(
      this.currentWanderSegment as WanderSegment,
      this.simTime,
      this.bounds,
    );
  }

  startWanderSegment(): void {
    this.currentWanderSegment = this.wanderPlanner.nextSegment(this.simTime);
  }

  private getInterestTarget(isOrbit: boolean): Point {
    if (!this.currentInterest) return this.pose.getRoot();
    const { centerX, centerY, top, bottom } = this.currentInterest;

    if (isOrbit) {
      const radius = MASCOT_CONFIG.interest.approachDistance * 0.6;
      return {
        x: centerX + Math.cos(this.orbitAngle) * radius,
        y:
          centerY -
          (bottom - top) / 2 -
          20 +
          Math.sin(this.orbitAngle) * radius * 0.4,
      };
    }

    return { x: centerX, y: top - MASCOT_CONFIG.interest.approachDistance };
  }

  private getAvoidanceTarget(): Point {
    const root = this.pose.getRoot();
    const force = this.computeHardSteeringForce(root);
    if (force.x === 0 && force.y === 0) return root;
    return { x: root.x + force.x * 3, y: root.y + force.y * 3 };
  }

  private computeHardSteeringForce(root: Point): Point {
    if (!this.obstacles) return { x: 0, y: 0 };
    const nearby = this.obstacles.queryNearby(
      root.x,
      root.y,
      MASCOT_CONFIG.steering.influenceRadius.hard,
    );
    const hardObstacles = nearby.filter((o) => o.mode === "hard");
    if (hardObstacles.length === 0) return { x: 0, y: 0 };

    const velocity = this.pose.getVelocity();
    const forces = hardObstacles.map((obstacle: MascotObstacle) =>
      computeRectangleSteering(
        root.x,
        root.y,
        velocity.x,
        velocity.y,
        obstacle,
        {
          influenceRadius: MASCOT_CONFIG.steering.influenceRadius.hard,
          maxForce: MASCOT_CONFIG.steering.maxForce,
          tangentWeight: 0.15,
        },
      ),
    );
    return combineSteering(forces, MASCOT_CONFIG.steering.maxForce);
  }

  getHardObstacleForce(): number {
    const force = this.computeHardSteeringForce(this.pose.getRoot());
    return Math.hypot(force.x, force.y);
  }

  private applySteering(rawTarget: Point): Point {
    if (!this.obstacles) return rawTarget;
    const root = this.pose.getRoot();
    const nearby = this.obstacles.queryNearby(
      root.x,
      root.y,
      MASCOT_CONFIG.steering.influenceRadius.hard * 1.5,
    );
    // Perch/interest are attractors — never feed them into repulsion.
    const relevant = nearby.filter(
      (o) => o.mode !== "interest" && o.mode !== "perch",
    );
    if (relevant.length === 0) return rawTarget;

    const velocity = this.pose.getVelocity();
    const forces = relevant.map((obstacle: MascotObstacle) =>
      computeRectangleSteering(
        root.x,
        root.y,
        velocity.x,
        velocity.y,
        obstacle,
        {
          influenceRadius:
            obstacle.mode === "hard"
              ? MASCOT_CONFIG.steering.influenceRadius.hard
              : MASCOT_CONFIG.steering.influenceRadius.soft,
          maxForce: MASCOT_CONFIG.steering.maxForce,
          tangentWeight: MASCOT_CONFIG.steering.tangentWeight,
        },
      ),
    );
    const combined = combineSteering(forces, MASCOT_CONFIG.steering.maxForce);
    return { x: rawTarget.x + combined.x, y: rawTarget.y + combined.y };
  }

  private updateSecondaryMotion(dt: number): void {
    const joints = this.pose.joints;
    if (joints.length === 0) return;

    // Reason: fins were pinned at joint 1 (nose tip) and read as fangs/horns
    // next to the face — attach at the shoulder region instead (V2 / visual rescue).
    const shoulderIndex = clamp(
      this.anatomy.regions.shoulders.start,
      0,
      joints.length - 1,
    );
    const shoulderJoint = joints[shoulderIndex];
    const shoulderRib = this.ribs[shoulderIndex];
    const tailJoint = joints[joints.length - 1];
    const heading = this.pose.getHeading();

    const velocity = this.pose.getVelocity();
    const forwardSpeed =
      velocity.x * Math.cos(heading) + velocity.y * Math.sin(heading);
    const sweepBack = clamp(forwardSpeed / 220, -0.2, 0.45);
    // Reach scales with local body half-width so ears sit on the silhouette edge.
    const halfWidth = Math.max(6, shoulderRib?.width ?? 10);
    const finReach =
      halfWidth * 0.92 + clamp(this.bodyDeformation.finSpread, -1, 1) * 2;

    const leftAngle = heading + Math.PI / 2 + sweepBack * 0.6;
    const rightAngle = heading - Math.PI / 2 - sweepBack * 0.6;
    const leftRootX = shoulderJoint.x + Math.cos(leftAngle) * finReach;
    const leftRootY = shoulderJoint.y + Math.sin(leftAngle) * finReach;
    const rightRootX = shoulderJoint.x + Math.cos(rightAngle) * finReach;
    const rightRootY = shoulderJoint.y + Math.sin(rightAngle) * finReach;

    pinVerletNode(this.antennaeLeft[0], leftRootX, leftRootY);
    pinVerletNode(this.antennaeRight[0], rightRootX, rightRootY);
    pinVerletNode(this.tailWhisker[0], tailJoint.x, tailJoint.y);

    const gravityY = 60;
    const antennaeChain = MASCOT_CONFIG.creature.antennaeChain;
    integrateVerlet(this.antennaeLeft, dt, antennaeChain, 0, gravityY);
    integrateVerlet(this.antennaeRight, dt, antennaeChain, 0, gravityY);
    solveVerletDistanceConstraints(
      this.antennaeLeft,
      antennaeChain.segmentLength,
      antennaeChain.iterations,
    );
    solveVerletDistanceConstraints(
      this.antennaeRight,
      antennaeChain.segmentLength,
      antennaeChain.iterations,
    );

    const whiskerChain = MASCOT_CONFIG.creature.tailWhiskerChain;
    integrateVerlet(this.tailWhisker, dt, whiskerChain, 0, gravityY * 0.5);
    solveVerletDistanceConstraints(
      this.tailWhisker,
      whiskerChain.segmentLength,
      whiskerChain.iterations,
    );
  }

  /**
   * Face frame + expression, resolved fresh each frame from the current
   * ribs/heading — simulation-side, per this codebase's
   * simulation/render-separation rule (CanvasMascotRenderer only reads
   * `faceFrame`/`expressionVisual`, never computes them).
   */
  private updateAppearance(dt: number): void {
    const root = this.pose.getRoot();
    const heading = this.pose.getHeading();
    const behavior = this.behaviorMachine.getCurrent();
    const velocity = this.pose.getVelocity();
    const speed = Math.hypot(velocity.x, velocity.y);
    const fallingSpeed = Math.max(0, velocity.y);
    const dragTension = this.computeDragTension(velocity);

    let targetDirectionX = Math.cos(heading);
    let targetDirectionY = Math.sin(heading);
    if (this.pointerActive) {
      const dx = this.pointerX - root.x;
      const dy = this.pointerY - root.y;
      const len = Math.max(1e-6, Math.hypot(dx, dy));
      targetDirectionX = dx / len;
      targetDirectionY = dy / len;
    } else if (this.currentInterest) {
      const dx = this.currentInterest.centerX - root.x;
      const dy = this.currentInterest.centerY - root.y;
      const len = Math.max(1e-6, Math.hypot(dx, dy));
      targetDirectionX = dx / len;
      targetDirectionY = dy / len;
    }

    const facialMotion: FacialMotionInput = {
      velocityX: velocity.x,
      velocityY: velocity.y,
      accelerationX: this.facialMotionInput.accelerationX,
      accelerationY: this.facialMotionInput.accelerationY,
      speed,
      fallingSpeed,
      dragTension,
      collisionImpulse: this.collisionImpulse,
      stringTension: this.stringTension,
      targetDirectionX,
      targetDirectionY,
    };
    this.facialMotionInput = facialMotion;

    this.faceFrame = computeFaceFrame({
      ribs: this.ribs,
      headRegion: this.anatomy.regions.head,
      headingX: Math.cos(heading),
      headingY: Math.sin(heading),
      deformation: this.bodyDeformation,
    });

    this.expressionVisual = this.expressionController.update(dt, {
      behavior,
      headingX: Math.cos(heading),
      headingY: Math.sin(heading),
      interestX: this.currentInterest?.centerX,
      interestY: this.currentInterest?.centerY,
      coreX: root.x,
      coreY: root.y,
      breathingPhase: this.breathingPhase,
      impactWave: Math.max(
        this.bodyDeformation.impactWave,
        this.collisionImpulse,
      ),
      overrideExpression: this.expressionOverride,
      facialMotion,
    });
  }

  getDotDeformation(): DotDeformation {
    const behavior = this.behaviorMachine.getCurrent();
    let stateStretch = 1;
    if (behavior === "sprint") stateStretch = 1.15;
    else if (behavior === "avoid") stateStretch = 1.08;
    else if (behavior === "rest" || behavior === "dormant") stateStretch = 0.92;

    const scatterAmount = this.scatterProgress;
    return {
      breathingPhase: this.breathingPhase,
      breathingAmount: MASCOT_CONFIG.breathingAmount * (1 + scatterAmount),
      stateStretch: lerp(stateStretch, stateStretch * 2.4, scatterAmount),
      noiseAmount: scatterAmount > 0 ? scatterAmount * 30 : 0,
    };
  }

  trySelectInterest(): boolean {
    if (!this.obstacles) return false;
    const candidates = this.obstacles.getByMode("interest");
    const root = this.pose.getRoot();
    const preferredTag = MASCOT_CONFIG.heroInteraction.preferredInterestTag;
    const preferredWeight =
      MASCOT_CONFIG.heroInteraction.preferredInterestWeight;
    const chosen = this.interestDirector.select(candidates, (candidate) => {
      const tagBonus =
        candidate.interestTag === preferredTag ? preferredWeight : 1;
      const dist = Math.hypot(
        candidate.centerX - root.x,
        candidate.centerY - root.y,
      );
      const proximity = 1 / (1 + dist / 280);
      return tagBonus * (0.55 + proximity);
    });
    if (!chosen) return false;
    this.currentInterest = chosen;
    return true;
  }

  getDragTension(): number {
    return this.dragTension;
  }

  getStringTension(): number {
    return this.stringTension;
  }

  getResonanceGateState(): ResonanceGateState {
    return {
      attachedToString: false,
      pullTension: 0,
      releaseVelocity: 0,
      pointerReleased: false,
      triggerCooldown: 0,
    };
  }

  consumeSlingshotTrigger(): boolean {
    return false;
  }

  setPointer(x: number, y: number, active: boolean): void {
    if (active) {
      if (Math.hypot(x - this.pointerX, y - this.pointerY) > 0.5) {
        this.pointerIdleSeconds = 0;
      }
      this.pointerX = x;
      this.pointerY = y;
      // User pointer ownership clears autonomous chase for this runtime.
      this.autonomousTarget = null;
      this.autonomousChase = false;
    }
    this.pointerActive = active;
  }

  setScrollVelocity(value: number): void {
    if (Number.isFinite(value)) this.scrollVelocity = value;
  }

  setBounds(bounds: WanderBounds): void {
    this.bounds = bounds;
  }

  setQuality(quality: MascotQuality): void {
    if (quality === this.quality) return;
    this.quality = quality;

    const newDotCount = getQualityDotCapacity(quality);
    if (newDotCount !== this.dotSkinConfig.dotCount) {
      this.dotSkinConfig = { ...this.dotSkinConfig, dotCount: newDotCount };
      this.skinPoints = generateSkinPoints(
        this.anatomy.jointCount,
        this.dotSkinConfig,
      );
    }

    const newParticleCapacity = getQualityParticleCapacity(quality);
    if (newParticleCapacity !== this.particles.getCapacity()) {
      this.particles = new ParticlePool(newParticleCapacity);
    }

    // Pattern mark budget depends on quality tier too — regenerate once here
    // (never per frame), mirroring the skinPoints regeneration above.
    this.patternMarks = generatePatternMarks(
      this.patternRecipe,
      this.dotSkinConfig.seed + MASCOT_CONFIG.appearance.patternSeedOffset,
      quality,
    );

    this.pose.setSpineConfig({
      ...getSpineConfigForQuality(quality),
      jointCount: this.anatomy.jointCount,
      segmentLength: this.anatomy.segmentLength,
    });
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  setReducedMotion(reduced: boolean): void {
    this.reducedMotion = reduced;
  }

  teleport(x: number, y: number): void {
    this.pose.teleport(x, y);
  }

  // --- Appearance lab controls (dev/motion-lab only) --------------------

  setAppearancePreset(id: AppearancePresetName): void {
    const preset = getAppearancePreset(id);
    this.appearancePresetId = id;
    this.appearancePalette = preset.palette;
    this.patternRecipe = preset.patternRecipe;
    this.patternMarks = generatePatternMarks(
      this.patternRecipe,
      this.dotSkinConfig.seed + MASCOT_CONFIG.appearance.patternSeedOffset,
      this.quality,
    );
  }

  setAppearanceLayers(
    layers: Partial<Record<AppearanceLayerName, boolean>>,
  ): void {
    this.appearanceLayerOverrides = {
      ...this.appearanceLayerOverrides,
      ...layers,
    };
  }

  setAppearanceTuning(tuning: Partial<AppearanceTuningOverrides>): void {
    this.appearanceTuning = { ...this.appearanceTuning, ...tuning };
  }

  setExpressionOverride(expression: MascotExpression | null): void {
    this.expressionOverride = expression;
  }

  setDeformationOverride(deformation: Partial<BodyDeformation> | null): void {
    this.deformationOverride = deformation;
  }

  trigger(action: MascotAction): void {
    switch (action.type) {
      case "scatter":
        this.behaviorMachine.transition("scatter", this);
        break;
      case "reform":
        this.behaviorMachine.transition("reform", this);
        break;
      case "wake":
        if (this.behaviorMachine.getCurrent() === "dormant")
          this.behaviorMachine.transition("wake", this);
        break;
      case "rest":
        this.behaviorMachine.transition("rest", this);
        break;
      case "click":
        this.spawnClickScatter(action.x, action.y);
        break;
      default:
        break;
    }
  }

  private spawnClickScatter(x: number, y: number): void {
    const count = Math.min(24, this.particles.getCapacity());
    for (let i = 0; i < count; i += 1) {
      const angle = this.rng.angle();
      const speed = this.rng.range(40, 160);
      this.particles.spawn(
        "clickScatter",
        x,
        y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.rng.range(0.4, 0.9),
        this.rng.range(1, 2.4),
        this.rng.next() * 1000,
      );
    }
  }
}
