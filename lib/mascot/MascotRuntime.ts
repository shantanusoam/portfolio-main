import { clamp, lerp, wrapAngle } from "./core/NumericGuards";
import { SeededRandom } from "./core/SeededRandom";
import { PoseController } from "./motion/PoseController";
import { MOTION_RECIPES } from "./motion/MotionRecipes";
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
import {
  StringContactDetector,
  type ContactPoint,
} from "./music/StringContactDetector";
import type { StringRegistry } from "./music/StringRegistry";
import { MusicalDirector, type StrumResult } from "./music/MusicalDirector";
import { ParticlePool } from "./rendering/ParticlePool";
import {
  MASCOT_CONFIG,
  getQualityDotCapacity,
  getQualityParticleCapacity,
  getSpineConfigForQuality,
} from "./MascotConfig";
import type {
  AppearanceLayerName,
  AppearancePresetName,
  AppearanceTuningOverrides,
  BodyDeformation,
  MascotAction,
  MascotBehavior,
  MascotExpression,
  MascotObstacle,
  MascotQuality,
  Point,
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
  currentInterest: MascotObstacle | null = null;

  pointerX: number;
  pointerY: number;
  pointerActive = false;
  pointerIdleSeconds = 999;

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
    this.pose = new PoseController(
      { spine: getSpineConfigForQuality(this.quality) },
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
      recipe.spine.jointCount,
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
      headRegion: MASCOT_CONFIG.creature.regions.head,
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

  update(dt: number): void {
    if (!this.enabled || !Number.isFinite(dt) || dt <= 0) return;

    this.simTime += dt;
    this.breathingPhase += dt * MASCOT_CONFIG.breathingRateRadiansPerSecond;
    this.pointerIdleSeconds += dt;
    this.scrollVelocity = lerp(this.scrollVelocity, 0, clamp(dt * 3, 0, 1));

    this.interestDirector.tick(dt);
    this.particles.update(dt, MASCOT_CONFIG.particleDrag);

    this.behaviorMachine.update(this, dt);
    if (this.behaviorMachine.getCurrent() === "orbit") {
      this.orbitAngle += dt * 1.6;
    }

    const recipe = this.behaviorMachine.getMotionRecipe();
    this.pose.setRecipe(recipe);
    this.pose.setHeadingRecipe(recipe.frequency * 0.8, recipe.damping);

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
    this.bodyDeformation = this.bodyDeformationController.update({
      behavior: this.behaviorMachine.getCurrent(),
      speed: Math.hypot(velocity.x, velocity.y),
      turnRate,
      scatterProgress: this.scatterProgress,
      dt,
      manualOverride: this.deformationOverride,
    });

    this.ribs = computeRibs(
      this.pose.joints,
      {
        bodyProfile: MASCOT_CONFIG.creature.bodyProfile,
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

  private updateStringContacts(dt: number): void {
    if (!this.strings) {
      this.stringPluckEvents = [];
      return;
    }
    const strings = this.strings.getAll();
    if (strings.length === 0) {
      this.stringPluckEvents = [];
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

    for (const event of events) {
      this.strings.triggerContact(
        event.stringIndex,
        event.velocity,
        event.contactPosition,
        event.direction,
      );
    }

    this.stringPluckEvents = events;
    this.lastStrum = this.musicalDirector.process(
      this.simTime,
      events,
      MASCOT_CONFIG.strings.strum,
    );
    this.musicalCombo = this.musicalDirector.getCombo();
  }

  private getWanderBlendTarget(): number {
    const behavior = this.behaviorMachine.getCurrent();
    if (behavior === "follow" || behavior === "avoid") return 0;
    if (behavior === "wake") return this.pointerActive ? 0 : 1;
    return 1;
  }

  private computeRawTarget(): Point {
    const behavior = this.behaviorMachine.getCurrent();
    switch (behavior) {
      case "inspect":
      case "orbit":
        return this.getInterestTarget(behavior === "orbit");
      case "avoid":
        return this.getAvoidanceTarget();
      case "scatter":
      case "reform":
      case "dormant":
        return this.pose.getRoot();
      default: {
        const pointerPoint: Point = { x: this.pointerX, y: this.pointerY };
        const wanderPoint = this.sampleWander();
        return blendTargets(
          pointerPoint,
          wanderPoint,
          this.targetDirector.getBlend(),
        );
      }
    }
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
    const relevant = nearby.filter((o) => o.mode !== "interest");
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

    const headJoint = joints[Math.min(1, joints.length - 1)];
    const tailJoint = joints[joints.length - 1];
    const heading = this.pose.getHeading();

    // Fin/ear root pin, biased by two real signals rather than a fixed
    // perpendicular offset — MASCOT_VISUAL_RESCUE spec "FIN / EAR DESIGN"
    // states (sprint sweeps back, rest/dormant folds in, avoid/scatter
    // spread wide) fall out of forward speed + the existing
    // `bodyDeformation.finSpread` signal (already computed per-behavior in
    // BodyDeformation.ts) without any new state machinery. The chain's own
    // gravity/drag Verlet physics still does all the actual settling.
    const velocity = this.pose.getVelocity();
    const forwardSpeed =
      velocity.x * Math.cos(heading) + velocity.y * Math.sin(heading);
    const sweepBack = clamp(forwardSpeed / 220, -0.3, 0.5);
    const finReach = 4 + clamp(this.bodyDeformation.finSpread, -1, 1) * 2.5;

    const leftAngle = heading + Math.PI / 2 + sweepBack;
    const rightAngle = heading - Math.PI / 2 - sweepBack;
    const leftRootX = headJoint.x + Math.cos(leftAngle) * finReach;
    const leftRootY = headJoint.y + Math.sin(leftAngle) * finReach;
    const rightRootX = headJoint.x + Math.cos(rightAngle) * finReach;
    const rightRootY = headJoint.y + Math.sin(rightAngle) * finReach;

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

    this.faceFrame = computeFaceFrame({
      ribs: this.ribs,
      headRegion: MASCOT_CONFIG.creature.regions.head,
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
      impactWave: this.bodyDeformation.impactWave,
      overrideExpression: this.expressionOverride,
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
    const chosen = this.interestDirector.select(candidates);
    if (!chosen) return false;
    this.currentInterest = chosen;
    return true;
  }

  setPointer(x: number, y: number, active: boolean): void {
    if (active) {
      if (Math.hypot(x - this.pointerX, y - this.pointerY) > 0.5) {
        this.pointerIdleSeconds = 0;
      }
      this.pointerX = x;
      this.pointerY = y;
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
        MASCOT_CONFIG.creature.spine.jointCount,
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

    this.pose.setSpineConfig(getSpineConfigForQuality(quality));
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
