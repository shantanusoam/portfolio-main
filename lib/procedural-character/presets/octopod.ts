import { createCharacterSpec } from "../createCharacterSpec";

const PHASES = [0, 0.5, 0.25, 0.75, 0, 0.5, 0.25, 0.75] as const;
const GROUPS = [0, 1, 2, 3, 0, 1, 2, 3] as const;

/**
 * First-deliverable debug octopod: eight planted IK legs, opposite-pair wave
 * gait, soft delayed body, and enough reach reserve to show clear knee bends.
 */
export const octopodPreset = createCharacterSpec({
  id: "debug-octopod",
  name: "Debug Octopod",
  seed: 0x0c70,
  scale: 1,
  appendages: 8,
  body: {
    shape: "radial",
    radius: 28,
    squashAmount: 0.16,
    segmentCount: 1,
    segmentSpacing: 12,
    stiffness: 0.8,
    maxJointAngleDifference: Math.PI / 3,
    widthProfile: { kind: "elliptical" },
  },
  dynamics: {
    frequency: 1.85,
    damping: 0.68,
    response: 0.1,
    maxSpeed: 280,
    maxAcceleration: 4800,
    facingResponsiveness: 11,
    movementFrequency: 2,
  },
  appendageDefaults: {
    segmentLengths: [48, 46, 44, 42],
    maxReach: 180,
    restingFootRadius: 105,
    anchor: { radius: 0.8 },
    step: {
      threshold: 29,
      duration: 0.17,
      height: 18,
      predictionTime: 0.09,
      cooldown: 0.05,
      variation: 3.4,
    },
    stiffness: 0.78,
    drag: 0.88,
    thickness: 5.5,
  },
  appendageFactory: (base, index, count) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      ...base,
      id: `octopod-leg-${index + 1}`,
      anchor: { ...base.anchor, angle },
      restingFootRadius: 102 + (index % 2) * 6,
      preferredFoot: {
        ...base.preferredFoot,
        angle,
        radius: 102 + (index % 2) * 6,
      },
      gaitPhase: PHASES[index],
      gaitGroup: GROUPS[index],
      preferredBendDirection: index % 2 === 0 ? 1 : -1,
    };
  },
  gait: {
    style: "wave",
    phaseOffsets: PHASES,
    cadence: 2.6,
    phaseWindow: 0.4,
    maxConcurrentSteps: 2,
    maxConcurrentStepsRunning: 4,
    maxConcurrentPerGroup: 2,
    minPlantedFeet: 4,
    runningSpeed: 0.55,
    emergencyStretchRatio: 1.5,
  },
  eyes: {
    count: 2,
    spacing: 13,
    size: 7.5,
    pupilSize: 3,
    pupilTrackingStrength: 0.65,
    velocityAnticipation: 0.2,
    blink: {
      minimumInterval: 2.5,
      maximumInterval: 6.5,
      duration: 0.14,
    },
  },
  personality: {
    curiosity: 0.82,
    confidence: 0.58,
    energy: 0.85,
    elasticity: 0.82,
    anticipation: 0.72,
    overshoot: 0.64,
    appendageStiffness: 0.74,
    glowResponsiveness: 0.45,
  },
  rendering: {
    bodyColor: "#c4b5fd",
    appendageColor: "#8b5cf6",
    eyeColor: "#f8fafc",
    pupilColor: "#111827",
    outlineColor: "#ede9fe",
    outlineWidth: 2,
    glowColor: "#7c3aed",
    glow: 0,
    appendageThickness: 5.5,
    debugPalette: ["#22d3ee", "#f472b6", "#facc15", "#4ade80"],
  },
  performance: {
    fixedTimeStep: 1 / 120,
    maxFrameDelta: 0.05,
    maxSimulationSteps: 6,
    solverIterations: 7,
    lowPowerSolverIterations: 4,
    dprCap: 2,
  },
});
