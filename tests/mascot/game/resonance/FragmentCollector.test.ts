import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { FragmentCollector } from "@/lib/mascot/game/resonance/FragmentCollector";
import { createGameRoot } from "@/lib/mascot/game/resonance/WeaverPhysics";
import type { HeroProxyObject } from "@/lib/mascot/game/resonance/types";

function makeProxy(
  overrides: Partial<HeroProxyObject> & { id: string },
): HeroProxyObject {
  return {
    sourceElement: null,
    type: "letter",
    homeX: 0,
    homeY: 0,
    x: 50,
    y: 50,
    previousX: 50,
    previousY: 50,
    velocityX: 0,
    velocityY: 0,
    rotation: 0,
    angularVelocity: 0,
    width: 20,
    height: 24,
    opacity: 1,
    collected: false,
    label: "A",
    fillStyle: "#fff",
    ...overrides,
  };
}

describe("FragmentCollector", () => {
  it("collects overlapping proxies and raises combo", () => {
    const collector = new FragmentCollector();
    const root = createGameRoot(50, 50, 22);
    const proxies = [
      makeProxy({ id: "a" }),
      makeProxy({ id: "b", x: 200, y: 200 }),
    ];
    const got = collector.collectOverlapping(root, proxies);
    assert.equal(got, 1);
    assert.equal(proxies[0].collected, true);
    assert.equal(proxies[1].collected, false);
    assert.equal(collector.getCombo(), 1);
    assert.ok(collector.getScore() > 0);
  });

  it("winTarget respects fraction and floor", () => {
    assert.ok(FragmentCollector.winTarget(30) >= 4);
    assert.ok(FragmentCollector.winTarget(2) <= 2);
  });

  it("does not collect already collected proxies", () => {
    const collector = new FragmentCollector();
    const root = createGameRoot(50, 50, 22);
    const proxies = [makeProxy({ id: "a", collected: true, opacity: 0 })];
    assert.equal(collector.collectOverlapping(root, proxies), 0);
  });
});
