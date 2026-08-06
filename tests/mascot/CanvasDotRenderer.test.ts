import assert from "node:assert/strict";
import { test } from "node:test";

import {
  CanvasDotRenderer,
  type Canvas2DLike,
} from "@/lib/mascot/rendering/CanvasDotRenderer";

function makeFakeContext() {
  const calls: string[] = [];
  const ctx: Canvas2DLike = {
    beginPath: () => calls.push("beginPath"),
    moveTo: () => calls.push("moveTo"),
    arc: () => calls.push("arc"),
    closePath: () => calls.push("closePath"),
    fill: () => calls.push("fill"),
    fillStyle: "",
    globalAlpha: 1,
  };
  return { ctx, calls };
}

test("flushing a group issues exactly one beginPath and one fill regardless of dot count", () => {
  const renderer = new CanvasDotRenderer();
  renderer.registerGroup(0, 100);
  renderer.beginFrame();
  for (let i = 0; i < 50; i += 1) renderer.push(0, i, i, 1);

  const { ctx, calls } = makeFakeContext();
  renderer.flushGroup(ctx, 0, { color: "#fff", opacity: 1 });

  assert.equal(calls.filter((c) => c === "beginPath").length, 1);
  assert.equal(calls.filter((c) => c === "fill").length, 1);
  assert.equal(calls.filter((c) => c === "moveTo").length, 50);
  assert.equal(calls.filter((c) => c === "arc").length, 50);
});

test("pushing beyond the registered capacity is silently dropped, not grown", () => {
  const renderer = new CanvasDotRenderer();
  renderer.registerGroup(0, 3);
  renderer.beginFrame();
  for (let i = 0; i < 10; i += 1) renderer.push(0, i, i, 1);
  assert.equal(renderer.getCount(0), 3);
});

test("beginFrame resets counts for every registered group", () => {
  const renderer = new CanvasDotRenderer();
  renderer.registerGroup(0, 10);
  renderer.registerGroup(1, 10);
  renderer.push(0, 1, 1, 1);
  renderer.push(1, 1, 1, 1);
  assert.equal(renderer.getCount(0), 1);
  assert.equal(renderer.getCount(1), 1);
  renderer.beginFrame();
  assert.equal(renderer.getCount(0), 0);
  assert.equal(renderer.getCount(1), 0);
});

test("flushing an empty group does not call fill", () => {
  const renderer = new CanvasDotRenderer();
  renderer.registerGroup(0, 10);
  renderer.beginFrame();
  const { ctx, calls } = makeFakeContext();
  renderer.flushGroup(ctx, 0, { color: "#fff", opacity: 1 });
  assert.equal(calls.length, 0);
});

test("pushing to an unregistered group is a safe no-op", () => {
  const renderer = new CanvasDotRenderer();
  renderer.push(99, 1, 1, 1);
  assert.equal(renderer.getCount(99), 0);
});
