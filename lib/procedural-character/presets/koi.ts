import { createCharacterSpec } from "../createCharacterSpec";

const FIN_ANGLES = [Math.PI - 0.16, Math.PI, Math.PI + 0.16] as const;

/** Sumi: a soft-bodied koi with a three-part caudal fan and side fins. */
export const koiPreset = createCharacterSpec({
  id: "sumi-koi",
  name: "Sumi Koi",
  seed: 0x50b1,
  appendages: 5,
  body: {
    shape: "soft-polygon",
    orientationMode: "velocity",
    radius: 54,
    squashAmount: 0.12,
    softBody: {
      boundary: [
        { x: 1.08, y: 0 },
        { x: 0.74, y: 0.31 },
        { x: 0.22, y: 0.48 },
        { x: -0.34, y: 0.42 },
        { x: -0.9, y: 0.18 },
        { x: -1.1, y: 0 },
        { x: -0.9, y: -0.18 },
        { x: -0.34, y: -0.42 },
        { x: 0.22, y: -0.48 },
        { x: 0.74, y: -0.31 },
      ],
      deformationMode: "none",
      damping: 0.93,
      guideStrength: 0.25,
      edgeStiffness: 0.8,
      bendStiffness: 0.34,
      shapeStiffness: 0.16,
      areaStiffness: 0.7,
      centerStiffness: 0.62,
      constraintIterations: 8,
    },
  },
  dynamics: {
    frequency: 1.42,
    damping: 0.84,
    response: 0.03,
    maxSpeed: 360,
    maxAcceleration: 3200,
    facingResponsiveness: 7.4,
  },
  appendageDefaults: {
    mode: "trailing",
    segmentLengths: [18, 17, 15, 13],
    maxReach: 63,
    restingFootRadius: 58,
    anchor: { radius: 0.78 },
    spring: {
      damping: 0.95,
      guideStrength: 0.14,
      gravity: 22,
      curl: 520,
      constraintIterations: 6,
    },
    drag: 0.4,
    thickness: 6.8,
  },
  appendageFactory: (base, index) => {
    const isTail = index < 3;
    const side = index === 3 ? -1 : 1;
    const angle = isTail ? FIN_ANGLES[index] : side * Math.PI * 0.55;
    return {
      ...base,
      id: isTail ? `sumi-tail-${index + 1}` : `sumi-fin-${index - 2}`,
      anchor: {
        ...base.anchor,
        angle,
        radius: isTail ? 0.82 : 0.52,
      },
      preferredFoot: {
        ...base.preferredFoot,
        angle: isTail ? angle : angle + side * 0.35,
        radius: isTail ? 64 : 34,
      },
      segmentLengths: isTail ? [18, 17, 15, 13] : [12, 11, 9],
      maxReach: isTail ? 63 : 31,
      thickness: isTail ? 7.2 - Math.abs(index - 1) * 1.4 : 8.5,
      gaitGroup: index,
      gaitPhase: index / 5,
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
    count: 2,
    spacing: 13,
    spacingAngle: Math.PI / 2,
    offsetX: 26,
    offsetY: 0,
    mouthOffsetX: 42,
    mouthOffsetY: 0,
    size: 5.2,
    pupilSize: 2.1,
  },
  personality: {
    curiosity: 0.82,
    confidence: 0.7,
    energy: 0.58,
    elasticity: 0.66,
    anticipation: 0.72,
    overshoot: 0.48,
  },
  rendering: {
    bodyColor: "#eef1eb",
    bodyHighlightColor: "rgba(255, 255, 255, 0.54)",
    bodyShadowColor: "rgba(16, 28, 36, 0.28)",
    appendageColor: "#dfe8e5",
    eyeColor: "#ffffff",
    pupilColor: "#15232d",
    outlineColor: "rgba(221, 246, 247, 0.78)",
    outlineWidth: 1.25,
    glowColor: "#9ed7df",
    glow: 0.2,
    markingStyle: "koi",
    markingColor: "#e66f43",
  },
});
