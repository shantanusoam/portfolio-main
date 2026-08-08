import assert from "node:assert/strict";
import { test } from "node:test";

import {
  collectPerchCandidates,
  computeDragResistance,
  findNearestPerch,
  pickWeightedInterest,
  slideAlongPerch,
  HeroInteractionDirector,
  type PerchCandidate,
} from "@/lib/mascot/interaction/HeroInteractionDirector";
import type { MascotObstacle } from "@/lib/mascot/types";

const hardRect = { left: 200, top: 100, right: 320, bottom: 160 };

test("drag resistance is zero when the pointer is free of hard UI", () => {
  const result = computeDragResistance({
    rootX: 80,
    rootY: 130,
    pointerX: 100,
    pointerY: 130,
    pointerActive: true,
    hardObstacles: [hardRect],
    hardForceX: 0,
    hardForceY: 0,
  });
  assert.equal(result.dragTension, 0);
  assert.equal(result.adjustedPointer.x, 100);
});

test("drag resistance rises when pulling into a hard obstacle", () => {
  const result = computeDragResistance({
    rootX: 180,
    rootY: 130,
    pointerX: 260,
    pointerY: 130,
    pointerActive: true,
    hardObstacles: [hardRect],
    // Escape force points left — opposite the rightward pull.
    hardForceX: -120,
    hardForceY: 0,
  });
  assert.ok(result.dragTension > 0.2);
  assert.ok(
    result.adjustedPointer.x < 260,
    "resisted pointer should pull back from the hard rect",
  );
});

test("inactive pointer reports zero drag tension", () => {
  const result = computeDragResistance({
    rootX: 180,
    rootY: 130,
    pointerX: 260,
    pointerY: 130,
    pointerActive: false,
    hardObstacles: [hardRect],
    hardForceX: -120,
    hardForceY: 0,
  });
  assert.equal(result.dragTension, 0);
});

test("collectPerchCandidates keeps soft and perch modes only", () => {
  const obstacles = [
    {
      id: "h",
      mode: "hard",
      left: 0,
      top: 0,
      right: 10,
      bottom: 10,
      padding: 0,
    },
    {
      id: "p",
      mode: "perch",
      left: 0,
      top: 40,
      right: 200,
      bottom: 44,
      padding: 4,
    },
    {
      id: "s",
      mode: "soft",
      left: 0,
      top: 80,
      right: 100,
      bottom: 120,
      padding: 6,
    },
    {
      id: "i",
      mode: "interest",
      left: 0,
      top: 0,
      right: 10,
      bottom: 10,
      padding: 0,
    },
  ] as MascotObstacle[];

  const candidates = collectPerchCandidates(obstacles);
  assert.equal(candidates.length, 2);
  assert.deepEqual(candidates.map((c) => c.id).sort(), ["p", "s"]);
});

test("findNearestPerch snaps to a bar within the vertical band", () => {
  const bars: PerchCandidate[] = [
    { id: "a", left: 0, right: 400, topY: 200 },
    { id: "b", left: 0, right: 400, topY: 500 },
  ];
  const near = findNearestPerch(120, 185, bars);
  assert.ok(near);
  assert.equal(near!.id, "a");
});

test("slideAlongPerch clamps X to the bar insets", () => {
  const bar: PerchCandidate = { id: "rail", left: 0, right: 200, topY: 90 };
  const point = slideAlongPerch(1000, bar);
  assert.ok(point.x < 200);
  assert.equal(point.y, 90);
});

test("pickWeightedInterest prefers the hero tag", () => {
  const candidates = [
    { id: "project", tag: "project", centerX: 100, centerY: 100 },
    { id: "hero", tag: "hero", centerX: 110, centerY: 110 },
  ];
  let heroWins = 0;
  for (let i = 0; i < 40; i += 1) {
    const chosen = pickWeightedInterest(candidates, 105, 105, i / 40);
    if (chosen?.id === "hero") heroWins += 1;
  }
  assert.ok(heroWins > 20, `expected hero bias, got ${heroWins}/40`);
});

test("HeroInteractionDirector latches perch and exposes dragTension", () => {
  const director = new HeroInteractionDirector();
  const obstacles = [
    {
      id: "rail",
      element: {} as HTMLElement,
      mode: "perch" as const,
      left: 50,
      top: 190,
      right: 350,
      bottom: 196,
      centerX: 200,
      centerY: 193,
      padding: 4,
      influence: 8,
      priority: 0,
    },
    {
      id: "cta",
      element: {} as HTMLElement,
      mode: "hard" as const,
      left: 400,
      top: 100,
      right: 520,
      bottom: 140,
      centerX: 460,
      centerY: 120,
      padding: 12,
      influence: 90,
      priority: 2,
    },
  ];

  const perched = director.update({
    dt: 1 / 60,
    rootX: 180,
    rootY: 175,
    pointerX: 180,
    pointerY: 175,
    pointerActive: false,
    allowPerch: true,
    obstacles,
    hardForceX: 0,
    hardForceY: 0,
    desiredSlideX: 220,
  });
  assert.equal(perched.perched, true);
  assert.ok(perched.surfaceTarget);
  assert.ok(perched.surfaceTarget!.y > 180 && perched.surfaceTarget!.y < 200);
  assert.ok(perched.surfaceTarget!.x >= 50 && perched.surfaceTarget!.x <= 350);

  const dragging = director.update({
    dt: 1 / 60,
    rootX: 390,
    rootY: 120,
    pointerX: 470,
    pointerY: 120,
    pointerActive: true,
    allowPerch: false,
    obstacles,
    hardForceX: -100,
    hardForceY: 0,
    desiredSlideX: 470,
  });
  assert.ok(dragging.dragTension > 0);
  assert.equal(dragging.perched, false);
});

test("release after high drag tension produces a rebound offset", () => {
  const director = new HeroInteractionDirector({
    reboundTensionThreshold: 0.1,
  });
  const obstacles = [
    {
      id: "cta",
      element: {} as HTMLElement,
      mode: "hard" as const,
      left: 200,
      top: 100,
      right: 320,
      bottom: 160,
      centerX: 260,
      centerY: 130,
      padding: 12,
      influence: 90,
      priority: 2,
    },
  ];

  // Build tension while dragging into the hard rect.
  for (let i = 0; i < 12; i += 1) {
    director.update({
      dt: 1 / 60,
      rootX: 180,
      rootY: 130,
      pointerX: 280,
      pointerY: 130,
      pointerActive: true,
      allowPerch: false,
      obstacles,
      hardForceX: -130,
      hardForceY: 0,
      desiredSlideX: 280,
    });
  }

  const released = director.update({
    dt: 1 / 60,
    rootX: 180,
    rootY: 130,
    pointerX: 280,
    pointerY: 130,
    pointerActive: false,
    allowPerch: true,
    obstacles,
    hardForceX: 0,
    hardForceY: 0,
    desiredSlideX: 180,
  });
  assert.ok(released.reboundOffset);
  assert.ok(
    (released.reboundOffset!.x !== 0 || released.reboundOffset!.y !== 0) &&
      Number.isFinite(released.reboundOffset!.x),
  );
});
