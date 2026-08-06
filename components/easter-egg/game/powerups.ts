import { PLAYER_TUNING, SUPER_TUNING } from "./config";
import type {
  Enemy,
  GameModel,
  PowerKind,
  PowerUp,
  WaveModifierKind,
  WeaponPickup,
  WeaponType,
} from "./types";
import { angleTo, clamp, findNearestEnemy, nextId, randomBetween } from "./utils";

const POWER_WEIGHTS: { kind: PowerKind; weight: number }[] = [
  { kind: "shield", weight: 22 },
  { kind: "magnet", weight: 16 },
  { kind: "health", weight: 16 },
  { kind: "invincible", weight: 12 },
  { kind: "drone", weight: 14 },
  { kind: "timewarp", weight: 12 },
  { kind: "nova", weight: 8 },
];

const WEAPON_KINDS: WeaponType[] = [
  "pulse",
  "rapid",
  "spread",
  "laser",
  "missile",
  "bomb",
];

function weightedPick<T>(items: { kind: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item.kind;
  }
  return items[items.length - 1].kind;
}

export function choosePowerKind(): PowerKind {
  return weightedPick(POWER_WEIGHTS);
}

export function chooseWeaponKind(): WeaponType {
  return WEAPON_KINDS[Math.floor(Math.random() * WEAPON_KINDS.length)];
}

export function spawnPowerUp(model: GameModel, x: number, y: number, kind?: PowerKind): PowerUp {
  const power: PowerUp = {
    age: 0,
    id: nextId(),
    kind: kind || choosePowerKind(),
    r: 16,
    spin: randomBetween(-1.3, 1.3),
    vx: randomBetween(-22, 22),
    vy: randomBetween(70, 108),
    x,
    y,
  };
  model.powerUps.push(power);
  return power;
}

export function spawnWeaponPickup(
  model: GameModel,
  x: number,
  y: number,
  weapon?: WeaponType,
): WeaponPickup {
  const pickup: WeaponPickup = {
    age: 0,
    id: nextId(),
    r: 16,
    spin: randomBetween(-1.1, 1.1),
    vx: randomBetween(-22, 22),
    vy: randomBetween(70, 108),
    weapon: weapon || chooseWeaponKind(),
    x,
    y,
  };
  model.weaponPickups.push(pickup);
  return pickup;
}

// Tuned generous on purpose: a variable-ratio reward schedule keeps players
// engaged, but only if the *floor* is high enough that a bad-luck streak
// never reads as "the game stopped giving me anything." Pity timers below
// guarantee a drop well before that floor is reached.
const DROP_CHANCE_BY_KIND: Record<string, number> = {
  armored: 0.4,
  elite: 0.68,
  grunt: 0.16,
  healer: 0.34,
  popcorn: 0.12,
  shooter: 0.24,
  splitter: 0.32,
  splitterling: 0.06,
  ufo: 0.38,
};

const PITY_WEAPON_KILLS = 7;
const PITY_POWERUP_KILLS = 5;

export function maybeDropOnKill(
  model: GameModel,
  enemy: Enemy,
  modifiers: WaveModifierKind[],
) {
  const isBoss = enemy.kind === "boss" || enemy.kind === "miniBoss";
  if (isBoss) {
    model.dropsSincePowerup = 0;
    model.dropsSinceWeapon = 0;
    spawnWeaponPickup(model, enemy.x - 44, enemy.y);
    spawnPowerUp(model, enemy.x + 44, enemy.y);
    return;
  }

  model.dropsSincePowerup += 1;
  model.dropsSinceWeapon += 1;

  if (model.dropsSinceWeapon >= PITY_WEAPON_KILLS) {
    model.dropsSinceWeapon = 0;
    spawnWeaponPickup(model, enemy.x, enemy.y);
    return;
  }
  if (model.dropsSincePowerup >= PITY_POWERUP_KILLS) {
    model.dropsSincePowerup = 0;
    spawnPowerUp(model, enemy.x, enemy.y);
    return;
  }

  const richDrops = modifiers.includes("richDrops");
  const baseChance = DROP_CHANCE_BY_KIND[enemy.kind] ?? 0.1;
  const chance = richDrops ? Math.min(0.9, baseChance * 1.9) : baseChance;
  if (Math.random() >= chance) return;

  if (Math.random() < 0.42) {
    model.dropsSinceWeapon = 0;
    spawnWeaponPickup(model, enemy.x, enemy.y);
  } else {
    model.dropsSincePowerup = 0;
    spawnPowerUp(model, enemy.x, enemy.y);
  }
}

export function applyPowerUp(model: GameModel, power: PowerUp) {
  const player = model.player;
  model.score += 40;

  switch (power.kind) {
    case "shield":
      player.shieldHp = clamp(player.shieldHp + PLAYER_TUNING.shieldMax * 0.75, 0, player.shieldMax);
      break;
    case "magnet":
      player.magnetTimer = Math.max(player.magnetTimer, 11);
      break;
    case "health":
      if (player.hull >= player.hullMax) {
        player.lives = clamp(player.lives + 1, 0, 6);
      } else {
        player.hull = player.hullMax;
      }
      break;
    case "invincible":
      player.powerInvincibleTimer = Math.max(player.powerInvincibleTimer, 6);
      break;
    case "drone":
      if (player.drones.length < 2) {
        player.drones.push({
          angleOffset: player.drones.length === 0 ? Math.PI * 0.5 : Math.PI * 1.5,
          fireCooldown: 0,
          life: 26,
        });
      } else {
        player.drones.forEach((drone) => {
          drone.life = Math.max(drone.life, 26);
        });
      }
      break;
    case "timewarp":
      model.timewarpTimer = Math.max(model.timewarpTimer, 6.5);
      break;
    case "nova":
      player.super = clamp(player.super + SUPER_TUNING.gainNova, 0, SUPER_TUNING.max);
      break;
  }
}

export function updateDrones(model: GameModel, dt: number) {
  const player = model.player;
  player.drones = player.drones.filter((drone) => {
    drone.life -= dt;
    return drone.life > 0;
  });

  player.drones.forEach((drone) => {
    const angle = model.elapsed * 2.1 + drone.angleOffset;
    const droneX = player.x + Math.cos(angle) * 46;
    const droneY = player.y + Math.sin(angle) * 26 - 8;
    drone.fireCooldown -= dt;
    if (drone.fireCooldown <= 0) {
      const target = findNearestEnemy(model.enemies, droneX, droneY);
      if (target) {
        const aimed = angleTo(droneX, droneY, target.x, target.y);
        model.bullets.push({
          age: 0,
          damage: 1.2,
          id: nextId(),
          kind: "droneBolt",
          pierce: 0,
          r: 3.6,
          source: "drone",
          vx: Math.cos(aimed) * 560,
          vy: Math.sin(aimed) * 560,
          x: droneX,
          y: droneY,
        });
      }
      drone.fireCooldown = 0.85;
    }
  });
}

export function getEnemyTimeScale(model: GameModel): number {
  return model.timewarpTimer > 0 ? 0.45 : 1;
}
