import type { MascotQuality, QualityPreset } from "../types";

/**
 * Starting values — tune from real profiling and record changes in
 * docs/mascot/PERFORMANCE.md (see the GPU migration gate in ARCHITECTURE.md
 * before adding a renderer beyond Canvas 2D).
 */
export const QUALITY_PRESETS: Record<MascotQuality, QualityPreset> = {
  reduced: {
    dotCount: 0,
    particles: 0,
    solverIterations: 1,
    dprCap: 1,
    targetFps: 15,
  },
  low: {
    // Reason: dots are accents only — silhouette + generated print carry the read.
    dotCount: 180,
    particles: 80,
    solverIterations: 2,
    dprCap: 1.25,
    targetFps: 45,
  },
  medium: {
    dotCount: 420,
    particles: 180,
    solverIterations: 3,
    dprCap: 1.5,
    targetFps: 60,
  },
  high: {
    dotCount: 720,
    particles: 320,
    solverIterations: 5,
    dprCap: 2,
    targetFps: 60,
  },
};

export function getQualityPreset(quality: MascotQuality): QualityPreset {
  return QUALITY_PRESETS[quality];
}
