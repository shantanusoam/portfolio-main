import assert from "node:assert/strict";
import { test } from "node:test";

import { InterestDirector } from "@/lib/mascot/behavior/InterestDirector";

const candidates = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];

test("the same card is not repeatedly selected back to back", () => {
  const director = new InterestDirector(1, {
    cooldownSeconds: 0,
    minRevisitGap: 2,
  });
  let lastId: string | null = null;
  for (let i = 0; i < 20; i += 1) {
    const chosen = director.select(candidates);
    assert.ok(chosen);
    if (lastId) assert.notEqual(chosen!.id, lastId);
    lastId = chosen!.id;
  }
});

test("cooldown blocks selection until it elapses", () => {
  const director = new InterestDirector(2, {
    cooldownSeconds: 5,
    minRevisitGap: 1,
  });
  const first = director.select(candidates);
  assert.ok(first);
  assert.equal(director.canSelect(), false);
  assert.equal(director.select(candidates), null);

  director.tick(3);
  assert.equal(director.canSelect(), false);

  director.tick(3);
  assert.equal(director.canSelect(), true);
  assert.ok(director.select(candidates));
});

test("returns null for an empty candidate list", () => {
  const director = new InterestDirector(3, {
    cooldownSeconds: 0,
    minRevisitGap: 1,
  });
  assert.equal(director.select([]), null);
});

test("falls back to the full pool when every candidate is in the avoid window", () => {
  const director = new InterestDirector(4, {
    cooldownSeconds: 0,
    minRevisitGap: 10,
  });
  const single = [{ id: "only" }];
  for (let i = 0; i < 5; i += 1) {
    const chosen = director.select(single);
    assert.deepEqual(chosen, { id: "only" });
  }
});
