import { createCharacterSpec } from "../createCharacterSpec";

const PHASES = [0, 0.25, 0.5, 0.75, 0.25, 0, 0.75, 0.5] as const;
const GROUPS = [0, 1, 2, 3, 1, 0, 3, 2] as const;
const ANCHOR_ANGLES = [0.23, 0.29, 0.36, 0.44, 0.56, 0.64, 0.71, 0.77] as const;
const FOOT_ANGLES = [0.12, 0.23, 0.34, 0.43, 0.57, 0.66, 0.77, 0.88] as const;
const FOOT_RADII = [54, 49, 45, 42, 42, 45, 49, 54] as const;

/**
 * Soft silhouette octopod. FABRIK supplies planted endpoints while Verlet
 * ribbons provide the visible recoil, drag and fluid curvature.
 */
export const octopodPreset = createCharacterSpec({
  id: "soft-octopod",
  name: "Soft Octopod",
  seed: 0x0c70,
  scale: 1,
  appendages: 8,
  body: {
    shape: "radial",
    orientationMode: "upright",
    maxLean: 0.27,
    radius: 27,
    squashAmount: 0.26,
    segmentCount: 1,
    segmentSpacing: 12,
    stiffness: 0.72,
    maxJointAngleDifference: Math.PI / 2.5,
    widthProfile: { kind: "head-heavy", exponent: 1.35 },
  },
  dynamics: {
    frequency: 1.95,
    damping: 0.5,
    response: 0.16,
    maxSpeed: 780,
    maxAcceleration: 5200,
    facingResponsiveness: 8.5,
    movementFrequency: 2.15,
  },
  locomotion: {
    mode: "platform",
    gravity: 1500,
    maxFallSpeed: 720,
    maxHorizontalSpeed: 245,
    horizontalAcceleration: 1320,
    horizontalDrag: 9,
    jumpSpeed: 650,
    hopDistance: 70,
    hopHeightBias: 34,
    hopCooldown: 0.2,
    coyoteTime: 0.09,
    bodyGroundOffset: 52,
    surfaceInset: 7,
  },
  idle: {
    delay: 2.8,
    breathingFrequency: 0.82,
    breathingAmount: 0.025,
    lookAroundAmount: 0.3,
    wanderRadius: 160,
  },
  appendageDefaults: {
    segmentLengths: [14, 14, 13, 12, 10],
    maxReach: 61,
    restingFootRadius: 48,
    anchor: { radius: 0.76 },
    step: {
      threshold: 11,
      duration: 0.19,
      height: 8,
      predictionTime: 0.1,
      cooldown: 0.075,
      variation: 1.2,
    },
    spring: {
      damping: 0.92,
      guideStrength: 0.34,
      gravity: 360,
      curl: 260,
      constraintIterations: 6,
    },
    stiffness: 0.66,
    drag: 0.92,
    thickness: 7.2,
  },
  appendageFactory: (base, index) => {
    const edgeDistance = Math.abs(index - 3.5) / 3.5;
    return {
      ...base,
      id: `soft-arm-${index + 1}`,
      anchor: {
        ...base.anchor,
        angle: ANCHOR_ANGLES[index] * Math.PI,
      },
      restingFootRadius: FOOT_RADII[index],
      preferredFoot: {
        ...base.preferredFoot,
        angle: FOOT_ANGLES[index] * Math.PI,
        radius: FOOT_RADII[index],
      },
      spring: {
        ...base.spring,
        damping: 0.916 + edgeDistance * 0.012,
        guideStrength: 0.38 - edgeDistance * 0.06,
        curl: 220 + edgeDistance * 160,
      },
      thickness: 7.8 - edgeDistance * 1.8,
      gaitPhase: PHASES[index],
      gaitGroup: GROUPS[index],
      preferredBendDirection: index < 4 ? 1 : -1,
    };
  },
  gait: {
    style: "wave",
    phaseOffsets: PHASES,
    cadence: 3.6,
    phaseWindow: 0.42,
    maxConcurrentSteps: 2,
    maxConcurrentStepsRunning: 3,
    maxConcurrentPerGroup: 1,
    minPlantedFeet: 6,
    runningSpeed: 0.58,
    emergencyStretchRatio: 1.55,
  },
  eyes: {
    count: 2,
    spacing: 15,
    size: 7,
    pupilSize: 3,
    pupilTrackingStrength: 0.68,
    velocityAnticipation: 0.13,
    blink: {
      minimumInterval: 2.7,
      maximumInterval: 6.8,
      duration: 0.15,
    },
  },
  personality: {
    curiosity: 0.88,
    confidence: 0.48,
    energy: 0.9,
    elasticity: 0.98,
    anticipation: 0.78,
    overshoot: 0.9,
    appendageStiffness: 0.58,
    glowResponsiveness: 0.35,
  },
  rendering: {
    bodyColor: "#dbe7ec",
    appendageColor: "#dbe7ec",
    eyeColor: "#f9fcfd",
    pupilColor: "#142534",
    outlineColor: "rgba(246, 252, 255, 0.62)",
    outlineWidth: 1.15,
    glowColor: "#9dd7e7",
    glow: 0.42,
    appendageThickness: 7.2,
    debugPalette: ["#67e8f9", "#f9a8d4", "#fde68a", "#86efac"],
  },
  performance: {
    fixedTimeStep: 1 / 120,
    maxFrameDelta: 0.05,
    maxSimulationSteps: 6,
    solverIterations: 8,
    lowPowerSolverIterations: 5,
    dprCap: 2,
  },
});
