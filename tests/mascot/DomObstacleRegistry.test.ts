import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveObstacleMode } from "@/lib/mascot/interaction/DomObstacleRegistry";

function fakeElement(attrs: Record<string, string>) {
  return {
    getAttribute: (name: string) => (name in attrs ? attrs[name] : null),
    hasAttribute: (name: string) => name in attrs,
  };
}

test("resolves the hard obstacle mode", () => {
  assert.equal(
    resolveObstacleMode(fakeElement({ "data-mascot-obstacle": "hard" })),
    "hard",
  );
});

test("resolves the soft obstacle mode", () => {
  assert.equal(
    resolveObstacleMode(fakeElement({ "data-mascot-obstacle": "soft" })),
    "soft",
  );
});

test("resolves the interest mode from a bare attribute", () => {
  assert.equal(
    resolveObstacleMode(fakeElement({ "data-mascot-interest": "project" })),
    "interest",
  );
});

test("an invalid data-mascot-obstacle value resolves to null", () => {
  assert.equal(
    resolveObstacleMode(fakeElement({ "data-mascot-obstacle": "medium" })),
    null,
  );
});

test("an element with neither attribute resolves to null", () => {
  assert.equal(resolveObstacleMode(fakeElement({})), null);
});

test("data-mascot-obstacle takes precedence over data-mascot-interest when both are present", () => {
  const element = fakeElement({
    "data-mascot-obstacle": "hard",
    "data-mascot-interest": "project",
  });
  assert.equal(resolveObstacleMode(element), "hard");
});
