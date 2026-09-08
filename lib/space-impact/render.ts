import { clamp, HEIGHT, WEAPONS, WIDTH } from "./config";
import { bossVulnerable } from "./content/bosses";
import { SECTORS } from "./content/sectors";
import { noise } from "./random";
import type { Boss, Enemy, Game, Settings } from "./types";

const SHIP = [
  "      22               ",
  "     2332              ",
  "   222333222           ",
  "122333344333222        ",
  "123333344433333222     ",
  "123333344443333333332  ",
  "123333344433333222     ",
  "122333344333222        ",
  "   222333222           ",
  "     2332              ",
  "      22               ",
];
const SCOUT = [
  "    2222    ",
  "  22333322  ",
  "223333333322",
  "233422443332",
  "223422443322",
  "  22333322  ",
  "    2222    ",
];
const BIRD = [
  "     55     ",
  "    5335    ",
  "   333335   ",
  "  33423332  ",
  "  33333211  ",
  "2233333332  ",
  " 2333333322 ",
  "  2333332   ",
  "    11      ",
];
type Palette = {
  accent: string;
  ink: string;
  body: string;
  light: string;
  danger: string;
  muted: string;
  lcd: boolean;
};
function colors(game: Game, settings: Settings): Palette {
  if (settings.skin === "lcd")
    return {
      accent: "#b5ce76",
      ink: "#192d24",
      body: "#678950",
      light: "#d2e6a1",
      danger: "#d2e6a1",
      muted: "#45603d",
      lcd: true,
    };
  return {
    accent: SECTORS[game.sector].color,
    ink: "#080f16",
    body: "#677b88",
    light: "#eef8e5",
    danger: settings.highContrast ? "#ffff87" : "#ff957f",
    muted: "#253640",
    lcd: false,
  };
}
function pixels(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  x: number,
  y: number,
  palette: string[],
  scale = 1,
): void {
  const left = Math.round(x - (rows[0].length * scale) / 2);
  const top = Math.round(y - (rows.length * scale) / 2);
  rows.forEach((row, j) => {
    for (let i = 0; i < row.length; i++) {
      const id = Number(row[i]);
      if (id > 0) {
        ctx.fillStyle = palette[id - 1];
        ctx.fillRect(left + i * scale, top + j * scale, scale, scale);
      }
    }
  });
}
function polygon(
  ctx: CanvasRenderingContext2D,
  points: number[][],
  fill: string,
  stroke?: string,
): void {
  ctx.beginPath();
  points.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}
function ring(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  width = 1,
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}
function background(
  ctx: CanvasRenderingContext2D,
  game: Game,
  palette: Palette,
  settings: Settings,
  backdrop: HTMLImageElement | null,
): void {
  ctx.fillStyle = palette.lcd ? "#233b2c" : SECTORS[game.sector].dark;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  if (backdrop && !palette.lcd) {
    ctx.globalAlpha = game.status === "ready" ? 0.86 : 0.28;
    ctx.drawImage(backdrop, 0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
  }
  const time = settings.reducedMotion ? 0 : game.tick / 60;
  for (let layer = 0; layer < (settings.lowEffects ? 1 : 3); layer++) {
    ctx.fillStyle = layer === 2 ? palette.light : palette.accent;
    ctx.globalAlpha = 0.18 + layer * 0.14;
    for (let i = 0; i < 44; i++) {
      const x =
        (((noise(i + layer * 91) * WIDTH - time * (5 + layer * 9)) % WIDTH) +
          WIDTH) %
        WIDTH;
      const y = noise(i + layer * 119 + 700) * HEIGHT;
      ctx.fillRect(
        Math.floor(x),
        Math.floor(y),
        layer === 2 && i % 7 === 0 ? 2 : 1,
        1,
      );
    }
  }
  ctx.globalAlpha = 1;
  // Sector architecture is game-native geometry, tied to terrain and boss silhouettes.
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = palette.accent;
  if (game.sector === 1) {
    for (let i = 0; i < 14; i++) {
      const x = ((((i * 47 - time * 9) % 650) + 650) % 650) - 60;
      const length = 20 + noise(i + 12) * 45;
      polygon(
        ctx,
        [
          [x, 0],
          [x + 22, length],
          [x + 34, 0],
        ],
        palette.accent,
      );
      polygon(
        ctx,
        [
          [x - 20, HEIGHT],
          [x + 5, HEIGHT - length],
          [x + 15, HEIGHT],
        ],
        palette.accent,
      );
    }
  } else if (game.sector === 2) {
    for (let i = 0; i < 10; i++) {
      const x = ((((i * 70 - time * 7) % 700) + 700) % 700) - 70;
      ctx.fillRect(x, 0, 9, 65);
      ctx.fillRect(x, 215, 9, 55);
      ctx.fillRect(x, 40, 32, 4);
      ctx.fillRect(x - 15, 225, 35, 4);
    }
  } else if (game.sector === 3) {
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      for (let x = 0; x <= WIDTH; x += 8) {
        const y = 32 + i * 31 + Math.sin(x / 70 + i + time * 0.22) * 16;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = palette.accent;
      ctx.stroke();
    }
  } else if (game.sector === 4) {
    ring(ctx, 400, 135, 100, palette.accent, 6);
    ring(ctx, 400, 135, 80, palette.accent, 2);
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4 + time * 0.025;
      ctx.fillRect(
        400 + Math.cos(a) * 93 - 3,
        135 + Math.sin(a) * 93 - 7,
        6,
        14,
      );
    }
  }
  ctx.globalAlpha = 1;
}
function drawEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  p: Palette,
): void {
  if (enemy.kind === "clucker") {
    pixels(
      ctx,
      BIRD,
      enemy.x,
      enemy.y,
      ["#e0a955", "#ab7057", "#f2e3b2", "#213442", "#d78674"],
      2,
    );
  } else if (enemy.kind === "prism") {
    polygon(
      ctx,
      [
        [enemy.x - 16, enemy.y],
        [enemy.x, enemy.y - 13],
        [enemy.x + 14, enemy.y],
        [enemy.x, enemy.y + 13],
      ],
      p.ink,
      p.accent,
    );
    polygon(
      ctx,
      [
        [enemy.x - 8, enemy.y],
        [enemy.x, enemy.y - 6],
        [enemy.x + 6, enemy.y],
        [enemy.x, enemy.y + 6],
      ],
      p.accent,
    );
  } else if (enemy.kind === "armored") {
    ctx.fillStyle = p.body;
    ctx.fillRect(enemy.x - 13, enemy.y - 12, 26, 24);
    ctx.fillStyle = p.ink;
    ctx.fillRect(enemy.x - 9, enemy.y - 9, 17, 18);
    ctx.fillStyle = p.danger;
    ctx.fillRect(enemy.x - 16, enemy.y - 8, 10, 4);
    ctx.fillRect(enemy.x - 16, enemy.y + 4, 10, 4);
    ctx.fillStyle = p.light;
    ctx.fillRect(enemy.x - 7, enemy.y - 3, 5, 6);
  } else if (enemy.kind === "choir") {
    for (let j = 3; j >= 0; j--) {
      const y = enemy.y + Math.sin(enemy.age * 5 - j) * 4;
      ctx.fillStyle = j ? p.body : p.accent;
      ctx.fillRect(enemy.x + j * 7 - 8, y - 5, 8, 10);
    }
    ctx.fillStyle = p.light;
    ctx.fillRect(enemy.x - 9, enemy.y - 2, 3, 3);
  } else {
    pixels(
      ctx,
      SCOUT,
      enemy.x,
      enemy.y,
      [p.danger, p.body, p.ink, p.danger],
      enemy.kind === "diver" ? 1.6 : 1.8,
    );
    if (enemy.kind === "sentry") {
      ctx.fillStyle = p.danger;
      ctx.fillRect(enemy.x - 16, enemy.y - 2, 8, 4);
    }
  }
}
function drawBoss(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  game: Game,
  p: Palette,
): void {
  if (game.bossDefeated) return;
  const x = Math.round(boss.x);
  const y = Math.round(boss.y);
  const open = bossVulnerable(boss);
  if (game.sector === 1 || game.sector === 3) {
    for (let i = 7; i >= 1; i--) {
      const sx = x + i * 13;
      const sy =
        y + Math.sin(boss.age * 2 - i * 0.5) * (game.sector === 3 ? 25 : 18);
      const r = 24 - i * 1.7;
      polygon(
        ctx,
        [
          [sx - r, sy],
          [sx, sy - r],
          [sx + r, sy],
          [sx, sy + r],
        ],
        p.ink,
        p.body,
      );
      ctx.fillStyle = p.accent;
      ctx.fillRect(sx - 2, sy - 6, 4, 12);
    }
  }
  if (game.sector === 2) {
    ctx.fillStyle = p.body;
    ctx.fillRect(x - 35, y - 43, 76, 86);
    ctx.fillStyle = p.ink;
    ctx.fillRect(x - 29, y - 35, 63, 70);
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = p.body;
      ctx.fillRect(
        x + 15 + i * 14,
        y - 50 - (i % 2) * 10,
        7,
        105 + (i % 2) * 20,
      );
    }
  } else {
    polygon(
      ctx,
      [
        [x - 38, y - 14],
        [x - 24, y - 38],
        [x + 24, y - 42],
        [x + 45, y - 20],
        [x + 45, y + 20],
        [x + 24, y + 42],
        [x - 24, y + 38],
        [x - 38, y + 14],
      ],
      p.ink,
      p.body,
    );
    ring(ctx, x, y, 30, p.body, 3);
    if (game.sector === 4) {
      ring(ctx, x, y, 52, p.accent, 1);
      for (let i = 0; i < 6; i++) {
        const a = boss.age * 0.35 + (i * Math.PI) / 3;
        ctx.fillStyle = p.accent;
        ctx.fillRect(x + Math.cos(a) * 53 - 3, y + Math.sin(a) * 53 - 3, 6, 6);
      }
    }
  }
  boss.parts.forEach((part) => {
    const cy = y + part.y;
    ctx.fillStyle = part.hp > 0 ? p.body : p.ink;
    ctx.fillRect(x - 31, cy - 9, 27, 18);
    if (part.hp > 0) {
      ctx.fillStyle = p.danger;
      ctx.fillRect(x - 35, cy - 3, 15, 6);
      ctx.fillStyle = p.accent;
      ctx.fillRect(x - 25, cy + 11, (20 * part.hp) / part.maxHp, 2);
    }
  });
  ctx.fillStyle = open ? p.accent : p.body;
  ctx.fillRect(x - 17, y - (open ? 10 : 3), 25, open ? 20 : 6);
  ctx.fillStyle = p.light;
  ctx.fillRect(x - 12, y - (open ? 5 : 1), open ? 9 : 4, open ? 10 : 2);
  if (boss.transition > 0)
    ring(ctx, x, y, 36 + (1.2 - boss.transition) * 24, p.light);
  if (boss.telegraph > 0) {
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = p.danger;
    if (game.sector === 0 || game.sector === 2)
      ctx.fillRect(0, boss.targetY - 7, x - 30, 14);
    if (game.sector === 4) {
      ctx.fillRect(0, 0, x - 25, Math.max(0, boss.targetY - 38));
      ctx.fillRect(0, boss.targetY + 38, x - 25, HEIGHT - boss.targetY - 38);
    }
    ctx.globalAlpha = 0.8;
    ctx.strokeStyle = p.danger;
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    if (game.sector === 0 || game.sector === 2 || game.sector === 4) {
      ctx.beginPath();
      ctx.moveTo(0, boss.targetY);
      ctx.lineTo(x - 25, boss.targetY);
      ctx.stroke();
    } else {
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.moveTo(x - 25, y);
        ctx.lineTo(20, clamp(y + i * 110, 15, 255));
        ctx.stroke();
      }
    }
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
    ring(ctx, x - 6, y, 18 + boss.telegraph * 9, p.danger);
  }
}
function drawFeatures(
  ctx: CanvasRenderingContext2D,
  game: Game,
  p: Palette,
): void {
  for (const feature of game.features) {
    const x = Math.round(feature.x);
    const y = Math.round(feature.y);
    if (feature.kind === "window") {
      ctx.fillStyle = p.body;
      ctx.fillRect(x - 20, y - 14, 40, 28);
      ctx.fillStyle = p.ink;
      ctx.fillRect(x - 16, y - 10, 32, 20);
      ctx.fillStyle = Math.floor(game.tick / 40) % 2 === 0 ? p.light : p.muted;
      ctx.fillRect(x - 7, y - 5, 14, 10);
    } else if (feature.kind === "planet") {
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 7);
      ctx.fill();
      ring(ctx, x, y, 13, p.muted);
    } else if (feature.kind === "portal") {
      ring(ctx, x, y, 22, p.accent, 2);
      ring(ctx, x, y, 16, p.body);
      ctx.fillStyle = p.light;
      ctx.fillRect(x - 2, y - 7, 4, 14);
    } else if (feature.kind === "ghost") {
      ctx.globalAlpha = 0.45;
      pixels(ctx, SHIP, x, y, [p.accent, p.accent, p.ink, p.light], 1.2);
      ring(ctx, x, y, 24, p.muted);
      ctx.globalAlpha = 1;
    } else {
      polygon(
        ctx,
        [
          [x, y - 12],
          [x + 10, y],
          [x, y + 12],
          [x - 10, y],
        ],
        p.ink,
        p.accent,
      );
      ctx.fillStyle = p.light;
      ctx.fillRect(x - 3, y - 3, 6, 6);
      if (feature.kind === "probe" && feature.progress > 0) {
        ctx.strokeStyle = p.light;
        ctx.beginPath();
        ctx.arc(
          x,
          y,
          19,
          -Math.PI / 2,
          -Math.PI / 2 + (feature.progress / 5) * Math.PI * 2,
        );
        ctx.stroke();
      }
    }
  }
}
export function renderGame(
  ctx: CanvasRenderingContext2D,
  game: Game,
  settings: Settings,
  backdrop: HTMLImageElement | null,
): void {
  const p = colors(game, settings);
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  background(ctx, game, p, settings, backdrop);
  if (game.shake > 0 && !settings.reducedMotion)
    ctx.translate(
      Math.sin(game.tick * 7) * game.shake,
      Math.cos(game.tick * 11) * game.shake * 0.4,
    );
  if (game.room?.kind === "glitch") {
    ctx.fillStyle = p.accent;
    ctx.globalAlpha = 0.09;
    for (let i = 0; i < 7; i++)
      ctx.fillRect(
        noise(i + Math.floor(game.tick / 12)) * WIDTH,
        i * 39,
        80,
        3,
      );
    ctx.globalAlpha = 1;
  }
  if (game.room?.kind === "observatory") {
    const gradient = ctx.createRadialGradient(335, 135, 10, 335, 135, 64);
    gradient.addColorStop(0, p.accent);
    gradient.addColorStop(0.8, p.body);
    gradient.addColorStop(1, p.ink);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(335, 135, 64, 0, 7);
    ctx.fill();
    ctx.fillStyle = p.ink;
    ctx.beginPath();
    ctx.arc(358, 128, 62, 0, 7);
    ctx.fill();
  }
  for (const item of game.terrain) {
    ctx.fillStyle = p.ink;
    ctx.fillRect(item.x, item.y, item.w, item.h);
    ctx.strokeStyle = p.body;
    ctx.lineWidth = 2;
    ctx.strokeRect(item.x + 1, item.y + 1, item.w - 2, Math.max(0, item.h - 2));
    ctx.fillStyle = item.kind === "glass" ? p.accent : p.body;
    ctx.fillRect(
      item.x + 4,
      item.y === 0 ? item.h - 5 : item.y + 2,
      item.w - 8,
      3,
    );
  }
  drawFeatures(ctx, game, p);
  for (const item of game.pickups) {
    const x = Math.round(item.x);
    const y = Math.round(item.y + Math.sin(item.age * 3) * 2);
    const color =
      item.kind in WEAPONS
        ? WEAPONS[item.kind as keyof typeof WEAPONS].color
        : p.accent;
    const c = p.lcd ? p.light : color;
    polygon(
      ctx,
      [
        [x, y - 8],
        [x + 8, y],
        [x, y + 8],
        [x - 8, y],
      ],
      p.ink,
      c,
    );
    ctx.fillStyle = c;
    if (item.kind === "repair") {
      ctx.fillRect(x - 4, y - 1, 8, 2);
      ctx.fillRect(x - 1, y - 4, 2, 8);
    } else if (item.kind === "feather") {
      polygon(
        ctx,
        [
          [x - 4, y + 5],
          [x, y - 5],
          [x + 4, y - 2],
          [x + 1, y + 3],
        ],
        p.lcd ? p.light : "#ffd68c",
      );
    } else if (item.kind === "rail") ctx.fillRect(x - 5, y - 1, 10, 2);
    else if (item.kind === "split") {
      ctx.fillRect(x - 1, y - 4, 2, 2);
      ctx.fillRect(x + 3, y - 1, 2, 2);
      ctx.fillRect(x - 1, y + 3, 2, 2);
    } else ctx.fillRect(x - 2, y - 2, 4, 4);
  }
  for (const enemy of game.enemies) if (!enemy.dead) drawEnemy(ctx, enemy, p);
  if (game.boss) drawBoss(ctx, game.boss, game, p);
  for (const b of game.bullets) {
    if (b.dead) continue;
    if (b.enemy) {
      ctx.fillStyle = p.ink;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius + 1.5, 0, 7);
      ctx.fill();
      ctx.fillStyle = p.danger;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.radius, 0, 7);
      ctx.fill();
      ctx.fillStyle = p.light;
      ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
    } else {
      ctx.fillStyle = p.lcd ? p.light : WEAPONS[game.player.weapon].color;
      ctx.fillRect(
        Math.round(b.x) - (b.rail ? 22 : 6),
        Math.round(b.y) - 1,
        b.rail ? 25 : 9,
        b.rail ? 3 : 2,
      );
    }
  }
  const player = game.player;
  if (game.status !== "dead") {
    if (player.invincible > 0) ring(ctx, player.x, player.y, 16, p.accent);
    ctx.globalAlpha = player.invincible > 0 && game.tick % 12 < 5 ? 0.65 : 1;
    const flame = 4 + Math.floor(noise(game.tick) * 7);
    ctx.fillStyle = p.lcd ? p.accent : "#e6ac75";
    ctx.fillRect(player.x - 15 - flame, player.y - 2, flame, 4);
    ctx.fillStyle = p.light;
    ctx.fillRect(player.x - 17, player.y - 1, 5, 2);
    if (game.secrets.includes("signal")) {
      // Recovered constellation livery is cosmetic; the hitbox stays unchanged.
      ctx.fillStyle = p.lcd ? p.light : "#f4cf88";
      ctx.fillRect(player.x - 8, player.y - 10, 13, 2);
      ctx.fillRect(player.x - 8, player.y + 8, 13, 2);
      ctx.fillRect(player.x - 12, player.y - 7, 3, 14);
    }
    pixels(
      ctx,
      SHIP,
      player.x,
      player.y,
      [p.lcd ? p.body : "#c78659", p.body, p.light, p.accent],
      1.15,
    );
    ctx.globalAlpha = 1;
    if (settings.highContrast) {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(player.x - 1, player.y - 1, 2, 2);
    }
    if (game.companion) {
      ctx.fillStyle = p.accent;
      ctx.fillRect(
        player.x - 27,
        player.y - 17 + Math.sin(game.tick / 20) * 3,
        5,
        5,
      );
    }
  }
  if (game.ghostPlayback > 0 && game.ghost?.points.length) {
    const index = Math.min(
      game.ghost.points.length - 1,
      Math.floor((12 - game.ghostPlayback) * 5),
    );
    const point = game.ghost.points[index];
    ctx.globalAlpha = 0.32;
    pixels(
      ctx,
      SHIP,
      point.x,
      point.y,
      [p.accent, p.accent, p.ink, p.light],
      1.15,
    );
    ctx.globalAlpha = 1;
  }
  if (!settings.lowEffects)
    for (const particle of game.particles) {
      ctx.globalAlpha = particle.life / particle.maxLife;
      ctx.fillStyle = p.lcd ? p.accent : particle.color;
      ctx.fillRect(
        Math.floor(particle.x),
        Math.floor(particle.y),
        particle.size,
        particle.size,
      );
    }
  ctx.globalAlpha = 1;
  if (game.pulseTime > 0) {
    ring(ctx, player.x, player.y, (1 - game.pulseTime / 0.6) * 240, p.light, 2);
    if (!settings.lowFlashes) {
      ctx.globalAlpha = game.pulseTime / 6;
      ctx.fillStyle = p.light;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.globalAlpha = 1;
    }
  }
  // A quiet raster texture. No temporal flashing, and no gameplay obstruction.
  if (p.lcd && !settings.lowEffects) {
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = p.ink;
    for (let y = 0; y < HEIGHT; y += 3) ctx.fillRect(0, y, WIDTH, 1);
  }
  ctx.restore();
}
