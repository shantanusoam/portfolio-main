/**
 * Lost Signal: Pocket Edition — indexed LCD palette.
 *
 * Four authored tones, shared by every sprite grid and screen effect.
 * The ink/backlight pair carries a static contrast ratio of about 7.83:1;
 * essential cores must retain at least 4.5:1 local contrast on screen.
 */
export type Tone = 0 | 1 | 2 | 3 | 4;

export const POCKET_PALETTE = {
  1: "#152316", // ink — essential cores, outlines, collision silhouettes
  2: "#42573d", // shadow — body fill, dark scenery
  3: "#778e56", // faded ink — mid tones, dither clusters
  4: "#a5bc76", // backlight — lit cells, clearance borders, cores
} as const;

export const TONE_RGB: Record<Tone, [number, number, number]> = {
  0: [0, 0, 0],
  1: [21, 35, 22],
  2: [66, 87, 61],
  3: [119, 142, 86],
  4: [165, 188, 118],
};

/** Mint preset cued by the supplied reference photographs. */
export const MINT_PALETTE = {
  1: "#123028",
  2: "#3d5c4c",
  3: "#7d9a70",
  4: "#c2dcb0",
} as const;

/** Emissive phosphor: bright collision silhouettes on a dark tube. */
export const PHOSPHOR_PALETTE = {
  1: "#c6ffc0",
  2: "#70c97a",
  3: "#275b3e",
  4: "#07180f",
} as const;
export type ToneSet = Record<1 | 2 | 3 | 4, string>;
export function toneRGB(hex: string): [number, number, number] {
  return [1, 3, 5].map((offset) =>
    parseInt(hex.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}
export type PresetName = "clean" | "pocket" | "worn" | "crt";

export interface PresetConfig {
  /** LCD persistence time constant in ms; 0 disables history. */
  persistenceMs: number;
  /** Cell-gap overlay strength 0..1. */
  cell: number;
  /** Static backlight vignette strength 0..1. */
  backlight: number;
  /** Inset glass reflection streak 0..1. */
  reflection: number;
  /** Static screen-edge wear 0..1. */
  wear: number;
  /** Clearance border width around critical shapes, art px. */
  clearance: number;
}

export const PRESETS: Record<PresetName, PresetConfig> = {
  clean: {
    persistenceMs: 0,
    cell: 0.015,
    backlight: 0.35,
    reflection: 0,
    wear: 0,
    clearance: 1,
  },
  pocket: {
    persistenceMs: 55,
    cell: 0.045,
    backlight: 0.6,
    reflection: 0.05,
    wear: 0,
    clearance: 1,
  },
  crt: {
    persistenceMs: 35,
    cell: 0.1,
    backlight: 0.2,
    reflection: 0.025,
    wear: 0,
    clearance: 1,
  },
  worn: {
    persistenceMs: 75,
    cell: 0.08,
    backlight: 0.7,
    reflection: 0.07,
    wear: 0.5,
    clearance: 1,
  },
};

export const ART_WIDTH = 240;
export const ART_HEIGHT = 135;
/** Two simulation units map to one art pixel. */
export const WORLD_PER_ART = 2;
