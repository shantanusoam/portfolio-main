import { clamp, HEIGHT } from "../config";
import { aim, bullet, message, sound } from "../combat";
import { SECTORS } from "./sectors";
import type { Boss, Game } from "../types";

export function createBoss(game: Game, truePhase = false): Boss {
  const hp =
    (truePhase ? 520 : 860 + game.sector * 130) * (game.assist ? 0.85 : 1);
  return {
    x: 540,
    y: HEIGHT / 2,
    hp,
    maxHp: hp,
    phase: 1,
    age: 0,
    attack: 2.6,
    telegraph: 0,
    attackAge: 0,
    pattern: 0,
    targetY: HEIGHT / 2,
    parts: [0, 1].map((id) => ({ id, y: id ? 32 : -32, hp: 65, maxHp: 65 })),
    awakened: false,
    transition: 0,
    truePhase,
  };
}
export function bossVulnerable(boss: Boss): boolean {
  return (
    boss.awakened &&
    boss.transition <= 0 &&
    boss.telegraph <= 0 &&
    boss.attackAge > 0.5
  );
}
export function updateBoss(game: Game, dt: number): void {
  const boss = game.boss;
  if (!boss) return;
  boss.age += dt;
  if (!boss.awakened) {
    boss.x += (390 - boss.x) * Math.min(1, dt * 1.5);
    if (boss.age >= 2.2) {
      boss.awakened = true;
      boss.x = 390;
    }
    return;
  }
  const phase =
    boss.hp / boss.maxHp < 0.33 ? 3 : boss.hp / boss.maxHp < 0.66 ? 2 : 1;
  if (phase > boss.phase) {
    boss.phase = phase;
    boss.transition = 1.2;
    boss.attack = 1.6;
    boss.telegraph = 0;
    game.bullets = game.bullets.filter((item) => !item.enemy);
    message(
      game,
      "Pattern " + phase,
      phase === 3
        ? "The core is exposed. Make it count."
        : "It is learning your language.",
      2.5,
    );
    sound(game, "warning");
  }
  if (boss.transition > 0) {
    boss.transition -= dt;
    return;
  }
  boss.y =
    135 +
    Math.sin(boss.age * (game.sector === 1 ? 0.9 : 0.45)) *
      (game.sector === 1 ? 48 : 22);
  boss.attackAge += dt;
  boss.attack -= dt;
  if (boss.attack <= 0) {
    boss.pattern++;
    boss.targetY = clamp(game.player.y, 45, 225);
    boss.telegraph = game.assist ? 1.2 : 0.95;
    boss.attackAge = 0;
    boss.attack = 3.9 - phase * 0.18;
    sound(game, "warning");
  }
  if (boss.telegraph > 0) {
    boss.telegraph -= dt;
    if (boss.telegraph > 0) return;
    boss.attackAge = 0;
    const speed = (game.assist ? 60 : 78) + phase * 8;
    if (game.sector === 0) {
      // A fixed aimed lane, followed by independently destructible cannons.
      for (let i = 0; i < 8; i++)
        bullet(game, boss.x - 30 + i * 20, boss.targetY, -200, 0);
      boss.parts
        .filter((part) => part.hp > 0)
        .forEach((part) => {
          aim(
            game,
            boss.x - 12,
            boss.y + part.y,
            speed,
            0.22,
            phase === 3 ? 3 : 1,
          );
        });
    } else if (game.sector === 1) {
      // Symmetric diagonal reflections leave a central passage.
      for (let i = 0; i < 7 + phase; i++) {
        const a = Math.PI - 0.65 + (i * 1.3) / (6 + phase);
        bullet(
          game,
          boss.x - 20,
          boss.y,
          Math.cos(a) * speed,
          Math.sin(a) * speed,
        );
      }
    } else if (game.sector === 2) {
      boss.parts
        .filter((part) => part.hp > 0)
        .forEach((part) => {
          aim(game, boss.x - 35, boss.y + part.y, speed, 0.15, 2 + phase);
        });
      // One clearly marked horizontal band, never a complete wall.
      for (let i = 0; i < 4; i++)
        bullet(game, boss.x - 25 + i * 22, boss.targetY, -145, 0);
    } else if (game.sector === 3) {
      const gap = boss.pattern % 2 ? 1 : -1;
      for (let i = -4; i <= 4; i++) {
        if (i === gap || i === 0) continue;
        const angle = Math.PI + i * 0.18;
        bullet(
          game,
          boss.x - 25,
          boss.y,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
        );
      }
      aim(game, boss.x - 60, boss.y, speed * 0.8, 0.12, 2);
    } else {
      const gapY = boss.targetY;
      for (let y = 25; y < 260; y += 22) {
        if (Math.abs(y - gapY) < (game.assist ? 49 : 38)) continue;
        bullet(game, boss.x - 20, y, -(game.assist ? 65 : 85), 0);
      }
      if (boss.truePhase) {
        aim(game, boss.x, 35, 70, 0.15, 2);
        aim(game, boss.x, 235, 70, 0.15, 2);
      }
    }
  }
}
export function announceBoss(game: Game): void {
  game.enemies = [];
  game.terrain = [];
  game.features = [];
  game.bullets = [];
  game.boss = createBoss(game);
  message(
    game,
    SECTORS[game.sector].bossName,
    "Something in the dark just woke up.",
    3.5,
  );
  sound(game, "warning");
}
