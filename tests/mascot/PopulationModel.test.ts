import assert from "node:assert/strict";
import { test } from "node:test";

import {
  anatomyAfterFission,
  MEALS_TO_FISSION,
  resolveAnatomyForMeals,
  spineLengthPx,
} from "@/lib/mascot/ecosystem/AnatomyGrowth";
import {
  FRY_SCHOOL_SIZE,
  MAX_ADULT_FISH,
  PopulationModel,
} from "@/lib/mascot/ecosystem/PopulationModel";
import { baseScaleForPopulation } from "@/lib/mascot/ecosystem/FishEcosystem";

function feed(
  model: PopulationModel,
  mealsAfter: number,
  canSplit = model.canSplitOneAdult(),
) {
  assert.equal(model.requestFry(), true);
  return model.consumeFry(mealsAfter, canSplit);
}

test("only one school can be active at a time", () => {
  const model = new PopulationModel();
  assert.equal(model.requestSchool(FRY_SCHOOL_SIZE), FRY_SCHOOL_SIZE);
  assert.equal(model.requestSchool(FRY_SCHOOL_SIZE), 0);
  assert.equal(model.getActiveFryCount(), FRY_SCHOOL_SIZE);
  model.cancelFry();
  assert.equal(model.requestSchool(2), 2);
});

test("consuming fry decrements the school until empty", () => {
  const model = new PopulationModel();
  assert.equal(model.requestSchool(3), 3);
  assert.equal(model.consumeFry(1, true), "growth");
  assert.equal(model.getActiveFryCount(), 2);
  assert.equal(model.consumeFry(2, true), "growth");
  assert.equal(model.consumeFry(3, true), "growth");
  assert.equal(model.getActiveFryCount(), 0);
  assert.equal(model.consumeFry(4, true), "ignored");
});

test("fission unlocks only after twenty meals when the cap allows a split", () => {
  const model = new PopulationModel();
  for (let meal = 1; meal < MEALS_TO_FISSION; meal += 1) {
    assert.equal(feed(model, meal), "growth");
  }
  assert.equal(feed(model, MEALS_TO_FISSION), "fission");
  assert.equal(model.requestFry(), false, "spawn remains locked during fission");
  assert.equal(model.completeFission(), 2);
  assert.equal(model.getStatus().population, 2);
});

test("each successive adult split adds one fish up to the four-fish cap", () => {
  const model = new PopulationModel();
  assert.equal(feed(model, MEALS_TO_FISSION), "fission");
  assert.equal(model.completeFission(), 2);

  assert.equal(feed(model, MEALS_TO_FISSION), "fission");
  assert.equal(model.completeFission(), 3);

  assert.equal(feed(model, MEALS_TO_FISSION), "fission");
  assert.equal(model.completeFission(), 4);
  assert.equal(model.getStatus().capped, true);
  assert.equal(model.canSplitOneAdult(), false);
});

test("feeding at the cap blooms without increasing the population", () => {
  const model = new PopulationModel();
  for (let i = 0; i < 3; i += 1) {
    feed(model, MEALS_TO_FISSION);
    model.completeFission();
  }
  assert.equal(model.getPopulation(), MAX_ADULT_FISH);
  assert.equal(feed(model, MEALS_TO_FISSION, false), "bloom");
  assert.equal(model.getStatus().population, 4);
  assert.equal(model.getStatus().mealsToNextFission, 0);
});

test("anatomy milestones grow to sixty joints with a long cute tail", () => {
  const meal0 = resolveAnatomyForMeals(0);
  const meal1 = resolveAnatomyForMeals(1);
  const meal5 = resolveAnatomyForMeals(5);
  const meal20 = resolveAnatomyForMeals(20);

  assert.equal(meal0.jointCount, 30);
  assert.ok(meal1.segmentLength > meal0.segmentLength);
  assert.ok(meal1.bodyProfile.maxWidth >= meal0.bodyProfile.maxWidth);
  assert.equal(meal5.jointCount, 38);
  assert.equal(meal20.jointCount, 60);
  assert.ok(spineLengthPx(meal20) > spineLengthPx(meal0) * 1.8);
  // Not a screen-filling ribbon — width stays in a cute fish range.
  assert.ok(spineLengthPx(meal20) < spineLengthPx(meal0) * 3.2);
  assert.ok(meal20.bodyProfile.maxWidth > meal0.bodyProfile.maxWidth);
  assert.ok(meal20.bodyProfile.headScale < meal0.bodyProfile.headScale);
  assert.ok(
    meal20.regions.tailTip.start - meal20.regions.torso.start >
      meal20.regions.head.end,
    "tail should claim more spine than the head",
  );
  assert.equal(meal20.regions.tailTip.end, meal20.jointCount - 1);
});

test("post-fission anatomy is equal and resets the meal counter", () => {
  const child = anatomyAfterFission(20);
  assert.equal(child.mealsEaten, 0);
  assert.equal(child.jointCount, resolveAnatomyForMeals(10).jointCount);
  assert.equal(
    child.segmentLength,
    resolveAnatomyForMeals(10).segmentLength,
  );
});

test("post-fission siblings use equal bounded scales", () => {
  assert.equal(baseScaleForPopulation(1), 1);
  assert.equal(baseScaleForPopulation(2), 0.92);
  assert.equal(baseScaleForPopulation(4), 0.8);
});
