import assert from "node:assert/strict";
import { test } from "node:test";

import { CHORDS } from "@/components/IntrectiveComponents/stringSynth";
import { resolveDefaultMusicalEvent } from "@/lib/mascot/music/DefaultNoteMapping";
import type { StringPluckEvent } from "@/lib/mascot/types";

function makeEvent(
  overrides: Partial<StringPluckEvent> = {},
): StringPluckEvent {
  return {
    stringId: "string-0",
    stringIndex: 0,
    contactType: "core",
    contactPosition: 0.5,
    velocity: 0.5,
    direction: 1,
    worldX: 0,
    worldY: 0,
    gameMode: false,
    combo: 0,
    timestamp: 0,
    ...overrides,
  };
}

test("resolves the frequency straight from CHORDS[0] (C major) by string index", () => {
  const event = makeEvent({ stringIndex: 2 });
  const musical = resolveDefaultMusicalEvent(event);
  assert.equal(musical.frequency, CHORDS[0].strings[2][1]);
});

test("clamps an out-of-range string index instead of throwing", () => {
  const tooHigh = resolveDefaultMusicalEvent(makeEvent({ stringIndex: 99 }));
  assert.equal(
    tooHigh.frequency,
    CHORDS[0].strings[CHORDS[0].strings.length - 1][1],
  );

  const negative = resolveDefaultMusicalEvent(makeEvent({ stringIndex: -5 }));
  assert.equal(negative.frequency, CHORDS[0].strings[0][1]);
});

test("maps contact position to a symmetric pan within the configured clamp", () => {
  const left = resolveDefaultMusicalEvent(makeEvent({ contactPosition: 0 }));
  const center = resolveDefaultMusicalEvent(
    makeEvent({ contactPosition: 0.5 }),
  );
  const right = resolveDefaultMusicalEvent(makeEvent({ contactPosition: 1 }));
  assert.equal(left.pan, -0.75);
  assert.equal(center.pan, 0);
  assert.equal(right.pan, 0.75);
});

test("maps contact type to the documented articulation", () => {
  assert.equal(
    resolveDefaultMusicalEvent(makeEvent({ contactType: "core" })).articulation,
    "pluck",
  );
  assert.equal(
    resolveDefaultMusicalEvent(makeEvent({ contactType: "tail" })).articulation,
    "muted",
  );
  assert.equal(
    resolveDefaultMusicalEvent(makeEvent({ contactType: "drag" })).articulation,
    "muted",
  );
  assert.equal(
    resolveDefaultMusicalEvent(makeEvent({ contactType: "fin" })).articulation,
    "harmonic",
  );
  assert.equal(
    resolveDefaultMusicalEvent(makeEvent({ contactType: "landing" }))
      .articulation,
    "bass",
  );
});

test("velocity is perceptually curved, never passed through linearly", () => {
  const musical = resolveDefaultMusicalEvent(makeEvent({ velocity: 0.1 }));
  assert.ok(musical.velocity > 0.1);
  assert.ok(musical.velocity <= 1);
});

test("reverbSend scales with combo but stays bounded", () => {
  const noCombo = resolveDefaultMusicalEvent(makeEvent({ combo: 0 }));
  const highCombo = resolveDefaultMusicalEvent(makeEvent({ combo: 999 }));
  assert.equal(noCombo.reverbSend, 0);
  assert.ok(highCombo.reverbSend <= 0.6);
});

test("scheduledTime is left for the voice/scheduler layer to fill in, not this pure mapping", () => {
  const musical = resolveDefaultMusicalEvent(makeEvent());
  assert.equal(musical.scheduledTime, 0);
});
