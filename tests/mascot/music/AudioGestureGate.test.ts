import assert from "node:assert/strict";
import { test } from "node:test";

import { AudioGestureGate } from "@/lib/mascot/music/AudioGestureGate";

test("requestActivation calls the underlying activate function", async () => {
  let calls = 0;
  const gate = new AudioGestureGate(async () => {
    calls += 1;
  });
  await gate.requestActivation();
  assert.equal(calls, 1);
});

test("hasEngaged flips true immediately, before the activation promise settles", () => {
  let resolveActivate: () => void = () => undefined;
  const gate = new AudioGestureGate(
    () =>
      new Promise<void>((resolve) => {
        resolveActivate = resolve;
      }),
  );
  assert.equal(gate.hasEngaged(), false);
  const pending = gate.requestActivation();
  assert.equal(
    gate.hasEngaged(),
    true,
    "engaged should flip synchronously, for UI that hides a hint on click",
  );
  resolveActivate();
  return pending;
});

test("concurrent requests coalesce into a single in-flight activation", async () => {
  let calls = 0;
  let resolveActivate: () => void = () => undefined;
  const gate = new AudioGestureGate(
    () =>
      new Promise<void>((resolve) => {
        calls += 1;
        resolveActivate = resolve;
      }),
  );

  const first = gate.requestActivation();
  const second = gate.requestActivation();
  assert.equal(
    calls,
    1,
    "a second rapid request must not create a second activation",
  );
  resolveActivate();
  await Promise.all([first, second]);
});

test("a later request after the first settles triggers a fresh activation", async () => {
  let calls = 0;
  const gate = new AudioGestureGate(async () => {
    calls += 1;
  });
  await gate.requestActivation();
  await gate.requestActivation();
  assert.equal(calls, 2);
});

test("never rejects, even if the underlying activate function throws", async () => {
  const gate = new AudioGestureGate(async () => {
    throw new Error("boom");
  });
  await assert.rejects(() => gate.requestActivation());
  // AudioGestureGate itself does not swallow errors — that is
  // AudioDirector.activate()'s job (it never throws). This test documents
  // the gate's actual contract: it is a coalescing pass-through, not an
  // error boundary.
});
