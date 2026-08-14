import assert from "node:assert/strict";
import { test } from "node:test";

import { GAME_TUNING } from "./config";
import { createModel, resetEntityIds, resizeModel } from "./model";
import {
  applyPowerUp,
  clearAllBricks,
  dropAllBalls,
  updateGame,
} from "./update";

test("model starts with a complete ready-state contract", () => {
  resetEntityIds();
  const model = createModel(900, 620);

  assert.equal(model.status, "ready");
  assert.equal(model.lives, GAME_TUNING.lives);
  assert.equal(model.balls.length, 1);
  assert.equal(model.balls[0].stuck, true);
  assert.ok(model.bricks.length > 0);
  assert.equal(model.bricksRemaining, model.bricks.length);
});

test("launch intent moves the model from ready to playing", () => {
  const model = createModel(900, 620);
  updateGame(model, { dt: 1 / 60, launch: true });

  assert.equal(model.status, "playing");
  assert.equal(model.balls[0].stuck, false);
  assert.ok(model.balls[0].vy < 0);
  assert.ok(model.sfx.includes("launch"));
});

test("clearing every brick produces the terminal win state", () => {
  const model = createModel(900, 620, { reducedMotion: true });
  clearAllBricks(model);

  assert.equal(model.status, "won");
  assert.equal(model.bricksRemaining, 0);
  assert.equal(model.balls.length, 0);
  assert.equal(model.particles.length, 0);
  assert.ok(model.sfx.includes("win"));
});

test("losing the final free ball spends one life and enters recovery", () => {
  const model = createModel(900, 620);
  updateGame(model, { dt: 1 / 60, launch: true });
  dropAllBalls(model);
  updateGame(model, { dt: 1 / 60, launch: false });

  assert.equal(model.lives, GAME_TUNING.lives - 1);
  assert.equal(model.status, "stillLost");
  assert.equal(model.combo, 0);
  assert.equal(model.balls.length, 1);
  assert.equal(model.balls[0].stuck, true);
});

test("recovery returns to ready after the still-lost timer", () => {
  const model = createModel(900, 620);
  model.status = "stillLost";
  model.stillLostTimer = 0.01;

  updateGame(model, { dt: 0.02, launch: false });

  assert.equal(model.status, "ready");
  assert.equal(model.balls.length, 1);
  assert.equal(model.balls[0].stuck, true);
});

test("timed wide power restores the base paddle width", () => {
  const model = createModel(900, 620);
  applyPowerUp(model, "wide");
  assert.equal(model.paddle.w, GAME_TUNING.paddleWideWidth);

  model.time = model.active.wideUntil;
  updateGame(model, { dt: 1 / 60, launch: false });

  assert.equal(model.paddle.w, model.paddle.baseW);
});

test("resize preserves cleared bricks by stable layout index", () => {
  const model = createModel(900, 620);
  model.bricks[0].alive = false;
  model.bricksRemaining -= 1;

  resizeModel(model, 620, 900);

  assert.equal(model.bricks[0].alive, false);
  assert.equal(
    model.bricksRemaining,
    model.bricks.filter((brick) => brick.alive).length,
  );
  assert.ok(model.paddle.x >= 0);
  assert.ok(model.paddle.x + model.paddle.w <= model.width);
});

test("particle creation never exceeds the configured cap", () => {
  const model = createModel(900, 620);
  clearAllBricks(model);

  assert.ok(model.particles.length <= GAME_TUNING.maxParticles);
});
