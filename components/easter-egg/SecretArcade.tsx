"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Gamepad2,
  Heart,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import styles from "./SecretArcade.module.css";
import { type AudioEngine, createAudioEngine } from "./game/audio";
import {
  GAME_ASSET_COUNT,
  loadGameAssets,
  type GameAssets,
} from "./game/assets";
import { getBossDisplayName } from "./game/bosses";
import {
  POWER_LABELS,
  DIFFICULTY_PRESETS,
  ENEMY_SKIN_NAMES,
  SHIP_SKIN_NAMES,
  WAVES_PER_SECTOR,
  WEAPON_COLORS,
  WEAPON_MAX_LEVEL,
  WEAPON_NAMES,
  getSectorForWave,
  getWaveInSector,
} from "./game/config";
import { createModel } from "./game/model";
import { spawnPowerUp, spawnWeaponPickup } from "./game/powerups";
import { renderGame } from "./game/render";
import { readBestScore, readMuted, writeMuted } from "./game/storage";
import type {
  GameDifficulty,
  EnemySkin,
  GameModel,
  GameStatus,
  HudState,
  ShipSkin,
  WeaponType,
} from "./game/types";
import { activateSuper, getActiveBoss, getMultiplier, getRank, updateGame } from "./game/update";
import { clamp, formatNumber } from "./game/utils";

type GameStatus = "ended" | "paused" | "ready" | "running";
type WeaponType = "laser" | "missile" | "pulse" | "spread";
type PowerKind =
  | "health"
  | "invincible"
  | "laser"
  | "magnet"
  | "missile"
  | "rapid"
  | "shield"
  | "spread";
type EnemyKind =
  | "armored"
  | "boss"
  | "grunt"
  | "miniBoss"
  | "popcorn"
  | "shooter"
  | "ufo"
  | "wingCannon";
type BulletKind = "egg" | "feather" | "laser" | "meteor" | "missile" | "pulse";
type SfxKind = "boss" | "damage" | "explode" | "pickup" | "shoot";

type HudState = {
  best: number;
  bossHp: number;
  bossMaxHp: number;
  combo: number;
  lives: number;
  multiplier: number;
  powerLine: string;
  score: number;
  status: GameStatus;
  wave: number;
  weapon: WeaponType;
  weaponLevel: number;
};

type Player = {
  fireCooldown: number;
  invincibleTimer: number;
  magnetTimer: number;
  r: number;
  rapidTimer: number;
  shieldTimer: number;
  vx: number;
  vy: number;
  weapon: WeaponType;
  weaponLevel: number;
  weaponTimer: number;
  x: number;
  y: number;
};

type Enemy = {
  age: number;
  baseX: number;
  dead?: boolean;
  fireCooldown: number;
  homeY: number;
  hp: number;
  id: number;
  kind: EnemyKind;
  maxHp: number;
  phase: number;
  r: number;
  score: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type Bullet = {
  age: number;
  damage: number;
  dead?: boolean;
  id: number;
  kind: BulletKind;
  pierce: number;
  r: number;
  source: "enemy" | "player";
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type PowerUp = {
  age: number;
  kind: PowerKind;
  r: number;
  spin: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type Particle = {
  age: number;
  color: string;
  life: number;
  r: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

type FloatText = {
  age: number;
  color: string;
  life: number;
  text: string;
  x: number;
  y: number;
};

type PointerState = {
  active: boolean;
  x: number;
  y: number;
};

type GameModel = {
  best: number;
  bullets: Bullet[];
  combo: number;
  comboTimer: number;
  dpr: number;
  dropsSincePowerup: number;
  elapsed: number;
  enemies: Enemy[];
  floats: FloatText[];
  height: number;
  lives: number;
  particles: Particle[];
  player: Player;
  pointer: PointerState;
  powerups: PowerUp[];
  score: number;
  sfxQueue: SfxKind[];
  shake: number;
  status: GameStatus;
  wave: number;
  waveBanner: string;
  waveBannerTimer: number;
  waveCooldown: number;
  width: number;
};

type AssetKey =
  | "cluckerAtlas"
  | "cluckerBackground"
  | "cockpitBackdrop"
  | "spaceAtlas"
  | "speedRing"
  | "starfield";
type GameAssets = Partial<Record<AssetKey, HTMLImageElement>>;
type SpriteCell = { column: number; row: number };
type SpaceSpriteKey =
  | "boostPickup"
  | "courierShip"
  | "engineFlame"
  | "privateBadge"
  | "radarPing"
  | "rareShard"
  | "shieldPickup"
  | "sparkBurst";
type CluckerSpriteKey =
  | "armored"
  | "boss"
  | "egg"
  | "explosion"
  | "feather"
  | "grunt"
  | "health"
  | "laser"
  | "meteor"
  | "miniBoss"
  | "missileCrate"
  | "popcorn"
  | "shield"
  | "shooter"
  | "ufo"
  | "wingCannon";

const STORAGE_KEY = "portfolio-cluckstorm-high-score";
const ASSET_SOURCES: Record<AssetKey, string> = {
  cluckerAtlas: "/easter-egg/generated/clucker-atlas.png",
  cluckerBackground: "/easter-egg/generated/clucker-space-bg.webp",
  cockpitBackdrop: "/easter-egg/generated/cockpit-backdrop.webp",
  spaceAtlas: "/easter-egg/generated/space-opera-atlas.png",
  speedRing: "/easter-egg/fx/speed-ring.svg",
  starfield: "/easter-egg/textures/starfield-tile.svg",
};
const ATLAS_GRID = 4;
// Reason: courier-ship.png is authored nose-toward-bottom-left (~135°).
// Vertical shmup fire/thrust assume nose-up, so rotate the cell 135° CW.
const COURIER_SHIP_FACING_OFFSET = (3 * Math.PI) / 4;
const SPACE_SPRITES: Record<SpaceSpriteKey, SpriteCell> = {
  boostPickup: { column: 3, row: 1 },
  courierShip: { column: 0, row: 0 },
  engineFlame: { column: 1, row: 3 },
  privateBadge: { column: 2, row: 3 },
  radarPing: { column: 3, row: 2 },
  rareShard: { column: 3, row: 0 },
  shieldPickup: { column: 2, row: 1 },
  sparkBurst: { column: 0, row: 3 },
};
const CLUCKER_SPRITES: Record<CluckerSpriteKey, SpriteCell> = {
  armored: { column: 2, row: 0 },
  boss: { column: 1, row: 3 },
  egg: { column: 1, row: 1 },
  explosion: { column: 3, row: 3 },
  feather: { column: 2, row: 1 },
  grunt: { column: 0, row: 0 },
  health: { column: 1, row: 2 },
  laser: { column: 3, row: 2 },
  meteor: { column: 3, row: 1 },
  miniBoss: { column: 0, row: 3 },
  missileCrate: { column: 2, row: 2 },
  popcorn: { column: 0, row: 1 },
  shield: { column: 0, row: 2 },
  shooter: { column: 1, row: 0 },
  ufo: { column: 3, row: 0 },
  wingCannon: { column: 2, row: 3 },
};
const POWER_LABELS: Record<PowerKind, string> = {
  health: "Health",
  invincible: "Invincible",
  laser: "Laser",
  magnet: "Magnet",
  missile: "Missiles",
  rapid: "Rapid",
  shield: "Shield",
  spread: "Spread",
};
const SECRET_WORDS = ["cluck", "shipit", "arcade", "soam", "build"];
const KONAMI = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "KeyB",
  "KeyA",
];

const MOVE_KEYS = [
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "KeyA",
  "KeyD",
  "KeyS",
  "KeyW",
  "Space",
];

const DEBUG_WEAPON_KEYS: Record<string, WeaponType> = {
  Digit1: "pulse",
  Digit2: "rapid",
  Digit3: "spread",
  Digit4: "laser",
  Digit5: "missile",
  Digit6: "bomb",
};

function computeHud(model: GameModel): HudState {
  const boss = getActiveBoss(model);
  const bossPhaseMax = boss?.kind === "boss" ? 3 : boss?.kind === "miniBoss" ? 2 : 0;
  const bossPhase = boss
    ? boss.kind === "miniBoss"
      ? boss.hp < boss.maxHp * 0.4
        ? 2
        : 1
      : boss.bossPhase || 1
    : 0;

  return {
    banner: model.banner,
    best: Math.round(model.best),
    bossHp: boss ? Math.max(0, boss.hp) : 0,
    bossMaxHp: boss?.maxHp || 0,
    bossName: boss ? getBossDisplayName(boss) : "",
    bossPhase,
    bossPhaseMax,
    combo: model.combo,
    comboPulseId: model.comboPulseId,
    droneCount: model.player.drones.length,
    enemySkin: model.enemySkin,
    difficulty: model.difficulty,
    hull: model.player.hull,
    hullMax: model.player.hullMax,
    invincibleTimer: model.player.powerInvincibleTimer,
    lives: model.player.lives,
    magnetTimer: model.player.magnetTimer,
    multiplier: getMultiplier(model),
    rank: getRank(model.score),
    score: Math.round(model.score),
    sector: model.sector,
    shipSkin: model.shipSkin,
    shieldHp: model.player.shieldHp,
    shieldMax: model.player.shieldMax,
    status: model.status,
    timewarpTimer: model.timewarpTimer,
    super: model.player.super,
    superReady: model.player.super >= 100,
    wave: model.wave,
    waveInSector: getWaveInSector(model.wave),
    wavesPerSector: WAVES_PER_SECTOR,
    weapon: model.player.weapon,
    weaponLevel: model.player.weaponLevel,
  };
}

function createModel(width: number, height: number, best: number): GameModel {
  return {
    best,
    bullets: [],
    combo: 0,
    comboTimer: 0,
    dpr: 1,
    dropsSincePowerup: 0,
    elapsed: 0,
    enemies: [],
    floats: [],
    height,
    lives: 3,
    particles: [],
    player: createPlayer(width, height),
    pointer: { active: false, x: width / 2, y: height - 76 },
    powerups: [],
    score: 0,
    sfxQueue: [],
    shake: 0,
    status: "ready",
    wave: 0,
    waveBanner: "Private coop unlocked",
    waveBannerTimer: 0,
    waveCooldown: 0.55,
    width,
  };
}

function addFloat(
  model: GameModel,
  text: string,
  x: number,
  y: number,
  color = "#fff0c5",
) {
  model.floats.push({ age: 0, color, life: 1, text, x, y });
}

function createParticles(
  model: GameModel,
  x: number,
  y: number,
  color: string,
  count: number,
  speedMin = 70,
  speedMax = 360,
) {
  for (let index = 0; index < count; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(speedMin, speedMax);
    model.particles.push({
      age: 0,
      color,
      life: randomBetween(0.34, 0.95),
      r: randomBetween(1.4, 4.8),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x,
      y,
    });
  }
}

function getMultiplier(model: GameModel) {
  return clamp(1 + Math.floor(model.combo / 8) * 0.5, 1, 5);
}

function getEnemyStats(kind: EnemyKind, wave: number) {
  const scale = 1 + wave * 0.11;
  switch (kind) {
    case "shooter":
      return { hp: 3.2 * scale, r: 25, score: 180 };
    case "armored":
      return { hp: 5.2 * scale, r: 29, score: 260 };
    case "ufo":
      return { hp: 4.2 * scale, r: 27, score: 230 };
    case "popcorn":
      return { hp: 3.8 * scale, r: 27, score: 210 };
    case "miniBoss":
      return { hp: 86 + wave * 22, r: 48, score: 2400 + wave * 120 };
    case "boss":
      return { hp: 260 + wave * 54, r: 70, score: 6000 + wave * 220 };
    case "wingCannon":
      return { hp: 78 + wave * 16, r: 38, score: 1400 + wave * 80 };
    default:
      return { hp: 2.2 * scale, r: 22, score: 130 };
  }
}

function createEnemy(
  model: GameModel,
  kind: EnemyKind,
  x: number,
  y: number,
  homeY: number,
  phase = 0,
): Enemy {
  const stats = getEnemyStats(kind, model.wave);
  return {
    age: 0,
    baseX: x,
    fireCooldown: randomBetween(0.8, 2.8),
    homeY,
    hp: stats.hp,
    id: nextId(),
    kind,
    maxHp: stats.hp,
    phase,
    r: stats.r,
    score: stats.score,
    vx: randomBetween(0.75, 1.35),
    vy: randomBetween(16, 42),
    x,
    y,
  };
}

function chooseEnemyKind(wave: number, row: number, column: number): EnemyKind {
  if ((row + column + wave) % 9 === 0) return "popcorn";
  if (wave >= 5 && (row * 2 + column) % 7 === 0) return "armored";
  if (wave >= 3 && (row + column) % 4 === 0) return "ufo";
  if (wave >= 2 && column % 3 === 1) return "shooter";
  return "grunt";
}

function spawnNextWave(model: GameModel) {
  model.wave += 1;
  const wave = model.wave;

  if (wave % 10 === 0) {
    model.waveBanner = `Wave ${wave}: motherclucker protocol`;
    model.waveBannerTimer = 2.5;
    model.sfxQueue.push("boss");
    model.enemies.push(
      createEnemy(model, "boss", model.width / 2, -120, 118, 0),
      createEnemy(model, "wingCannon", model.width / 2 - 120, -180, 178, 1.8),
      createEnemy(model, "wingCannon", model.width / 2 + 120, -180, 178, 4.2),
    );
    return;
  }

  if (wave % 5 === 0) {
    model.waveBanner = `Wave ${wave}: mini-rooster ambush`;
    model.waveBannerTimer = 2.1;
    model.enemies.push(
      createEnemy(model, "miniBoss", model.width / 2, -110, 130),
    );
    return;
  }

  model.waveBanner = `Wave ${wave}: cluck squad inbound`;
  model.waveBannerTimer = 1.55;
  const columns = clamp(4 + Math.floor(wave / 2), 4, 8);
  const rows = clamp(2 + Math.floor(wave / 4), 2, 4);
  const spacing = Math.min(80, model.width / (columns + 0.8));
  const startX = (model.width - spacing * (columns - 1)) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const kind = chooseEnemyKind(wave, row, column);
      const x = startX + column * spacing;
      const y = -70 - row * 68;
      const homeY = 74 + row * 54;
      model.enemies.push(createEnemy(model, kind, x, y, homeY, row + column));
    }
  }
}

function addPlayerBullet(
  model: GameModel,
  kind: BulletKind,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  r: number,
  pierce = 0,
) {
  model.bullets.push({
    age: 0,
    damage,
    id: nextId(),
    kind,
    pierce,
    r,
    source: "player",
    vx,
    vy,
    x,
    y,
  });
}

function addEnemyBullet(
  model: GameModel,
  kind: BulletKind,
  x: number,
  y: number,
  angle: number,
  speed: number,
  damage = 1,
  radius = 8,
) {
  model.bullets.push({
    age: 0,
    damage,
    id: nextId(),
    kind,
    pierce: 0,
    r: radius,
    source: "enemy",
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x,
    y,
  });
}

function getFireInterval(player: Player) {
  const levelBonus = (player.weaponLevel - 1) * 0.018;
  const weaponBase =
    player.weapon === "missile"
      ? 0.38
      : player.weapon === "laser"
        ? 0.13
        : player.weapon === "spread"
          ? 0.18
          : 0.16;
  return (
    Math.max(0.055, weaponBase - levelBonus) *
    (player.rapidTimer > 0 ? 0.52 : 1)
  );
}

function firePlayer(model: GameModel) {
  const player = model.player;
  const level = player.weaponLevel;
  const baseDamage = 1 + (level - 1) * 0.28;
  model.sfxQueue.push("shoot");

  if (player.weapon === "spread") {
    const angles =
      level >= 3
        ? [-0.34, -0.17, 0, 0.17, 0.34]
        : level >= 2
          ? [-0.24, 0, 0.24]
          : [-0.16, 0.16];
    angles.forEach((angle) => {
      addPlayerBullet(
        model,
        "pulse",
        player.x,
        player.y - 24,
        Math.sin(angle) * 360,
        -650 * Math.cos(angle),
        baseDamage,
        5,
      );
    });
    return;
  }

  if (player.weapon === "laser") {
    const offsets = level >= 3 ? [-14, 0, 14] : level >= 2 ? [-10, 10] : [0];
    offsets.forEach((offset) => {
      addPlayerBullet(
        model,
        "laser",
        player.x + offset,
        player.y - 26,
        0,
        -820,
        2.1 + level * 0.35,
        5,
        2 + level,
      );
    });
    return;
  }

  if (player.weapon === "missile") {
    const offsets = level >= 2 ? [-13, 13] : [0];
    offsets.forEach((offset) => {
      addPlayerBullet(
        model,
        "missile",
        player.x + offset,
        player.y - 18,
        offset * 5,
        -430,
        3.8 + level * 0.45,
        8,
      );
    });
    if (level >= 3) {
      addPlayerBullet(
        model,
        "pulse",
        player.x,
        player.y - 28,
        0,
        -680,
        baseDamage,
        4,
      );
    }
    return;
  }

  const offsets = level >= 3 ? [-16, 0, 16] : level >= 2 ? [-10, 10] : [0];
  offsets.forEach((offset) => {
    addPlayerBullet(
      model,
      "pulse",
      player.x + offset,
      player.y - 24,
      0,
      -700,
      baseDamage,
      4.5,
    );
  });
}

function fireEnemy(model: GameModel, enemy: Enemy, difficulty: number) {
  const player = model.player;
  const aimedAngle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
  const speed = 160 + difficulty * 34;

  if (enemy.kind === "boss") {
    const count = 9 + Math.min(6, Math.floor(model.wave / 10));
    for (let index = 0; index < count; index += 1) {
      const offset = (index - (count - 1) / 2) * 0.15;
      addEnemyBullet(
        model,
        index % 2 ? "feather" : "egg",
        enemy.x,
        enemy.y + 36,
        Math.PI / 2 + offset,
        speed + 30,
        1,
        8,
      );
    }
    if (Math.random() > 0.45) {
      addEnemyBullet(
        model,
        "meteor",
        enemy.x - 48,
        enemy.y + 42,
        aimedAngle - 0.12,
        speed * 0.82,
        1,
        12,
      );
      addEnemyBullet(
        model,
        "meteor",
        enemy.x + 48,
        enemy.y + 42,
        aimedAngle + 0.12,
        speed * 0.82,
        1,
        12,
      );
    }
    return;
  }

  if (enemy.kind === "miniBoss" || enemy.kind === "wingCannon") {
    [-0.22, 0, 0.22].forEach((offset) => {
      addEnemyBullet(
        model,
        "egg",
        enemy.x,
        enemy.y + enemy.r * 0.5,
        aimedAngle + offset,
        speed + 35,
        1,
        8,
      );
    });
    return;
  }

  if (enemy.kind === "ufo") {
    addEnemyBullet(
      model,
      "feather",
      enemy.x,
      enemy.y + 16,
      aimedAngle - 0.08,
      speed + 20,
      1,
      7,
    );
    addEnemyBullet(
      model,
      "feather",
      enemy.x,
      enemy.y + 16,
      aimedAngle + 0.08,
      speed + 20,
      1,
      7,
    );
    return;
  }

  if (enemy.kind === "armored") {
    addEnemyBullet(
      model,
      "meteor",
      enemy.x,
      enemy.y + 22,
      aimedAngle,
      speed * 0.85,
      1,
      11,
    );
    return;
  }

  addEnemyBullet(model, "egg", enemy.x, enemy.y + 18, aimedAngle, speed, 1, 8);
}

function choosePowerKind(): PowerKind {
  const roll = Math.random();
  if (roll < 0.13) return "rapid";
  if (roll < 0.27) return "spread";
  if (roll < 0.39) return "laser";
  if (roll < 0.51) return "missile";
  if (roll < 0.64) return "shield";
  if (roll < 0.76) return "magnet";
  if (roll < 0.88) return "health";
  return "invincible";
}

function spawnPowerUp(
  model: GameModel,
  x: number,
  y: number,
  forcedKind?: PowerKind,
) {
  model.powerups.push({
    age: 0,
    kind: forcedKind || choosePowerKind(),
    r: 16,
    spin: randomBetween(-1.3, 1.3),
    vx: randomBetween(-22, 22),
    vy: randomBetween(72, 112),
    x,
    y,
  });
}

function maybeDropPowerUp(model: GameModel, enemy: Enemy) {
  model.dropsSincePowerup += 1;
  const bossDrop = enemy.kind === "boss" || enemy.kind === "miniBoss";
  const guaranteed = model.dropsSincePowerup >= 8;
  const chance = bossDrop
    ? 1
    : enemy.kind === "armored" || enemy.kind === "ufo"
      ? 0.24
      : 0.15;

  if (guaranteed || Math.random() < chance) {
    model.dropsSincePowerup = 0;
    if (bossDrop) {
      spawnPowerUp(model, enemy.x - 42, enemy.y, "health");
      spawnPowerUp(model, enemy.x + 42, enemy.y, choosePowerKind());
      return;
    }
    spawnPowerUp(model, enemy.x, enemy.y);
  }
}

function applyPowerUp(model: GameModel, power: PowerUp) {
  const player = model.player;
  model.sfxQueue.push("pickup");
  addFloat(model, POWER_LABELS[power.kind], power.x, power.y, "#fff0c5");

  switch (power.kind) {
    case "rapid":
      player.rapidTimer = Math.max(player.rapidTimer, 9);
      break;
    case "spread":
    case "laser":
    case "missile":
      player.weaponLevel =
        player.weapon === power.kind ? clamp(player.weaponLevel + 1, 1, 4) : 1;
      player.weapon = power.kind;
      player.weaponTimer = 16;
      break;
    case "shield":
      player.shieldTimer = Math.max(player.shieldTimer, 12);
      break;
    case "magnet":
      player.magnetTimer = Math.max(player.magnetTimer, 10);
      break;
    case "health":
      model.lives = clamp(model.lives + 1, 0, 5);
      break;
    case "invincible":
      player.invincibleTimer = Math.max(player.invincibleTimer, 5.5);
      break;
  }
}

function destroyEnemy(model: GameModel, enemy: Enemy) {
  if (enemy.dead) return;
  enemy.dead = true;
  const multiplier = getMultiplier(model);
  const reward = Math.round(enemy.score * multiplier);

  model.score += reward;
  model.combo += enemy.kind === "boss" ? 12 : enemy.kind === "miniBoss" ? 7 : 1;
  model.comboTimer = 3.1;
  model.shake = Math.max(
    model.shake,
    enemy.kind === "boss" ? 18 : enemy.kind === "miniBoss" ? 12 : 4,
  );
  model.sfxQueue.push("explode");
  createParticles(
    model,
    enemy.x,
    enemy.y,
    enemy.kind === "boss" || enemy.kind === "miniBoss" ? "#ffb23f" : "#fff0c5",
    enemy.kind === "boss" ? 74 : enemy.kind === "miniBoss" ? 46 : 20,
  );
  addFloat(model, `+${reward}`, enemy.x, enemy.y - enemy.r * 0.4);
  maybeDropPowerUp(model, enemy);
}

function damagePlayer(model: GameModel, x: number, y: number) {
  const player = model.player;
  if (player.invincibleTimer > 0) {
    createParticles(model, x, y, "#8df6ff", 10, 40, 180);
    return;
  }
  if (player.shieldTimer > 0) {
    player.shieldTimer = Math.max(0, player.shieldTimer - 2.8);
    createParticles(model, x, y, "#65eaff", 18, 80, 260);
    model.shake = Math.max(model.shake, 5);
    return;
  }

  model.lives -= 1;
  model.combo = 0;
  model.comboTimer = 0;
  player.invincibleTimer = 2.2;
  model.shake = Math.max(model.shake, 16);
  model.sfxQueue.push("damage");
  createParticles(model, player.x, player.y, "#ff486f", 36, 90, 420);

  if (model.lives <= 0) {
    model.status = "ended";
    model.best = Math.max(model.best, model.score);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, String(Math.round(model.best)));
    }
  }
}

function nearestEnemy(model: GameModel, x: number, y: number) {
  let bestEnemy: Enemy | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  model.enemies.forEach((enemy) => {
    if (enemy.dead) return;
    const dist = distanceSquared(x, y, enemy.x, enemy.y);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestEnemy = enemy;
    }
  });
  return bestEnemy;
}

function updatePlayer(model: GameModel, keys: Set<string>, dt: number) {
  const player = model.player;
  let dx = 0;
  let dy = 0;

  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

  const acceleration = 1500;
  const maxSpeed = 430;

  if (dx || dy) {
    const length = Math.hypot(dx, dy) || 1;
    player.vx += (dx / length) * acceleration * dt;
    player.vy += (dy / length) * acceleration * dt;
  } else if (model.pointer.active) {
    const toX = model.pointer.x - player.x;
    const toY = model.pointer.y - player.y;
    const length = Math.hypot(toX, toY);
    if (length > 4) {
      player.vx += (toX / length) * acceleration * 0.95 * dt;
      player.vy += (toY / length) * acceleration * 0.95 * dt;
    }
  }

  const speed = Math.hypot(player.vx, player.vy);
  if (speed > maxSpeed) {
    player.vx = (player.vx / speed) * maxSpeed;
    player.vy = (player.vy / speed) * maxSpeed;
  }

  const drag = Math.pow(0.035, dt);
  player.vx *= drag;
  player.vy *= drag;
  player.x = clamp(player.x + player.vx * dt, 24, model.width - 24);
  player.y = clamp(
    player.y + player.vy * dt,
    model.height * 0.42,
    model.height - 34,
  );
}

function updateTimers(model: GameModel, dt: number) {
  const player = model.player;
  model.elapsed += dt;
  model.shake = Math.max(0, model.shake - dt * 20);
  model.comboTimer = Math.max(0, model.comboTimer - dt);
  model.waveBannerTimer = Math.max(0, model.waveBannerTimer - dt);
  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
  player.magnetTimer = Math.max(0, player.magnetTimer - dt);
  player.rapidTimer = Math.max(0, player.rapidTimer - dt);
  player.shieldTimer = Math.max(0, player.shieldTimer - dt);
  player.weaponTimer = Math.max(0, player.weaponTimer - dt);

  if (model.comboTimer <= 0) {
    model.combo = 0;
  }

  if (player.weapon !== "pulse" && player.weaponTimer <= 0) {
    player.weapon = "pulse";
    player.weaponLevel = 1;
  }
}

function updateEnemies(model: GameModel, dt: number, difficulty: number) {
  model.enemies.forEach((enemy) => {
    enemy.age += dt;

    if (enemy.kind === "boss") {
      enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.1);
      enemy.x = clamp(
        enemy.baseX +
          Math.sin(model.elapsed * 0.78 + enemy.phase) * model.width * 0.22,
        enemy.r + 18,
        model.width - enemy.r - 18,
      );
    } else if (enemy.kind === "wingCannon") {
      enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.25);
      enemy.x = clamp(
        enemy.baseX + Math.sin(model.elapsed * 1.08 + enemy.phase) * 52,
        enemy.r + 8,
        model.width - enemy.r - 8,
      );
    } else if (enemy.kind === "miniBoss") {
      enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.25);
      enemy.x = clamp(
        enemy.baseX +
          Math.sin(model.elapsed * 1.15 + enemy.phase) * model.width * 0.28,
        enemy.r + 12,
        model.width - enemy.r - 12,
      );
    } else {
      const descend = Math.min(
        enemy.homeY + Math.max(0, enemy.age - 5) * (7 + difficulty * 2),
        model.height * 0.52,
      );
      enemy.y += (descend - enemy.y) * Math.min(1, dt * 1.7);
      enemy.x = clamp(
        enemy.baseX +
          Math.sin(model.elapsed * enemy.vx + enemy.phase) * enemy.vy,
        enemy.r + 8,
        model.width - enemy.r - 8,
      );
    }

    enemy.fireCooldown -= dt;
    const canShoot =
      enemy.y > -10 &&
      enemy.kind !== "popcorn" &&
      (enemy.kind !== "grunt" || model.wave > 2);

    if (canShoot && enemy.fireCooldown <= 0) {
      fireEnemy(model, enemy, difficulty);
      const base =
        enemy.kind === "boss"
          ? 0.62
          : enemy.kind === "miniBoss" || enemy.kind === "wingCannon"
            ? 1.05
            : enemy.kind === "shooter" || enemy.kind === "ufo"
              ? 1.25
              : 2.2;
      enemy.fireCooldown =
        randomBetween(base, base + 0.85) / clamp(difficulty * 0.45, 0.8, 2.2);
    }
  });
}

function updateBullets(model: GameModel, dt: number) {
  model.bullets.forEach((bullet) => {
    bullet.age += dt;

    if (bullet.source === "player" && bullet.kind === "missile") {
      const target = nearestEnemy(model, bullet.x, bullet.y);
      if (target) {
        const targetAngle = Math.atan2(
          target.y - bullet.y,
          target.x - bullet.x,
        );
        const currentSpeed = Math.max(340, Math.hypot(bullet.vx, bullet.vy));
        bullet.vx += Math.cos(targetAngle) * 540 * dt;
        bullet.vy += Math.sin(targetAngle) * 540 * dt;
        const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
        bullet.vx = (bullet.vx / speed) * currentSpeed;
        bullet.vy = (bullet.vy / speed) * currentSpeed;
      }
    }

    bullet.x += bullet.vx * dt;
    bullet.y += bullet.vy * dt;

    if (
      bullet.y < -70 ||
      bullet.y > model.height + 90 ||
      bullet.x < -90 ||
      bullet.x > model.width + 90 ||
      bullet.age > 5
    ) {
      bullet.dead = true;
    }
  });
}

function updateParticles(model: GameModel, dt: number) {
  model.particles.forEach((particle) => {
    particle.age += dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.vx *= Math.pow(0.18, dt);
    particle.vy *= Math.pow(0.18, dt);
  });
  model.floats.forEach((float) => {
    float.age += dt;
    float.y -= 38 * dt;
  });
  model.particles = model.particles.filter(
    (particle) => particle.age < particle.life,
  );
  model.floats = model.floats.filter((float) => float.age < float.life);
}

function updatePowerUps(model: GameModel, dt: number) {
  const player = model.player;
  model.powerups.forEach((power) => {
    power.age += dt;

    if (player.magnetTimer > 0) {
      const toX = player.x - power.x;
      const toY = player.y - power.y;
      const distance = Math.hypot(toX, toY) || 1;
      if (distance < 260) {
        power.vx += (toX / distance) * 760 * dt;
        power.vy += (toY / distance) * 760 * dt;
      }
    }

    power.x += power.vx * dt;
    power.y += power.vy * dt;
    power.vx *= Math.pow(0.24, dt);

    const hit =
      distanceSquared(player.x, player.y, power.x, power.y) <
      (player.r + power.r + (player.magnetTimer > 0 ? 6 : 0)) ** 2;
    if (hit) {
      applyPowerUp(model, power);
      power.y = model.height + 100;
      createParticles(model, power.x, power.y, "#fff0c5", 18, 50, 240);
    }
  });
  model.powerups = model.powerups.filter(
    (power) => power.y < model.height + 60,
  );
}

function explodeMissile(model: GameModel, bullet: Bullet) {
  createParticles(model, bullet.x, bullet.y, "#ffb23f", 26, 70, 320);
  model.shake = Math.max(model.shake, 5);
  model.enemies.forEach((enemy) => {
    if (enemy.dead) return;
    const radius = enemy.kind === "boss" ? enemy.r * 0.82 : enemy.r;
    if (
      distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <
      (radius + 56) ** 2
    ) {
      enemy.hp -= bullet.damage * 0.82;
      if (enemy.hp <= 0) destroyEnemy(model, enemy);
    }
  });
}

function resolveCollisions(model: GameModel) {
  const player = model.player;

  model.bullets.forEach((bullet) => {
    if (bullet.dead) return;

    if (bullet.source === "player") {
      for (const enemy of model.enemies) {
        if (enemy.dead) continue;
        const enemyRadius =
          enemy.kind === "boss"
            ? enemy.r * 0.72
            : enemy.kind === "miniBoss" || enemy.kind === "wingCannon"
              ? enemy.r * 0.78
              : enemy.r * 0.68;
        const hit =
          distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) <
          (bullet.r + enemyRadius) ** 2;
        if (!hit) continue;

        enemy.hp -= bullet.damage;
        createParticles(
          model,
          bullet.x,
          bullet.y,
          bullet.kind === "laser" ? "#8df6ff" : "#fff0c5",
          5,
          30,
          150,
        );

        if (bullet.kind === "missile") {
          explodeMissile(model, bullet);
          bullet.dead = true;
        } else if (bullet.pierce > 0) {
          bullet.pierce -= 1;
        } else {
          bullet.dead = true;
        }

        if (enemy.hp <= 0) {
          destroyEnemy(model, enemy);
        }

        if (bullet.dead) break;
      }
      return;
    }

    const hit =
      distanceSquared(player.x, player.y, bullet.x, bullet.y) <
      (player.r + bullet.r * 0.78) ** 2;
    if (hit) {
      bullet.dead = true;
      damagePlayer(model, bullet.x, bullet.y);
    }
  });

  model.enemies.forEach((enemy) => {
    if (enemy.dead || enemy.y < -enemy.r) return;
    const hit =
      distanceSquared(player.x, player.y, enemy.x, enemy.y) <
      (player.r + enemy.r * 0.5) ** 2;
    if (hit) {
      damagePlayer(model, enemy.x, enemy.y);
      if (
        enemy.kind !== "boss" &&
        enemy.kind !== "miniBoss" &&
        enemy.kind !== "wingCannon"
      ) {
        destroyEnemy(model, enemy);
      }
    }
  });

  model.bullets = model.bullets.filter((bullet) => !bullet.dead);
  model.enemies = model.enemies.filter((enemy) => !enemy.dead);
}

function updateGame(model: GameModel, keys: Set<string>, dt: number) {
  if (model.status !== "running") return;

  updateTimers(model, dt);
  const difficulty = 1 + model.wave * 0.08 + model.elapsed * 0.006;

  if (model.enemies.length === 0) {
    model.waveCooldown -= dt;
    if (model.waveCooldown <= 0) {
      spawnNextWave(model);
      model.waveCooldown = 1.25;
    }
  }

  updatePlayer(model, keys, dt);

  if (model.player.fireCooldown <= 0) {
    firePlayer(model);
    model.player.fireCooldown = getFireInterval(model.player);
  }

  updateEnemies(model, dt, difficulty);
  updateBullets(model, dt);
  updatePowerUps(model, dt);
  resolveCollisions(model);
  updateParticles(model, dt);
}

function getBoss(model: GameModel) {
  return model.enemies.find(
    (enemy) => enemy.kind === "boss" || enemy.kind === "miniBoss",
  );
}

function powerLine(player: Player) {
  const powers = [
    player.rapidTimer > 0 ? `Rapid ${Math.ceil(player.rapidTimer)}` : "",
    player.shieldTimer > 0 ? `Shield ${Math.ceil(player.shieldTimer)}` : "",
    player.magnetTimer > 0 ? `Magnet ${Math.ceil(player.magnetTimer)}` : "",
    player.invincibleTimer > 0
      ? `Invincible ${Math.ceil(player.invincibleTimer)}`
      : "",
  ].filter(Boolean);
  return powers.length ? powers.join("  /  ") : "Collect crates for chaos";
}

function formatNumber(value: number) {
  return Math.round(value).toLocaleString("en-US");
}

function drawBackground(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
) {
  const { width, height } = model;
  context.fillStyle = "#050315";
  context.fillRect(0, 0, width, height);

  const background = assets.cluckerBackground;
  if (imageReady(background)) {
    const scale = Math.max(
      width / background.naturalWidth,
      height / background.naturalHeight,
    );
    const drawWidth = background.naturalWidth * scale;
    const drawHeight = background.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const scroll = (model.elapsed * 52) % drawHeight;

    for (
      let y = scroll - drawHeight;
      y < height + drawHeight;
      y += drawHeight
    ) {
      context.drawImage(background, x, y, drawWidth, drawHeight);
    }

    context.fillStyle = "rgba(2, 1, 12, 0.18)";
    context.fillRect(0, 0, width, height);
  } else {
    const gradient = context.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#120735");
    gradient.addColorStop(0.5, "#030312");
    gradient.addColorStop(1, "#160622");
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }

  const tile = assets.starfield;
  if (imageReady(tile)) {
    const tileSize = 128;
    const offset = (model.elapsed * 38) % tileSize;
    context.save();
    context.globalAlpha = 0.32;
    for (let x = -tileSize; x < width + tileSize; x += tileSize) {
      for (let y = -tileSize + offset; y < height + tileSize; y += tileSize) {
        context.drawImage(tile, x, y, tileSize, tileSize);
      }
    }
    context.restore();
  }
}

function drawPowerUp(
  context: CanvasRenderingContext2D,
  power: PowerUp,
  model: GameModel,
  assets: GameAssets,
) {
  const size = power.r * (3.6 + Math.sin(model.elapsed * 5 + power.age) * 0.12);
  const rotation = power.age * power.spin;

  if (power.kind === "shield") {
    if (
      drawAtlasSprite(
        context,
        assets.cluckerAtlas,
        CLUCKER_SPRITES,
        "shield",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "health") {
    if (
      drawAtlasSprite(
        context,
        assets.cluckerAtlas,
        CLUCKER_SPRITES,
        "health",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "missile") {
    if (
      drawAtlasSprite(
        context,
        assets.cluckerAtlas,
        CLUCKER_SPRITES,
        "missileCrate",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "laser") {
    if (
      drawAtlasSprite(
        context,
        assets.cluckerAtlas,
        CLUCKER_SPRITES,
        "laser",
        power.x,
        power.y,
        size * 1.2,
        size * 0.8,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "rapid") {
    if (
      drawAtlasSprite(
        context,
        assets.spaceAtlas,
        SPACE_SPRITES,
        "boostPickup",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "magnet") {
    if (
      drawAtlasSprite(
        context,
        assets.spaceAtlas,
        SPACE_SPRITES,
        "radarPing",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }
  if (power.kind === "invincible") {
    if (
      drawAtlasSprite(
        context,
        assets.spaceAtlas,
        SPACE_SPRITES,
        "rareShard",
        power.x,
        power.y,
        size,
        size,
        rotation,
      )
    )
      return;
  }

  context.save();
  context.translate(power.x, power.y);
  context.rotate(rotation);
  context.fillStyle = "#fff0c5";
  context.strokeStyle = "#ff6bdb";
  context.lineWidth = 2;
  context.beginPath();
  context.arc(0, 0, power.r, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.restore();
}

function enemySprite(kind: EnemyKind): CluckerSpriteKey {
  if (kind === "boss") return "boss";
  if (kind === "miniBoss") return "miniBoss";
  if (kind === "wingCannon") return "wingCannon";
  return kind;
}

function drawEnemy(
  context: CanvasRenderingContext2D,
  enemy: Enemy,
  model: GameModel,
  assets: GameAssets,
) {
  const pulse = 1 + Math.sin(model.elapsed * 5 + enemy.phase) * 0.035;
  const width =
    enemy.kind === "boss"
      ? enemy.r * 2.75
      : enemy.kind === "miniBoss"
        ? enemy.r * 2.55
        : enemy.kind === "wingCannon"
          ? enemy.r * 2.35
          : enemy.r * 2.15;
  const height = width;
  const rotation =
    enemy.kind === "popcorn"
      ? enemy.age * 0.8
      : Math.sin(enemy.age * 2 + enemy.phase) * 0.07;

  context.save();
  context.shadowColor =
    enemy.kind === "boss"
      ? "rgba(255, 73, 191, 0.6)"
      : "rgba(255, 240, 197, 0.24)";
  context.shadowBlur =
    enemy.kind === "boss" || enemy.kind === "miniBoss" ? 26 : 12;
  const drew = drawAtlasSprite(
    context,
    assets.cluckerAtlas,
    CLUCKER_SPRITES,
    enemySprite(enemy.kind),
    enemy.x,
    enemy.y,
    width * pulse,
    height * pulse,
    rotation,
  );
  context.restore();

  if (!drew) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.fillStyle = enemy.kind === "boss" ? "#ff4bbb" : "#fff0c5";
    context.strokeStyle = "#7a39ff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, enemy.r, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  if (
    enemy.kind === "boss" ||
    enemy.kind === "miniBoss" ||
    enemy.kind === "wingCannon"
  ) {
    const barWidth = enemy.r * 1.8;
    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(
      enemy.x - barWidth / 2,
      enemy.y + enemy.r * 0.95,
      barWidth,
      4,
    );
    context.fillStyle = enemy.kind === "boss" ? "#ff4bbb" : "#ffcf4b";
    context.fillRect(
      enemy.x - barWidth / 2,
      enemy.y + enemy.r * 0.95,
      barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1),
      4,
    );
  }
}

function drawBullet(
  context: CanvasRenderingContext2D,
  bullet: Bullet,
  assets: GameAssets,
) {
  const angle = Math.atan2(bullet.vy, bullet.vx) + Math.PI / 2;

  if (bullet.source === "enemy") {
    const sprite =
      bullet.kind === "feather"
        ? "feather"
        : bullet.kind === "meteor"
          ? "meteor"
          : "egg";
    if (
      drawAtlasSprite(
        context,
        assets.cluckerAtlas,
        CLUCKER_SPRITES,
        sprite,
        bullet.x,
        bullet.y,
        bullet.r * (bullet.kind === "meteor" ? 3.7 : 3.1),
        bullet.r * (bullet.kind === "meteor" ? 3.7 : 3.1),
        angle,
      )
    ) {
      return;
    }
  }

  context.save();
  context.translate(bullet.x, bullet.y);
  context.rotate(angle);
  context.shadowBlur = bullet.kind === "laser" ? 16 : 9;
  context.shadowColor = bullet.kind === "laser" ? "#8df6ff" : "#ffd36a";
  context.fillStyle =
    bullet.source === "player"
      ? bullet.kind === "laser"
        ? "#8df6ff"
        : bullet.kind === "missile"
          ? "#ffb23f"
          : "#fff0c5"
      : "#ff6bdb";
  if (bullet.kind === "laser") {
    context.fillRect(-2, -18, 4, 32);
  } else if (bullet.kind === "missile") {
    context.beginPath();
    context.moveTo(0, -12);
    context.lineTo(7, 10);
    context.lineTo(0, 6);
    context.lineTo(-7, 10);
    context.closePath();
    context.fill();
  } else {
    context.beginPath();
    context.arc(0, 0, bullet.r, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawPlayer(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
) {
  const player = model.player;
  const speed = Math.hypot(player.vx, player.vy);
  const wobble = Math.sin(model.elapsed * 12) * 0.035;
  const flicker =
    player.invincibleTimer > 0 && Math.floor(model.elapsed * 18) % 2 === 0;

  if (player.shieldTimer > 0 || player.invincibleTimer > 0) {
    drawAtlasSprite(
      context,
      assets.spaceAtlas,
      SPACE_SPRITES,
      "shieldPickup",
      player.x,
      player.y,
      player.r * (5.2 + Math.sin(model.elapsed * 7) * 0.2),
      player.r * (5.2 + Math.sin(model.elapsed * 7) * 0.2),
      model.elapsed * 0.8,
      player.invincibleTimer > 0 ? 0.58 : 0.36,
    );
  }

  if (speed > 18) {
    drawAtlasSprite(
      context,
      assets.spaceAtlas,
      SPACE_SPRITES,
      "engineFlame",
      player.x,
      player.y + player.r * 1.65,
      player.r * 2.15,
      player.r * 3.25,
      // Reason: engine-flame.png trails bottom-left; +45° aligns exhaust downward.
      Math.PI / 4,
      clamp(speed / 420, 0.25, 0.82),
    );
  }

  const drew = drawAtlasSprite(
    context,
    assets.spaceAtlas,
    SPACE_SPRITES,
    "courierShip",
    player.x,
    player.y,
    player.r * 5.35,
    player.r * 4.75,
    COURIER_SHIP_FACING_OFFSET + wobble,
    flicker ? 0.36 : 1,
  );

  if (!drew) {
    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = "#8df6ff";
    context.beginPath();
    context.moveTo(0, -player.r * 1.4);
    context.lineTo(player.r, player.r);
    context.lineTo(0, player.r * 0.55);
    context.lineTo(-player.r, player.r);
    context.closePath();
    context.fill();
    context.restore();
  }
}

function drawParticles(context: CanvasRenderingContext2D, model: GameModel) {
  model.particles.forEach((particle) => {
    const alpha = clamp(1 - particle.age / particle.life, 0, 1);
    context.globalAlpha = alpha;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(
      particle.x,
      particle.y,
      particle.r * (0.8 + alpha),
      0,
      Math.PI * 2,
    );
    context.fill();
    context.globalAlpha = 1;
  });

  context.font = "700 12px monospace";
  context.textAlign = "center";
  model.floats.forEach((float) => {
    const alpha = clamp(1 - float.age / float.life, 0, 1);
    context.globalAlpha = alpha;
    context.fillStyle = float.color;
    context.fillText(float.text, float.x, float.y);
    context.globalAlpha = 1;
  });
}

function renderGame(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
) {
  context.setTransform(model.dpr, 0, 0, model.dpr, 0, 0);
  context.clearRect(0, 0, model.width, model.height);

  const shakeX = model.shake > 0 ? randomBetween(-model.shake, model.shake) : 0;
  const shakeY = model.shake > 0 ? randomBetween(-model.shake, model.shake) : 0;

  context.save();
  context.translate(shakeX, shakeY);
  drawBackground(context, model, assets);

  model.powerups.forEach((power) => drawPowerUp(context, power, model, assets));
  model.bullets
    .filter((bullet) => bullet.source === "player")
    .forEach((bullet) => drawBullet(context, bullet, assets));
  model.enemies.forEach((enemy) => drawEnemy(context, enemy, model, assets));
  model.bullets
    .filter((bullet) => bullet.source === "enemy")
    .forEach((bullet) => drawBullet(context, bullet, assets));
  drawParticles(context, model);
  drawPlayer(context, model, assets);

  if (model.combo >= 12) {
    drawCenteredImage(
      context,
      assets.speedRing,
      model.player.x,
      model.player.y,
      model.player.r * 5.9,
      model.player.r * 5.9,
      -model.elapsed * 1.8,
      clamp((model.combo - 8) / 22, 0.2, 0.72),
    );
  }

  if (model.waveBannerTimer > 0) {
    context.save();
    context.globalAlpha = clamp(model.waveBannerTimer / 0.5, 0, 1);
    context.fillStyle = "rgba(0, 0, 0, 0.3)";
    context.fillRect(0, model.height * 0.44 - 28, model.width, 56);
    context.fillStyle = "#fff0c5";
    context.font = "900 18px monospace";
    context.textAlign = "center";
    context.fillText(
      model.waveBanner,
      model.width / 2,
      model.height * 0.44 + 6,
    );
    context.restore();
  }

  if (model.status !== "running") {
    context.fillStyle = "rgba(0, 0, 0, 0.26)";
    context.fillRect(0, 0, model.width, model.height);
  }
  context.restore();
}

export default function SecretArcade() {
  const assetsRef = useRef<GameAssets>({});
  const audioRef = useRef<AudioEngine | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const gameRef = useRef<GameModel | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const konamiRef = useRef<string[]>([]);
  const lastFrameRef = useRef(0);
  const lastHudSyncRef = useRef(0);
  const wordBufferRef = useRef("");
  const reducedMotionRef = useRef(false);

  const [assetCount, setAssetCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [unlockFlash, setUnlockFlash] = useState("");
  const [muted, setMuted] = useState(false);
  const [difficulty, setDifficulty] = useState<GameDifficulty>("easy");
  const [enemySkin, setEnemySkin] = useState<EnemySkin>("topdown");
  const [shipSkin, setShipSkin] = useState<ShipSkin>("circuit");
  const [hud, setHud] = useState<HudState>({
    banner: null,
    best: 0,
    bossHp: 0,
    bossMaxHp: 0,
    bossName: "",
    bossPhase: 0,
    bossPhaseMax: 0,
    combo: 0,
    comboPulseId: 0,
    droneCount: 0,
    enemySkin: "topdown",
    difficulty: "easy",
    hull: 100,
    hullMax: 100,
    invincibleTimer: 0,
    lives: 3,
    magnetTimer: 0,
    multiplier: 1,
    rank: "Egg Cadet",
    score: 0,
    sector: 1,
    shipSkin: "circuit",
    shieldHp: 0,
    shieldMax: 60,
    status: "ready",
    timewarpTimer: 0,
    super: 0,
    superReady: false,
    wave: 0,
    waveInSector: 1,
    wavesPerSector: WAVES_PER_SECTOR,
    weapon: "pulse",
    weaponLevel: 1,
  });

  const [comboPulsing, setComboPulsing] = useState(false);
  const comboPulseIdRef = useRef(0);

  const syncHud = useCallback((model: GameModel) => {
    setHud(computeHud(model));
  }, []);

  useEffect(() => {
    if (hud.comboPulseId === comboPulseIdRef.current) return;
    comboPulseIdRef.current = hud.comboPulseId;
    setComboPulsing(true);
    const timeout = window.setTimeout(() => setComboPulsing(false), 420);
    return () => window.clearTimeout(timeout);
  }, [hud.comboPulseId]);

  const sizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const parent = canvas.parentElement;
    const rect = parent?.getBoundingClientRect();
    const width = Math.max(320, Math.floor(rect?.width || window.innerWidth || 900));
    const height = Math.max(420, Math.floor(rect?.height || window.innerHeight || 720));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    if (gameRef.current) {
      const model = gameRef.current;
      model.width = width;
      model.height = height;
      model.dpr = dpr;
      model.player.x = clamp(model.player.x, 24, width - 24);
      model.player.y = clamp(model.player.y, height * 0.42, height - 34);
    }

    return { dpr, height, width };
  }, []);

  const resetGame = useCallback(
    (running = false) => {
      const dimensions = sizeCanvas();
      const model = createModel(
        dimensions?.width || 900,
        dimensions?.height || 720,
        readBestScore(),
        difficulty,
        shipSkin,
        enemySkin,
      );
      model.dpr = dimensions?.dpr || 1;
      model.status = running ? "running" : "ready";
      gameRef.current = model;
      keysRef.current.clear();
      syncHud(model);
    },
    [difficulty, enemySkin, shipSkin, sizeCanvas, syncHud],
  );

  const startGame = useCallback(() => {
    resetGame(true);
  }, [resetGame]);

  const togglePause = useCallback(() => {
    const model = gameRef.current;
    if (!model || model.status === "ready" || model.status === "ended") return;
    model.status = model.status === "paused" ? "running" : "paused";
    keysRef.current.clear();
    syncHud(model);
  }, [syncHud]);

  const trySuper = useCallback(() => {
    const model = gameRef.current;
    if (!model || model.status !== "running") return;
    if (activateSuper(model)) syncHud(model);
  }, [syncHud]);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      audioRef.current?.setMuted(next);
      writeMuted(next);
      return next;
    });
  }, []);

  const openArcade = useCallback((source: string) => {
    setOpen(true);
    setUnlockFlash(source === "konami" ? "Konami coop unlocked" : "Secret coop unlocked");
    window.setTimeout(() => setUnlockFlash(""), 1800);
  }, []);

  const closeArcade = useCallback(() => {
    setOpen(false);
    keysRef.current.clear();
  }, []);

  useEffect(() => {
    setHud((current) => ({ ...current, best: readBestScore() }));
    const initialMuted = readMuted();
    setMuted(initialMuted);
    audioRef.current = createAudioEngine(initialMuted);
    reducedMotionRef.current =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
  }, []);

  useEffect(() => {
    audioRef.current?.setAmbience(open && hud.status === "running");
  }, [hud.status, open]);

  useEffect(() => {
    if (!open || Object.keys(assetsRef.current).length > 0) return;
    let cancelled = false;

    loadGameAssets().then((assets) => {
      if (cancelled) return;
      assetsRef.current = assets;
      setAssetCount(Object.keys(assets).length);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    resetGame(false);

    const handleResize = () => sizeCanvas();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [open, resetGame, sizeCanvas]);

  useEffect(() => {
    if (!open) return;
    const handleVisibility = () => {
      if (document.hidden) {
        const model = gameRef.current;
        if (model && model.status === "running") {
          model.status = "paused";
          syncHud(model);
        }
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [open, syncHud]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (isTextInput) return;

      if (open) {
        if (MOVE_KEYS.includes(event.code)) {
          event.preventDefault();
        }

        if (event.code === "Escape") {
          closeArcade();
          return;
        }
        if (event.code === "KeyP") {
          togglePause();
          return;
        }
        if (event.code === "Space" && hud.status === "running") {
          trySuper();
          return;
        }
        if ((event.code === "Space" || event.code === "Enter") && (hud.status === "ready" || hud.status === "ended")) {
          startGame();
          return;
        }
        if ((event.code === "Space" || event.code === "Enter") && hud.status === "paused") {
          togglePause();
          return;
        }

        const model = gameRef.current;
        if (model && model.status === "running") {
          const debugWeapon = DEBUG_WEAPON_KEYS[event.code];
          if (debugWeapon) {
            spawnWeaponPickup(model, model.player.x, model.player.y - 90, debugWeapon);
          } else if (event.code === "KeyM") {
            spawnPowerUp(model, model.player.x, model.player.y - 90);
          } else if (event.code === "KeyN") {
            model.enemies = [];
            model.waveCooldown = Math.min(model.waveCooldown, 0.05);
          } else if (event.code === "KeyB") {
            const sector = getSectorForWave(model.wave || 1);
            model.wave = sector.id * WAVES_PER_SECTOR - 1;
            model.enemies = [];
            model.waveCooldown = Math.min(model.waveCooldown, 0.05);
          }
        }

        keysRef.current.add(event.code);
        return;
      }

      konamiRef.current = [...konamiRef.current, event.code].slice(-KONAMI.length);
      const hasKonami = KONAMI.every((code, index) => konamiRef.current[index] === code);
      if (hasKonami) {
        openArcade("konami");
        konamiRef.current = [];
        return;
      }

      if (event.key.length === 1) {
        wordBufferRef.current = `${wordBufferRef.current}${event.key.toLowerCase()}`.slice(-16);
        if (SECRET_WORDS.some((word) => wordBufferRef.current.endsWith(word))) {
          openArcade("word");
          wordBufferRef.current = "";
        }
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      keysRef.current.delete(event.code);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [closeArcade, hud.status, open, openArcade, startGame, togglePause, trySuper]);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const renderingContext = context;

    function tick(time: number) {
      const model = gameRef.current;
      if (!model) {
        frameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      const previous = lastFrameRef.current || time;
      const dt = clamp((time - previous) / 1000, 0, 0.033);
      lastFrameRef.current = time;

      updateGame(model, keysRef.current, dt);
      renderGame(renderingContext, model, assetsRef.current, {
        reducedMotion: reducedMotionRef.current,
      });

      if (model.sfxQueue.length) {
        const sounds = model.sfxQueue.splice(0, 4);
        sounds.forEach((kind) => audioRef.current?.play(kind));
      }

      if (time - lastHudSyncRef.current > 80 || model.status !== hud.status) {
        lastHudSyncRef.current = time;
        syncHud(model);
      }

      frameRef.current = window.requestAnimationFrame(tick);
    }

    lastFrameRef.current = 0;
    frameRef.current = window.requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
    };
  }, [hud.status, open, syncHud]);

  const updatePointer = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const model = gameRef.current;
    if (!canvas || !model) return;
    const rect = canvas.getBoundingClientRect();
    model.pointer.x = event.clientX - rect.left;
    model.pointer.y = event.clientY - rect.top;
  }, []);

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLCanvasElement>) => {
      const model = gameRef.current;
      if (!model) return;
      model.pointer.active = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      updatePointer(event);
      if (model.status === "ready" || model.status === "ended") {
        startGame();
      } else if (model.status === "paused") {
        model.status = "running";
        syncHud(model);
      }
    },
    [startGame, syncHud, updatePointer],
  );

  const handlePointerUp = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const model = gameRef.current;
    if (model) model.pointer.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const statusText: Record<GameStatus, string> = {
    ended: "Run archived",
    paused: "Paused",
    ready: "Private coop waiting",
    running: `Sector ${hud.sector} · Wave ${hud.waveInSector}/${hud.wavesPerSector}`,
  };
  const menuTitle =
    hud.status === "ended" ? "The flock got through" : hud.status === "paused" ? "Paused" : "Cluckstorm";
  const menuCopy =
    hud.status === "ended"
      ? `Rank achieved: ${hud.rank}. Restart with your weapon memory fresh — the flock only gets angrier.`
      : hud.status === "paused"
        ? "Catch your breath. The eggs can wait."
        : "A hidden vertical shooter with goofy alien space-birds, six weapons, smart formations, and boss waves across 5 sectors.";

  const weaponPips = Array.from({ length: WEAPON_MAX_LEVEL }, (_, index) => index < hud.weaponLevel);
  const activePowers: string[] = [];
  if (hud.magnetTimer > 0) activePowers.push(`${POWER_LABELS.magnet} ${Math.ceil(hud.magnetTimer)}s`);
  if (hud.invincibleTimer > 0) activePowers.push(`${POWER_LABELS.invincible} ${Math.ceil(hud.invincibleTimer)}s`);
  if (hud.timewarpTimer > 0) activePowers.push(`${POWER_LABELS.timewarp} ${Math.ceil(hud.timewarpTimer)}s`);
  if (hud.droneCount > 0) activePowers.push(`${POWER_LABELS.drone} x${hud.droneCount}`);

  return (
    <>
      <button
        className={styles.secretTrigger}
        type="button"
        aria-label="Open private arcade"
        title="Private arcade"
        onClick={() => openArcade("button")}
      >
        <Gamepad2 size={17} aria-hidden="true" />
      </button>

      {unlockFlash && <div className={styles.flash}>{unlockFlash}</div>}

      {open && (
        <div className={styles.overlay} role="dialog" aria-modal="true">
          <div className={styles.backdrop} aria-hidden="true" />
          <section className={styles.panel} aria-label="Cluckstorm private arcade">
            <canvas
              ref={canvasRef}
              className={styles.canvas}
              onPointerDown={handlePointerDown}
              onPointerMove={updatePointer}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            <header className={styles.hud}>
              <div className={styles.identity}>
                <span className={styles.eyebrow}>Secret arcade / original shooter</span>
                <h2 className={styles.title}>Cluckstorm</h2>
              </div>

              <div className={styles.stats}>
                <div className={styles.stat}>
                  <span>Score</span>
                  <strong>{formatNumber(hud.score)}</strong>
                </div>
                <div className={styles.stat}>
                  <span>Best</span>
                  <strong>{formatNumber(hud.best)}</strong>
                </div>
                <div className={comboPulsing ? `${styles.stat} ${styles.statPulse}` : styles.stat}>
                  <span>Combo</span>
                  <strong>{hud.combo}x</strong>
                </div>
                <div className={styles.stat}>
                  <span>Mult</span>
                  <strong>{hud.multiplier.toFixed(1)}x</strong>
                </div>
              </div>

              <div className={styles.actions}>
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={muted ? "Unmute" : "Mute"}
                  onClick={toggleMuted}
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <button
                  className={styles.iconButton}
                  type="button"
                  aria-label={hud.status === "paused" ? "Resume" : "Pause"}
                  onClick={togglePause}
                >
                  {hud.status === "paused" ? <Play size={17} /> : <Pause size={17} />}
                </button>
                <button className={styles.iconButton} type="button" aria-label="Close arcade" onClick={closeArcade}>
                  <X size={18} />
                </button>
              </div>
            </header>

            <div className={styles.sideHud}>
              <div className={styles.livesPill}>
                <Heart size={11} fill="#ff6bdb" aria-hidden="true" />
                {hud.lives}
              </div>
              <div className={styles.pill}>
                {WEAPON_NAMES[hud.weapon]}
                <span className={styles.pipRow}>
                  {weaponPips.map((filled, index) => (
                    <i
                      key={index}
                      className={filled ? styles.pipOn : styles.pipOff}
                      style={filled ? { background: WEAPON_COLORS[hud.weapon] } : undefined}
                    />
                  ))}
                </span>
              </div>
              <div className={styles.pill}>
                <div className={styles.miniBar} aria-label="Hull integrity">
                  <i style={{ background: "#ff6bdb", width: `${clamp((hud.hull / hud.hullMax) * 100, 0, 100)}%` }} />
                </div>
              </div>
              {hud.shieldHp > 0 && (
                <div className={styles.pill}>
                  <div className={styles.miniBar} aria-label="Shield charge">
                    <i style={{ background: "#65eaff", width: `${clamp((hud.shieldHp / hud.shieldMax) * 100, 0, 100)}%` }} />
                  </div>
                </div>
              )}
              <div className={styles.pill}>{hud.rank}</div>
              <div className={styles.pill}>{DIFFICULTY_PRESETS[hud.difficulty].label}</div>
              <div className={styles.pill}>{SHIP_SKIN_NAMES[hud.shipSkin]}</div>
              <div className={styles.pill}>{ENEMY_SKIN_NAMES[hud.enemySkin]}</div>
              {activePowers.map((label) => (
                <div key={label} className={styles.pillActive}>
                  {label}
                </div>
              ))}
            </div>

            {hud.bossMaxHp > 0 && (
              <div className={styles.bossMeter}>
                <span>
                  {hud.bossName} · Phase {hud.bossPhase}/{hud.bossPhaseMax}
                </span>
                <div>
                  <i style={{ transform: `scaleX(${hud.bossHp / hud.bossMaxHp})` }} />
                </div>
              </div>
            )}

            <div className={styles.superWrap}>
              <button
                type="button"
                className={hud.superReady ? styles.superButtonReady : styles.superButton}
                onClick={trySuper}
                aria-label="Activate Cluckocalypse super ability"
                disabled={hud.status !== "running"}
              >
                <Zap size={18} aria-hidden="true" />
                <span className={styles.superBar}>
                  <i style={{ width: `${clamp(hud.super, 0, 100)}%` }} />
                </span>
              </button>
            </div>

            <footer className={styles.bottomBar}>
              <span>{statusText[hud.status]}</span>
              <span>Move: WASD / arrows / drag · SPACE super · P pause</span>
              <span className={styles.assetChip}>
                <Volume2 size={13} aria-hidden="true" />
                Assets {assetCount}/{GAME_ASSET_COUNT}
              </span>
            </footer>

            {hud.status !== "running" && (
              <div className={styles.menuOverlay}>
                <div className={styles.menuCard}>
                  <span className={styles.eyebrow}>Funny vertical shooter</span>
                  <h3>{menuTitle}</h3>
                  <p>{menuCopy}</p>
                  {hud.status === "ready" && (
                    <p className={styles.controlsHint}>
                      5 sectors, 6 weapons, mini-bosses, and 3 boss types. Grazing bullets and combos charge your
                      Cluckocalypse super.
                    </p>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.difficultyRow} aria-label="Difficulty">
                      {(["easy", "hard"] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            difficulty === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setDifficulty(option)}
                        >
                          {DIFFICULTY_PRESETS[option].label}
                        </button>
                      ))}
                    </div>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.skinRow} aria-label="Ship skin">
                      {(Object.keys(SHIP_SKIN_NAMES) as ShipSkin[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            shipSkin === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setShipSkin(option)}
                        >
                          {SHIP_SKIN_NAMES[option]}
                        </button>
                      ))}
                    </div>
                  )}
                  {hud.status === "ready" && (
                    <div className={styles.difficultyRow} aria-label="Enemy skin">
                      {(Object.keys(ENEMY_SKIN_NAMES) as EnemySkin[]).map((option) => (
                        <button
                          key={option}
                          type="button"
                          className={
                            enemySkin === option
                              ? styles.difficultyButtonActive
                              : styles.difficultyButton
                          }
                          onClick={() => setEnemySkin(option)}
                        >
                          {ENEMY_SKIN_NAMES[option]}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className={styles.actionRow}>
                    <button
                      className={styles.primaryButton}
                      type="button"
                      onClick={hud.status === "paused" ? togglePause : startGame}
                    >
                      <Play size={16} aria-hidden="true" />
                      {hud.status === "ended" ? "Restart" : hud.status === "paused" ? "Resume" : "Start"}
                    </button>
                    {hud.status === "ended" && (
                      <button className={styles.ghostButton} type="button" onClick={() => resetGame(false)}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Reset view
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
