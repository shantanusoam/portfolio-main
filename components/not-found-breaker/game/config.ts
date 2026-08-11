export const STORAGE_MUTE_KEY = "portfolio-break404-muted";

export const BREAK404_COLORS = {
  bg: "#080807",
  surface: "#10100f",
  orange: "#ff5d2f",
  orangeBright: "#ff7448",
  orangeDeep: "#c9330a",
  orangeMuted: "rgba(255, 93, 47, 0.45)",
  bone: "#eee9df",
  boneMuted: "rgba(238, 233, 223, 0.56)",
  boneFaint: "rgba(238, 233, 223, 0.16)",
  ink: "#161616",
  gray: "#595959",
} as const;

export const POWER_LABELS = {
  multi: "Multi Ball",
  wide: "Wide Paddle",
  fire: "Fire Ball",
  slow: "Slow Motion",
} as const;

export const POWER_COLORS = {
  multi: "#ff7448",
  wide: "#eee9df",
  fire: "#ff4d1c",
  slow: "#c9b8a0",
} as const;

export const GAME_TUNING = {
  lives: 3,
  ballRadius: 7,
  ballSpeed: 420,
  ballSpeedMax: 620,
  paddleHeight: 12,
  paddleWidth: 110,
  paddleWideWidth: 170,
  paddleMarginBottom: 48,
  paddleSpeedKeyboard: 560,
  brickGap: 3,
  powerDropChance: 0.12,
  powerFallSpeed: 140,
  powerRadius: 11,
  wideDuration: 10,
  fireDuration: 7,
  slowDuration: 6,
  slowScale: 0.65,
  multiExtraBalls: 2,
  comboTimeout: 1.8,
  stillLostFlash: 1.35,
  shakeDecay: 8,
  maxParticles: 120,
} as const;
