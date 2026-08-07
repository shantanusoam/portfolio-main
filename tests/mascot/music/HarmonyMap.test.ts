import assert from "node:assert/strict";
import { test } from "node:test";

import {
  guitarModeStringCount,
  midiToFrequency,
  PENTATONIC_DEGREES,
  resolveGuitarModeNote,
  resolvePortfolioModeNote,
} from "@/lib/mascot/music/HarmonyMap";

test("resolveGuitarModeNote returns a real note for a valid chord/string pair", () => {
  const note = resolveGuitarModeNote(0, 0);
  assert.ok(note);
  assert.ok(typeof note!.name === "string" && note!.name.length > 0);
  assert.ok(Number.isFinite(note!.frequency) && note!.frequency > 0);
});

test("resolveGuitarModeNote returns null for an out-of-range chord or string index", () => {
  assert.equal(resolveGuitarModeNote(999, 0), null);
  assert.equal(resolveGuitarModeNote(0, 999), null);
});

test("guitarModeStringCount matches the actual chord table (6 strings)", () => {
  assert.equal(guitarModeStringCount(0), 6);
  assert.equal(guitarModeStringCount(999), 0);
});

test("midiToFrequency matches the standard A4=440Hz reference", () => {
  assert.ok(Math.abs(midiToFrequency(69) - 440) < 1e-6);
  // One octave up doubles frequency.
  assert.ok(Math.abs(midiToFrequency(81) - 880) < 1e-6);
});

test("resolvePortfolioModeNote always returns a finite, positive frequency", () => {
  for (let i = -3; i <= 12; i += 1) {
    const note = resolvePortfolioModeNote(60, i);
    assert.ok(Number.isFinite(note.frequency));
    assert.ok(note.frequency > 0);
  }
});

test("resolvePortfolioModeNote wraps degree index into the pentatonic scale", () => {
  const base = resolvePortfolioModeNote(60, 0);
  const wrapped = resolvePortfolioModeNote(60, PENTATONIC_DEGREES.length);
  assert.equal(base.frequency, wrapped.frequency);
});

test("resolvePortfolioModeNote octaveOffset shifts frequency by whole octaves", () => {
  const base = resolvePortfolioModeNote(60, 0, 0);
  const up = resolvePortfolioModeNote(60, 0, 1);
  assert.ok(Math.abs(up.frequency - base.frequency * 2) < 1e-6);
});
