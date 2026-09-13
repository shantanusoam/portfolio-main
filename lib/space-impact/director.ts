import { clamp, HEIGHT, WIDTH } from "./config";
import {
  burst,
  combatNotice,
  discover,
  message,
  pickup,
  sound,
} from "./combat";
import { announceBoss, createBoss } from "./content/bosses";
import { SECTORS } from "./content/sectors";
import { FRAGMENTS } from "./content/secrets";
import { hashSeed, random } from "./random";
import { checkpointFor } from "./storage";
import type {
  Encounter,
  Enemy,
  EnemyKind,
  Formation,
  Game,
  Pickup,
  Room,
} from "./types";

export function spawnEnemy(
  game: Game,
  kind: EnemyKind,
  x: number,
  y: number,
): Enemy | null {
  if (game.enemies.length >= 45) return null;
  const hp =
    (kind === "armored" ? 80 : kind === "sentry" ? 42 : 26) *
    (game.assist ? 0.8 : 1);
  const enemy: Enemy = {
    id: ++game.nextId,
    kind,
    x,
    y,
    baseY: y,
    originX: x,
    slot: 0,
    telegraph: 0,
    targetX: 86,
    targetY: y,
    burstLeft: 0,
    attackPattern:
      kind === "armored" || kind === "choir"
        ? "fan"
        : kind === "prism"
          ? "cross"
          : kind === "sentry"
            ? "burst"
            : "aimed",
    hp,
    maxHp: hp,
    radius: kind === "armored" ? 15 : 10,
    age: 0,
    fire: 1.2 + random(game) * 1.2,
    phase: random(game) * Math.PI * 2,
    dead: false,
  };
  game.enemies.push(enemy);
  return enemy;
}
export function spawnFormation(
  game: Game,
  kind: EnemyKind,
  formation: Formation,
  lane = 0.5,
  count = 5,
  reward: Pickup["kind"] = "overdrive",
): void {
  if (game.squads.length >= 12) return;
  const id = ++game.nextId;
  const middle = clamp(lane * HEIGHT, 75, 195);
  const wall = [32, 66, 100, 134, 168, 202, 236].filter(
    (y) => Math.abs(y - middle) > 42,
  );
  const total = Math.min(
    count,
    formation === "wall" ? wall.length : 7,
    45 - game.enemies.length,
  );
  let members = 0;
  for (let i = 0; i < total; i++) {
    const offset = i - (total - 1) / 2;
    const x =
      WIDTH +
      22 +
      (formation === "chevron"
        ? Math.abs(offset) * 30
        : formation === "wall"
          ? (i % 2) * 12
          : i * 30);
    const y =
      formation === "wall"
        ? wall[i]
        : formation === "pincer"
          ? i % 2
            ? 228
            : 42
          : formation === "chevron"
            ? middle + offset * 26
            : middle;
    const enemy = spawnEnemy(game, kind, x, y);
    if (!enemy) continue;
    Object.assign(enemy, {
      formation,
      squad: id,
      slot: i,
      phase: 0,
      fire: 2.1 + i * 0.2,
    });
    members++;
  }
  if (!members) return;
  game.squads.push({ id, remaining: members, escaped: false, reward });
  combatNotice(
    game,
    formation.toUpperCase() + " INBOUND",
    "Clear the entire formation for +400 and a power pod",
    2,
  );
}
function spawnEncounter(game: Game, encounter: Encounter): void {
  const y = clamp(encounter.lane * HEIGHT, 30, 240);
  const kind = encounter.kind;
  if (kind === "supply") {
    const early = game.sector === 0 && encounter.at <= 3;
    pickup(
      game,
      early ? Math.min(430, game.player.x + 85) : WIDTH - 30,
      early ? game.player.y : y,
      encounter.drop ?? "charge",
    );
    if (early)
      combatNotice(
        game,
        "YOUR FIRST UPGRADE",
        "Fly into the S pod. It unlocks split shot.",
        4,
      );
    return;
  }
  if (kind === "weapon") {
    const weapons = ["split", "rail", "pulse"] as const;
    pickup(game, WIDTH - 20, y, weapons[game.sector % 3]);
    return;
  }
  if (kind === "repair" || kind === "feather") {
    pickup(game, WIDTH - 20, y, kind);
    return;
  }
  if (kind === "corridor") {
    const gap = game.assist ? 145 : 120;
    const center = clamp(y, gap / 2 + 15, HEIGHT - gap / 2 - 15);
    const terrainKind =
      game.sector === 1 ? "glass" : game.sector === 2 ? "gate" : "rock";
    for (let i = 0; i < 3; i++) {
      game.terrain.push({
        id: ++game.nextId,
        x: WIDTH + i * 100,
        y: 0,
        w: 36,
        h: center - gap / 2,
        speed: 38,
        kind: terrainKind,
      });
      game.terrain.push({
        id: ++game.nextId,
        x: WIDTH + i * 100,
        y: center + gap / 2,
        w: 36,
        h: HEIGHT - center - gap / 2,
        speed: 38,
        kind: terrainKind,
      });
    }
    message(game, "Narrow passage", "Follow the open water.", 2.5);
    return;
  }
  if (kind === "current") {
    message(
      game,
      "A current in the stars",
      "The ocean gently bends incoming shots.",
      4,
    );
    spawnEnemy(game, "choir", WIDTH + 20, y);
    return;
  }
  if (encounter.formation) {
    spawnFormation(
      game,
      kind,
      encounter.formation,
      encounter.lane,
      encounter.count,
      encounter.drop ?? "overdrive",
    );
    return;
  }
  for (let i = 0; i < (encounter.count || 1); i++) {
    spawnEnemy(
      game,
      kind,
      WIDTH + 20 + i * 36,
      clamp(y + Math.sin(i * 1.4) * 36, 30, 235),
    );
  }
}
export function enterRoom(game: Game, kind: Room["kind"]): void {
  if (game.room) return;
  game.room = {
    kind,
    tick: 0,
    duration: kind === "salvage" ? 12 : kind === "observatory" ? 10 : 30,
  };
  game.enemies = [];
  game.squads = [];
  game.bullets = [];
  game.terrain = [];
  game.features = [];
  game.player.invincible = 2;
  if (kind === "salvage") {
    discover(game, "window");
    for (let i = 0; i < 9; i++)
      pickup(game, 250 + i * 26, 105 + Math.sin(i) * 40, "salvage");
  } else if (kind === "observatory") {
    discover(game, "blue-dot");
    message(
      game,
      "A little light, like home",
      "Every journey begins somewhere small.",
      10,
    );
  } else {
    message(
      game,
      kind === "glitch" ? "404 / Sector not found" : "An impossible flock",
      kind === "glitch"
        ? "Recover the missing packets. Survive 30 seconds."
        : "There are definitely not supposed to be chickens here.",
      5,
    );
  }
}
export function submitCode(game: Game, code: string): boolean {
  if (game.console === "beacon" && code === "404") {
    game.console = null;
    game.status = "running";
    discover(game, "404");
    enterRoom(game, "glitch");
    return true;
  }
  if (game.console === "relay" && code === "123") {
    game.console = null;
    game.status = "countdown";
    game.countdown = 2;
    game.bossDefeated = false;
    game.boss = createBoss(game, true);
    message(
      game,
      "The relay answers",
      "One last conversation. Keep listening.",
      5,
    );
    return true;
  }
  return false;
}
export function declineRelay(game: Game): void {
  game.console = null;
  finishGame(game, "home");
}
function finishGame(game: Game, ending: Game["ending"]): void {
  game.ending = ending;
  game.status = "victory";
  game.bullets = [];
  game.enemies = [];
  game.squads = [];
  game.features = [];
  game.terrain = [];
  game.events.push({ kind: "complete" });
  sound(game, "clear");
}
export function finishBoss(game: Game): void {
  const boss = game.boss;
  if (!boss || game.bossDefeated) return;
  game.bossDefeated = true;
  game.score += 2000 + game.sector * 500;
  game.bullets = [];
  game.enemies = [];
  game.squads = [];
  game.terrain = [];
  burst(game, boss.x, boss.y, SECTORS[game.sector].color, 50);
  game.shake = 4;
  sound(game, "clear");
  if (game.mode === "practice") {
    game.status = "cleared";
    game.events.push({ kind: "save" });
    return;
  }
  if (game.sector === 4) {
    if (boss.truePhase) {
      discover(game, "signal");
      finishGame(game, "signal");
    } else if (FRAGMENTS.every((id) => game.secrets.includes(id))) {
      game.console = "relay";
      game.status = "console";
      message(
        game,
        "You have heard all three voices",
        "Repeat the relay: triangle, circle, diamond.",
        10,
      );
    } else finishGame(game, "home");
  } else {
    game.status = "cleared";
    if (game.mode === "campaign")
      game.checkpoint = checkpointFor(game, game.sector + 1);
    game.events.push({ kind: "checkpoint" });
  }
}
export function nextSector(game: Game): void {
  if (game.status !== "cleared" || game.sector >= 4 || game.mode === "practice")
    return;
  game.sector++;
  game.random = hashSeed(game.seed + ":" + game.sector);
  game.sectorTick = 0;
  game.encounter = 0;
  game.featureCursor = 0;
  game.boss = null;
  game.bossDefeated = false;
  game.stageStarted = false;
  game.feathers = 0;
  game.trace = [];
  game.pickups = [];
  game.features = [];
  game.terrain = [];
  game.enemies = [];
  game.squads = [];
  game.bullets = [];
  game.player.x = 86;
  game.player.y = 135;
  game.player.hull = Math.min(game.player.maxHull, game.player.hull + 1);
  game.player.invincible = 2;
  game.status = "countdown";
  game.countdown = 2;
}
export function updateDirector(game: Game): void {
  if (game.mode === "challenge" && game.tick >= 180 * 60) {
    finishGame(game, "challenge");
    return;
  }
  if (game.room) {
    const room = game.room;
    room.tick++;
    if (
      (room.kind === "glitch" || room.kind === "cluck") &&
      room.tick % 150 === 0
    ) {
      spawnEnemy(
        game,
        room.kind === "cluck" ? "clucker" : "prism",
        WIDTH + 20,
        40 + random(game) * 190,
      );
      pickup(game, WIDTH, 40 + random(game) * 190, "salvage");
    }
    if (room.tick >= room.duration * 60) {
      if (room.kind === "cluck") discover(game, "cluck");
      game.room = null;
      game.enemies = [];
      game.squads = [];
      game.bullets = [];
      game.pickups = [];
      game.player.invincible = 2;
      message(game, "Main signal restored", "The journey continues.", 3);
    }
    return;
  }
  const sector = SECTORS[game.sector];
  if (!game.stageStarted) {
    game.stageStarted = true;
    message(game, sector.name, sector.transmission, 5);
    if (game.mode === "campaign") {
      game.checkpoint = checkpointFor(game, game.sector);
      game.events.push({ kind: "checkpoint" });
    }
    if (game.mode === "practice") {
      announceBoss(game);
      return;
    }
  }
  game.sectorTick++;
  const time = game.sectorTick / 60;
  if (game.mode === "challenge" && game.tick >= 180 * 60) {
    finishGame(game, "challenge");
    return;
  }
  if (game.boss) return;
  if (
    game.mode !== "challenge" &&
    game.ghost?.sector === game.sector &&
    game.sectorTick === 300
  ) {
    game.features.push({
      id: ++game.nextId,
      kind: "ghost",
      x: 370,
      y: 180,
      age: 0,
      progress: 0,
    });
  }
  while (
    game.encounter < sector.encounters.length &&
    time >= sector.encounters[game.encounter].at
  ) {
    spawnEncounter(game, sector.encounters[game.encounter++]);
  }
  while (
    game.featureCursor < sector.features.length &&
    time >= sector.features[game.featureCursor].at
  ) {
    const feature = sector.features[game.featureCursor++];
    if (game.mode !== "challenge") {
      game.features.push({
        id: ++game.nextId,
        kind: feature.kind,
        x: 420,
        y: feature.y,
        age: 0,
        progress: 0,
      });
    }
  }
  if (time >= sector.duration) {
    if (game.mode === "challenge") {
      // A three-minute challenge cycles authored waves without boss or menu interruptions.
      game.sectorTick = 0;
      game.encounter = 0;
      game.featureCursor = sector.features.length;
      game.sector = Math.min(4, game.sector + 1);
    } else announceBoss(game);
  }
}
