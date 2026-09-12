import { restoreArsenal } from "./arsenal";
import { hashSeed } from "./random";
import { HEIGHT, VERSION, WIDTH } from "./config";
import type { Checkpoint, Game, Input, Mode, Profile } from "./types";

export const emptyInput = (): Input => ({
  x: 0,
  y: 0,
  target: null,
  pulse: false,
  interact: false,
  ceaseFire: false,
  cycleWeapon: false,
});
export function createGame(
  profile: Profile,
  mode: Mode = "campaign",
  sector = 0,
  seed = 331042,
  checkpoint?: Checkpoint | null,
): Game {
  const assist = checkpoint?.assist ?? profile.settings.assist;
  const maxHull = assist ? 5 : 3;
  return {
    version: VERSION,
    status: "ready",
    mode,
    seed: seed || 1,
    random: hashSeed((seed || 1) + ":" + sector),
    nextId: 0,
    tick: 0,
    sectorTick: 0,
    sector,
    score: checkpoint?.score ?? 0,
    kills: 0,
    grazes: 0,
    combo: 0,
    comboTime: 0,
    player: {
      x: WIDTH * 0.18,
      y: HEIGHT / 2,
      previousX: WIDTH * 0.18,
      previousY: HEIGHT / 2,
      hull: maxHull,
      maxHull,
      invincible: 2,
      weapon: checkpoint?.weapon ?? "pulse",
      level: checkpoint?.level ?? 1,
      fire: 0,
      charge: 30,
      arsenal: restoreArsenal(checkpoint?.arsenal, checkpoint?.weapon, checkpoint?.level),
      shield: 0,
      overdrive: 0,
      drones: 0,
      droneFire: 0,
    },
    enemies: [],
    squads: [],
    formationsCleared: 0,
    combatNotice: null,
    bullets: [],
    terrain: [],
    pickups: [],
    features: [],
    particles: [],
    boss: null,
    bossDefeated: false,
    encounter: 0,
    featureCursor: 0,
    message: null,
    events: [],
    secrets: [...profile.secrets],
    discovered: [],
    feathers: 0,
    room: null,
    pulseTime: 0,
    hitStop: 0,
    shake: 0,
    countdown: 0,
    console: null,
    ending: null,
    assist,
    trace: [],
    ghost: profile.ghost,
    ghostPlayback: 0,
    best: profile.best[mode + (assist ? ":assist" : ":standard")] ?? 0,
    hint: "",
    stageStarted: false,
    companion: profile.secrets.includes("patient"),
    checkpoint: checkpoint ?? null,
  };
}
export function startGame(game: Game): void {
  game.status = "countdown";
  game.countdown = 1.5;
}
export function pauseGame(game: Game): void {
  if (game.status === "running" || game.status === "countdown")
    game.status = "paused";
}
export function resumeGame(game: Game): void {
  if (game.status !== "paused") return;
  game.status = "countdown";
  game.countdown = 2;
}
