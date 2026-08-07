import assert from "node:assert/strict";
import { test } from "node:test";

import { GeneratedDecalAtlas } from "@/lib/mascot/appearance/GeneratedDecalAtlas";

test("a freshly constructed atlas is never ready", () => {
  const atlas = new GeneratedDecalAtlas(
    "/mascot/generated/runtime/mascot-decal-atlas",
  );
  assert.equal(atlas.isReady(), false);
  assert.equal(atlas.getImage(), null);
  assert.deepEqual(atlas.getSpritesForSheet("terrazzo-decals"), []);
});

test("load() is a safe no-op under plain Node (no window/fetch) — never throws", () => {
  const atlas = new GeneratedDecalAtlas(
    "/mascot/generated/runtime/mascot-decal-atlas",
  );
  assert.doesNotThrow(() => atlas.load());
  // This test runs under plain node:test (no DOM), so `window` is
  // undefined and load() must return before touching it — the atlas
  // should still report not-ready rather than crash or hang.
  assert.equal(atlas.isReady(), false);
});

test("getSpritesForSheet on an unknown sheet name returns an empty array, not undefined", () => {
  const atlas = new GeneratedDecalAtlas(
    "/mascot/generated/runtime/mascot-decal-atlas",
  );
  const sprites = atlas.getSpritesForSheet("nonexistent-sheet");
  assert.ok(Array.isArray(sprites));
  assert.equal(sprites.length, 0);
});
