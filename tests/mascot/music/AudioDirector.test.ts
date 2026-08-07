import assert from "node:assert/strict";
import { test } from "node:test";

import { AudioDirector } from "@/lib/mascot/music/AudioDirector";
import { VisibilityController } from "@/lib/mascot/input/VisibilityController";

// This suite runs under plain Node (`tsx --test`), which has no `window` or
// `AudioContext` global — exactly the "no Web Audio support" fallback path
// the spec requires ("AUDIO FAILURE FALLBACKS": disable audio features,
// preserve the rest of the experience, never throw). It is a real
// unsupported-environment exercise, not a mock.

test("reports unsupported when no AudioContext constructor exists", () => {
  const director = new AudioDirector();
  assert.equal(director.isSupported(), false);
  director.destroy();
});

test("activate() never throws when unsupported, and isActive() stays false", async () => {
  const director = new AudioDirector();
  await assert.doesNotReject(() => director.activate());
  assert.equal(director.isActive(), false);
  director.destroy();
});

test("setMuted/setMasterVolume are safe no-ops before activation succeeds", () => {
  const director = new AudioDirector();
  assert.doesNotThrow(() => director.setMuted(true));
  assert.doesNotThrow(() => director.setMasterVolume(0.8));
  assert.equal(director.getMasterVolume(), 0.8);
  director.destroy();
});

test("setMasterVolume clamps to [0, 1]", () => {
  const director = new AudioDirector();
  director.setMasterVolume(5);
  assert.equal(director.getMasterVolume(), 1);
  director.setMasterVolume(-5);
  assert.equal(director.getMasterVolume(), 0);
  director.destroy();
});

test("getMasterDestination throws before activation succeeds, rather than returning something unusable", () => {
  const director = new AudioDirector();
  assert.throws(() => director.getMasterDestination());
  director.destroy();
});

test("getEffectsSend and getContext return null before/without activation", () => {
  const director = new AudioDirector();
  assert.equal(director.getEffectsSend(), null);
  assert.equal(director.getContext(), null);
  director.destroy();
});

test("reuses a caller-supplied VisibilityController instead of registering a second listener, and does not detach it on destroy", () => {
  const shared = new VisibilityController();
  let detachCalls = 0;
  const originalDetach = shared.detach.bind(shared);
  shared.detach = () => {
    detachCalls += 1;
    originalDetach();
  };

  const director = new AudioDirector({ visibility: shared });
  director.destroy();

  assert.equal(
    detachCalls,
    0,
    "AudioDirector must not detach a VisibilityController instance it does not own",
  );
});

test("destroy is idempotent and safe to call without a prior activate()", () => {
  const director = new AudioDirector();
  assert.doesNotThrow(() => {
    director.destroy();
    director.destroy();
  });
});
