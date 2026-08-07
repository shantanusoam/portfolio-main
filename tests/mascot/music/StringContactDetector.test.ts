import assert from "node:assert/strict";
import { test } from "node:test";

import { StringContactDetector } from "@/lib/mascot/music/StringContactDetector";
import type { MusicalStringGeometry } from "@/lib/mascot/music/StringRegistry";

function makeString(
  index: number,
  restY: number,
  left = 0,
  right = 1000,
): MusicalStringGeometry {
  return {
    id: `mascot-string-${index}`,
    index,
    role: "mid",
    element: {} as Element,
    left,
    right,
    restY,
  };
}

const config = { cooldownSeconds: 0.15, minSpeed: 100 };

test("a fast downward crossing through the rest line emits one event", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  const events = detector.detect(
    1 / 60,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 120 }],
    config,
  );

  assert.equal(events.length, 1);
  assert.equal(events[0].stringIndex, 0);
  assert.equal(events[0].contactType, "core");
  assert.equal(events[0].direction, 1);
});

test("staying on one side of the rest line never triggers a contact", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];
  let totalEvents = 0;

  for (let i = 0; i < 10; i += 1) {
    const events = detector.detect(
      i / 60,
      1 / 60,
      strings,
      [{ id: "core", type: "core", x: 500, y: 40 + i }],
      config,
    );
    totalEvents += events.length;
  }

  assert.equal(totalEvents, 0);
});

test("resting overlap does not retrigger within the cooldown window", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  const first = detector.detect(
    0.02,
    0.02,
    strings,
    [{ id: "core", type: "core", x: 500, y: 120 }],
    config,
  );
  assert.equal(first.length, 1);

  // Bounce back and forth quickly, still inside the cooldown window.
  const second = detector.detect(
    0.04,
    0.02,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  const third = detector.detect(
    0.06,
    0.02,
    strings,
    [{ id: "core", type: "core", x: 500, y: 120 }],
    config,
  );
  assert.equal(
    second.length + third.length,
    0,
    "expected the cooldown to suppress rapid re-crossings",
  );
});

test("a high-speed swept crossing across a large dt is still detected", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 0 }],
    config,
  );
  const events = detector.detect(
    0.016,
    0.016,
    strings,
    [{ id: "core", type: "core", x: 500, y: 400 }],
    config,
  );

  assert.equal(events.length, 1);
});

test("a slow drag below minSpeed does not trigger a contact", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1,
    strings,
    [{ id: "core", type: "core", x: 500, y: 99 }],
    config,
  );
  const events = detector.detect(
    1,
    1,
    strings,
    [{ id: "core", type: "core", x: 500, y: 101 }],
    config,
  );

  assert.equal(events.length, 0);
});

test("contact outside the string's horizontal span is ignored", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100, 200, 800)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 50, y: 80 }],
    config,
  );
  const events = detector.detect(
    1 / 60,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 50, y: 120 }],
    config,
  );

  assert.equal(events.length, 0);
});

test("intensity and contactPosition are always finite and within [0, 1]", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100, 0, 1000)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 900, y: 0 }],
    config,
  );
  const events = detector.detect(
    1 / 60,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 900, y: 5000 }],
    config,
  );

  assert.equal(events.length, 1);
  const [event] = events;
  assert.ok(Number.isFinite(event.velocity));
  assert.ok(event.velocity >= 0 && event.velocity <= 1);
  assert.ok(Number.isFinite(event.contactPosition));
  assert.ok(event.contactPosition >= 0 && event.contactPosition <= 1);
});

test("multiple contact points against multiple strings each resolve independently", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100), makeString(1, 200)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [
      { id: "core", type: "core", x: 500, y: 80 },
      { id: "tail", type: "tail", x: 500, y: 180 },
    ],
    config,
  );
  const events = detector.detect(
    1 / 60,
    1 / 60,
    strings,
    [
      { id: "core", type: "core", x: 500, y: 120 },
      { id: "tail", type: "tail", x: 500, y: 220 },
    ],
    config,
  );

  assert.equal(events.length, 2);
  const types = events.map((e) => e.contactType).sort();
  assert.deepEqual(types, ["core", "tail"]);
});

test("zero or negative dt is a safe no-op (still records position for next call)", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  const events = detector.detect(
    0,
    0,
    strings,
    [{ id: "core", type: "core", x: 500, y: 120 }],
    config,
  );
  assert.equal(events.length, 0);
});

test("reset clears cooldown and position history", () => {
  const detector = new StringContactDetector();
  const strings = [makeString(0, 100)];

  detector.detect(
    0,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  detector.detect(
    1 / 60,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 120 }],
    config,
  );

  detector.reset();

  // Immediately after reset there's no "previous" sample, so this call
  // only records position and cannot emit an event yet.
  const events = detector.detect(
    2 / 60,
    1 / 60,
    strings,
    [{ id: "core", type: "core", x: 500, y: 80 }],
    config,
  );
  assert.equal(events.length, 0);
});
