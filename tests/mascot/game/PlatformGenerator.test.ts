import assert from "node:assert/strict";
import { test } from "node:test";

import { PlatformGenerator } from "@/lib/mascot/game/PlatformGenerator";
import { isReachable } from "@/lib/mascot/game/AscentPhysics";
import { STRUMRISE_CONFIG } from "@/lib/mascot/game/StrumriseConfig";
import type {
  GeneratedPlatform,
  StringPlatformKind,
} from "@/lib/mascot/game/GameTypes";

function generateRun(seed: number, count: number): GeneratedPlatform[] {
  const generator = new PlatformGenerator({
    seed,
    startY: 0,
    viewportWidth: 900,
  });
  const platforms: GeneratedPlatform[] = [
    generator.generateGroundPlatform("ground"),
  ];
  for (let i = 0; i < count; i += 1) {
    platforms.push(generator.generateNext(`p${i}`));
  }
  return platforms;
}

test("every generated platform is reachable from the platform launched before it", () => {
  const physics = STRUMRISE_CONFIG.physics;
  for (let seed = 0; seed < 25; seed += 1) {
    const platforms = generateRun(seed, 60);
    for (let i = 1; i < platforms.length; i += 1) {
      const from = platforms[i - 1];
      const to = platforms[i];
      const dy = from.y - to.y; // positive = upward
      const dx = to.x - from.x;
      const bounceSpeed = physics.bounce[from.kind];
      assert.ok(
        isReachable(
          dx,
          dy,
          bounceSpeed,
          physics.gravity,
          physics.maxHorizontalSpeed,
          physics.horizontalAcceleration,
        ),
        `seed ${seed}: platform ${i} (dx=${dx}, dy=${dy}) unreachable from kind "${from.kind}"`,
      );
    }
  }
});

test("generated gaps never exceed the theoretical max jump height", () => {
  const physics = STRUMRISE_CONFIG.physics;
  for (let seed = 0; seed < 10; seed += 1) {
    const platforms = generateRun(seed, 40);
    for (let i = 1; i < platforms.length; i += 1) {
      const from = platforms[i - 1];
      const to = platforms[i];
      const dy = from.y - to.y;
      const maxHeight = physics.bounce[from.kind] ** 2 / (2 * physics.gravity);
      assert.ok(
        dy <= maxHeight + 1e-6,
        `seed ${seed}: gap ${dy} exceeds max height ${maxHeight}`,
      );
    }
  }
});

test("the first N platforms are always the generous 'normal' kind", () => {
  const platforms = generateRun(7, 10);
  const generousCount = STRUMRISE_CONFIG.generation.firstGenerousCount;
  for (let i = 1; i <= generousCount; i += 1) {
    assert.equal(platforms[i].kind, "normal");
  }
});

test("no more than the configured max of consecutive treble platforms occurs", () => {
  const maxConsecutive = STRUMRISE_CONFIG.generation.maxConsecutiveTreble;
  for (let seed = 0; seed < 15; seed += 1) {
    const platforms = generateRun(seed, 80);
    let streak = 0;
    for (const platform of platforms) {
      streak = platform.kind === "treble" ? streak + 1 : 0;
      assert.ok(
        streak <= maxConsecutive,
        `seed ${seed}: treble streak ${streak} exceeds ${maxConsecutive}`,
      );
    }
  }
});

test("generated platforms stay within the viewport width", () => {
  const viewportWidth = 500;
  const generator = new PlatformGenerator({
    seed: 3,
    startY: 0,
    viewportWidth,
  });
  const ground = generator.generateGroundPlatform("ground");
  assert.ok(ground.x >= 0 && ground.x + ground.width <= viewportWidth + 1e-6);
  for (let i = 0; i < 40; i += 1) {
    const platform = generator.generateNext(`p${i}`);
    assert.ok(platform.x >= -1e-6, `platform ${i} x=${platform.x} is negative`);
    assert.ok(
      platform.x + platform.width <= viewportWidth + 1e-6,
      `platform ${i} extends past viewport width`,
    );
  }
});

test("note frequencies are always finite and positive", () => {
  const platforms = generateRun(11, 60);
  for (const platform of platforms) {
    assert.ok(Number.isFinite(platform.note.frequency));
    assert.ok(platform.note.frequency > 0);
    assert.ok(Number.isFinite(platform.note.midiNote));
  }
});

test("the same seed always produces the same sequence of platform kinds (deterministic)", () => {
  const kinds = (platforms: GeneratedPlatform[]): StringPlatformKind[] =>
    platforms.map((p) => p.kind);
  const runA = generateRun(42, 30);
  const runB = generateRun(42, 30);
  assert.deepEqual(kinds(runA), kinds(runB));
});
