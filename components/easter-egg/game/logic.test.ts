import assert from "node:assert/strict";
import { test } from "node:test";

import { createBoss, updateBoss } from "./bosses";
import { WEAPON_MAX_LEVEL, getPlayerYBounds } from "./config";
import { buildFormation } from "./formations";
import { createModel, createPlayer } from "./model";
import { applyPowerUp } from "./powerups";
import { spawnNextWave } from "./waves";
import {
  readBestScore,
  readMuted,
  writeBestScore,
  writeMuted,
} from "./storage";
import { activateSuper, damagePlayer, getMultiplier, getRank } from "./update";
import { applyWeaponPickup, firePlayer, steerTowards } from "./weapons";

test("getMultiplier scales with combo and caps at 5x", () => {
  assert.equal(getMultiplier({ combo: 0 }), 1);
  assert.equal(getMultiplier({ combo: 8 }), 1.5);
  assert.equal(getMultiplier({ combo: 32 }), 3);
  assert.equal(getMultiplier({ combo: 999 }), 5);
});

test("getPlayerYBounds leaves extra bottom clearance on portrait phones", () => {
  const portrait = getPlayerYBounds(390, 844);
  assert.ok(portrait.bottom < 844 - 100);
  assert.ok(portrait.respawnY < portrait.bottom);
  assert.ok(portrait.top > 0);

  const landscape = getPlayerYBounds(1200, 700);
  assert.equal(landscape.bottom, 700 - 72);
});

test("getPlayerYBounds rejects inverted dimensions without throwing", () => {
  const bounds = getPlayerYBounds(0, 500);
  assert.ok(Number.isFinite(bounds.top));
  assert.ok(bounds.bottom <= 500);
});

test("getRank climbs the rank table and never drops below Egg Cadet", () => {
  assert.equal(getRank(0), "Egg Cadet");
  assert.equal(getRank(20000), "Feather Ace");
  assert.equal(getRank(200000), "Poultry Legend");
});

test("applyWeaponPickup: switch, level up, then bonus at cap", () => {
  const player = createPlayer(900, 700);
  assert.equal(player.weapon, "pulse");

  const first = applyWeaponPickup(player, "spread");
  assert.equal(first, "switch");
  assert.equal(player.weapon, "spread");
  assert.equal(player.weaponLevel, 1);

  for (let i = 1; i < WEAPON_MAX_LEVEL; i += 1) {
    const result = applyWeaponPickup(player, "spread");
    assert.equal(result, "levelUp");
  }
  assert.equal(player.weaponLevel, WEAPON_MAX_LEVEL);

  const maxed = applyWeaponPickup(player, "spread");
  assert.equal(maxed, "bonus");
  assert.equal(player.weaponLevel, WEAPON_MAX_LEVEL);
});

test("bomb weapon fires a fused area projectile", () => {
  const model = createModel(900, 700, 0, "hard", "classic", "classic");
  model.player.weapon = "bomb";
  firePlayer(model);
  assert.equal(model.difficulty, "hard");
  assert.equal(model.shipSkin, "classic");
  assert.equal(model.enemySkin, "classic");
  assert.equal(model.bullets.length, 1);
  assert.equal(model.bullets[0].kind, "bomb");
  assert.equal(model.bullets[0].source, "player");
});

test("boss waves trigger warning flash and shake before entry", () => {
  const model = createModel(900, 700, 0);
  model.wave = 5;
  spawnNextWave(model);
  assert.equal(model.enemies[0].kind, "boss");
  assert.equal(model.screenFlash?.color, "#ff1744");
  assert.ok(model.shake >= 14);
});

test("buildFormation produces the requested slot count with increasing rows", () => {
  const slots = buildFormation("gridRanks", 4, 3, 60, 900);
  assert.equal(slots.length, 12);
  const rowYs = new Set(slots.map((slot) => slot.homeY));
  assert.equal(rowYs.size, 3);
  slots.forEach((slot) => {
    assert.ok(slot.x >= 0 && slot.x <= 900);
  });
});

test("buildFormation orbitRing gives every slot a shared center and radius", () => {
  const slots = buildFormation("orbitRing", 5, 1, 60, 900);
  assert.equal(slots.length, 5);
  slots.forEach((slot) => {
    assert.equal(slot.formationCenterX, 450);
    assert.ok((slot.formationRadius || 0) > 0);
  });
});

test("steerTowards respects the turn-rate limit instead of snapping", () => {
  const steered = steerTowards(0, -600, 0, 0, 600, 0, 1 / 60, 4, 600);
  const angle = Math.atan2(steered.vy, steered.vx);
  const maxDelta = 4 * (1 / 60);
  // starting angle is -90deg (straight up); target is 0deg (straight right) => desired delta ~ +90deg
  const delta = Math.atan2(Math.sin(angle - -Math.PI / 2), Math.cos(angle - -Math.PI / 2));
  assert.ok(Math.abs(delta) <= maxDelta + 1e-6);
  const speed = Math.hypot(steered.vx, steered.vy);
  assert.ok(Math.abs(speed - 600) < 1e-6);
});

test("steerTowards converges toward the target over many small steps", () => {
  let vx = 0;
  let vy = -600;
  for (let i = 0; i < 500; i += 1) {
    const steered = steerTowards(vx, vy, 0, 0, 600, 0, 1 / 60, 4, 600);
    vx = steered.vx;
    vy = steered.vy;
  }
  const angle = Math.atan2(vy, vx);
  assert.ok(Math.abs(angle) < 0.05);
});

test("boss phase transitions fire at the 70% and 35% hp thresholds", () => {
  const model = createModel(900, 700, 0);
  const boss = createBoss(model, "mothercluckerPrime");
  boss.aiState = "attacking";
  model.enemies.push(boss);

  boss.hp = boss.maxHp * 0.71;
  updateBoss(model, boss, 1 / 60, 1);
  assert.equal(boss.bossPhase, 1);

  boss.hp = boss.maxHp * 0.5;
  updateBoss(model, boss, 1 / 60, 1);
  assert.equal(boss.bossPhase, 2);

  boss.hp = boss.maxHp * 0.2;
  updateBoss(model, boss, 1 / 60, 1);
  assert.equal(boss.bossPhase, 3);
});

test("drone power-up stacks up to two, then just refreshes duration", () => {
  const model = createModel(900, 700, 0);
  applyPowerUp(model, { age: 0, id: 1, kind: "drone", r: 16, spin: 0, vx: 0, vy: 0, x: 0, y: 0 });
  assert.equal(model.player.drones.length, 1);
  applyPowerUp(model, { age: 0, id: 2, kind: "drone", r: 16, spin: 0, vx: 0, vy: 0, x: 0, y: 0 });
  assert.equal(model.player.drones.length, 2);
  model.player.drones[0].life = 1;
  applyPowerUp(model, { age: 0, id: 3, kind: "drone", r: 16, spin: 0, vx: 0, vy: 0, x: 0, y: 0 });
  assert.equal(model.player.drones.length, 2);
  assert.equal(model.player.drones[0].life, 26);
});

test("health power-up heals to full, or grants a life when already full", () => {
  const model = createModel(900, 700, 0);
  model.player.hull = 40;
  applyPowerUp(model, { age: 0, id: 1, kind: "health", r: 16, spin: 0, vx: 0, vy: 0, x: 0, y: 0 });
  assert.equal(model.player.hull, model.player.hullMax);

  const livesBefore = model.player.lives;
  applyPowerUp(model, { age: 0, id: 2, kind: "health", r: 16, spin: 0, vx: 0, vy: 0, x: 0, y: 0 });
  assert.equal(model.player.lives, livesBefore + 1);
});

test("shield fully absorbs hits deterministically until depleted, then hull takes damage", () => {
  const model = createModel(900, 700, 0);
  model.player.invincibleTimer = 0; // skip the spawn-grace iframes for this test
  model.player.shieldHp = 30;

  damagePlayer(model, 0, 0, 26);
  assert.equal(model.player.shieldHp, 4);
  assert.equal(model.player.hull, model.player.hullMax);

  damagePlayer(model, 0, 0, 26);
  assert.equal(model.player.shieldHp, 0);
  assert.equal(model.player.hull, model.player.hullMax);

  damagePlayer(model, 0, 0, 26);
  assert.equal(model.player.hull, model.player.hullMax - 26);
});

test("taking hull damage halves the combo instead of wiping it (loss-aversion tuning)", () => {
  const model = createModel(900, 700, 0);
  model.player.invincibleTimer = 0;
  model.combo = 17;
  model.comboTimer = 3;

  damagePlayer(model, 0, 0, 10);
  assert.equal(model.combo, 8);
  assert.ok(model.comboTimer > 0);

  model.player.invincibleTimer = 0; // bypass post-hit iframes to test the next hit in isolation
  model.combo = 1;
  damagePlayer(model, 0, 0, 10);
  assert.equal(model.combo, 0);
  assert.equal(model.comboTimer, 0);
});

test("activateSuper requires a full meter and resets it on use", () => {
  const model = createModel(900, 700, 0);
  model.player.super = 99;
  assert.equal(activateSuper(model), false);
  assert.equal(model.player.super, 99);

  model.player.super = 100;
  assert.equal(activateSuper(model), true);
  assert.equal(model.player.super, 0);
});

test("localStorage helpers fall back gracefully without a window", () => {
  assert.equal(readBestScore(), 0);
  assert.equal(readMuted(), false);
  assert.doesNotThrow(() => writeBestScore(500));
  assert.doesNotThrow(() => writeMuted(true));
});
