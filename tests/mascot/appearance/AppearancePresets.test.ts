import assert from "node:assert/strict";
import { test } from "node:test";

import {
  APPEARANCE_PRESETS,
  DEFAULT_APPEARANCE_PRESET_ID,
  getAppearancePreset,
  listAppearancePresets,
} from "@/lib/mascot/appearance/AppearancePresets";

test("exactly the expected preset ids exist", () => {
  const ids = Object.keys(APPEARANCE_PRESETS).sort();
  assert.deepEqual(ids, ["cute-bean", "signal-manta", "velvet-comet"]);
});

test("the default preset id resolves to a real preset", () => {
  const preset = getAppearancePreset(DEFAULT_APPEARANCE_PRESET_ID);
  assert.equal(preset.id, DEFAULT_APPEARANCE_PRESET_ID);
});

test("every preset has a fully populated palette and a valid pattern recipe", () => {
  const hexPattern = /^#[0-9a-f]{6}$/i;
  for (const preset of listAppearancePresets()) {
    for (const [key, value] of Object.entries(preset.palette)) {
      if (key === "name") {
        assert.ok(typeof value === "string" && value.length > 0);
        continue;
      }
      assert.ok(
        hexPattern.test(value as string),
        `${preset.id}.palette.${key} = ${value}`,
      );
    }
    assert.ok(
      [
        "terrazzo-confetti",
        "constellation-freckles",
        "soft-stripes",
        "signal-glyphs",
      ].includes(preset.patternRecipe),
    );
  }
});

test("each preset uses a distinct palette and pattern recipe (no accidental duplicates)", () => {
  const presets = listAppearancePresets();
  const paletteNames = new Set(presets.map((p) => p.palette.name));
  const recipes = new Set(presets.map((p) => p.patternRecipe));
  assert.equal(paletteNames.size, presets.length);
  assert.equal(recipes.size, presets.length);
});
