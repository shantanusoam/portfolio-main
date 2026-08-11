import { POWER_LABELS } from "./config";

export type PowerKind = keyof typeof POWER_LABELS;

export type GameStatus = "ready" | "playing" | "stillLost" | "won" | "gameOver";

export interface Brick {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  /** 0 = bone, 1 = orange, 2 = deep orange */
  tier: 0 | 1 | 2;
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  stuck: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  w: number;
  h: number;
  baseW: number;
}

export interface FallingPower {
  id: number;
  kind: PowerKind;
  x: number;
  y: number;
  r: number;
  vy: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface ActivePowers {
  wideUntil: number;
  fireUntil: number;
  slowUntil: number;
}

export interface Break404Model {
  width: number;
  height: number;
  status: GameStatus;
  time: number;
  lives: number;
  combo: number;
  comboTimer: number;
  score: number;
  bricks: Brick[];
  balls: Ball[];
  paddle: Paddle;
  powers: FallingPower[];
  active: ActivePowers;
  particles: Particle[];
  shake: number;
  stillLostTimer: number;
  muted: boolean;
  reducedMotion: boolean;
  pointerX: number | null;
  keys: { left: boolean; right: boolean };
  bricksRemaining: number;
  /** One-shot cues for the React shell to play; cleared after read. */
  sfx: Array<"hit" | "power" | "lose" | "win" | "launch">;
}

export interface Break404Input {
  dt: number;
  launch: boolean;
}
