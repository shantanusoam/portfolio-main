import type {
  AppearanceLayerName,
  AppearanceTuningOverrides,
  MascotQuality,
} from "../types";

/**
 * Shared appearance-lab config shapes: which layers render and how the
 * continuous tuning knobs default. Kept separate from SilhouetteRenderer so
 * both MascotRuntime (state ownership) and the render pipeline can import it
 * without a cycle.
 */

export type AppearanceLayerToggles = Record<AppearanceLayerName, boolean>;

export const DEFAULT_APPEARANCE_LAYERS: AppearanceLayerToggles = {
  silhouette: true,
  print: true,
  rim: true,
  dots: true,
  face: true,
};

export const DEFAULT_APPEARANCE_TUNING: AppearanceTuningOverrides = {
  // Reason: dots are a sparse accent layer; silhouette+face must read alone (V2 §9/§45).
  dotDensity: 0.28,
  bodyOpacity: 1,
  rimWidth: 1,
  glowIntensity: 0.38,
  patternScale: 0.72,
  patternContrast: 0.24,
};

const REDUCED_ALLOWED: AppearanceLayerToggles = {
  silhouette: true,
  print: false,
  rim: false,
  dots: false,
  face: true,
};

const LOW_ALLOWED: AppearanceLayerToggles = {
  silhouette: true,
  print: true,
  rim: true,
  dots: false,
  face: true,
};

const FULL_ALLOWED: AppearanceLayerToggles = {
  silhouette: true,
  print: true,
  rim: true,
  dots: true,
  face: true,
};

/**
 * Quality-gates which layers can render this frame, per the upgrade spec's
 * render pipeline table (reduced: silhouette+face; low: +one flat print+
 * simple rim; medium/high: full print+sparse dots+rim). User/dev overrides
 * from the appearance lab can only narrow this further — a quality tier can
 * never be forced to show a layer it doesn't support.
 */
export function resolveLayersForQuality(
  quality: MascotQuality,
  overrides: AppearanceLayerToggles,
): AppearanceLayerToggles {
  const allowed =
    quality === "reduced"
      ? REDUCED_ALLOWED
      : quality === "low"
        ? LOW_ALLOWED
        : FULL_ALLOWED;

  return {
    silhouette: allowed.silhouette && overrides.silhouette,
    print: allowed.print && overrides.print,
    rim: allowed.rim && overrides.rim,
    dots: allowed.dots && overrides.dots,
    face: allowed.face && overrides.face,
  };
}
