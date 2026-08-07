import type { AppearancePresetName } from "../types";
import type { PatternRecipeName } from "./PatternRecipes";

/**
 * Palette/recipe presets — pure configuration, never engine architecture
 * (upgrade spec: "Do not allow a preset to change engine architecture.
 * Presets are configuration recipes."). Colour hierarchy per palette: one
 * dominant body colour (`base`), one support (`highlight`), one accent pair
 * for print (`printPrimary`/`printSecondary`) — replacing the old build's
 * equal-density cyan/magenta noise.
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

/** "Night Candy" family from the upgrade spec's BASE BODY COLOUR section. */
export const NIGHT_CANDY_PALETTE: AppearancePalette = {
  name: "Night Candy",
  base: "#2f1f52",
  highlight: "#c9b6ff",
  printPrimary: "#38f2d8",
  printSecondary: "#ff3ec9",
  face: "#fff8ec",
  shadow: "#140c2b",
  rim: "#e7d9ff",
};

/** "Deep Sea Toy" family. */
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

/** "Signal Plush" family. */
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
    label: "Cute Bean",
    palette: NIGHT_CANDY_PALETTE,
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
