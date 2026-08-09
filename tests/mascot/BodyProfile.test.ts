import assert from "node:assert/strict";
import { test } from "node:test";

import {
  bodyWidth,
  DEFAULT_BODY_PROFILE,
} from "@/lib/mascot/character/BodyProfile";

test("returns finite values across and beyond [0, 1]", () => {
  for (const t of [-2, -0.5, 0, 0.25, 0.5, 0.75, 1, 1.5, 3]) {
    const width = bodyWidth(t, DEFAULT_BODY_PROFILE);
    assert.ok(Number.isFinite(width), `t=${t} produced ${width}`);
  }
});

test("never returns a negative width", () => {
  for (let i = 0; i <= 40; i += 1) {
    const t = -0.5 + (i / 40) * 2;
    assert.ok(bodyWidth(t, DEFAULT_BODY_PROFILE) >= 0);
  }
});

test("tail approaches zero at t=1", () => {
  const width = bodyWidth(1, DEFAULT_BODY_PROFILE);
  assert.ok(width < 1e-6, `expected near-zero tail width, got ${width}`);
});

test("nose retains enough volume to host the face", () => {
  const nose = bodyWidth(0, DEFAULT_BODY_PROFILE);
  const peak = Math.max(
    ...Array.from({ length: 101 }, (_, index) =>
      bodyWidth(index / 100, DEFAULT_BODY_PROFILE),
    ),
  );
  assert.ok(nose >= peak * 0.72, `expected rounded nose, got ${nose}/${peak}`);
});

test("maximum occurs in the front half of the body (shoulder region), not the tail", () => {
  let maxWidth = -Infinity;
  let maxT = 0;
  for (let i = 0; i <= 200; i += 1) {
    const t = i / 200;
    const width = bodyWidth(t, DEFAULT_BODY_PROFILE);
    if (width > maxWidth) {
      maxWidth = width;
      maxT = t;
    }
  }
  assert.ok(
    maxT > 0.05 && maxT < 0.55,
    `expected peak near the shoulders, got t=${maxT}`,
  );
});

test("no abrupt discontinuities across the domain", () => {
  const samples: number[] = [];
  for (let i = 0; i <= 400; i += 1) {
    samples.push(bodyWidth(i / 400, DEFAULT_BODY_PROFILE));
  }
  for (let i = 1; i < samples.length; i += 1) {
    const delta = Math.abs(samples[i] - samples[i - 1]);
    assert.ok(
      delta < 0.05,
      `discontinuity of ${delta} between adjacent samples at index ${i}`,
    );
  }
});

test("maxWidth scales the profile linearly", () => {
  const base = bodyWidth(0.3, DEFAULT_BODY_PROFILE);
  const scaled = bodyWidth(0.3, { ...DEFAULT_BODY_PROFILE, maxWidth: 10 });
  assert.ok(Math.abs(scaled - base * 10) < 1e-9);
});

test("zero or negative maxWidth never produces a negative width", () => {
  assert.equal(bodyWidth(0.3, { ...DEFAULT_BODY_PROFILE, maxWidth: 0 }), 0);
  assert.ok(bodyWidth(0.3, { ...DEFAULT_BODY_PROFILE, maxWidth: -5 }) === 0);
});
