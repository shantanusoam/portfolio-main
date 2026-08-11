import { GAME_TUNING } from "./config";
import {
  build404BrickSpecs,
  layoutMetricsForCanvas,
} from "./layout404";
import type { Ball, Break404Model, Brick, Paddle } from "./types";

let nextEntityId = 1;

export function nextId(): number {
  nextEntityId += 1;
  return nextEntityId;
}

export function resetEntityIds(seed = 1): void {
  nextEntityId = seed;
}

function createPaddle(width: number, height: number): Paddle {
  const w = GAME_TUNING.paddleWidth;
  const h = GAME_TUNING.paddleHeight;
  return {
    x: width / 2 - w / 2,
    y: height - GAME_TUNING.paddleMarginBottom - h,
    w,
    h,
    baseW: w,
  };
}

function createStuckBall(paddle: Paddle): Ball {
  return {
    id: nextId(),
    x: paddle.x + paddle.w / 2,
    y: paddle.y - GAME_TUNING.ballRadius - 1,
    vx: 0,
    vy: 0,
    r: GAME_TUNING.ballRadius,
    stuck: true,
  };
}

export function createBricks(width: number, height: number): Brick[] {
  const metrics = layoutMetricsForCanvas(width, height);
  const gap = GAME_TUNING.brickGap;
  return build404BrickSpecs().map((spec) => ({
    id: nextId(),
    x: metrics.originX + spec.col * (metrics.brickW + gap),
    y: metrics.originY + spec.row * (metrics.brickH + gap),
    w: metrics.brickW,
    h: metrics.brickH,
    alive: true,
    tier: spec.tier,
  }));
}

export function createModel(
  width: number,
  height: number,
  options?: { muted?: boolean; reducedMotion?: boolean },
): Break404Model {
  const paddle = createPaddle(width, height);
  const bricks = createBricks(width, height);
  return {
    width,
    height,
    status: "ready",
    time: 0,
    lives: GAME_TUNING.lives,
    combo: 0,
    comboTimer: 0,
    score: 0,
    bricks,
    balls: [createStuckBall(paddle)],
    paddle,
    powers: [],
    active: { wideUntil: 0, fireUntil: 0, slowUntil: 0 },
    particles: [],
    shake: 0,
    stillLostTimer: 0,
    muted: options?.muted ?? false,
    reducedMotion: options?.reducedMotion ?? false,
    pointerX: null,
    keys: { left: false, right: false },
    bricksRemaining: bricks.length,
    sfx: [],
  };
}

export function resizeModel(model: Break404Model, width: number, height: number): void {
  const wasStuck = model.balls.every((b) => b.stuck);
  const sx = width / Math.max(1, model.width);
  const sy = height / Math.max(1, model.height);

  model.width = width;
  model.height = height;

  // Rebuild brick field for the new aspect — keep alive flags by index when possible.
  const prevAlive = model.bricks.map((b) => b.alive);
  const nextBricks = createBricks(width, height);
  for (let i = 0; i < nextBricks.length; i += 1) {
    if (prevAlive[i] === false) nextBricks[i].alive = false;
  }
  model.bricks = nextBricks;
  model.bricksRemaining = nextBricks.filter((b) => b.alive).length;

  model.paddle.baseW = GAME_TUNING.paddleWidth;
  const wide = model.time < model.active.wideUntil;
  model.paddle.w = wide ? GAME_TUNING.paddleWideWidth : model.paddle.baseW;
  model.paddle.h = GAME_TUNING.paddleHeight;
  model.paddle.y = height - GAME_TUNING.paddleMarginBottom - model.paddle.h;
  model.paddle.x = Math.min(
    Math.max(0, model.paddle.x * sx),
    width - model.paddle.w,
  );

  for (const ball of model.balls) {
    ball.x *= sx;
    ball.y *= sy;
    if (wasStuck || ball.stuck) {
      ball.stuck = true;
      ball.x = model.paddle.x + model.paddle.w / 2;
      ball.y = model.paddle.y - ball.r - 1;
      ball.vx = 0;
      ball.vy = 0;
    }
  }

  if (model.balls.length === 0) {
    model.balls.push(createStuckBall(model.paddle));
  }
}

export function spawnStuckBall(model: Break404Model): void {
  model.balls = [createStuckBall(model.paddle)];
}
