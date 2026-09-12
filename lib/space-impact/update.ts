import {
  clamp,
  distance,
  HEIGHT,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  STEP,
  WIDTH,
} from "./config";
import { circleRect, segmentCircle } from "./collision";
import {
  activatePulse,
  collectPickup,
  cycleWeapon,
  bullet,
  burst,
  damagePlayer,
  discover,
  fire,
  killEnemy,
  sound,
} from "./combat";
import { bossVulnerable, updateBoss } from "./content/bosses";
import { enterRoom, finishBoss, updateDirector } from "./director";
import { updateEnemies } from "./enemies";
import type { Game, Input } from "./types";

function updatePlayer(game: Game, input: Input): void {
  const p = game.player;
  p.previousX = p.x;
  p.previousY = p.y;
  let dx = input.x;
  let dy = input.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude > 1) {
    dx /= magnitude;
    dy /= magnitude;
  }
  if (!magnitude && input.target) {
    const x = input.target.x - p.x;
    const y = input.target.y - p.y;
    const d = Math.hypot(x, y);
    const travel = Math.min(d, PLAYER_SPEED * STEP);
    if (d > 0) {
      p.x += (x / d) * travel;
      p.y += (y / d) * travel;
    }
  } else {
    p.x += dx * PLAYER_SPEED * STEP;
    p.y += dy * PLAYER_SPEED * STEP;
  }
  p.x = clamp(p.x, 17, WIDTH - 25);
  p.y = clamp(p.y, 18, HEIGHT - 18);
  p.invincible = Math.max(0, p.invincible - STEP);
  p.fire = Math.max(0, p.fire - STEP);
  p.shield = Math.max(0, p.shield - STEP); p.overdrive = Math.max(0, p.overdrive - STEP);
  p.drones = Math.max(0, p.drones - STEP); p.droneFire = Math.max(0, p.droneFire - STEP);
  if (input.cycleWeapon) cycleWeapon(game);
  if (input.pulse) activatePulse(game);
  if (p.drones > 0 && p.droneFire === 0 && !input.ceaseFire && game.room?.kind !== "observatory") {
    for (const offset of [-16, 16]) bullet(game, p.x + 2, clamp(p.y + offset, 8, HEIGHT - 8), 365, 0, false, 7);
    p.droneFire = 0.32;
  }
  if (!input.ceaseFire && game.room?.kind !== "observatory") fire(game);
}
function moveBullets(game: Game): void {
  for (const b of game.bullets) {
    if (b.seeker && !b.enemy && !b.dead) {
      const candidates = game.enemies.filter((enemy) => !enemy.dead && enemy.x > b.x - 12 && enemy.x < WIDTH);
      const boss = game.boss;
      const target = candidates.reduce<{ x: number; y: number } | null>((best, enemy) => !best || distance(b, enemy) < distance(b, best) ? enemy : best,
        boss?.awakened && !game.bossDefeated && boss.x > b.x ? boss : null);
      if (target) {
        const current = Math.atan2(b.vy, b.vx); const desired = Math.atan2(target.y - b.y, target.x - b.x);
        const diff = Math.atan2(Math.sin(desired - current), Math.cos(desired - current));
        const turn = current + clamp(diff, -2.8 * STEP, 2.8 * STEP);
        b.vx = Math.cos(turn) * 250; b.vy = Math.sin(turn) * 250;
      }
    }
    b.previousX = b.x;
    b.previousY = b.y;
    b.x += b.vx * STEP;
    b.y += b.vy * STEP;
    b.life -= STEP;
    if (game.sector === 3 && b.enemy && !game.boss)
      b.y += Math.sin(game.tick / 90 + b.id) * 7 * STEP;
    if (
      game.sector === 1 &&
      b.enemy &&
      b.life > 5 &&
      (b.y < 12 || b.y > HEIGHT - 12)
    ) {
      b.y = clamp(b.y, 12, HEIGHT - 12);
      b.vy *= -1;
    }
    if (
      b.x < -30 ||
      b.x > WIDTH + 140 ||
      b.y < -35 ||
      b.y > HEIGHT + 35 ||
      b.life <= 0
    )
      b.dead = true;
  }
}
function resolveCollisions(game: Game): void {
  const player = game.player;
  for (const b of game.bullets) {
    if (b.dead) continue;
    const previous = { x: b.previousX, y: b.previousY };
    if (b.enemy) {
      // Relative sweep also accounts for player motion during this tick.
      const start = {
        x: b.previousX - player.previousX + player.x,
        y: b.previousY - player.previousY + player.y,
      };
      if (segmentCircle(start, b, player, PLAYER_RADIUS + b.radius)) {
        b.dead = true;
        damagePlayer(game);
      } else if (
        !b.grazed &&
        player.invincible <= 0 &&
        game.pulseTime <= 0 &&
        segmentCircle(start, b, player, PLAYER_RADIUS + b.radius + 13)
      ) {
        b.grazed = true;
        game.grazes++;
        game.score += 15;
        player.charge = clamp(player.charge + 3, 0, 100);
        burst(game, player.x, player.y, "#e7fff9", 2);
      }
      continue;
    }
    for (const feature of game.features) {
      if (
        feature.kind === "window" &&
        Math.floor(game.tick / 40) % 2 === 0 &&
        segmentCircle(previous, b, feature, 10)
      ) {
        b.dead = true;
        enterRoom(game, "salvage");
        return;
      }
    }
    for (const enemy of game.enemies) {
      if (b.dead || enemy.dead || b.hits.includes(enemy.id)) continue;
      // Formations must enter the visible field before being damaged.
      if (enemy.x > WIDTH - enemy.radius) continue;
      if (segmentCircle(previous, b, enemy, enemy.radius + b.radius)) {
        enemy.hp -= b.damage;
        b.hits.push(enemy.id);
        if (!b.rail) b.dead = true;
        burst(game, b.x, b.y, "#ebf8ef", 2);
        if (enemy.hp <= 0) killEnemy(game, enemy);
      }
    }
    const boss = game.boss;
    if (boss && !game.bossDefeated && !b.dead && boss.awakened) {
      for (const part of boss.parts) {
        const partId = -2 - part.id;
        if (part.hp <= 0 || b.hits.includes(partId)) continue;
        const target = { x: boss.x - 15, y: boss.y + part.y };
        if (segmentCircle(previous, b, target, 12 + b.radius)) {
          part.hp = Math.max(0, part.hp - b.damage);
          b.hits.push(partId);
          if (!b.rail) b.dead = true;
          burst(game, target.x, target.y, "#edb786", part.hp === 0 ? 14 : 3);
          if (part.hp === 0) {
            game.score += 200;
            sound(game, "explode");
          }
        }
      }
      if (
        !b.dead &&
        !b.hits.includes(-1) &&
        segmentCircle(previous, b, boss, 28 + b.radius)
      ) {
        b.hits.push(-1);
        b.dead = true;
        if (bossVulnerable(boss)) {
          boss.hp = Math.max(0, boss.hp - b.damage);
          burst(game, b.x, b.y, "#f6efd7", 3);
        }
      }
    }
    for (const terrain of game.terrain) {
      if (!b.rail && circleRect(b, b.radius, terrain)) b.dead = true;
    }
  }
  for (const enemy of game.enemies)
    if (!enemy.dead && distance(enemy, player) < enemy.radius + PLAYER_RADIUS)
      damagePlayer(game);
  for (const terrain of game.terrain)
    if (circleRect(player, PLAYER_RADIUS, terrain)) damagePlayer(game);
  if (game.boss && !game.bossDefeated && distance(game.boss, player) < 38)
    damagePlayer(game);
}
function updatePickups(game: Game): void {
  for (const item of game.pickups) {
    item.age += STEP;
    item.x -= (item.kind === "feather" ? 23 : 42) * STEP;
    if (distance(item, game.player) < 76) {
      const d = Math.max(1, distance(item, game.player));
      item.x += ((game.player.x - item.x) / d) * 90 * STEP;
      item.y += ((game.player.y - item.y) / d) * 90 * STEP;
    }
    if (distance(item, game.player) < 17) collectPickup(game, item);
    if (item.x < -25) item.dead = true;
  }
}
function updateFeatures(game: Game, input: Input): void {
  game.hint = "";
  for (const feature of game.features) {
    feature.age += STEP;
    feature.x -= (feature.kind === "probe" ? 7 : 11) * STEP;
    const nearby = distance(feature, game.player) < 70;
    if (feature.kind === "probe") {
      if (nearby && input.ceaseFire) {
        feature.progress += STEP;
        game.hint =
          "Listening… " + Math.min(5, Math.floor(feature.progress)) + " / 5";
        // The probe creates a small sanctuary while the player responds.
        game.bullets = game.bullets.filter(
          (b) => !b.enemy || distance(b, feature) > 85,
        );
        if (feature.progress >= 5) {
          discover(game, "patient");
          game.companion = true;
          feature.x = -100;
        }
      } else {
        feature.progress = 0;
        if (nearby) game.hint = "The probe asks for silence. Hold fire.";
      }
      continue;
    }
    if (!nearby) continue;
    if (feature.kind === "window")
      game.hint = "That window blinks differently.";
    else
      game.hint =
        feature.kind === "beacon"
          ? "Inspect the broken beacon"
          : feature.kind === "planet"
            ? "Observe the little blue light"
            : feature.kind === "ghost"
              ? "Listen to your echo"
              : "Enter the impossible portal";
    if (feature.kind === "portal" && game.feathers < 3) {
      game.hint =
        "The portal needs three feathers. " + game.feathers + " / 3 recovered";
      continue;
    }
    if (!input.interact) continue;
    if (feature.kind === "beacon") {
      game.status = "console";
      game.console = "beacon";
      feature.x = -100;
    } else if (feature.kind === "planet") enterRoom(game, "observatory");
    else if (feature.kind === "portal") enterRoom(game, "cluck");
    else if (feature.kind === "ghost") {
      discover(game, "ghost");
      game.ghostPlayback = 12;
      feature.x = -100;
    }
  }
  game.features = game.features.filter(
    (feature) => feature.x > -25 && feature.age < 42,
  );
}
export function updateGame(game: Game, input: Input, dt = STEP): void {
  if (game.status === "countdown") {
    game.countdown = Math.max(0, game.countdown - dt);
    if (game.countdown === 0) game.status = "running";
    return;
  }
  if (game.status !== "running") return;
  if (game.hitStop > 0) {
    game.hitStop = Math.max(0, game.hitStop - STEP);
    return;
  }
  game.tick++;
  game.pulseTime = Math.max(0, game.pulseTime - STEP);
  game.shake = Math.max(0, game.shake - STEP * 8);
  game.ghostPlayback = Math.max(0, game.ghostPlayback - STEP);
  game.comboTime = Math.max(0, game.comboTime - STEP);
  if (game.comboTime === 0) game.combo = 0;
  if (game.combatNotice) { game.combatNotice.life -= STEP; if (game.combatNotice.life <= 0) game.combatNotice = null; }
  if (game.message) {
    game.message.life -= STEP;
    if (game.message.life <= 0) game.message = null;
  }
  updateDirector(game);
  if (game.status !== "running") return;
  updatePlayer(game, input);
  updateEnemies(game);
  updateBoss(game, STEP);
  for (const terrain of game.terrain) terrain.x -= terrain.speed * STEP;
  moveBullets(game);
  // Clear hostile shots before collision while answering the neutral probe.
  const listeningProbe =
    input.ceaseFire &&
    game.features.find(
      (feature) =>
        feature.kind === "probe" && distance(feature, game.player) < 70,
    );
  if (listeningProbe)
    game.bullets = game.bullets.filter(
      (shot) => !shot.enemy || distance(shot, listeningProbe) > 85,
    );
  resolveCollisions(game);
  if (game.status !== "running") return;
  updatePickups(game);
  updateFeatures(game, input);
  if (game.boss && game.boss.hp <= 0) finishBoss(game);
  for (const particle of game.particles) {
    particle.life -= STEP;
    particle.x += particle.vx * STEP;
    particle.y += particle.vy * STEP;
    particle.vx *= 0.98;
    particle.vy *= 0.98;
  }
  game.particles = game.particles.filter((p) => p.life > 0);
  game.enemies = game.enemies.filter((enemy) => !enemy.dead);
  game.bullets = game.bullets.filter((b) => !b.dead);
  game.pickups = game.pickups.filter((item) => !item.dead);
  game.terrain = game.terrain.filter((item) => item.x + item.w > -10);
  if (game.tick % 12 === 0) {
    game.trace.push({ x: game.player.x, y: game.player.y });
    if (game.trace.length > 300) game.trace.shift();
  }
}
