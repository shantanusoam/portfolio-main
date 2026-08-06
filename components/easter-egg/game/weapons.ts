import { WEAPON_MAX_LEVEL } from "./config";
import type { Bullet, BulletKind, GameModel, Player, WeaponType } from "./types";
import { clamp, nextId } from "./utils";

const BASE_INTERVAL: Record<WeaponType, number> = {
  bomb: 0.72,
  laser: 0.12,
  missile: 0.42,
  pulse: 0.16,
  rapid: 0.065,
  spread: 0.2,
};

const INTERVAL_PER_LEVEL: Record<WeaponType, number> = {
  bomb: 0.045,
  laser: 0.008,
  missile: 0.03,
  pulse: 0.012,
  rapid: 0.006,
  spread: 0.013,
};

export function getFireInterval(player: Pick<Player, "weapon" | "weaponLevel">) {
  const base = BASE_INTERVAL[player.weapon];
  const perLevel = INTERVAL_PER_LEVEL[player.weapon];
  return Math.max(0.045, base - perLevel * (player.weaponLevel - 1));
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
): Bullet {
  const bullet: Bullet = {
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
  };
  model.bullets.push(bullet);
  return bullet;
}

/** Upgrades or switches the player's active weapon from a collected crate.
 * Returns "bonus" when the weapon was already at max level (caller awards
 * score / super charge instead of a redundant upgrade), "switch" when a new
 * weapon type was equipped, or "levelUp" otherwise. Pure & unit-testable. */
export function applyWeaponPickup(
  player: Pick<Player, "weapon" | "weaponLevel">,
  weapon: WeaponType,
): "bonus" | "levelUp" | "switch" {
  if (player.weapon !== weapon) {
    player.weapon = weapon;
    player.weaponLevel = 1;
    return "switch";
  }
  if (player.weaponLevel >= WEAPON_MAX_LEVEL) {
    return "bonus";
  }
  player.weaponLevel = clamp(player.weaponLevel + 1, 1, WEAPON_MAX_LEVEL);
  return "levelUp";
}

/** Limited-turn-rate homing steering, shared by missiles and drone bolts.
 * Pure function so it can be unit tested independent of the game loop. */
export function steerTowards(
  vx: number,
  vy: number,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  dt: number,
  turnRateRadPerSec = 6.4,
  speed = 620,
): { vx: number; vy: number } {
  const currentAngle = Math.atan2(vy, vx);
  const desiredAngle = Math.atan2(toY - fromY, toX - fromX);
  let delta = desiredAngle - currentAngle;
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  const maxDelta = turnRateRadPerSec * dt;
  const clampedDelta = clamp(delta, -maxDelta, maxDelta);
  const newAngle = currentAngle + clampedDelta;
  return { vx: Math.cos(newAngle) * speed, vy: Math.sin(newAngle) * speed };
}

function firePulse(model: GameModel, level: number) {
  const player = model.player;
  const damage = 1 + (level - 1) * 0.34;
  player.shotParity += 1;

  if (level >= 5) {
    const side = player.shotParity % 2 === 0 ? -1 : 1;
    addPlayerBullet(model, "pulse", player.x, player.y - 26, 0, -720, damage, 5);
    addPlayerBullet(
      model,
      "pulse",
      player.x + side * 22,
      player.y - 10,
      side * 40,
      -700,
      damage * 0.85,
      4.5,
    );
    return;
  }

  if (level >= 4) {
    addPlayerBullet(model, "pulse", player.x, player.y - 28, 0, -760, damage * 1.6, 6.5, 2);
    addPlayerBullet(model, "pulse", player.x - 16, player.y - 20, 0, -700, damage * 0.6, 4);
    addPlayerBullet(model, "pulse", player.x + 16, player.y - 20, 0, -700, damage * 0.6, 4);
    return;
  }

  const offsets = level >= 3 ? [-16, 0, 16] : level >= 2 ? [-10, 10] : [0];
  offsets.forEach((offset) => {
    addPlayerBullet(model, "pulse", player.x + offset, player.y - 24, 0, -700, damage, 4.5);
  });
}

function fireRapid(model: GameModel, level: number) {
  const player = model.player;
  const damage = 0.42 + (level - 1) * 0.1;

  if (level >= 5) {
    [-9, 0, 9].forEach((offset) => {
      addPlayerBullet(
        model,
        "rapidBolt",
        player.x + offset,
        player.y - 24,
        offset * 3,
        -840,
        damage * 0.8,
        3.2,
      );
    });
    return;
  }

  const offsets = level >= 3 ? [-7, 7] : [0];
  offsets.forEach((offset) => {
    addPlayerBullet(model, "rapidBolt", player.x + offset, player.y - 24, 0, -800, damage, 3.2);
  });
}

function fireSpread(model: GameModel, level: number) {
  const player = model.player;
  const damage = 0.85 + (level - 1) * 0.12;
  const angleSets: number[][] = [
    [-0.16, 0.16],
    [-0.24, 0, 0.24],
    [-0.3, -0.1, 0.1, 0.3],
    [-0.36, -0.18, 0, 0.18, 0.36],
    [-0.42, -0.26, -0.1, 0, 0.1, 0.26, 0.42],
  ];
  const angles = angleSets[clamp(level, 1, 5) - 1];
  angles.forEach((angle) => {
    const isCenter = level >= 5 && angle === 0;
    addPlayerBullet(
      model,
      "spreadPellet",
      player.x,
      player.y - 22,
      Math.sin(angle) * 380,
      -650 * Math.cos(angle),
      isCenter ? damage * 1.8 : damage,
      isCenter ? 6 : 4.6,
    );
  });
}

function fireLaser(model: GameModel, level: number) {
  const player = model.player;
  const damage = 1.6 + level * 0.5;
  const pierce = level >= 5 ? 30 : 1 + level;
  const width = level >= 4 ? 6.5 : level >= 2 ? 5.4 : 4.4;
  const offsets = level >= 3 ? [-14, 0, 14] : level >= 2 ? [-10, 10] : [0];
  offsets.forEach((offset) => {
    addPlayerBullet(model, "laser", player.x + offset, player.y - 26, 0, -900, damage, width, pierce);
  });
}

function fireMissile(model: GameModel, level: number) {
  const player = model.player;
  const damage = 3.6 + level * 0.65;
  const offsetSets: number[][] = [[0], [-13, 13], [-13, 13], [-18, 0, 18], [-20, -7, 7, 20]];
  const offsets = offsetSets[clamp(level, 1, 5) - 1];
  offsets.forEach((offset) => {
    addPlayerBullet(model, "missile", player.x + offset, player.y - 18, offset * 4, -420, damage, 8);
  });
}

function fireBomb(model: GameModel, level: number) {
  const player = model.player;
  const damage = 6.5 + level * 1.7;
  const offsets = level >= 4 ? [-16, 16] : [0];
  offsets.forEach((offset) => {
    addPlayerBullet(
      model,
      "bomb",
      player.x + offset,
      player.y - 20,
      offset * 1.5,
      -330,
      damage,
      10 + level,
    );
  });
}

export function firePlayer(model: GameModel) {
  const player = model.player;
  const level = player.weaponLevel;

  switch (player.weapon) {
    case "bomb":
      fireBomb(model, level);
      model.sfxQueue.push("shootBomb");
      break;
    case "spread":
      fireSpread(model, level);
      model.sfxQueue.push("shootSpread");
      break;
    case "laser":
      fireLaser(model, level);
      model.sfxQueue.push("shootLaser");
      break;
    case "missile":
      fireMissile(model, level);
      model.sfxQueue.push("shootMissile");
      break;
    case "rapid":
      fireRapid(model, level);
      model.sfxQueue.push("shootRapid");
      break;
    default:
      firePulse(model, level);
      model.sfxQueue.push("shootPulse");
  }
}
