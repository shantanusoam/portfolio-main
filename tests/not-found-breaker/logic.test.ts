import assert from "node:assert/strict";
import { test } from "node:test";

import { GAME_TUNING } from "@/components/not-found-breaker/game/config";
import {
  build404BrickSpecs,
  count404Cells,
} from "@/components/not-found-breaker/game/layout404";
import { createModel, resetEntityIds } from "@/components/not-found-breaker/game/model";
import {
  applyPowerUp,
  clearAllBricks,
  dropAllBalls,
  updateGame,
} from "@/components/not-found-breaker/game/update";

test("404 layout spells enough bricks for a readable numeral field", () => {
  const specs = build404BrickSpecs();
  assert.equal(specs.length, count404Cells());
  assert.ok(specs.length >= 40, `expected dense 404, got ${specs.length}`);
  assert.ok(specs.every((s) => s.col >= 0 && s.row >= 0 && s.row < 7));
});

test("fresh model starts ready with a stuck ball and full lives", () => {
  resetEntityIds();
  const model = createModel(800, 600);
  assert.equal(model.status, "ready");
  assert.equal(model.lives, GAME_TUNING.lives);
  assert.equal(model.balls.length, 1);
  assert.equal(model.balls[0].stuck, true);
  assert.equal(model.bricksRemaining, model.bricks.length);
  assert.ok(model.bricksRemaining > 0);
});

test("clearing every brick wins the run", () => {
  resetEntityIds();
  const model = createModel(900, 700);
  model.status = "playing";
  clearAllBricks(model);
  assert.equal(model.bricksRemaining, 0);
  assert.equal(model.status, "won");
  assert.ok(model.sfx.includes("win"));
});

test("dropping the last ball spends a life and flashes still lost", () => {
  resetEntityIds();
  const model = createModel(800, 600);
  model.status = "playing";
  model.balls[0].stuck = false;
  dropAllBalls(model);
  updateGame(model, { dt: 1 / 60, launch: false });
  assert.equal(model.lives, GAME_TUNING.lives - 1);
  assert.equal(model.status, "stillLost");
  assert.ok(model.sfx.includes("lose"));
});

test("wide power-up expands the paddle for a duration", () => {
  resetEntityIds();
  const model = createModel(800, 600);
  const before = model.paddle.w;
  applyPowerUp(model, "wide");
  assert.ok(model.paddle.w > before);
  assert.equal(model.paddle.w, GAME_TUNING.paddleWideWidth);
  assert.ok(model.active.wideUntil > model.time);
});

test("multi power-up adds extra free balls", () => {
  resetEntityIds();
  const model = createModel(800, 600);
  model.status = "playing";
  model.balls[0].stuck = false;
  model.balls[0].vx = 100;
  model.balls[0].vy = -200;
  applyPowerUp(model, "multi");
  assert.equal(model.balls.length, 1 + GAME_TUNING.multiExtraBalls);
  assert.ok(model.balls.every((b) => !b.stuck));
});

test("launch from ready begins play", () => {
  resetEntityIds();
  const model = createModel(800, 600);
  updateGame(model, { dt: 1 / 60, launch: true });
  assert.equal(model.status, "playing");
  assert.equal(model.balls[0].stuck, false);
  assert.ok(model.sfx.includes("launch"));
});
