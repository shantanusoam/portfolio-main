import type {
  AppendageSpec,
  BodyDynamicsSpec,
  BodyShape,
  BodySpec,
  CharacterPerformanceSpec,
  CharacterRenderingSpec,
  CharacterSpec,
  EyeSpec,
  GaitSpec,
  IdleMovementSpec,
  PersonalitySpec,
} from "./types";
import { TAU } from "./math/Vec2";

type AppendageTemplate = Partial<
  Omit<AppendageSpec, "anchor" | "preferredFoot" | "step" | "spring">
> & {
  anchor?: Partial<AppendageSpec["anchor"]>;
  preferredFoot?: Partial<AppendageSpec["preferredFoot"]>;
  step?: Partial<AppendageSpec["step"]>;
  spring?: Partial<AppendageSpec["spring"]>;
};

export interface CreateCharacterSpecOptions {
  id: string;
  name?: string;
  seed?: number;
  scale?: number;
  bodyShape?: BodyShape;
  body?: Partial<BodySpec>;
  dynamics?: Partial<BodyDynamicsSpec>;
  idle?: Partial<IdleMovementSpec>;
  appendages: number | readonly AppendageSpec[];
  appendageDefaults?: AppendageTemplate;
  appendageFactory?: (
    base: AppendageSpec,
    index: number,
    count: number,
  ) => AppendageSpec;
  gait?: Partial<GaitSpec>;
  eyes?: Partial<Omit<EyeSpec, "blink">> & {
    blink?: Partial<EyeSpec["blink"]>;
  };
  personality?: Partial<PersonalitySpec>;
  rendering?: Partial<CharacterRenderingSpec>;
  performance?: Partial<CharacterPerformanceSpec>;
}

const DEFAULT_BODY: BodySpec = {
  shape: "radial",
  orientationMode: "velocity",
  maxLean: 0.3,
  radius: 26,
  squashAmount: 0.12,
  segmentCount: 1,
  segmentSpacing: 12,
  stiffness: 0.85,
  maxJointAngleDifference: Math.PI / 4,
  widthProfile: { kind: "elliptical" },
};

const DEFAULT_DYNAMICS: BodyDynamicsSpec = {
  frequency: 1.7,
  damping: 0.72,
  response: 0.08,
  maxSpeed: 620,
  maxAcceleration: 4200,
  facingResponsiveness: 10,
  movementFrequency: 1.8,
};

const DEFAULT_IDLE: IdleMovementSpec = {
  delay: 3,
  breathingFrequency: 0.9,
  breathingAmount: 0.04,
  lookAroundAmount: 0.25,
  wanderRadius: 140,
};

const DEFAULT_GAIT: GaitSpec = {
  style: "wave",
  phaseOffsets: [],
  cadence: 1.8,
  phaseWindow: 0.34,
  maxConcurrentSteps: 2,
  maxConcurrentStepsRunning: 3,
  maxConcurrentPerGroup: 1,
  minPlantedFeet: 3,
  runningSpeed: 0.7,
  emergencyStretchRatio: 1.75,
};

const DEFAULT_EYES: EyeSpec = {
  count: 2,
  spacing: 12,
  size: 7,
  pupilSize: 2.8,
  pupilTrackingStrength: 0.62,
  velocityAnticipation: 0.18,
  blink: {
    minimumInterval: 2.4,
    maximumInterval: 6.2,
    duration: 0.14,
  },
};

const DEFAULT_PERSONALITY: PersonalitySpec = {
  curiosity: 0.7,
  confidence: 0.6,
  energy: 0.75,
  elasticity: 0.7,
  anticipation: 0.6,
  overshoot: 0.55,
  appendageStiffness: 0.72,
  glowResponsiveness: 0.5,
};

const DEFAULT_RENDERING: CharacterRenderingSpec = {
  bodyColor: "#a78bfa",
  appendageColor: "#8b5cf6",
  eyeColor: "#f8fafc",
  pupilColor: "#111827",
  outlineColor: "#ddd6fe",
  outlineWidth: 2,
  glowColor: "#8b5cf6",
  glow: 0,
  appendageThickness: 5,
  debugPalette: ["#22d3ee", "#f472b6", "#facc15", "#4ade80"],
};

const DEFAULT_PERFORMANCE: CharacterPerformanceSpec = {
  fixedTimeStep: 1 / 120,
  maxFrameDelta: 0.05,
  maxSimulationSteps: 6,
  solverIterations: 6,
  lowPowerSolverIterations: 3,
  dprCap: 2,
};

function makeDefaultAppendage(
  index: number,
  count: number,
  template: AppendageTemplate,
): AppendageSpec {
  const angle = (index / Math.max(1, count)) * TAU;
  const segmentLengths = template.segmentLengths
    ? [...template.segmentLengths]
    : [25, 23, 21];
  const totalLength = segmentLengths.reduce((sum, value) => sum + value, 0);

  return {
    id: template.id ?? `appendage-${index}`,
    mode: template.mode ?? "planted",
    anchor: {
      bodySegment: template.anchor?.bodySegment ?? 0,
      angle: template.anchor?.angle ?? angle,
      radius: template.anchor?.radius ?? 0.82,
    },
    segmentLengths,
    maxReach: template.maxReach ?? totalLength,
    restingFootRadius: template.restingFootRadius ?? 72,
    preferredFoot: {
      angle: template.preferredFoot?.angle ?? angle,
      radius:
        template.preferredFoot?.radius ?? template.restingFootRadius ?? 72,
      offsetX: template.preferredFoot?.offsetX ?? 0,
      offsetY: template.preferredFoot?.offsetY ?? 0,
    },
    step: {
      threshold: template.step?.threshold ?? 26,
      duration: template.step?.duration ?? 0.24,
      height: template.step?.height ?? 18,
      predictionTime: template.step?.predictionTime ?? 0.09,
      cooldown: template.step?.cooldown ?? 0.06,
      variation: template.step?.variation ?? 3,
    },
    spring: {
      damping: template.spring?.damping ?? 0.92,
      guideStrength: template.spring?.guideStrength ?? 0.3,
      gravity: template.spring?.gravity ?? 180,
      curl: template.spring?.curl ?? 240,
      constraintIterations: template.spring?.constraintIterations ?? 4,
    },
    gaitPhase: template.gaitPhase ?? index / Math.max(1, count),
    gaitGroup: template.gaitGroup ?? index % 2,
    preferredBendDirection:
      template.preferredBendDirection ?? (index % 2 === 0 ? 1 : -1),
    stiffness: template.stiffness ?? 0.78,
    drag: template.drag ?? 0.9,
    thickness: template.thickness ?? DEFAULT_RENDERING.appendageThickness,
  };
}

/**
 * Configuration builder used by presets and consumer-created creatures.
 * `appendages: 10` is enough to receive a valid radial rig; callers can then
 * override morphology globally or per index with `appendageFactory`.
 */
export function createCharacterSpec(
  options: CreateCharacterSpecOptions,
): CharacterSpec {
  const count =
    typeof options.appendages === "number"
      ? Math.max(0, Math.floor(options.appendages))
      : options.appendages.length;

  const appendages: AppendageSpec[] =
    typeof options.appendages === "number"
      ? Array.from({ length: count }, (_, index) => {
          const base = makeDefaultAppendage(
            index,
            count,
            options.appendageDefaults ?? {},
          );
          return options.appendageFactory?.(base, index, count) ?? base;
        })
      : options.appendages.map((appendage) => ({
          ...appendage,
          anchor: { ...appendage.anchor },
          preferredFoot: { ...appendage.preferredFoot },
          step: { ...appendage.step },
          spring: { ...appendage.spring },
          segmentLengths: [...appendage.segmentLengths],
        }));

  const phaseOffsets =
    options.gait?.phaseOffsets ?? appendages.map((item) => item.gaitPhase);

  return {
    id: options.id,
    name: options.name ?? options.id,
    seed: options.seed ?? 1337,
    scale: options.scale ?? 1,
    body: {
      ...DEFAULT_BODY,
      ...options.body,
      shape: options.bodyShape ?? options.body?.shape ?? DEFAULT_BODY.shape,
      widthProfile: options.body?.widthProfile ?? DEFAULT_BODY.widthProfile,
    },
    dynamics: { ...DEFAULT_DYNAMICS, ...options.dynamics },
    idle: { ...DEFAULT_IDLE, ...options.idle },
    appendages,
    gait: {
      ...DEFAULT_GAIT,
      ...options.gait,
      phaseOffsets: [...phaseOffsets],
    },
    eyes: {
      ...DEFAULT_EYES,
      ...options.eyes,
      blink: { ...DEFAULT_EYES.blink, ...options.eyes?.blink },
    },
    personality: { ...DEFAULT_PERSONALITY, ...options.personality },
    rendering: {
      ...DEFAULT_RENDERING,
      ...options.rendering,
      debugPalette: [
        ...(options.rendering?.debugPalette ?? DEFAULT_RENDERING.debugPalette),
      ],
    },
    performance: { ...DEFAULT_PERFORMANCE, ...options.performance },
  };
}
