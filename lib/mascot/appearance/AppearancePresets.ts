import type { AppearancePresetName } from "../types";
import type { PatternRecipeName } from "./PatternRecipes";

/**
 * Palette/recipe presets — pure configuration, never engine architecture
 * (upgrade spec: "Do not allow a preset to change engine architecture.
 * Presets are configuration recipes."). Colour hierarchy per palette: one
 * dominant body colour (`base`), one support (`highlight`), one accent pair
 * for print (`printPrimary`/`printSecondary`) — V2 §9 Soft Signal Plush
 * hierarchy: deep-violet silhouette → warm-cream face → muted lavender
 * texture → sparse cyan/magenta accents.
 */

export interface AppearancePalette {
  name: string;
  /** Dominant body colour. */
  base: string;
  /** Support colour — gradient highlight, glow, sparse dot accent. */
  highlight: string;
  printPrimary: string;
  printSecondary: string;
  face: string;
  shadow: string;
  rim: string;
}

/**
 * Preferred default material — Soft Signal Plush (V2 §9 / §36).
 * Deep violet body, warm-cream face, muted lavender support, desaturated
 * cyan/magenta print accents (coverage kept sparse via PatternRecipes budgets).
 */
export const SOFT_SIGNAL_PLUSH_PALETTE: AppearancePalette = {
  name: "Soft Signal Plush",
  base: "#2f1f52",
  highlight: "#b8a4d9",
  printPrimary: "#5ecfc0",
  printSecondary: "#d478b0",
  face: "#fff8ec",
  shadow: "#140c2b",
  rim: "#d4c4ef",
};

/** @deprecated Alias kept for existing print tests — prefer SOFT_SIGNAL_PLUSH_PALETTE. */
export const NIGHT_CANDY_PALETTE: AppearancePalette = SOFT_SIGNAL_PLUSH_PALETTE;

/** "Deep Sea Toy" family — alternate lab preset. */
export const DEEP_SEA_TOY_PALETTE: AppearancePalette = {
  name: "Deep Sea Toy",
  base: "#0d2b2e",
  highlight: "#8fe9c9",
  printPrimary: "#ff8a65",
  printSecondary: "#cbb2ff",
  face: "#dff6ee",
  shadow: "#08181a",
  rim: "#9be8d3",
};

/** "Signal Manta" family — cooler charcoal plush alternate. */
export const SIGNAL_PLUSH_PALETTE: AppearancePalette = {
  name: "Signal Plush",
  base: "#2b2b31",
  highlight: "#f2f1ee",
  printPrimary: "#39ff8f",
  printSecondary: "#3ec8ff",
  face: "#fbfaf6",
  shadow: "#100f14",
  rim: "#eae7de",
};

export interface AppearancePreset {
  id: AppearancePresetName;
  label: string;
  palette: AppearancePalette;
  patternRecipe: PatternRecipeName;
}

export const APPEARANCE_PRESETS: Record<
  AppearancePresetName,
  AppearancePreset
> = {
  "cute-bean": {
    id: "cute-bean",
    label: "Soft Signal Plush",
    palette: SOFT_SIGNAL_PLUSH_PALETTE,
    // Reason: soft-plush fabric patches via terrazzo placement budget (mapped in ProceduralPrint).
    patternRecipe: "terrazzo-confetti",
  },
  "signal-manta": {
    id: "signal-manta",
    label: "Signal Manta",
    palette: SIGNAL_PLUSH_PALETTE,
    patternRecipe: "soft-stripes",
  },
  "velvet-comet": {
    id: "velvet-comet",
    label: "Velvet Comet",
    palette: DEEP_SEA_TOY_PALETTE,
    patternRecipe: "constellation-freckles",
  },
};

export const DEFAULT_APPEARANCE_PRESET_ID: AppearancePresetName = "cute-bean";

export function getAppearancePreset(
  id: AppearancePresetName,
): AppearancePreset {
  return (
    APPEARANCE_PRESETS[id] ?? APPEARANCE_PRESETS[DEFAULT_APPEARANCE_PRESET_ID]
  );
}

export function listAppearancePresets(): AppearancePreset[] {
  return Object.values(APPEARANCE_PRESETS);
}
