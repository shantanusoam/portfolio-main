import assert from "node:assert/strict";
import { test } from "node:test";

import { shouldEnableEffects } from "@/lib/mascot/music/EffectsBus";

test("effects are gated off at reduced and low quality", () => {
  assert.equal(shouldEnableEffects("reduced"), false);
  assert.equal(shouldEnableEffects("low"), false);
});

test("effects are enabled at medium and high quality", () => {
  assert.equal(shouldEnableEffects("medium"), true);
  assert.equal(shouldEnableEffects("high"), true);
});
