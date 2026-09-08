export type Mode = "campaign" | "arcade" | "practice" | "challenge";
export type Status =
  | "ready"
  | "running"
  | "paused"
  | "countdown"
  | "cleared"
  | "dead"
  | "victory"
  | "console";
export type Weapon = "pulse" | "split" | "rail";
export type Secret =
  | "lcd"
  | "window"
  | "404"
  | "cluck"
  | "patient"
  | "blue-dot"
  | "ghost"
  | "signal";
export type EnemyKind =
  | "scout"
  | "sentry"
  | "diver"
  | "prism"
  | "armored"
  | "choir"
  | "clucker";
export type FeatureKind =
  | "window"
  | "beacon"
  | "probe"
  | "planet"
  | "ghost"
  | "portal";
export type Sound =
  | "shot"
  | "rail"
  | "hit"
  | "explode"
  | "damage"
  | "pickup"
  | "pulse"
  | "warning"
  | "secret"
  | "clear";
export interface Point {
  x: number;
  y: number;
}
export interface Input {
  x: number;
  y: number;
  target: Point | null;
  pulse: boolean;
  interact: boolean;
  ceaseFire: boolean;
}
export interface Settings {
  music: number;
  effects: number;
  muted: boolean;
  reducedMotion: boolean;
  lowFlashes: boolean;
  highContrast: boolean;
  lowEffects: boolean;
  leftHanded: boolean;
  control: "drag" | "stick";
  skin: "color" | "lcd";
  assist: boolean;
}
export interface Checkpoint {
  sector: number;
  weapon: Weapon;
  level: number;
  score: number;
  seed: number;
  assist: boolean;
}
export interface Profile {
  version: 1;
  settings: Settings;
  secrets: Secret[];
  highestSector: number;
  best: Record<string, number>;
  checkpoint: Checkpoint | null;
  ghost: { sector: number; points: Point[] } | null;
  completed: boolean;
}
export interface Player extends Point {
  previousX: number;
  previousY: number;
  hull: number;
  maxHull: number;
  invincible: number;
  weapon: Weapon;
  level: number;
  fire: number;
  charge: number;
}
export interface Enemy extends Point {
  id: number;
  kind: EnemyKind;
  hp: number;
  maxHp: number;
  radius: number;
  age: number;
  fire: number;
  phase: number;
  baseY: number;
  dead: boolean;
}
export interface Bullet extends Point {
  id: number;
  previousX: number;
  previousY: number;
  vx: number;
  vy: number;
  enemy: boolean;
  radius: number;
  damage: number;
  life: number;
  grazed: boolean;
  dead: boolean;
  rail: boolean;
  hits: number[];
}
export interface Terrain extends Point {
  id: number;
  w: number;
  h: number;
  speed: number;
  kind: "rock" | "gate" | "glass";
}
export interface Pickup extends Point {
  id: number;
  kind: Weapon | "repair" | "charge" | "feather" | "salvage";
  age: number;
  dead: boolean;
}
export interface BossPart {
  id: number;
  y: number;
  hp: number;
  maxHp: number;
}
export interface Boss extends Point {
  hp: number;
  maxHp: number;
  phase: number;
  age: number;
  attack: number;
  telegraph: number;
  attackAge: number;
  pattern: number;
  targetY: number;
  parts: BossPart[];
  awakened: boolean;
  transition: number;
  truePhase: boolean;
}
export interface Feature extends Point {
  id: number;
  kind: FeatureKind;
  age: number;
  progress: number;
}
export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
export interface Message {
  title: string;
  text: string;
  life: number;
}
export interface Room {
  kind: "salvage" | "glitch" | "cluck" | "observatory";
  tick: number;
  duration: number;
}
export interface GameEvent {
  kind: "sound" | "save" | "death" | "checkpoint" | "complete";
  sound?: Sound;
}
export interface Game {
  version: string;
  status: Status;
  mode: Mode;
  seed: number;
  random: number;
  nextId: number;
  tick: number;
  sectorTick: number;
  sector: number;
  score: number;
  kills: number;
  grazes: number;
  combo: number;
  comboTime: number;
  player: Player;
  enemies: Enemy[];
  bullets: Bullet[];
  terrain: Terrain[];
  pickups: Pickup[];
  features: Feature[];
  particles: Particle[];
  boss: Boss | null;
  bossDefeated: boolean;
  encounter: number;
  featureCursor: number;
  message: Message | null;
  events: GameEvent[];
  secrets: Secret[];
  discovered: Secret[];
  feathers: number;
  room: Room | null;
  pulseTime: number;
  hitStop: number;
  shake: number;
  countdown: number;
  console: "beacon" | "relay" | null;
  ending: "home" | "signal" | "challenge" | null;
  assist: boolean;
  trace: Point[];
  ghost: Profile["ghost"];
  ghostPlayback: number;
  best: number;
  hint: string;
  stageStarted: boolean;
  companion: boolean;
  checkpoint: Checkpoint | null;
}
export interface Encounter {
  at: number;
  kind: EnemyKind | "corridor" | "current" | "weapon" | "repair" | "feather";
  lane: number;
  count?: number;
}
export interface Sector {
  id: string;
  name: string;
  subtitle: string;
  bossName: string;
  color: string;
  dark: string;
  duration: number;
  transmission: string;
  encounters: Encounter[];
  features: { at: number; kind: FeatureKind; y: number }[];
}
