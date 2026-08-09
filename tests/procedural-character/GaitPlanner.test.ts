import assert from "node:assert/strict";
import { test } from "node:test";

import { GaitPlanner } from "@/lib/procedural-character/behavior/GaitPlanner";
import { AppendageRuntime } from "@/lib/procedural-character/physics/Appendage";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";

function createAppendage(index: number): AppendageRuntime {
  return new AppendageRuntime(
    octopodPreset.appendages[index],
    index,
    { x: 0, y: 0 },
    0,
    octopodPreset.body.radius,
    octopodPreset.scale,
    octopodPreset.performance.solverIterations,
  );
}

const stillSignals = {
  normalizedSpeed: 0,
  velocity: { x: 0, y: 0 },
  scale: 1,
  reducedMotion: false,
};

test("a planted foot remains fixed while its ideal target is inside threshold", () => {
  const appendage = createAppendage(0);
  const planner = new GaitPlanner(12);
  const locked = { ...appendage.lockedFootPosition };
  appendage.idealFootTarget.x += 4;
  appendage.idealFootTarget.y += 3;

  for (let frame = 0; frame < 60; frame += 1) {
    planner.update(
      1 / 120,
      [appendage],
      {
        ...octopodPreset.gait,
        minPlantedFeet: 0,
      },
      stillSignals,
    );
  }

  assert.deepEqual(appendage.lockedFootPosition, locked);
  assert.deepEqual(appendage.foot, locked);
  assert.equal(appendage.stepping, false);
});

test("gait coordination never lifts every requested leg together", () => {
  const appendages = octopodPreset.appendages.map((_, index) =>
    createAppendage(index),
  );
  const planner = new GaitPlanner(42);
  for (const appendage of appendages) {
    appendage.idealFootTarget.x += 80;
  }

  planner.update(1 / 120, appendages, octopodPreset.gait, {
    ...stillSignals,
    normalizedSpeed: 0.4,
    velocity: { x: 200, y: 0 },
  });

  const stepping = appendages.filter((appendage) => appendage.stepping);
  assert.ok(stepping.length > 0);
  assert.ok(stepping.length <= octopodPreset.gait.maxConcurrentSteps);
  assert.ok(
    appendages.length - stepping.length >= octopodPreset.gait.minPlantedFeet,
  );
});

test("a procedural step follows a lifted arc and lands at its destination", () => {
  const appendage = createAppendage(0);
  const planner = new GaitPlanner(91);
  appendage.idealFootTarget.x += 60;
  const gait = { ...octopodPreset.gait, minPlantedFeet: 0 };

  planner.update(1 / 120, [appendage], gait, stillSignals);
  assert.equal(appendage.stepping, true);
  const start = { ...appendage.stepStart };
  const destination = { ...appendage.stepDestination };

  planner.update(appendage.stepDuration * 0.5, [appendage], gait, stillSignals);
  const straightMidpointY = start.y + (destination.y - start.y) * 0.5;
  assert.ok(appendage.foot.y < straightMidpointY - 1);

  planner.update(appendage.stepDuration, [appendage], gait, stillSignals);
  assert.equal(appendage.stepping, false);
  assert.deepEqual(appendage.foot, appendage.lockedFootPosition);
  assert.deepEqual(appendage.foot, appendage.stepDestination);
});

test("fast motion shortens duration and increases step lift", () => {
  const slowLeg = createAppendage(0);
  const fastLeg = createAppendage(0);
  slowLeg.idealFootTarget.x += 60;
  fastLeg.idealFootTarget.x += 60;
  const gait = { ...octopodPreset.gait, minPlantedFeet: 0 };
  const slowPlanner = new GaitPlanner(55);
  const fastPlanner = new GaitPlanner(55);

  slowPlanner.update(1 / 120, [slowLeg], gait, stillSignals);
  fastPlanner.update(1 / 120, [fastLeg], gait, {
    ...stillSignals,
    normalizedSpeed: 1,
    velocity: { x: 700, y: 0 },
  });

  assert.ok(fastLeg.stepDuration < slowLeg.stepDuration);
  assert.ok(fastLeg.stepHeight > slowLeg.stepHeight);
});
