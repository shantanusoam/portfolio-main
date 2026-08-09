import assert from "node:assert/strict";
import { test } from "node:test";

import { FishEcosystem } from "@/lib/mascot/ecosystem/FishEcosystem";
import { MascotRuntime } from "@/lib/mascot/MascotRuntime";

const BOUNDS = { minX: 40, minY: 40, maxX: 760, maxY: 560 };

function createRuntime(seed: number, x = 300, y = 260) {
  return new MascotRuntime({
    seed,
    quality: "low",
    originX: x,
    originY: y,
    bounds: BOUNDS,
    obstacles: null,
    strings: null,
  });
}

test("a called leader can catch a shy fry without unbounded simulation", () => {
  const leader = createRuntime(11);
  const ecosystem = new FishEcosystem({
    leader,
    seed: 11,
    quality: "low",
    bounds: BOUNDS,
    createRuntime: (seed, x, y) => createRuntime(seed, x, y),
  });

  assert.equal(ecosystem.releaseFry(300, 260), true);
  ecosystem.callFish();
  for (let step = 0; step < 900 && ecosystem.getStatus().activeFry; step += 1) {
    ecosystem.update(1 / 60);
  }

  const status = ecosystem.getStatus();
  assert.equal(status.activeFry, false);
  assert.equal(status.growthStage, 1);
  assert.equal(status.population, 1);
});

test("quality, bounds and reduced motion propagate to every spawned sibling", () => {
  const leader = createRuntime(22);
  const ecosystem = new FishEcosystem({
    leader,
    seed: 22,
    quality: "low",
    bounds: BOUNDS,
    createRuntime: (seed, x, y) => createRuntime(seed, x, y),
  });

  ecosystem.setQuality("medium");
  ecosystem.setReducedMotion(true);
  ecosystem.setBounds({ minX: 50, minY: 50, maxX: 700, maxY: 500 });

  const adult = ecosystem.getAdults()[0];
  assert.equal(adult.runtime.quality, "medium");
  assert.equal(adult.runtime.reducedMotion, true);
  assert.deepEqual(adult.runtime.bounds, {
    minX: 50,
    minY: 50,
    maxX: 700,
    maxY: 500,
  });
});

test("runtime choreography creates equal siblings and enforces the four-fish cap", () => {
  const leader = createRuntime(33);
  const ecosystem = new FishEcosystem({
    leader,
    seed: 33,
    quality: "low",
    bounds: BOUNDS,
    createRuntime: (seed, x, y) => createRuntime(seed, x, y),
  });
  const feedOnce = () => {
    for (
      let step = 0;
      step < 300 && !ecosystem.getStatus().canReleaseFry;
      step += 1
    ) {
      ecosystem.update(1 / 60);
    }
    const root = ecosystem.getAdults()[0].runtime.pose.getRoot();
    assert.equal(ecosystem.releaseFry(root.x, root.y), true);
    ecosystem.callFish();
    for (
      let step = 0;
      step < 1800 && ecosystem.getStatus().activeFry;
      step += 1
    ) {
      ecosystem.update(1 / 60);
    }
    assert.equal(ecosystem.getStatus().activeFry, false);
  };

  for (let meal = 0; meal < 3; meal += 1) feedOnce();
  for (
    let step = 0;
    step < 180 && ecosystem.getStatus().fissionPhase;
    step += 1
  ) {
    ecosystem.update(1 / 60);
  }
  assert.equal(ecosystem.getStatus().population, 2);
  assert.equal(ecosystem.getAdults().length, 2);
  assert.equal(ecosystem.getAdults()[0].scale, ecosystem.getAdults()[1].scale);

  for (let meal = 0; meal < 4; meal += 1) feedOnce();
  for (
    let step = 0;
    step < 180 && ecosystem.getStatus().fissionPhase;
    step += 1
  ) {
    ecosystem.update(1 / 60);
  }
  assert.equal(ecosystem.getStatus().population, 4);
  assert.equal(ecosystem.getAdults().length, 4);
  assert.ok(
    ecosystem
      .getAdults()
      .every((adult) => adult.scale === ecosystem.getAdults()[0].scale),
  );

  feedOnce();
  assert.equal(ecosystem.getStatus().population, 4);
  assert.equal(ecosystem.getAdults().length, 4);
  assert.ok(ecosystem.getBloomStrength() > 0);
});
