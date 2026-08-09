import { createCharacterSpec } from "../createCharacterSpec";

const PHASES = [0, 0.25, 0.5, 0.75, 0.25, 0, 0.75, 0.5] as const;
const GROUPS = [0, 1, 2, 3, 1, 0, 3, 2] as const;
const ANCHOR_ANGLES = [0.18, 0.28, 0.38, 0.47, 0.53, 0.62, 0.72, 0.82] as const;
const FOOT_ANGLES = [0.04, 0.18, 0.32, 0.43, 0.57, 0.68, 0.82, 0.96] as const;
const FOOT_RADII = [96, 89, 84, 80, 80, 84, 89, 96] as const;

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
    radius: 35,
    squashAmount: 0.3,
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
    maxSpeed: 390,
    maxAcceleration: 5200,
    facingResponsiveness: 8.5,
    movementFrequency: 2.15,
  },
  idle: {
    delay: 2.8,
    breathingFrequency: 0.82,
    breathingAmount: 0.025,
    lookAroundAmount: 0.3,
    wanderRadius: 160,
  },
  appendageDefaults: {
    segmentLengths: [23, 22, 20, 18, 16],
    maxReach: 99,
    restingFootRadius: 86,
    anchor: { radius: 0.76 },
    step: {
      threshold: 22,
      duration: 0.22,
      height: 15,
      predictionTime: 0.13,
      cooldown: 0.055,
      variation: 2.8,
    },
    spring: {
      damping: 0.936,
      guideStrength: 0.19,
      gravity: 230,
      curl: 620,
      constraintIterations: 5,
    },
    stiffness: 0.66,
    drag: 0.92,
    thickness: 14,
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
        damping: 0.93 + edgeDistance * 0.012,
        guideStrength: 0.21 - edgeDistance * 0.055,
        curl: 500 + edgeDistance * 300,
      },
      thickness: 15 - edgeDistance * 3.5,
      gaitPhase: PHASES[index],
      gaitGroup: GROUPS[index],
      preferredBendDirection: index < 4 ? 1 : -1,
    };
  },
  gait: {
    style: "wave",
    phaseOffsets: PHASES,
    cadence: 3.15,
    phaseWindow: 0.48,
    maxConcurrentSteps: 2,
    maxConcurrentStepsRunning: 3,
    maxConcurrentPerGroup: 1,
    minPlantedFeet: 5,
    runningSpeed: 0.58,
    emergencyStretchRatio: 1.42,
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
    appendageThickness: 14,
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
