import assert from "node:assert/strict";
import { test } from "node:test";

import {
  FRACTURE_ATTR,
  HeroFractureTransition,
  resetProxyPoolForTests,
  type FracturePhase,
  type SnapshotElement,
  type SnapshotRoot,
} from "@/lib/mascot/game/resonance";

function fakeEl(
  attrs: Record<string, string>,
  rect: { left: number; top: number; width: number; height: number },
): SnapshotElement {
  return {
    getAttribute(name: string) {
      return name in attrs ? attrs[name] : null;
    },
    hasAttribute(name: string) {
      return name in attrs;
    },
    getBoundingClientRect() {
      return rect;
    },
    textContent: attrs["data-proxy-label"] ?? "",
  };
}

function createHeroFixture(count = 6) {
  const attrs: Record<string, string> = {};
  const els = Array.from({ length: count }, (_, i) =>
    fakeEl(
      { "data-mascot-proxy": "letter", "data-proxy-label": "A" },
      { left: i * 12, top: 40, width: 10, height: 14 },
    ),
  );
  const root: SnapshotRoot & {
    setAttribute(name: string, value: string): void;
    removeAttribute(name: string): void;
    hasAttribute(name: string): boolean;
    attrs: Record<string, string>;
  } = {
    attrs,
    querySelectorAll() {
      return els;
    },
    setAttribute(name, value) {
      attrs[name] = value;
    },
    removeAttribute(name) {
      delete attrs[name];
    },
    hasAttribute(name) {
      return name in attrs;
    },
  };
  return root;
}

function advanceToPhase(
  transition: HeroFractureTransition,
  target: FracturePhase,
  maxSteps = 240,
): FracturePhase {
  for (let i = 0; i < maxSteps; i += 1) {
    transition.update(1 / 60);
    if (transition.getPhase() === target) return target;
  }
  return transition.getPhase();
}

test("accessible trigger reaches playing without Start modal and fires onPlaying once", () => {
  resetProxyPoolForTests();
  const hero = createHeroFixture();
  let playingCount = 0;
  const phases: FracturePhase[] = [];
  const transition = new HeroFractureTransition({
    heroRoot: hero,
    fractureTarget: hero,
    seed: 11,
    onPlaying: () => {
      playingCount += 1;
    },
    onPhaseChange: (p) => phases.push(p),
  });

  assert.equal(transition.beginFromAccessibleTrigger(), true);
  const phase = advanceToPhase(transition, "playing");
  assert.equal(phase, "playing");
  assert.equal(playingCount, 1);
  assert.ok(phases.includes("falling"));
  assert.ok(hero.hasAttribute(FRACTURE_ATTR));
  assert.ok(transition.getProxies().length > 0);

  // Still playing — onPlaying must not re-fire.
  transition.update(1 / 60);
  assert.equal(playingCount, 1);
});

test("slingshot path includes tension then snap beats", () => {
  resetProxyPoolForTests();
  const hero = createHeroFixture();
  const phases: FracturePhase[] = [];
  const transition = new HeroFractureTransition({
    heroRoot: hero,
    fractureTarget: hero,
    seed: 12,
    onPhaseChange: (p) => phases.push(p),
  });
  transition.beginFromSlingshot();
  assert.equal(transition.getPhase(), "tension");
  advanceToPhase(transition, "playing");
  assert.ok(phases.includes("tension"));
  assert.ok(phases.includes("snap"));
  assert.ok(phases.includes("unlock"));
  assert.ok(phases.includes("falling"));
  assert.ok(phases.includes("playing"));
});

test("reduced motion soft-detaches without tension/snap shake", () => {
  resetProxyPoolForTests();
  const hero = createHeroFixture();
  const phases: FracturePhase[] = [];
  const transition = new HeroFractureTransition({
    heroRoot: hero,
    fractureTarget: hero,
    reducedMotion: true,
    seed: 13,
    onPhaseChange: (p) => phases.push(p),
  });
  transition.beginFromSlingshot();
  assert.equal(transition.getPhase(), "falling");
  assert.equal(transition.getShakeImpulse(), 0);
  assert.ok(!phases.includes("tension"));
  assert.ok(!phases.includes("snap"));
  advanceToPhase(transition, "playing");
  assert.equal(transition.getPhase(), "playing");
  assert.equal(transition.getShakeImpulse(), 0);
});

test("interrupt enters restore and clears fracture attr on done", () => {
  resetProxyPoolForTests();
  const hero = createHeroFixture();
  let restoreDone = false;
  const transition = new HeroFractureTransition({
    heroRoot: hero,
    fractureTarget: hero,
    seed: 14,
    onRestoreComplete: () => {
      restoreDone = true;
    },
  });
  transition.beginFromAccessibleTrigger();
  advanceToPhase(transition, "falling");
  assert.ok(hero.hasAttribute(FRACTURE_ATTR));
  transition.interrupt();
  assert.equal(transition.getPhase(), "restore");
  advanceToPhase(transition, "done", 360);
  assert.equal(transition.getPhase(), "done");
  assert.equal(restoreDone, true);
  assert.equal(hero.hasAttribute(FRACTURE_ATTR), false);
});
