import { createCharacterSpec } from "../createCharacterSpec";

/** Current: a long ribbon fish whose fins lag and curl behind its turns. */
export const ribbonEelPreset = createCharacterSpec({
  id: "current-ribbon-eel",
  name: "Ribbon Eel",
  seed: 0xe311,
  appendages: 4,
  body: {
    shape: "soft-polygon",
    orientationMode: "velocity",
    radius: 58,
    squashAmount: 0.1,
    softBody: {
      boundary: [
        { x: 1.18, y: 0 },
        { x: 0.88, y: 0.19 },
        { x: 0.28, y: 0.27 },
        { x: -0.42, y: 0.22 },
        { x: -1.24, y: 0.08 },
        { x: -1.42, y: 0 },
        { x: -1.24, y: -0.08 },
        { x: -0.42, y: -0.22 },
        { x: 0.28, y: -0.27 },
        { x: 0.88, y: -0.19 },
      ],
      deformationMode: "wing",
      damping: 0.94,
      guideStrength: 0.18,
      edgeStiffness: 0.75,
      bendStiffness: 0.28,
      shapeStiffness: 0.1,
      areaStiffness: 0.58,
      centerStiffness: 0.52,
      constraintIterations: 8,
      deformationFrequency: 1.5,
      deformationAmount: 0.12,
    },
  },
  dynamics: {
    frequency: 1.2,
    damping: 0.76,
    response: -0.02,
    maxSpeed: 410,
    maxAcceleration: 3300,
    facingResponsiveness: 5.8,
  },
  appendageDefaults: {
    mode: "trailing",
    segmentLengths: [23, 22, 20, 18, 16],
    maxReach: 98,
    restingFootRadius: 92,
    anchor: { radius: 0.72 },
    spring: {
      damping: 0.958,
      guideStrength: 0.1,
      gravity: 18,
      curl: 780,
      constraintIterations: 7,
    },
    drag: 0.32,
    thickness: 5.2,
  },
  appendageFactory: (base, index) => {
    const pair = index < 2 ? index : index - 2;
    const angle =
      index < 2
        ? Math.PI + (pair === 0 ? -0.08 : 0.08)
        : (pair === 0 ? -1 : 1) * Math.PI * 0.53;
    const sideFin = index >= 2;
    return {
      ...base,
      id: sideFin ? `current-fin-${pair + 1}` : `current-ribbon-${pair + 1}`,
      anchor: { ...base.anchor, angle, radius: sideFin ? 0.5 : 0.84 },
      preferredFoot: {
        ...base.preferredFoot,
        angle,
        radius: sideFin ? 38 : 96,
      },
      segmentLengths: sideFin ? [14, 12, 10] : [23, 22, 20, 18, 16],
      maxReach: sideFin ? 34 : 98,
      thickness: sideFin ? 6.6 : 5.2,
      gaitGroup: index,
    };
  },
  gait: {
    style: "free",
    maxConcurrentSteps: 0,
    maxConcurrentStepsRunning: 0,
    maxConcurrentPerGroup: 0,
    minPlantedFeet: 0,
  },
  eyes: {
    spacing: 10,
    spacingAngle: Math.PI / 2,
    offsetX: 37,
    offsetY: 0,
    mouthOffsetX: 52,
    mouthOffsetY: 0,
    size: 4.8,
    pupilSize: 1.9,
  },
  personality: {
    curiosity: 0.96,
    confidence: 0.42,
    energy: 0.82,
    elasticity: 0.9,
    anticipation: 0.9,
    overshoot: 0.68,
  },
  rendering: {
    bodyColor: "#3d8fa7",
    bodyHighlightColor: "rgba(183, 240, 244, 0.48)",
    bodyShadowColor: "rgba(5, 34, 47, 0.32)",
    appendageColor: "#67b8c9",
    eyeColor: "#f6ffff",
    pupilColor: "#102c39",
    outlineColor: "rgba(208, 250, 252, 0.68)",
    outlineWidth: 1.1,
    glowColor: "#64d6e7",
    glow: 0.38,
    markingStyle: "bands",
    markingColor: "rgba(203, 244, 240, 0.46)",
  },
});
