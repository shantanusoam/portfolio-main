import assert from "node:assert/strict";
import { test } from "node:test";

import { quantizeToScale } from "@/lib/mascot/music/NoteQuantizer";

const PENTATONIC = [0, 3, 5, 7, 10];

test("a note already on the scale is returned unchanged", () => {
  assert.equal(quantizeToScale(60, PENTATONIC, 60), 60);
  assert.equal(quantizeToScale(65, PENTATONIC, 60), 65); // root+5
});

test("an off-scale note snaps to the nearest scale degree", () => {
  // root=60, requested 61 (one semitone off root) should snap to 60 (degree 0).
  assert.equal(quantizeToScale(61, PENTATONIC, 60), 60);
});

test("quantization is octave-preserving", () => {
  const quantized = quantizeToScale(73, PENTATONIC, 60); // one octave + 1 up
  assert.ok(
    quantized >= 72 && quantized < 84,
    `expected same octave as input, got ${quantized}`,
  );
});

test("an empty scale returns the input unchanged", () => {
  assert.equal(quantizeToScale(61, [], 60), 61);
});

test("a non-finite input is returned unchanged rather than propagating NaN", () => {
  assert.equal(quantizeToScale(Number.NaN, PENTATONIC, 60), Number.NaN);
});

test("ties resolve deterministically (same input always produces same output)", () => {
  const a = quantizeToScale(62, PENTATONIC, 60);
  const b = quantizeToScale(62, PENTATONIC, 60);
  assert.equal(a, b);
});
