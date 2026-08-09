import assert from "node:assert/strict";
import { test } from "node:test";

import { MusicalDirector } from "@/lib/mascot/music/MusicalDirector";
import type { StringPluckEvent } from "@/lib/mascot/types";

const config = {
  strumWindowSeconds: 0.5,
  minStringsForStrum: 3,
  comboResetSeconds: 2,
};

function makeEvent(
  stringIndex: number,
  timestamp: number,
  direction: 1 | -1 = 1,
): StringPluckEvent {
  return {
    stringId: `mascot-string-${stringIndex}`,
    stringIndex,
    contactType: "core",
    contactPosition: 0.5,
    velocity: 0.6,
    direction,
    worldX: 500,
    worldY: 100,
    gameMode: false,
    combo: 0,
    timestamp,
  };
}

test("three or more distinct strings in the same direction within the window is a strum", () => {
  const director = new MusicalDirector();
  assert.equal(director.process(0, [makeEvent(0, 0)], config), null);
  assert.equal(director.process(0.05, [makeEvent(1, 0.05)], config), null);
  const result = director.process(0.1, [makeEvent(2, 0.1)], config);

  assert.ok(result);
  assert.deepEqual(result!.stringIndexes, [0, 1, 2]);
  assert.equal(result!.direction, 1);
});

test("fewer than the minimum distinct strings never resolves a strum", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0)], config);
  const result = director.process(0.05, [makeEvent(0, 0.05)], config); // same string again
  assert.equal(result, null);
});

test("inconsistent direction does not count as a strum", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0, 1)], config);
  director.process(0.05, [makeEvent(1, 0.05, -1)], config);
  const result = director.process(0.1, [makeEvent(2, 0.1, 1)], config);
  assert.equal(result, null);
});

test("events outside the strum window are dropped before grouping", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0)], config);
  director.process(0.05, [makeEvent(1, 0.05)], config);
  // Far beyond strumWindowSeconds (0.5) later - the first two events should have aged out.
  const result = director.process(2, [makeEvent(2, 2)], config);
  assert.equal(result, null);
});

test("combo increments per event and resets after comboResetSeconds of silence", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0)], config);
  director.process(0.1, [makeEvent(1, 0.1)], config);
  assert.equal(director.getCombo(), 2);

  director.process(10, [], config); // long gap, past comboResetSeconds
  assert.equal(director.getCombo(), 0);
});

test("a recognized strum consumes its events (does not double-count into the next strum)", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0)], config);
  director.process(0.05, [makeEvent(1, 0.05)], config);
  const first = director.process(0.1, [makeEvent(2, 0.1)], config);
  assert.ok(first);

  // A single new event alone should not immediately re-trigger a strum.
  const second = director.process(0.12, [makeEvent(3, 0.12)], config);
  assert.equal(second, null);
});

test("reset clears combo and pending events", () => {
  const director = new MusicalDirector();
  director.process(0, [makeEvent(0, 0)], config);
  director.reset();
  assert.equal(director.getCombo(), 0);
  const result = director.process(0.01, [makeEvent(1, 0.01)], config);
  assert.equal(result, null);
});

test("empty events with no prior activity is a safe no-op", () => {
  const director = new MusicalDirector();
  const result = director.process(0, [], config);
  assert.equal(result, null);
  assert.equal(director.getCombo(), 0);
});
