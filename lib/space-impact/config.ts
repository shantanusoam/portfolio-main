import type { Settings, Weapon } from "./types";

export const WIDTH = 480;
export const HEIGHT = 270;
export const STEP = 1 / 60;
export const VERSION = "lost-signal-1";
export const PLAYER_RADIUS = 6;
export const PLAYER_SPEED = 170;
export const STORAGE_KEY = "portfolio-space-impact:v1";
export const MAX_BULLETS = 320;
export const MAX_PARTICLES = 160;
export const WEAPONS: Record<
  Weapon,
  { name: string; color: string; interval: number }
> = {
  pulse: { name: "Pulse cannon", color: "#9af8e9", interval: 0.19 },
  split: { name: "Split shot", color: "#ffc480", interval: 0.32 },
  rail: { name: "Rail lance", color: "#c4afff", interval: 0.52 },
};
export const DEFAULT_SETTINGS: Settings = {
  music: 0.3,
  effects: 0.55,
  muted: false,
  reducedMotion: false,
  lowFlashes: true,
  highContrast: false,
  lowEffects: false,
  leftHanded: false,
  control: "drag",
  skin: "color",
  assist: false,
};
export const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n));
export const distance = (
  a: { x: number; y: number },
  b: { x: number; y: number },
) => Math.hypot(a.x - b.x, a.y - b.y);
