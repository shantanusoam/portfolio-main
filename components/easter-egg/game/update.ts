import {
  getBossDisplayName,
  getComponentWorldPosition,
  onComponentDestroyed,
  updateBoss,
  updateMiniBoss,
} from "./bosses";
import {
  DIFFICULTY_TUNING,
  DIFFICULTY_PRESETS,
  GRAZE_TUNING,
  PLAYER_TUNING,
  POWER_COLORS,
  POWER_LABELS,
  RANKS,
  SUPER_TUNING,
  WEAPON_COLORS,
  WEAPON_NAMES,
  getPlayerYBounds,
  getSectorForWave,
  getWaveInSector,
} from "./config";
import { applyEnrageNearby, trySplitOnDeath, updateEnemyAI } from "./enemies";
import { applyPowerUp, getEnemyTimeScale, maybeDropOnKill, updateDrones } from "./powerups";
import { readHighestSector, writeBestScore, writeHighestSector } from "./storage";
import type { Bullet, Enemy, GameModel, WaveModifierKind } from "./types";
import { applyWeaponPickup, firePlayer, getFireInterval, steerTowards } from "./weapons";
import {
  clamp,
  distanceSquared,
  findNearestEnemy,
  formatNumber,
  nextId,
  randomBetween,
} from "./utils";
import { spawnNextWave } from "./waves";

export function getMultiplier(model: Pick<GameModel, "combo">): number {
  return clamp(1 + Math.floor(model.combo / 8) * 0.5, 1, 5);
}

export function getRank(score: number): string {
  let rank = RANKS[0].name;
  for (const entry of RANKS) {
    if (score >= entry.score) rank = entry.name;
  }
  return rank;
}

const MAX_PARTICLES = 260;
const MAX_FLOATS = 40;
const MAX_BULLETS = 420;

export function addFloat(
  model: GameModel,
  text: string,
  x: number,
  y: number,
  color = "#fff0c5",
) {
  model.floats.push({ age: 0, color, life: 1, text, x, y });
  if (model.floats.length > MAX_FLOATS) model.floats.shift();
}

export function createParticles(
  model: GameModel,
  x: number,
  y: number,
  color: string,
  count: number,
  speedMin = 70,
  speedMax = 360,
) {
  for (let index = 0; index < count; index += 1) {
    if (model.particles.length >= MAX_PARTICLES) break;
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

export function getActiveBoss(model: GameModel): Enemy | undefined {
  return model.enemies.find((enemy) => enemy.kind === "boss" || enemy.kind === "miniBoss");
}

function updatePlayerMovement(model: GameModel, keys: Set<string>, dt: number) {
  const player = model.player;
  if (player.respawnTimer > 0) {
    player.respawnTimer = Math.max(0, player.respawnTimer - dt);
    return;
  }

  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("KeyA")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("KeyD")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("KeyW")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("KeyS")) dy += 1;

  const { acceleration, dragPerSecond, maxSpeed } = PLAYER_TUNING;

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

  const drag = Math.pow(dragPerSecond, dt);
  player.vx *= drag;
  player.vy *= drag;
  const yBounds = getPlayerYBounds(model.width, model.height);
  player.x = clamp(player.x + player.vx * dt, 24, model.width - 24);
  player.y = clamp(player.y + player.vy * dt, yBounds.top, yBounds.bottom);

  const targetTilt = clamp(-player.vx / 420, -0.42, 0.42);
  player.bankTilt += (targetTilt - player.bankTilt) * Math.min(1, dt * 8);
}

function emitEngineTrail(model: GameModel, dt: number) {
  const player = model.player;
  if (player.respawnTimer > 0) return;
  const speed = Math.hypot(player.vx, player.vy);
  if (speed < 50 || model.particles.length >= MAX_PARTICLES) return;
  if (Math.random() >= dt * 24) return;

  const angle = Math.PI / 2 + randomBetween(-0.3, 0.3);
  const trailSpeed = randomBetween(40, 120);
  model.particles.push({
    age: 0,
    color: Math.random() < 0.7 ? "#ffb23f" : "#8df6ff",
    life: randomBetween(0.2, 0.38),
    r: randomBetween(1.5, 3.2),
    vx: Math.cos(angle) * trailSpeed + player.vx * 0.12,
    vy: Math.sin(angle) * trailSpeed + player.vy * 0.12,
    x: player.x + randomBetween(-4, 4),
    y: player.y + player.r * 1.4,
  });
}

function emitMuzzleFlash(model: GameModel) {
  const player = model.player;
  const color = WEAPON_COLORS[player.weapon];
  const count = Math.min(2, MAX_PARTICLES - model.particles.length);
  for (let index = 0; index < count; index += 1) {
    const angle = -Math.PI / 2 + randomBetween(-0.35, 0.35);
    const speed = randomBetween(90, 200);
    model.particles.push({
      age: 0,
      color,
      life: randomBetween(0.05, 0.09),
      r: randomBetween(1.8, 3),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x: player.x,
      y: player.y - 22,
    });
  }
}

/** Occasional bright sparkle so falling pickups read as "important" against
 * a busy battlefield instead of blending into the bullet/particle noise. */
function emitPickupSparkle(model: GameModel, x: number, y: number, color: string, dt: number) {
  if (model.particles.length >= MAX_PARTICLES) return;
  if (Math.random() >= dt * 3) return;
  const angle = randomBetween(0, Math.PI * 2);
  model.particles.push({
    age: 0,
    color,
    life: randomBetween(0.25, 0.4),
    r: randomBetween(1.2, 2.2),
    vx: Math.cos(angle) * 18,
    vy: Math.sin(angle) * 18 - 10,
    x,
    y,
  });
}

const MAX_SHOCKWAVES = 12;

function spawnShockwave(model: GameModel, x: number, y: number, maxRadius: number, color: string) {
  if (model.shockwaves.length >= MAX_SHOCKWAVES) model.shockwaves.shift();
  model.shockwaves.push({ age: 0, color, id: nextId(), life: 0.4, maxRadius, x, y });
}

const KILL_CALLOUTS = [
  "EGG-CELLENT!",
  "OVER EASY!",
  "CLUCKED!",
  "POULTRY IN MOTION!",
  "THAT'S A WRAP!",
  "SUNNY SIDE DOWN!",
];

function updateTimers(model: GameModel, dt: number) {
  const player = model.player;
  model.elapsed += dt;
  model.shake = Math.max(0, model.shake - dt * 20);
  model.comboTimer = Math.max(0, model.comboTimer - dt);
  model.timewarpTimer = Math.max(0, model.timewarpTimer - dt);

  if (model.screenFlash) {
    model.screenFlash.timer -= dt;
    if (model.screenFlash.timer <= 0) model.screenFlash = null;
  }

  if (model.banner) {
    model.banner.timer -= dt;
    if (model.banner.timer <= -0.6) model.banner = null;
  }

  player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  player.invincibleTimer = Math.max(0, player.invincibleTimer - dt);
  player.powerInvincibleTimer = Math.max(0, player.powerInvincibleTimer - dt);
  player.magnetTimer = Math.max(0, player.magnetTimer - dt);
  player.superActiveTimer = Math.max(0, player.superActiveTimer - dt);

  if (model.comboTimer <= 0) model.combo = 0;
}

export function damagePlayer(model: GameModel, x: number, y: number, amount: number) {
  const player = model.player;
  if (player.respawnTimer > 0) return;

  if (player.powerInvincibleTimer > 0) {
    createParticles(model, x, y, "#fff566", 12, 60, 220);
    return;
  }
  if (player.invincibleTimer > 0) {
    createParticles(model, x, y, "#8df6ff", 10, 40, 180);
    return;
  }
  if (player.shieldHp > 0) {
    player.shieldHp = Math.max(0, player.shieldHp - amount);
    model.sfxQueue.push("shieldImpact");
    createParticles(model, x, y, "#65eaff", 18, 80, 260);
    model.shake = Math.max(model.shake, 6);
    return;
  }

  model.waveClearedNoDamage = false;
  player.hull -= amount;
  // Loss-aversion tuning: a full combo wipe on a single hit punishes minutes
  // of careful play in an instant and tends to break flow rather than
  // sharpen it. Halving keeps a real stake in staying alive without making
  // one mistake feel catastrophic.
  model.combo = Math.floor(model.combo * 0.5);
  model.comboTimer = model.combo > 0 ? 1.6 : 0;
  model.shake = Math.max(model.shake, 16);
  model.sfxQueue.push("playerDamage");
  createParticles(model, player.x, player.y, "#ff486f", 30, 90, 380);

  if (player.hull > 0) {
    player.invincibleTimer = Math.max(player.invincibleTimer, 1.3);
    return;
  }

  if (player.lives > 0) {
    player.lives -= 1;
    player.hull = player.hullMax;
    player.respawnTimer = PLAYER_TUNING.respawnDuration;
    player.invincibleTimer = PLAYER_TUNING.respawnInvincible;
    player.vx = 0;
    player.vy = 0;
    player.x = model.width / 2;
    player.y = getPlayerYBounds(model.width, model.height).respawnY;
    createParticles(model, player.x, player.y, "#ff486f", 40, 100, 420);
    return;
  }

  model.status = "ended";
  model.best = Math.max(model.best, model.score);
  writeBestScore(model.best);
  if (model.sector > readHighestSector()) writeHighestSector(model.sector);
  model.sfxQueue.push("gameOver");
}

export function destroyEnemy(model: GameModel, enemy: Enemy, modifiers: WaveModifierKind[]) {
  if (enemy.dead) return;
  enemy.dead = true;

  const multiplier = getMultiplier(model);
  const reward = Math.round(enemy.score * multiplier);
  model.score += reward;
  model.combo +=
    enemy.kind === "boss" ? 14 : enemy.kind === "miniBoss" ? 8 : enemy.kind === "elite" ? 3 : 1;
  model.comboTimer = 3.2;
  if (model.combo > 0 && model.combo % 8 === 0) {
    model.sfxQueue.push("comboUp");
    model.comboPulseId += 1;
  }

  const player = model.player;
  const wasSuperReady = player.super >= SUPER_TUNING.max;
  const superGain = SUPER_TUNING.gainKill[enemy.kind] ?? 1.4;
  player.super = clamp(player.super + superGain, 0, SUPER_TUNING.max);
  if (!wasSuperReady && player.super >= SUPER_TUNING.max) model.sfxQueue.push("superReady");

  const isBossTier = enemy.kind === "boss" || enemy.kind === "miniBoss";
  model.shake = Math.max(
    model.shake,
    enemy.kind === "boss" ? 18 : enemy.kind === "miniBoss" ? 13 : enemy.kind === "elite" ? 7 : 4,
  );
  if (isBossTier) model.hitStop = Math.max(model.hitStop, 0.12);

  model.sfxQueue.push("enemyDeath");
  const burstColor = isBossTier ? "#ffb23f" : enemy.kind === "elite" ? "#c9a8ff" : "#fff0c5";
  createParticles(
    model,
    enemy.x,
    enemy.y,
    burstColor,
    enemy.kind === "boss" ? 80 : enemy.kind === "miniBoss" ? 50 : enemy.kind === "elite" ? 30 : 18,
  );
  spawnShockwave(
    model,
    enemy.x,
    enemy.y,
    enemy.kind === "boss" ? 140 : enemy.kind === "miniBoss" ? 100 : enemy.r * 2.6,
    burstColor,
  );
  addFloat(model, `+${formatNumber(reward)}`, enemy.x, enemy.y - enemy.r * 0.4);

  if (
    (enemy.kind === "elite" ||
      enemy.kind === "splitter" ||
      enemy.kind === "miniBoss" ||
      enemy.kind === "boss") &&
    Math.random() < 0.6
  ) {
    const callout = KILL_CALLOUTS[Math.floor(Math.random() * KILL_CALLOUTS.length)];
    addFloat(model, callout, enemy.x, enemy.y - enemy.r * 0.4 - 20, "#ff9ad1");
  }

  applyEnrageNearby(model, enemy.x, enemy.y);

  if (enemy.kind === "splitter") {
    model.enemies.push(...trySplitOnDeath(model, enemy));
  }

  if (!isBossTier) {
    maybeDropOnKill(model, enemy, modifiers);
  }

  if (enemy.kind === "miniBoss") {
    model.banner = {
      kind: "victory",
      subtitle: "The flock regroups...",
      timer: 2.2,
      title: `${getBossDisplayName(enemy)} down!`,
    };
  } else if (enemy.kind === "boss") {
    const sector = getSectorForWave(model.wave);
    model.banner = {
      kind: "victory",
      subtitle: sector.completion,
      timer: 3.4,
      title: `${sector.name} cleared!`,
    };
    if (sector.id > readHighestSector()) writeHighestSector(sector.id);
  }
}

function hitEnemyOrComponent(
  model: GameModel,
  enemy: Enemy,
  bullet: Bullet,
  modifiers: WaveModifierKind[],
): boolean {
  if (enemy.components?.length) {
    for (const component of enemy.components) {
      if (component.destroyed) continue;
      const pos = getComponentWorldPosition(enemy, component);
      const hit =
        distanceSquared(bullet.x, bullet.y, pos.x, pos.y) < (bullet.r + component.radius) ** 2;
      if (!hit) continue;
      component.hp -= bullet.damage;
      enemy.flashTimer = 0.055;
      if (enemy.kind === "boss" || enemy.kind === "miniBoss") {
        addFloat(model, `${Math.ceil(bullet.damage)}`, bullet.x, bullet.y - 8, "#ffcf4b");
      }
      if (component.hp <= 0) {
        component.hp = 0;
        component.destroyed = true;
        onComponentDestroyed(model, enemy, component);
      }
      return true;
    }
  }

  const coreRadius =
    enemy.kind === "boss"
      ? enemy.r * 0.72
      : enemy.kind === "miniBoss" || enemy.kind === "elite"
        ? enemy.r * 0.78
        : enemy.r * 0.68;
  const hit = distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) < (bullet.r + coreRadius) ** 2;
  if (!hit) return false;

  enemy.hp -= bullet.damage;
  enemy.flashTimer = 0.055;
  if (enemy.kind === "boss" || enemy.kind === "miniBoss") {
    addFloat(model, `${Math.ceil(bullet.damage)}`, bullet.x, bullet.y - 8, "#ffcf4b");
  }
  if (enemy.hp <= 0) destroyEnemy(model, enemy, modifiers);
  return true;
}

function explodeAreaWeapon(
  model: GameModel,
  bullet: Bullet,
  primaryId: number | null,
  modifiers: WaveModifierKind[],
) {
  const isBomb = bullet.kind === "bomb";
  const color = isBomb ? "#ff6b8f" : "#ffb23f";
  createParticles(model, bullet.x, bullet.y, color, isBomb ? 44 : 26, 70, isBomb ? 400 : 320);
  model.shake = Math.max(model.shake, isBomb ? 10 : 6);
  model.sfxQueue.push("missileExplode");
  const splashRadius = (isBomb ? 92 : 58) + bullet.damage * (isBomb ? 2.2 : 1.4);
  const splashDamage = bullet.damage * (isBomb ? 0.92 : 0.7);

  model.enemies.forEach((enemy) => {
    if (enemy.dead || enemy.id === primaryId) return;
    const radius = enemy.kind === "boss" || enemy.kind === "miniBoss" ? enemy.r * 0.8 : enemy.r;
    if (distanceSquared(bullet.x, bullet.y, enemy.x, enemy.y) < (radius + splashRadius) ** 2) {
      enemy.hp -= splashDamage;
      enemy.flashTimer = 0.1;
      if (enemy.hp <= 0) destroyEnemy(model, enemy, modifiers);
    }
  });

  if (isBomb) {
    model.bullets.forEach((other) => {
      if (
        other.source === "enemy" &&
        distanceSquared(bullet.x, bullet.y, other.x, other.y) < splashRadius ** 2
      ) {
        other.dead = true;
      }
    });
  }
}

function resolveCollisions(model: GameModel, modifiers: WaveModifierKind[]) {
  const player = model.player;

  model.bullets.forEach((bullet) => {
    if (bullet.dead) return;

    if (bullet.source === "player" || bullet.source === "drone") {
      for (const enemy of model.enemies) {
        if (enemy.dead) continue;
        const hit = hitEnemyOrComponent(model, enemy, bullet, modifiers);
        if (!hit) continue;

        model.sfxQueue.push("enemyHit");
        createParticles(
          model,
          bullet.x,
          bullet.y,
          bullet.kind === "laser" ? "#8df6ff" : "#fff0c5",
          5,
          30,
          150,
        );

        if (bullet.kind === "missile" || bullet.kind === "bomb") {
          explodeAreaWeapon(model, bullet, enemy.id, modifiers);
          bullet.dead = true;
        } else if (bullet.pierce > 0) {
          bullet.pierce -= 1;
        } else {
          bullet.dead = true;
        }
        if (bullet.dead) break;
      }
      return;
    }

    const hitDistSq = (player.r + bullet.r * 0.78) ** 2;
    if (distanceSquared(player.x, player.y, bullet.x, bullet.y) < hitDistSq) {
      bullet.dead = true;
      damagePlayer(model, bullet.x, bullet.y, bullet.damage);
      return;
    }

    if (!bullet.grazed && player.respawnTimer <= 0) {
      const grazeDistSq = (player.r + bullet.r * 0.78 + GRAZE_TUNING.band) ** 2;
      if (distanceSquared(player.x, player.y, bullet.x, bullet.y) < grazeDistSq) {
        bullet.grazed = true;
        model.score += GRAZE_TUNING.scoreBonus;
        model.combo += GRAZE_TUNING.comboBonus;
        model.comboTimer = Math.max(model.comboTimer, 2.2);
        player.super = clamp(player.super + SUPER_TUNING.gainGraze, 0, SUPER_TUNING.max);
        model.sfxQueue.push("graze");
      }
    }
  });

  model.enemies.forEach((enemy) => {
    if (enemy.dead || enemy.y < -enemy.r) return;
    const hit =
      distanceSquared(player.x, player.y, enemy.x, enemy.y) < (player.r + enemy.r * 0.5) ** 2;
    if (hit) {
      damagePlayer(model, enemy.x, enemy.y, PLAYER_TUNING.contactDamage);
      if (enemy.kind !== "boss" && enemy.kind !== "miniBoss") {
        destroyEnemy(model, enemy, modifiers);
      }
    }
  });

  model.bullets = model.bullets.filter((bullet) => !bullet.dead);
  model.enemies = model.enemies.filter((enemy) => !enemy.dead);
}

function updateBullets(model: GameModel, dt: number) {
  const timeScale = getEnemyTimeScale(model);

  model.bullets.forEach((bullet) => {
    const scale = bullet.source === "enemy" ? timeScale : 1;

    if (bullet.source === "player" && bullet.kind === "missile") {
      const target = findNearestEnemy(model.enemies, bullet.x, bullet.y);
      if (target) {
        const steered = steerTowards(bullet.vx, bullet.vy, bullet.x, bullet.y, target.x, target.y, dt, 6.8, 560);
        bullet.vx = steered.vx;
        bullet.vy = steered.vy;
      }
    }

    bullet.age += dt * scale;
    bullet.x += bullet.vx * dt * scale;
    bullet.y += bullet.vy * dt * scale;

    if (bullet.source === "player" && bullet.kind === "bomb" && bullet.age >= 0.8) {
      explodeAreaWeapon(model, bullet, null, model.activeModifiers);
      bullet.dead = true;
    }

    if (
      bullet.y < -70 ||
      bullet.y > model.height + 90 ||
      bullet.x < -90 ||
      bullet.x > model.width + 90 ||
      bullet.age > 5.5
    ) {
      bullet.dead = true;
    }
  });

  if (model.bullets.length > MAX_BULLETS) {
    model.bullets.splice(0, model.bullets.length - MAX_BULLETS);
  }
}

function updateHazards(model: GameModel, dt: number) {
  const player = model.player;
  model.hazards.forEach((hazard) => {
    hazard.age += dt;
    if (!hazard.hit && hazard.age >= hazard.telegraphTime) {
      const hit =
        distanceSquared(player.x, player.y, hazard.x, hazard.y) < (player.r + hazard.r * 0.6) ** 2;
      if (hit) {
        hazard.hit = true;
        damagePlayer(model, hazard.x, hazard.y, hazard.damage);
      }
    }
  });
  model.hazards = model.hazards.filter((hazard) => hazard.age < hazard.telegraphTime + hazard.life);
}

function updatePickups(model: GameModel, dt: number) {
  const player = model.player;
  const magnetActive = player.magnetTimer > 0;

  const attract = (item: { vx: number; vy: number; x: number; y: number }) => {
    const toX = player.x - item.x;
    const toY = player.y - item.y;
    const dist = Math.hypot(toX, toY) || 1;
    if (magnetActive && dist < PLAYER_TUNING.magnetRadius) {
      item.vx += (toX / dist) * 760 * dt;
      item.vy += (toY / dist) * 760 * dt;
      return;
    }
    // A faint, always-on pull toward the player's lane — nowhere near the
    // Magnet power-up's strength, just enough that a reasonably-aimed catch
    // doesn't get whiffed by a few stray pixels. Pickups should feel like a
    // reward you earned, not a precision platforming challenge.
    if (Math.abs(toX) < 220) {
      item.vx += Math.sign(toX) * 70 * dt;
    }
  };

  model.weaponPickups.forEach((pickup) => {
    pickup.age += dt;
    attract(pickup);
    pickup.x += pickup.vx * dt;
    pickup.y += pickup.vy * dt;
    pickup.vx *= Math.pow(0.24, dt);
    emitPickupSparkle(model, pickup.x, pickup.y, WEAPON_COLORS[pickup.weapon], dt);

    const hit =
      distanceSquared(player.x, player.y, pickup.x, pickup.y) <
      (player.r + pickup.r + 6 + (magnetActive ? 10 : 0)) ** 2;
    if (!hit) return;

    const result = applyWeaponPickup(player, pickup.weapon);
    model.sfxQueue.push(result === "switch" ? "weaponSwitch" : "pickup");
    if (result === "bonus") {
      model.score += 260;
      player.super = clamp(player.super + 6, 0, SUPER_TUNING.max);
      addFloat(model, "Maxed! +260", pickup.x, pickup.y, WEAPON_COLORS[pickup.weapon]);
    } else {
      addFloat(
        model,
        `${WEAPON_NAMES[pickup.weapon]}${result === "switch" ? "" : ` Lv${player.weaponLevel}`}`,
        pickup.x,
        pickup.y,
        WEAPON_COLORS[pickup.weapon],
      );
    }
    createParticles(model, pickup.x, pickup.y, WEAPON_COLORS[pickup.weapon], 16, 60, 220);
    model.screenFlash = { color: WEAPON_COLORS[pickup.weapon], timer: 0.22 };
    pickup.y = model.height + 999;
  });
  model.weaponPickups = model.weaponPickups.filter((pickup) => pickup.y < model.height + 80);

  model.powerUps.forEach((power) => {
    power.age += dt;
    attract(power);
    power.x += power.vx * dt;
    power.y += power.vy * dt;
    power.vx *= Math.pow(0.24, dt);
    emitPickupSparkle(model, power.x, power.y, POWER_COLORS[power.kind], dt);

    const hit =
      distanceSquared(player.x, player.y, power.x, power.y) <
      (player.r + power.r + 6 + (magnetActive ? 10 : 0)) ** 2;
    if (!hit) return;

    applyPowerUp(model, power);
    model.sfxQueue.push("pickup");
    addFloat(model, POWER_LABELS[power.kind], power.x, power.y, POWER_COLORS[power.kind]);
    createParticles(model, power.x, power.y, POWER_COLORS[power.kind], 16, 60, 220);
    model.screenFlash = { color: POWER_COLORS[power.kind], timer: 0.22 };
    power.y = model.height + 999;
  });
  model.powerUps = model.powerUps.filter((power) => power.y < model.height + 80);
}

function updateParticlesAndFloats(model: GameModel, dt: number) {
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
  model.shockwaves.forEach((wave) => {
    wave.age += dt;
  });
  model.particles = model.particles.filter((particle) => particle.age < particle.life);
  model.floats = model.floats.filter((float) => float.age < float.life);
  model.shockwaves = model.shockwaves.filter((wave) => wave.age < wave.life);
}

function onWaveCleared(model: GameModel) {
  const waveInSector = getWaveInSector(model.wave);
  const sector = getSectorForWave(model.wave);
  const isSpecialWave = waveInSector === sector.wavesPerSector || waveInSector === 4;

  if (!isSpecialWave) {
    const clearBonus = 150 + model.wave * 10;
    model.score += clearBonus;
    addFloat(model, `Wave Clear +${clearBonus}`, model.width / 2, model.height * 0.4, "#fff0c5");

    if (model.waveClearedNoDamage) {
      const noDamageBonus = 500 + model.wave * 20;
      model.score += noDamageBonus;
      model.noDamageStreakWaves += 1;
      addFloat(
        model,
        `No-Damage +${noDamageBonus}`,
        model.width / 2,
        model.height * 0.4 + 22,
        "#7dffb0",
      );
    } else {
      model.noDamageStreakWaves = 0;
    }
  }

  model.waveClearedNoDamage = true;
  model.waveCooldown = isSpecialWave ? 1.6 : 1.1;
}

export function activateSuper(model: GameModel): boolean {
  const player = model.player;
  if (player.super < SUPER_TUNING.max) return false;

  player.super = 0;
  player.superActiveTimer = 0.5;
  model.hitStop = Math.max(model.hitStop, 0.12);
  model.shake = Math.max(model.shake, 22);
  model.sfxQueue.push("superActivate");
  createParticles(model, player.x, player.y, "#ff9ad1", 90, 120, 520);

  model.bullets = model.bullets.filter((bullet) => {
    if (bullet.source !== "enemy") return true;
    createParticles(model, bullet.x, bullet.y, "#ff9ad1", 3, 40, 120);
    return false;
  });

  model.enemies.forEach((enemy) => {
    if (enemy.dead) return;
    const isBossTier = enemy.kind === "boss" || enemy.kind === "miniBoss";
    const damage = isBossTier ? enemy.maxHp * 0.16 : enemy.maxHp * 4;
    enemy.hp -= damage;
    enemy.flashTimer = 0.3;
    if (enemy.hp <= 0) destroyEnemy(model, enemy, model.activeModifiers);
  });

  return true;
}

export function updateGame(model: GameModel, keys: Set<string>, dt: number) {
  if (model.status !== "running") return;

  if (model.hitStop > 0) {
    model.hitStop = Math.max(0, model.hitStop - dt);
    return;
  }

  updateTimers(model, dt);

  const oneLifeLeft = model.player.lives <= 0;
  const difficulty =
    (1 + model.wave * 0.08 + model.elapsed * 0.006) *
    DIFFICULTY_PRESETS[model.difficulty].enemyPressure *
    (oneLifeLeft ? DIFFICULTY_TUNING.softenBulletsAtOneLife : 1);
  const modifiers = model.activeModifiers;

  if (model.enemies.length === 0) {
    model.waveCooldown -= dt;
    if (model.waveCooldown <= 0) {
      spawnNextWave(model);
      model.waveCooldown = 1.1;
    }
  }

  updatePlayerMovement(model, keys, dt);
  emitEngineTrail(model, dt);

  if (model.player.fireCooldown <= 0 && model.player.respawnTimer <= 0) {
    firePlayer(model);
    model.player.fireCooldown = getFireInterval(model.player);
    emitMuzzleFlash(model);
  }

  model.enemies.forEach((enemy) => {
    if (enemy.kind === "boss") updateBoss(model, enemy, dt, difficulty);
    else if (enemy.kind === "miniBoss") updateMiniBoss(model, enemy, dt, difficulty);
    else updateEnemyAI(model, enemy, dt, difficulty, modifiers);
  });

  updateDrones(model, dt);
  updateBullets(model, dt);
  updateHazards(model, dt);
  updatePickups(model, dt);

  const enemyCountBefore = model.enemies.length;
  resolveCollisions(model, modifiers);
  if (enemyCountBefore > 0 && model.enemies.length === 0) {
    onWaveCleared(model);
  }

  updateParticlesAndFloats(model, dt);
}
