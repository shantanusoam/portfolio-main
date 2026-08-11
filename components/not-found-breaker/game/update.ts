import { BREAK404_COLORS, GAME_TUNING } from "./config";
import { nextId, spawnStuckBall } from "./model";
import type {
  Ball,
  Break404Input,
  Break404Model,
  Brick,
  FallingPower,
  Particle,
  PowerKind,
} from "./types";

const POWER_KINDS = Object.keys({
  multi: 1,
  wide: 1,
  fire: 1,
  slow: 1,
}) as PowerKind[];

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function randomPowerKind(): PowerKind {
  return POWER_KINDS[Math.floor(Math.random() * POWER_KINDS.length)];
}

function spawnParticles(
  model: Break404Model,
  x: number,
  y: number,
  color: string,
  count: number,
): void {
  if (model.reducedMotion) return;
  const n = Math.min(count, GAME_TUNING.maxParticles - model.particles.length);
  for (let i = 0; i < n; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 180;
    model.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.35 + Math.random() * 0.45,
      maxLife: 0.8,
      color,
      size: 1.5 + Math.random() * 2.5,
    });
  }
}

function brickColor(tier: Brick["tier"]): string {
  if (tier === 2) return BREAK404_COLORS.orangeDeep;
  if (tier === 1) return BREAK404_COLORS.orange;
  return BREAK404_COLORS.bone;
}

function launchBall(ball: Ball, model: Break404Model): void {
  const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.7;
  const speed = GAME_TUNING.ballSpeed;
  ball.stuck = false;
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  if (model.status === "ready") {
    model.status = "playing";
    model.sfx.push("launch");
  }
}

function destroyBrick(model: Break404Model, brick: Brick): void {
  if (!brick.alive) return;
  brick.alive = false;
  model.bricksRemaining = Math.max(0, model.bricksRemaining - 1);
  model.combo += 1;
  model.comboTimer = GAME_TUNING.comboTimeout;
  model.score += 10 * Math.max(1, model.combo);
  model.shake = model.reducedMotion
    ? 0
    : Math.min(10, model.shake + 2.5 + model.combo * 0.15);
  model.sfx.push("hit");

  spawnParticles(
    model,
    brick.x + brick.w / 2,
    brick.y + brick.h / 2,
    brickColor(brick.tier),
    model.reducedMotion ? 0 : 8 + Math.min(12, model.combo),
  );

  if (Math.random() < GAME_TUNING.powerDropChance) {
    model.powers.push({
      id: nextId(),
      kind: randomPowerKind(),
      x: brick.x + brick.w / 2,
      y: brick.y + brick.h / 2,
      r: GAME_TUNING.powerRadius,
      vy: GAME_TUNING.powerFallSpeed,
    });
  }

  if (model.bricksRemaining <= 0) {
    model.status = "won";
    model.balls = [];
    model.powers = [];
    model.sfx.push("win");
  }
}

function circleHitsAabb(
  cx: number,
  cy: number,
  r: number,
  box: { x: number; y: number; w: number; h: number },
): boolean {
  const nearestX = clamp(cx, box.x, box.x + box.w);
  const nearestY = clamp(cy, box.y, box.y + box.h);
  const dx = cx - nearestX;
  const dy = cy - nearestY;
  return dx * dx + dy * dy <= r * r;
}

function bounceBallOffBrick(ball: Ball, brick: Brick): void {
  const nearestX = clamp(ball.x, brick.x, brick.x + brick.w);
  const nearestY = clamp(ball.y, brick.y, brick.y + brick.h);
  const dx = ball.x - nearestX;
  const dy = ball.y - nearestY;
  if (Math.abs(dx) > Math.abs(dy)) {
    ball.vx = Math.abs(ball.vx) * (dx >= 0 ? 1 : -1);
    ball.x = dx >= 0 ? brick.x + brick.w + ball.r : brick.x - ball.r;
  } else {
    ball.vy = Math.abs(ball.vy) * (dy >= 0 ? 1 : -1);
    ball.y = dy >= 0 ? brick.y + brick.h + ball.r : brick.y - ball.r;
  }
}

function reflectOffPaddle(ball: Ball, paddle: Break404Model["paddle"]): void {
  const hit = (ball.x - paddle.x) / paddle.w;
  const offset = clamp(hit, 0, 1) * 2 - 1;
  const angle = -Math.PI / 2 + offset * 1.05;
  const speed = clamp(
    Math.hypot(ball.vx, ball.vy) * 1.02,
    GAME_TUNING.ballSpeed * 0.9,
    GAME_TUNING.ballSpeedMax,
  );
  ball.vx = Math.cos(angle) * speed;
  ball.vy = Math.sin(angle) * speed;
  ball.y = paddle.y - ball.r - 0.5;
}

export function applyPowerUp(model: Break404Model, kind: PowerKind): void {
  if (kind === "multi") {
    const source =
      model.balls.find((b) => !b.stuck) ?? model.balls[0] ?? null;
    if (!source) return;
    for (let i = 0; i < GAME_TUNING.multiExtraBalls; i += 1) {
      const angle = -Math.PI / 2 + (i === 0 ? -0.45 : 0.45);
      const speed = Math.max(
        GAME_TUNING.ballSpeed * 0.95,
        Math.hypot(source.vx, source.vy),
      );
      model.balls.push({
        id: nextId(),
        x: source.x,
        y: source.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: GAME_TUNING.ballRadius,
        stuck: false,
      });
    }
    return;
  }

  if (kind === "wide") {
    model.active.wideUntil = model.time + GAME_TUNING.wideDuration;
    model.paddle.w = GAME_TUNING.paddleWideWidth;
    model.paddle.x = clamp(
      model.paddle.x,
      0,
      model.width - model.paddle.w,
    );
    return;
  }

  if (kind === "fire") {
    model.active.fireUntil = model.time + GAME_TUNING.fireDuration;
    return;
  }

  model.active.slowUntil = model.time + GAME_TUNING.slowDuration;
}

function updatePaddle(model: Break404Model, dt: number): void {
  const wide = model.time < model.active.wideUntil;
  model.paddle.w = wide ? GAME_TUNING.paddleWideWidth : model.paddle.baseW;

  if (model.pointerX !== null) {
    model.paddle.x = model.pointerX - model.paddle.w / 2;
  } else {
    let dir = 0;
    if (model.keys.left) dir -= 1;
    if (model.keys.right) dir += 1;
    model.paddle.x += dir * GAME_TUNING.paddleSpeedKeyboard * dt;
  }

  model.paddle.x = clamp(model.paddle.x, 0, model.width - model.paddle.w);

  for (const ball of model.balls) {
    if (!ball.stuck) continue;
    ball.x = model.paddle.x + model.paddle.w / 2;
    ball.y = model.paddle.y - ball.r - 1;
  }
}

function updateBalls(model: Break404Model, dt: number): void {
  const fire = model.time < model.active.fireUntil;
  const alive: Ball[] = [];

  for (const ball of model.balls) {
    if (ball.stuck) {
      alive.push(ball);
      continue;
    }

    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    if (ball.x - ball.r < 0) {
      ball.x = ball.r;
      ball.vx = Math.abs(ball.vx);
    } else if (ball.x + ball.r > model.width) {
      ball.x = model.width - ball.r;
      ball.vx = -Math.abs(ball.vx);
    }

    if (ball.y - ball.r < 0) {
      ball.y = ball.r;
      ball.vy = Math.abs(ball.vy);
    }

    if (
      ball.vy > 0 &&
      circleHitsAabb(ball.x, ball.y, ball.r, model.paddle)
    ) {
      reflectOffPaddle(ball, model.paddle);
    }

    for (const brick of model.bricks) {
      if (!brick.alive) continue;
      if (!circleHitsAabb(ball.x, ball.y, ball.r, brick)) continue;
      destroyBrick(model, brick);
      if (!fire) bounceBallOffBrick(ball, brick);
      if (model.status === "won") break;
    }

    if (model.status === "won") return;

    if (ball.y - ball.r > model.height + 20) {
      continue;
    }
    alive.push(ball);
  }

  model.balls = alive;
}

function updatePowers(model: Break404Model, dt: number): void {
  const kept: FallingPower[] = [];
  for (const power of model.powers) {
    power.y += power.vy * dt;
    if (power.y - power.r > model.height) continue;

    if (circleHitsAabb(power.x, power.y, power.r, model.paddle)) {
      applyPowerUp(model, power.kind);
      model.sfx.push("power");
      spawnParticles(
        model,
        power.x,
        power.y,
        BREAK404_COLORS.orangeBright,
        10,
      );
      continue;
    }
    kept.push(power);
  }
  model.powers = kept;

  if (model.time >= model.active.wideUntil) {
    model.paddle.w = model.paddle.baseW;
    model.paddle.x = clamp(
      model.paddle.x,
      0,
      model.width - model.paddle.w,
    );
  }
}

function updateParticles(model: Break404Model, dt: number): void {
  const next: Particle[] = [];
  for (const p of model.particles) {
    p.life -= dt;
    if (p.life <= 0) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 280 * dt;
    next.push(p);
  }
  model.particles = next;
}

/**
 * Advances simulation by one frame. Pure aside from Math.random for drops.
 */
export function updateGame(model: Break404Model, input: Break404Input): void {
  if (model.status === "won" || model.status === "gameOver") return;

  model.sfx.length = 0;

  const slow = model.time < model.active.slowUntil;
  const dt = input.dt * (slow ? GAME_TUNING.slowScale : 1);
  model.time += dt;

  if (model.status === "stillLost") {
    model.stillLostTimer -= input.dt;
    updatePaddle(model, dt);
    if (model.stillLostTimer <= 0) {
      model.status = "ready";
      spawnStuckBall(model);
    }
    model.shake = Math.max(0, model.shake - GAME_TUNING.shakeDecay * input.dt);
    updateParticles(model, input.dt);
    return;
  }

  updatePaddle(model, dt);

  if (input.launch) {
    for (const ball of model.balls) {
      if (ball.stuck) launchBall(ball, model);
    }
  }

  if (model.status === "ready" || model.status === "playing") {
    updateBalls(model, dt);
    updatePowers(model, dt);

    if (
      model.status === "playing" &&
      model.balls.length === 0 &&
      model.bricksRemaining > 0
    ) {
      model.lives -= 1;
      model.combo = 0;
      model.comboTimer = 0;
      model.powers = [];
      model.sfx.push("lose");
      if (model.lives <= 0) {
        model.status = "gameOver";
      } else {
        model.status = "stillLost";
        model.stillLostTimer = GAME_TUNING.stillLostFlash;
        spawnStuckBall(model);
      }
    }
  }

  if (model.comboTimer > 0) {
    model.comboTimer -= dt;
    if (model.comboTimer <= 0) model.combo = 0;
  }

  model.shake = Math.max(0, model.shake - GAME_TUNING.shakeDecay * input.dt);
  updateParticles(model, input.dt);
}

/** Test helper: destroy every alive brick (triggers win). */
export function clearAllBricks(model: Break404Model): void {
  for (const brick of model.bricks) {
    if (brick.alive) destroyBrick(model, brick);
  }
}

/** Test helper: force all free balls off-screen. */
export function dropAllBalls(model: Break404Model): void {
  for (const ball of model.balls) {
    ball.stuck = false;
    ball.y = model.height + 100;
    ball.vy = 200;
  }
}

export type { PowerKind };
