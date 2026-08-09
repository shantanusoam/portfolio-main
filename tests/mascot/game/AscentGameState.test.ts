import assert from "node:assert/strict";
import { test } from "node:test";

import { AscentGameController } from "@/lib/mascot/game/AscentGameState";
import type { AscentGameState } from "@/lib/mascot/game/GameTypes";

test("starts inactive", () => {
  const controller = new AscentGameController();
  assert.equal(controller.getState(), "inactive");
});

test("a full happy-path run of transitions succeeds in order", () => {
  const controller = new AscentGameController();
  const path: readonly AscentGameState[] = [
    "transitioningIn",
    "ready",
    "playing",
    "sectorComplete",
    "victory",
    "transitioningOut",
    "inactive",
  ];
  for (const next of path) {
    assert.ok(
      controller.transition(next),
      `expected transition to ${next} to succeed`,
    );
  }
});

test("pause and resume round-trip from playing", () => {
  const controller = new AscentGameController();
  controller.transition("transitioningIn");
  controller.transition("ready");
  controller.transition("playing");
  assert.ok(controller.transition("paused"));
  assert.ok(controller.transition("playing"));
  assert.equal(controller.getState(), "playing");
});

test("gameOver can retry back to ready or exit", () => {
  const controller = new AscentGameController();
  controller.transition("transitioningIn");
  controller.transition("ready");
  controller.transition("playing");
  controller.transition("fallingOut");
  assert.ok(controller.transition("gameOver"));
  assert.ok(controller.transition("ready"));
});

test("an invalid transition is rejected and state does not change", () => {
  const controller = new AscentGameController();
  assert.equal(controller.transition("playing"), false);
  assert.equal(controller.getState(), "inactive");
});

test("fallingOut can only reach gameOver, never skip back to playing", () => {
  const controller = new AscentGameController();
  controller.transition("transitioningIn");
  controller.transition("ready");
  controller.transition("playing");
  controller.transition("fallingOut");
  assert.equal(controller.transition("playing"), false);
});

test("listeners are notified on every successful transition", () => {
  const controller = new AscentGameController();
  const seen: string[] = [];
  const unsubscribe = controller.onChange((state: AscentGameState) =>
    seen.push(state),
  );
  controller.transition("transitioningIn");
  controller.transition("ready");
  unsubscribe();
  controller.transition("playing");
  assert.deepEqual(seen, ["transitioningIn", "ready"]);
});

test("reset returns to inactive from any state", () => {
  const controller = new AscentGameController();
  controller.transition("transitioningIn");
  controller.transition("ready");
  controller.transition("playing");
  controller.reset();
  assert.equal(controller.getState(), "inactive");
});
