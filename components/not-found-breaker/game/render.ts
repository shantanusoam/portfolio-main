import { BREAK404_COLORS, GAME_TUNING, POWER_COLORS } from "./config";
import type { Break404Model, Brick } from "./types";

function brickFill(tier: Brick["tier"]): string {
  if (tier === 2) return BREAK404_COLORS.orangeDeep;
  if (tier === 1) return BREAK404_COLORS.orange;
  return BREAK404_COLORS.bone;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  model: Break404Model,
): void {
  const { width, height } = model;
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = BREAK404_COLORS.bg;
  ctx.fillRect(0, 0, width, height);

  // Soft vignette atmosphere — one composition, no card chrome.
  const vignette = ctx.createRadialGradient(
    width * 0.5,
    height * 0.35,
    Math.min(width, height) * 0.15,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.75,
  );
  vignette.addColorStop(0, "rgba(255, 93, 47, 0.05)");
  vignette.addColorStop(0.55, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.45)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  const shake = model.reducedMotion ? 0 : model.shake;
  const ox = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
  const oy = shake > 0 ? (Math.random() - 0.5) * shake * 2 : 0;
  ctx.translate(ox, oy);

  for (const brick of model.bricks) {
    if (!brick.alive) continue;
    const fill = brickFill(brick.tier);
    roundRect(ctx, brick.x, brick.y, brick.w, brick.h, 3);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "rgba(8, 8, 7, 0.35)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Quiet top highlight — not a neon rim.
    ctx.fillStyle = "rgba(238, 233, 223, 0.14)";
    roundRect(ctx, brick.x + 1, brick.y + 1, brick.w - 2, brick.h * 0.28, 2);
    ctx.fill();
  }

  const paddle = model.paddle;
  roundRect(ctx, paddle.x, paddle.y, paddle.w, paddle.h, 6);
  const paddleGrad = ctx.createLinearGradient(
    paddle.x,
    paddle.y,
    paddle.x,
    paddle.y + paddle.h,
  );
  paddleGrad.addColorStop(0, BREAK404_COLORS.bone);
  paddleGrad.addColorStop(1, "#cfc7b8");
  ctx.fillStyle = paddleGrad;
  ctx.fill();

  if (model.time < model.active.wideUntil) {
    ctx.strokeStyle = BREAK404_COLORS.orangeMuted;
    ctx.lineWidth = 1.5;
    roundRect(ctx, paddle.x - 1, paddle.y - 1, paddle.w + 2, paddle.h + 2, 7);
    ctx.stroke();
  }

  const fire = model.time < model.active.fireUntil;
  for (const ball of model.balls) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fillStyle = fire ? BREAK404_COLORS.orangeBright : BREAK404_COLORS.bone;
    ctx.fill();
    if (fire) {
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.r * 1.85, 0, Math.PI * 2);
      ctx.fillStyle = BREAK404_COLORS.orange;
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  for (const power of model.powers) {
    ctx.beginPath();
    ctx.arc(power.x, power.y, power.r, 0, Math.PI * 2);
    ctx.fillStyle = POWER_COLORS[power.kind];
    ctx.fill();
    ctx.fillStyle = BREAK404_COLORS.ink;
    ctx.font = `600 ${Math.max(9, power.r)}px var(--font-data, monospace)`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const letter =
      power.kind === "multi"
        ? "M"
        : power.kind === "wide"
          ? "W"
          : power.kind === "fire"
            ? "F"
            : "S";
    ctx.fillText(letter, power.x, power.y + 0.5);
  }

  for (const p of model.particles) {
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (model.status === "ready") {
    ctx.fillStyle = BREAK404_COLORS.boneMuted;
    ctx.font = `500 14px var(--font-data, monospace)`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "Click / Space to serve  ·  Move with mouse or ← →",
      width / 2,
      paddle.y - 36,
    );
  }

  ctx.restore();

  // Keep unused tuning reference for tree-shake safety on radius defaults.
  void GAME_TUNING.ballRadius;
}
