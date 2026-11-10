import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createGarden,
  stepGarden,
  crossesLeaf,
  returnToLeaf,
  takeQuietStep,
  HOP_SPEED,
  GRAVITY,
} from "../../lib/garden-game/canopy";
test("seeded garden is reproducible and every next leaf is within a hop", () => {
  const a = createGarden(45),
    b = createGarden(45),
    c = createGarden(46);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a.leaves, c.leaves);
  const hopHeight = (HOP_SPEED * HOP_SPEED) / (2 * GRAVITY);
  a.leaves.slice(1).forEach((leaf, i) => {
    const previous = a.leaves[i];
    assert.ok(leaf.y - previous.y < hopHeight - 15);
    assert.ok(
      Math.abs(leaf.x - previous.x) < previous.width / 2 + leaf.width / 2,
    );
  });
});
test("landing is swept downward and does not catch a leaf while rising", () => {
  const s = createGarden(),
    leaf = s.leaves[1];
  assert.equal(crossesLeaf(leaf.y + 20, leaf.y - 10, leaf.x, leaf), true);
  assert.equal(crossesLeaf(leaf.y - 10, leaf.y + 20, leaf.x, leaf), false);
  assert.equal(crossesLeaf(leaf.y + 20, leaf.y - 10, 0, leaf), false);
  s.player = {
    x: leaf.x,
    y: leaf.y + 1,
    previousY: leaf.y + 1,
    vx: 0,
    vy: -200,
  };
  stepGarden(s, 0, 1 / 60);
  assert.equal(s.highestLeaf, 1);
  assert.equal(s.player.y, leaf.y);
  assert.equal(s.collected, 1);
  assert.equal(s.player.vy, HOP_SPEED);
  for (let i = 0; i < 140; i++) stepGarden(s, 0, 1 / 120);
  assert.equal(s.collected, 1, "same leaf cannot award a seed twice");
});
test("recovery retains progress and reset creates a clean garden", () => {
  const s = createGarden();
  takeQuietStep(s);
  takeQuietStep(s);
  const collected = s.collected;
  returnToLeaf(s);
  assert.equal(s.highestLeaf, 2);
  assert.equal(s.collected, collected);
  assert.equal(s.player.x, s.leaves[2].x);
  assert.equal(s.player.vy, HOP_SPEED);
  const clean = createGarden();
  assert.equal(clean.highestLeaf, 0);
  assert.equal(clean.collected, 0);
  assert.equal(clean.won, false);
});
test("still mode can complete the same garden without continuous animation", () => {
  const s = createGarden();
  for (let i = 0; i < 12; i++) takeQuietStep(s);
  assert.equal(s.won, true);
  assert.equal(s.highestLeaf, 12);
  assert.equal(s.collected, 12);
  const snapshot = structuredClone(s);
  takeQuietStep(s);
  stepGarden(s, 1, 1);
  assert.deepEqual(s, snapshot);
});
test("long frame and invalid input never produce non-finite state", () => {
  const s = createGarden();
  for (let i = 0; i < 2000; i++)
    stepGarden(s, i % 40 < 20 ? 1 : -1, i % 30 === 0 ? 100 : 1 / 60);
  Object.values(s.player).forEach((v) => assert.ok(Number.isFinite(v)));
  assert.ok(s.player.x >= 17 && s.player.x <= 463);
  stepGarden(s, NaN, NaN);
  assert.ok(Number.isFinite(s.player.y));
});

test("the generated path is completable under the real physics", () => {
  const state = createGarden();
  for (let frame = 0; frame < 120 * 60 && !state.won; frame++) {
    const next = state.leaves[Math.min(12, state.highestLeaf + 1)];
    stepGarden(
      state,
      Math.max(-1, Math.min(1, (next.x - state.player.x) / 25)),
      1 / 120,
    );
  }
  assert.equal(state.won, true);
  assert.equal(state.collected, 12);
});
