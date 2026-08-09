import assert from "node:assert/strict";
import { test } from "node:test";

import {
  DEFAULT_APPEARANCE_LAYERS,
  resolveLayersForQuality,
} from "@/lib/mascot/appearance/AppearanceConfig";

const ALL_ON = {
  silhouette: true,
  print: true,
  rim: true,
  dots: true,
  face: true,
};

test("reduced quality only allows silhouette + face, regardless of overrides", () => {
  const layers = resolveLayersForQuality("reduced", ALL_ON);
  assert.equal(layers.silhouette, true);
  assert.equal(layers.face, true);
  assert.equal(layers.print, false);
  assert.equal(layers.rim, false);
  assert.equal(layers.dots, false);
});

test("low quality allows silhouette/print/rim/face but never dots", () => {
  const layers = resolveLayersForQuality("low", ALL_ON);
  assert.equal(layers.silhouette, true);
  assert.equal(layers.print, true);
  assert.equal(layers.rim, true);
  assert.equal(layers.face, true);
  assert.equal(layers.dots, false);
});

test("medium/high quality respect overrides fully when a layer is allowed", () => {
  for (const quality of ["medium", "high"] as const) {
    const allOn = resolveLayersForQuality(quality, ALL_ON);
    assert.deepEqual(allOn, ALL_ON);

    const someOff = resolveLayersForQuality(quality, {
      ...ALL_ON,
      dots: false,
      print: false,
    });
    assert.equal(someOff.dots, false);
    assert.equal(someOff.print, false);
    assert.equal(someOff.silhouette, true);
    assert.equal(someOff.rim, true);
    assert.equal(someOff.face, true);
  }
});

test("overrides can only narrow, never force a layer a quality tier disallows", () => {
  const layers = resolveLayersForQuality("reduced", { ...ALL_ON, print: true });
  assert.equal(layers.print, false);
});

test("DEFAULT_APPEARANCE_LAYERS starts with every layer on", () => {
  assert.deepEqual(DEFAULT_APPEARANCE_LAYERS, ALL_ON);
});
