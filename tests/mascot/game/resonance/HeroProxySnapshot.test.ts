import assert from "node:assert/strict";
import { test } from "node:test";

import { SeededRandom } from "@/lib/mascot/core/SeededRandom";
import {
  HERO_PROXY_CAP_MOBILE,
  resetProxyPoolForTests,
  snapshotHeroProxies,
  type SnapshotElement,
  type SnapshotRoot,
} from "@/lib/mascot/game/resonance";

function fakeEl(
  attrs: Record<string, string>,
  rect: { left: number; top: number; width: number; height: number },
  text = "",
): SnapshotElement & { measureCount: number } {
  const el = {
    measureCount: 0,
    getAttribute(name: string) {
      return name in attrs ? attrs[name] : null;
    },
    hasAttribute(name: string) {
      return name in attrs;
    },
    getBoundingClientRect() {
      el.measureCount += 1;
      return rect;
    },
    textContent: text,
    style: { color: "#fff" },
  };
  return el;
}

function fakeRoot(elements: SnapshotElement[]): SnapshotRoot {
  return {
    querySelectorAll() {
      return elements;
    },
  };
}

test("snapshot caps proxies at maxProxies", () => {
  resetProxyPoolForTests();
  const els = Array.from({ length: 50 }, (_, i) =>
    fakeEl(
      { "data-mascot-proxy": "letter", "data-proxy-label": "A" },
      { left: i * 10, top: 20, width: 8, height: 12 },
      "A",
    ),
  );
  const proxies = snapshotHeroProxies(fakeRoot(els), {
    maxProxies: 22,
    seed: 1,
  });
  assert.equal(proxies.length, 22);
});

test("snapshot uses a lower default cap on mobile", () => {
  resetProxyPoolForTests();
  const els = Array.from({ length: 40 }, (_, i) =>
    fakeEl(
      { "data-mascot-proxy": "dot" },
      { left: i, top: i, width: 4, height: 4 },
    ),
  );
  const proxies = snapshotHeroProxies(fakeRoot(els), {
    isMobile: true,
    seed: 2,
  });
  assert.equal(proxies.length, HERO_PROXY_CAP_MOBILE);
});

test("snapshot measures each candidate once and ignores tiny rects", () => {
  resetProxyPoolForTests();
  const a = fakeEl(
    { "data-mascot-proxy": "letter", "data-proxy-label": "S" },
    { left: 0, top: 0, width: 10, height: 14 },
    "S",
  );
  const tiny = fakeEl(
    { "data-mascot-proxy": "dot" },
    { left: 0, top: 0, width: 0.2, height: 0.2 },
  );
  const bar = fakeEl(
    { "data-mascot-perch": "rail" },
    { left: 10, top: 40, width: 200, height: 1 },
  );
  const proxies = snapshotHeroProxies(fakeRoot([a, tiny, bar]), { seed: 3 });
  assert.equal(proxies.length, 2);
  assert.equal(a.measureCount, 1);
  assert.equal(tiny.measureCount, 1);
  assert.equal(bar.measureCount, 1);
  assert.equal(proxies[0].type, "letter");
  assert.equal(proxies[1].type, "bar");
});

test("scatter velocities are deterministic for the same seed", () => {
  resetProxyPoolForTests();
  const els = [
    fakeEl(
      { "data-mascot-proxy": "letter", "data-proxy-label": "X" },
      { left: 100, top: 50, width: 12, height: 16 },
      "X",
    ),
  ];
  const a = snapshotHeroProxies(fakeRoot(els), {
    rng: new SeededRandom(99),
  });
  resetProxyPoolForTests();
  const b = snapshotHeroProxies(fakeRoot(els), {
    rng: new SeededRandom(99),
  });
  assert.equal(a[0].velocityX, b[0].velocityX);
  assert.equal(a[0].velocityY, b[0].velocityY);
  assert.equal(a[0].angularVelocity, b[0].angularVelocity);
});
