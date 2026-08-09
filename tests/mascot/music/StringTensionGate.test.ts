import assert from "node:assert/strict";
import { test } from "node:test";

import {
  amplifyContactVelocity,
  computePullTension,
  evaluateSlingshotReady,
  StringTensionGate,
} from "@/lib/mascot/music/StringTensionGate";
import type { MusicalStringGeometry } from "@/lib/mascot/music/StringRegistry";

const string: MusicalStringGeometry = {
  id: "mascot-string-0",
  index: 0,
  role: "mid",
  element: {} as Element,
  left: 100,
  right: 500,
  restY: 300,
};

test("computePullTension clamps distance over MAX_STRING_PULL", () => {
  assert.equal(computePullTension(0, 110), 0);
  assert.equal(computePullTension(55, 110), 0.5);
  assert.equal(computePullTension(220, 110), 1);
  assert.ok(Math.abs(computePullTension(-90, 110) - 90 / 110) < 1e-9);
});

test("computePullTension handles invalid inputs as zero", () => {
  assert.equal(computePullTension(Number.NaN, 110), 0);
  assert.equal(computePullTension(40, 0), 0);
});

test("amplifyContactVelocity scales with tension and stays in 0..1", () => {
  const base = 0.5;
  const amplified = amplifyContactVelocity(base, 1);
  assert.ok(amplified > base);
  assert.ok(amplified <= 1);
  assert.equal(amplifyContactVelocity(0.2, 0), 0.2);
});

test("gate tracks pullTension while dragging near a string", () => {
  const gate = new StringTensionGate({ maxStringPull: 100 });
  gate.update({
    dt: 1 / 60,
    pointerActive: true,
    pointerX: 250,
    pointerY: 360,
    rootX: 250,
    rootY: 310,
    strings: [string],
    contactThisFrame: true,
    contactStringIndex: 0,
  });
  const state = gate.getState();
  assert.equal(state.attachedToString, true);
  assert.ok(Math.abs(state.pullTension - 0.6) < 1e-6);
  assert.equal(gate.getStringTension(), state.pullTension);
});

test("high-tension release arms slingshot once via consumeSlingshotTrigger", () => {
  const gate = new StringTensionGate({
    maxStringPull: 100,
    slingshotTensionThreshold: 0.82,
    slingshotReleaseVelocity: 1.4,
  });

  // Pull past threshold.
  for (let i = 0; i < 8; i += 1) {
    gate.update({
      dt: 1 / 60,
      pointerActive: true,
      pointerX: 250,
      pointerY: 300 + 90,
      rootX: 250,
      rootY: 310,
      strings: [string],
      contactThisFrame: i === 0,
      contactStringIndex: 0,
    });
  }
  assert.ok(gate.getPullTension() > 0.82);

  // Release.
  gate.update({
    dt: 1 / 60,
    pointerActive: false,
    pointerX: 250,
    pointerY: 390,
    rootX: 250,
    rootY: 310,
    strings: [string],
    contactThisFrame: false,
  });

  assert.equal(gate.isSlingshotReady(), true);
  assert.equal(gate.consumeSlingshotTrigger(), true);
  assert.equal(gate.consumeSlingshotTrigger(), false);
  assert.equal(gate.isSlingshotReady(), false);
});

test("low-tension release does not arm the slingshot", () => {
  const gate = new StringTensionGate({
    maxStringPull: 100,
    slingshotTensionThreshold: 0.82,
  });
  gate.update({
    dt: 1 / 60,
    pointerActive: true,
    pointerX: 250,
    pointerY: 320,
    rootX: 250,
    rootY: 305,
    strings: [string],
    contactThisFrame: true,
    contactStringIndex: 0,
  });
  assert.ok(gate.getPullTension() < 0.5);

  gate.update({
    dt: 1 / 60,
    pointerActive: false,
    pointerX: 250,
    pointerY: 320,
    rootX: 250,
    rootY: 305,
    strings: [string],
    contactThisFrame: false,
  });
  assert.equal(gate.consumeSlingshotTrigger(), false);
});

test("evaluateSlingshotReady matches the V2 gate predicate", () => {
  assert.equal(
    evaluateSlingshotReady(
      {
        attachedToString: true,
        pullTension: 0.9,
        releaseVelocity: 2,
        pointerReleased: true,
        triggerCooldown: 0,
      },
      {
        slingshotTensionThreshold: 0.82,
        slingshotReleaseVelocity: 1.4,
      },
    ),
    true,
  );
  assert.equal(
    evaluateSlingshotReady(
      {
        attachedToString: true,
        pullTension: 0.9,
        releaseVelocity: 2,
        pointerReleased: false,
        triggerCooldown: 0,
      },
      {
        slingshotTensionThreshold: 0.82,
        slingshotReleaseVelocity: 1.4,
      },
    ),
    false,
  );
});

test("trigger cooldown blocks a second arm until it elapses", () => {
  const gate = new StringTensionGate({
    maxStringPull: 100,
    triggerCooldownSeconds: 1,
  });

  const pullAndRelease = () => {
    for (let i = 0; i < 4; i += 1) {
      gate.update({
        dt: 1 / 60,
        pointerActive: true,
        pointerX: 250,
        pointerY: 400,
        rootX: 250,
        rootY: 310,
        strings: [string],
        contactThisFrame: i === 0,
        contactStringIndex: 0,
      });
    }
    gate.update({
      dt: 1 / 60,
      pointerActive: false,
      pointerX: 250,
      pointerY: 400,
      rootX: 250,
      rootY: 310,
      strings: [string],
      contactThisFrame: false,
    });
  };

  pullAndRelease();
  assert.equal(gate.consumeSlingshotTrigger(), true);

  pullAndRelease();
  assert.equal(gate.consumeSlingshotTrigger(), false);

  // Drain cooldown while idle.
  for (let i = 0; i < 70; i += 1) {
    gate.update({
      dt: 1 / 60,
      pointerActive: false,
      pointerX: 250,
      pointerY: 300,
      rootX: 250,
      rootY: 300,
      strings: [string],
      contactThisFrame: false,
    });
  }

  pullAndRelease();
  assert.equal(gate.consumeSlingshotTrigger(), true);
});
