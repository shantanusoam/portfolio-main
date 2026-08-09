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
 * Preferred default material — Signal Cloth. Graphite belongs to the dark
 * hero, bone keeps the face legible, and the single ember accent is shared
 * with the real instrument. It deliberately avoids the previous glossy
 * violet/cyan/magenta "effect" palette.
 */
export const SOFT_SIGNAL_PLUSH_PALETTE: AppearancePalette = {
  name: "Signal Cloth",
  base: "#282725",
  highlight: "#68635d",
  printPrimary: "#ff6b3d",
  printSecondary: "#c8bbae",
  face: "#f3ede4",
  shadow: "#11100f",
  rim: "#a69b91",
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
    label: "Signal Cloth",
    palette: SOFT_SIGNAL_PLUSH_PALETTE,
    // Sparse local stitches stay attached to the body and never turn into a
    // large pasted decal while the familiar bends.
    patternRecipe: "constellation-freckles",
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
