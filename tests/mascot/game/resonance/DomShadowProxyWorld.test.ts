import assert from "node:assert/strict";
import { test } from "node:test";

import { DomShadowProxyWorld } from "@/lib/mascot/game/resonance";
import type { HeroProxyObject } from "@/lib/mascot/game/resonance";

function makeProxy(overrides: Partial<HeroProxyObject> = {}): HeroProxyObject {
  const base: HeroProxyObject = {
    id: "p0",
    sourceElement: {
      getBoundingClientRect() {
        throw new Error("DOM read during simulation");
      },
    } as unknown as HTMLElement,
    type: "letter",
    homeX: 100,
    homeY: 80,
    x: 100,
    y: 80,
    previousX: 100,
    previousY: 80,
    velocityX: 40,
    velocityY: -20,
    rotation: 0.1,
    angularVelocity: 1,
    width: 12,
    height: 16,
    opacity: 1,
    collected: false,
    label: "A",
    fillStyle: "#fff",
  };
  return { ...base, ...overrides };
}

test("update never reads DOM (sourceElement getBoundingClientRect)", () => {
  const world = new DomShadowProxyWorld();
  const proxy = makeProxy({ x: 10, y: 10, homeX: 10, homeY: 10 });
  world.adopt([proxy], false);
  assert.doesNotThrow(() => {
    for (let i = 0; i < 30; i += 1) world.update(1 / 60);
  });
  // adopt(..., true) nulls sourceElement — verify detach path too
  const world2 = new DomShadowProxyWorld();
  const p2 = makeProxy();
  world2.adopt([p2], true);
  assert.equal(p2.sourceElement, null);
  world2.update(1 / 60);
  assert.ok(p2.y !== 80 || p2.x !== 100);
});

test("restoreTowardHome converges to home positions", () => {
  const world = new DomShadowProxyWorld();
  const proxy = makeProxy({
    x: 400,
    y: 500,
    homeX: 100,
    homeY: 80,
    velocityX: 200,
    velocityY: 200,
  });
  world.adopt([proxy], true);

  let remaining = Infinity;
  for (let i = 0; i < 180; i += 1) {
    remaining = world.restoreTowardHome(1 / 60, 8);
  }
  assert.ok(remaining < 1.5, `expected convergence, remaining=${remaining}`);
  assert.ok(Math.abs(proxy.x - proxy.homeX) < 1.5);
  assert.ok(Math.abs(proxy.y - proxy.homeY) < 1.5);
  assert.ok(Math.abs(proxy.rotation) < 0.05);
});

test("reduced motion damps initial scatter on adopt", () => {
  const calm = new DomShadowProxyWorld({ reducedMotion: true });
  const wild = new DomShadowProxyWorld({ reducedMotion: false });
  const a = makeProxy({ velocityX: 100, velocityY: 100, angularVelocity: 2 });
  const b = makeProxy({
    id: "p1",
    velocityX: 100,
    velocityY: 100,
    angularVelocity: 2,
  });
  calm.adopt([a], true);
  wild.adopt([b], true);
  assert.ok(Math.abs(a.velocityX) < Math.abs(b.velocityX));
  assert.ok(Math.abs(a.angularVelocity) < Math.abs(b.angularVelocity));
});
