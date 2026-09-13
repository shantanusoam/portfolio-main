import { clamp, HEIGHT, STEP, WIDTH } from "./config";
import { bullet, resolveSquad } from "./combat";
import type { Enemy, Game } from "./types";
export function attackAngles(enemy: Enemy): number[] {
  const angle = Math.atan2(
    enemy.targetY - enemy.y,
    enemy.targetX - (enemy.x - 8),
  );
  return enemy.attackPattern === "cross"
    ? [Math.PI - 0.38, Math.PI + 0.38]
    : enemy.attackPattern === "fan"
      ? [angle - 0.3, angle, angle + 0.3]
      : [angle];
}
function volley(game: Game, enemy: Enemy): void {
  const pressure = (game.assist ? 0.72 : 1) * (1 + game.sector * 0.07);
  const speed =
    enemy.attackPattern === "fan"
      ? 80
      : enemy.attackPattern === "cross"
        ? 94
        : enemy.attackPattern === "burst"
          ? 105
          : 88;
  for (const angle of attackAngles(enemy))
    bullet(
      game,
      enemy.x - 8,
      enemy.y,
      Math.cos(angle) * speed * pressure,
      Math.sin(angle) * speed * pressure,
    );
}
export function updateEnemies(game: Game): void {
  for (const enemy of game.enemies) {
    if (enemy.dead) continue;
    enemy.age += STEP;
    if (enemy.formation === "chevron") {
      enemy.x = enemy.originX - enemy.age * 48;
      enemy.y = enemy.baseY + Math.sin(enemy.age * 1.7) * 14;
    } else if (enemy.formation === "weave") {
      enemy.x = enemy.originX - enemy.age * 54;
      enemy.y =
        enemy.baseY + Math.sin(enemy.age * 2.1 - enemy.slot * 0.65) * 42;
    } else if (enemy.formation === "pincer") {
      enemy.x =
        enemy.originX -
        Math.min(enemy.age, 1.8) * 38 -
        Math.max(0, enemy.age - 1.8) * 76;
      const dive = clamp((enemy.age - 1.8) / 3, 0, 1);
      enemy.y =
        enemy.baseY + (HEIGHT / 2 - enemy.baseY) * dive * dive * (3 - 2 * dive);
    } else if (enemy.formation === "wall") {
      enemy.x = enemy.originX - enemy.age * 38;
      enemy.y = enemy.baseY;
    } else {
      enemy.x -=
        (enemy.kind === "diver" ? 78 : enemy.kind === "armored" ? 22 : 37) *
        STEP;
      if (enemy.kind === "diver")
        enemy.y += clamp(game.player.y - enemy.y, -75, 75) * STEP;
      else
        enemy.y =
          enemy.baseY +
          Math.sin(enemy.age * 2.3 + enemy.phase) *
            (enemy.kind === "prism" ? 28 : 14);
    }
    enemy.y = clamp(enemy.y, 22, HEIGHT - 22);
    if (enemy.x < -35) {
      enemy.dead = true;
      resolveSquad(game, enemy, true);
      continue;
    }
    enemy.fire -= STEP;
    // No shots outside the frame, behind the ship, or at contact range.
    if (enemy.x >= WIDTH - 16 || enemy.x <= game.player.x + 100) {
      enemy.fire = Math.max(enemy.fire, 0.85);
      enemy.telegraph = 0;
      enemy.burstLeft = 0;
      continue;
    }
    if (enemy.fire <= 0.75 && enemy.telegraph === 0 && enemy.burstLeft === 0) {
      enemy.targetX = game.player.x;
      enemy.targetY = game.player.y;
      enemy.telegraph = 0.75;
    }
    if (enemy.telegraph > 0)
      enemy.telegraph = Math.max(0.001, enemy.telegraph - STEP);
    if (enemy.fire > 0) continue;
    volley(game, enemy);
    if (
      enemy.attackPattern === "burst" &&
      enemy.burstLeft === 0 &&
      enemy.telegraph > 0
    )
      enemy.burstLeft = 2;
    else if (enemy.burstLeft > 0) enemy.burstLeft--;
    enemy.telegraph = 0;
    enemy.fire =
      enemy.burstLeft > 0
        ? 0.2
        : (game.assist ? 3.6 : 2.8) - game.sector * 0.15;
  }
}
