import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bounceRootOffSegment,
  circleVsCenteredRect,
  createGameRoot,
  integrateGameRoot,
} from "@/lib/mascot/game/resonance/WeaverPhysics";

describe("WeaverPhysics", () => {
  it("integrates horizontal steer and gravity", () => {
    const root = createGameRoot(100, 100);
    integrateGameRoot(root, 1 / 60, 1, { arenaWidth: 400, arenaHeight: 600 });
    assert.ok(root.x > 100);
    assert.ok(root.y > 100);
    assert.ok(root.velocityY > 0);
  });

  it("circleVsCenteredRect hits and misses", () => {
    assert.equal(circleVsCenteredRect(10, 10, 5, 10, 10, 8, 8), true);
    assert.equal(circleVsCenteredRect(50, 50, 5, 10, 10, 8, 8), false);
  });

  it("bounceRootOffSegment rejects zero-length segment", () => {
    const root = createGameRoot(0, 0);
    root.velocityY = 200;
    assert.equal(bounceRootOffSegment(root, 0, 0, 0, 0, 6), false);
  });

  it("bounceRootOffSegment applies upward impulse when overlapping", () => {
    const root = createGameRoot(50, 48, 20);
    root.velocityY = 300;
    const hit = bounceRootOffSegment(root, 0, 50, 100, 50, 6, 600);
    assert.equal(hit, true);
    assert.ok(root.velocityY < 0);
  });
});
