import { clamp, MAX_BULLETS, MAX_PARTICLES, WEAPONS } from "./config";
import { SECRETS } from "./content/secrets";
import { noise } from "./random";
import type { Enemy, Game, Pickup, Secret, Sound } from "./types";

export function sound(game: Game, value: Sound): void {
  if (game.events.length < 64)
    game.events.push({ kind: "sound", sound: value });
}
export function message(
  game: Game,
  title: string,
  text: string,
  life = 4,
): void {
  game.message = { title, text, life };
}
export function discover(game: Game, id: Secret): boolean {
  if (game.secrets.includes(id)) return false;
  game.secrets.push(id);
  game.discovered.push(id);
  const definition = SECRETS.find((item) => item.id === id)!;
  message(game, definition.name, definition.reward, 6);
  sound(game, "secret");
  game.events.push({ kind: "save" });
  return true;
}
export function burst(
  game: Game,
  x: number,
  y: number,
  color: string,
  count = 12,
): void {
  for (let i = 0; i < count && game.particles.length < MAX_PARTICLES; i++) {
    const seed = game.tick * 13 + i * 37 + Math.floor(x);
    const angle = noise(seed) * Math.PI * 2;
    const speed = 15 + noise(seed + 1) * 65;
    const life = 0.25 + noise(seed + 2) * 0.45;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life,
      maxLife: life,
      color,
      size: 1 + Math.floor(noise(seed + 3) * 3),
    });
  }
}
export function bullet(
  game: Game,
  x: number,
  y: number,
  vx: number,
  vy: number,
  enemy = true,
  damage = 1,
  rail = false,
): void {
  if (game.bullets.length >= MAX_BULLETS) return;
  game.bullets.push({
    id: ++game.nextId,
    x,
    y,
    previousX: x,
    previousY: y,
    vx,
    vy,
    enemy,
    radius: enemy ? 3.5 : rail ? 2 : 2.5,
    damage,
    life: 9,
    grazed: false,
    dead: false,
    rail,
    hits: [],
  });
}
export function aim(
  game: Game,
  x: number,
  y: number,
  speed: number,
  spread = 0,
  count = 1,
): void {
  const angle = Math.atan2(game.player.y - y, game.player.x - x);
  for (let i = 0; i < count; i++) {
    const a = angle + (i - (count - 1) / 2) * spread;
    bullet(game, x, y, Math.cos(a) * speed, Math.sin(a) * speed);
  }
}
export function pickup(
  game: Game,
  x: number,
  y: number,
  kind: Pickup["kind"],
): void {
  if (game.pickups.length < 30)
    game.pickups.push({ id: ++game.nextId, x, y, kind, age: 0, dead: false });
}
export function fire(game: Game): void {
  const player = game.player;
  if (player.fire > 0) return;
  const level = player.level;
  player.fire = WEAPONS[player.weapon].interval * (1 - (level - 1) * 0.1);
  if (player.weapon === "split") {
    const count = level === 3 ? 5 : 3;
    for (let i = 0; i < count; i++) {
      const angle = (i - (count - 1) / 2) * 0.15;
      bullet(
        game,
        player.x + 13,
        player.y,
        Math.cos(angle) * 340,
        Math.sin(angle) * 340,
        false,
        7 + level,
      );
    }
  } else if (player.weapon === "rail") {
    bullet(game, player.x + 13, player.y, 650, 0, false, 28 + level * 7, true);
  } else {
    bullet(
      game,
      player.x + 13,
      player.y - (level === 3 ? 3 : 0),
      380,
      0,
      false,
      9 + level * 3,
    );
    if (level === 3)
      bullet(game, player.x + 13, player.y + 3, 380, 0, false, 9);
  }
  sound(game, player.weapon === "rail" ? "rail" : "shot");
}
export function damagePlayer(game: Game): boolean {
  const player = game.player;
  if (player.invincible > 0 || game.status !== "running" || game.pulseTime > 0)
    return false;
  player.hull = Math.max(0, player.hull - 1);
  player.invincible = 1.7;
  game.combo = 0;
  game.shake = 4;
  game.hitStop = 0.045;
  burst(game, player.x, player.y, "#ffc087", 14);
  sound(game, "damage");
  if (player.hull === 0) {
    game.status = "dead";
    game.bullets = [];
    game.events.push({ kind: "death" });
    message(
      game,
      "Transmission lost",
      "Your echo remains. Try another route.",
      10,
    );
  }
  return true;
}
export function killEnemy(game: Game, enemy: Enemy): void {
  if (enemy.dead) return;
  enemy.dead = true;
  game.kills++;
  game.combo++;
  game.comboTime = 3;
  game.score += Math.round(
    (enemy.kind === "armored" ? 160 : 80) *
      (1 + Math.min(20, game.combo) * 0.05),
  );
  game.player.charge = clamp(game.player.charge + 5, 0, 100);
  burst(
    game,
    enemy.x,
    enemy.y,
    enemy.kind === "clucker" ? "#ffd174" : "#dca587",
    10,
  );
  sound(game, "explode");
  if (game.kills % 12 === 0) pickup(game, enemy.x, enemy.y, game.player.weapon);
  if (game.kills % 5 === 0) pickup(game, enemy.x, enemy.y, "charge");
}
export function activatePulse(game: Game): boolean {
  if (game.status !== "running" || game.player.charge < 100) return false;
  game.player.charge = 0;
  game.pulseTime = 0.6;
  game.hitStop = 0.075;
  game.shake = 3;
  game.bullets = game.bullets.filter((item) => !item.enemy);
  for (const enemy of game.enemies) {
    if (Math.hypot(enemy.x - game.player.x, enemy.y - game.player.y) < 230) {
      enemy.hp -= 50;
      if (enemy.hp <= 0) killEnemy(game, enemy);
    }
  }
  if (
    game.boss &&
    Math.hypot(game.boss.x - game.player.x, game.boss.y - game.player.y) < 230
  ) {
    game.boss.hp = Math.max(0, game.boss.hp - 50);
  }
  burst(game, game.player.x, game.player.y, "#adfff1", 24);
  sound(game, "pulse");
  return true;
}
