import assert from "node:assert/strict";
import { test } from "node:test";

import {
  BehaviorMachine,
  type BehaviorRegistry,
} from "@/lib/mascot/behavior/BehaviorMachine";
import type { MascotBehavior, MotionRecipe } from "@/lib/mascot/types";

interface TestContext {
  log: string[];
  blockExit: boolean;
}

const recipe: MotionRecipe = { frequency: 1, damping: 1, response: 0 };

function makeRegistry(): BehaviorRegistry<TestContext> {
  return {
    dormant: {
      name: "dormant",
      minimumDuration: 1,
      motion: recipe,
      enter: (ctx) => ctx.log.push("enter:dormant"),
      exit: (ctx) => ctx.log.push("exit:dormant"),
    },
    wander: {
      name: "wander",
      minimumDuration: 0.5,
      maximumDuration: 2,
      motion: recipe,
      enter: (ctx) => ctx.log.push("enter:wander"),
      exit: (ctx) => ctx.log.push("exit:wander"),
      canExit: (ctx) => !ctx.blockExit,
    },
    follow: {
      name: "follow",
      minimumDuration: 0,
      motion: recipe,
    },
  };
}

test("does not transition before minimumDuration elapses", () => {
  const machine = new BehaviorMachine<TestContext>({
    behaviors: makeRegistry(),
    initial: "dormant",
    decide: () => "wander",
  });
  const ctx: TestContext = { log: [], blockExit: false };
  machine.start(ctx);
  machine.update(ctx, 0.5);
  assert.equal(machine.getCurrent(), "dormant");
  machine.update(ctx, 0.6);
  assert.equal(machine.getCurrent(), "wander");
});

test("maximumDuration forces a transition even if canExit blocks it", () => {
  const machine = new BehaviorMachine<TestContext>({
    behaviors: makeRegistry(),
    initial: "wander",
    decide: () => "follow",
  });
  const ctx: TestContext = { log: [], blockExit: true };
  machine.start(ctx);
  machine.update(ctx, 1);
  assert.equal(
    machine.getCurrent(),
    "wander",
    "canExit blocks the transition before maximumDuration",
  );
  machine.update(ctx, 1.1);
  assert.equal(
    machine.getCurrent(),
    "follow",
    "maximumDuration overrides canExit",
  );
});

test("canExit blocks transition past minimumDuration when not at maximum", () => {
  const machine = new BehaviorMachine<TestContext>({
    behaviors: makeRegistry(),
    initial: "wander",
    decide: () => "follow",
  });
  const ctx: TestContext = { log: [], blockExit: true };
  machine.start(ctx);
  machine.update(ctx, 0.6); // past minimum(0.5), before maximum(2)
  assert.equal(machine.getCurrent(), "wander");
});

test("enter/exit fire in order across a transition", () => {
  const machine = new BehaviorMachine<TestContext>({
    behaviors: makeRegistry(),
    initial: "dormant",
    decide: () => "wander",
  });
  const ctx: TestContext = { log: [], blockExit: false };
  machine.start(ctx);
  machine.update(ctx, 1.5);
  assert.deepEqual(ctx.log, ["enter:dormant", "exit:dormant", "enter:wander"]);
});

test("forced transition() ignores minimumDuration", () => {
  const machine = new BehaviorMachine<TestContext>({
    behaviors: makeRegistry(),
    initial: "dormant",
    decide: () => null,
  });
  const ctx: TestContext = { log: [], blockExit: false };
  machine.start(ctx);
  machine.transition("follow", ctx);
  assert.equal(machine.getCurrent(), "follow");
  assert.equal(machine.getElapsed(), 0);
});

test("throws for an unregistered initial or decided behavior", () => {
  const registry = makeRegistry();
  delete (registry as Record<MascotBehavior, unknown>).rest;
  assert.throws(() => {
    const machine = new BehaviorMachine<TestContext>({
      behaviors: registry,
      initial: "rest",
      decide: () => null,
    });
    machine.start({ log: [], blockExit: false });
  });
});
