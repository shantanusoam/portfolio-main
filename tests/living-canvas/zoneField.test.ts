import assert from "node:assert/strict";
import test from "node:test";
import {
  clampSignalEnergy,
  DEFAULT_SIGNAL_ZONE_PROFILE,
  resolveCreatureIntent,
  resolveSignalZoneProfile,
} from "../../lib/living-canvas/zoneField";

test("resolveSignalZoneProfile gives each motion role a safe default", () => {
  assert.deepEqual(resolveSignalZoneProfile({ signalZone: "moment" }), {
    kind: "moment",
    energy: 0.88,
    warmth: 0,
  });
  assert.deepEqual(
    resolveSignalZoneProfile({ signalZone: "rest", signalTone: "warm" }),
    { kind: "rest", energy: 0.14, warmth: 0.72 },
  );
});

test("resolveSignalZoneProfile accepts deliberate overrides and rejects noise", () => {
  assert.deepEqual(
    resolveSignalZoneProfile({
      signalZone: "bridge",
      signalEnergy: "0.61",
      signalTone: "cool",
    }),
    { kind: "bridge", energy: 0.61, warmth: -0.72 },
  );
  assert.deepEqual(
    resolveSignalZoneProfile({
      signalZone: "unknown",
      signalEnergy: "not-a-number",
      signalTone: "purple",
    }),
    DEFAULT_SIGNAL_ZONE_PROFILE,
  );
});

test("clampSignalEnergy prevents invisible and overpowering zones", () => {
  assert.equal(clampSignalEnergy(-5), 0.06);
  assert.equal(clampSignalEnergy(4), 1);
  assert.equal(
    clampSignalEnergy(Number.NaN),
    DEFAULT_SIGNAL_ZONE_PROFILE.energy,
  );
});

test("resolveCreatureIntent turns behavior into bounded wake energy", () => {
  assert.equal(resolveCreatureIntent("sprint"), 1);
  assert.equal(resolveCreatureIntent("follow"), 0.72);
  assert.equal(resolveCreatureIntent("inspect"), 0.52);
  assert.equal(resolveCreatureIntent("rest"), 0.08);
  assert.equal(resolveCreatureIntent("something-new"), 0.3);
});
