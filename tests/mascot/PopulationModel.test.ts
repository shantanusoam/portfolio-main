import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FIRST_FISSION_MEALS,
  PopulationModel,
  SECOND_FISSION_MEALS,
} from "@/lib/mascot/ecosystem/PopulationModel";
import { baseScaleForPopulation } from "@/lib/mascot/ecosystem/FishEcosystem";

function feed(model: PopulationModel) {
  assert.equal(model.requestFry(), true);
  return model.consumeFry();
}

test("only one fry can be active at a time", () => {
  const model = new PopulationModel();
  assert.equal(model.requestFry(), true);
  assert.equal(model.requestFry(), false);
  assert.equal(model.getStatus().activeFry, true);
  model.cancelFry();
  assert.equal(model.requestFry(), true);
});

test("the first threshold produces exactly two adults", () => {
  const model = new PopulationModel();
  for (let index = 1; index < FIRST_FISSION_MEALS; index += 1) {
    assert.equal(feed(model), "growth");
  }
  assert.equal(feed(model), "fission");
  assert.equal(
    model.requestFry(),
    false,
    "spawn remains locked during fission",
  );
  assert.equal(model.completeFission(), 2);
  assert.equal(model.getStatus().population, 2);
  assert.equal(model.getStatus().growthStage, 0);
});

test("shared pair nourishment advances two adults directly to four", () => {
  const model = new PopulationModel();
  for (let index = 0; index < FIRST_FISSION_MEALS; index += 1) feed(model);
  model.completeFission();

  for (let index = 1; index < SECOND_FISSION_MEALS; index += 1) {
    assert.equal(feed(model), "growth");
  }
  assert.equal(feed(model), "fission");
  assert.equal(model.completeFission(), 4);
  assert.equal(model.getStatus().population, 4);
  assert.equal(model.getStatus().capped, true);
});

test("feeding at the cap blooms without increasing the population", () => {
  const model = new PopulationModel();
  for (let index = 0; index < FIRST_FISSION_MEALS; index += 1) feed(model);
  model.completeFission();
  for (let index = 0; index < SECOND_FISSION_MEALS; index += 1) feed(model);
  model.completeFission();

  assert.equal(feed(model), "bloom");
  assert.equal(model.getStatus().population, 4);
  assert.equal(model.getStatus().mealsToNextFission, 0);
});

test("post-fission siblings use equal bounded scales", () => {
  assert.equal(baseScaleForPopulation(1), 1);
  assert.equal(baseScaleForPopulation(2), 0.92);
  assert.equal(baseScaleForPopulation(4), 0.8);
});
