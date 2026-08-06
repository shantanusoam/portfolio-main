import assert from "node:assert/strict";
import { test } from "node:test";

import { PerformanceGovernor } from "@/lib/mascot/core/PerformanceGovernor";

test("downgrades after sustained slow frames", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "high",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(28);
  clock = 10_000;
  const next = governor.evaluate(false);
  assert.equal(next, "medium");
});

test("does not change quality while blocked", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "high",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(30);
  clock = 10_000;
  const next = governor.evaluate(true);
  assert.equal(next, null);
});

test("respects downgrade cooldown", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "high",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(30);
  clock = 100; // well within cooldown of lastQualityChange=0
  const next = governor.evaluate(false);
  assert.equal(next, null);
});

test("upgrades at most once per session", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "low",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(4);
  clock = 20_000;
  const first = governor.evaluate(false);
  assert.equal(first, "medium");

  for (let i = 0; i < 90; i += 1) governor.recordFrame(4);
  clock = 40_000;
  const second = governor.evaluate(false);
  assert.equal(second, null, "should not upgrade a second time in one session");
});

test("reduced is the final fallback (never downgrades below it)", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "reduced",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(50);
  clock = 20_000;
  const next = governor.evaluate(false);
  assert.equal(next, null);
});

test("does not oscillate rapidly", () => {
  let clock = 0;
  const governor = new PerformanceGovernor({
    initialQuality: "medium",
    now: () => clock,
  });
  for (let i = 0; i < 90; i += 1) governor.recordFrame(30);
  clock = 10_000;
  const first = governor.evaluate(false);
  assert.equal(first, "low");
  clock = 10_050; // immediately after, still within cooldown
  const second = governor.evaluate(false);
  assert.equal(second, null);
});
