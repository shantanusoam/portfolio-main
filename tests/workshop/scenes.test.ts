import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import path from "node:path";
import {
  SCENES,
  SCENE_ORDER,
  phaseAt,
  playbackFor,
  sceneForRoute,
  scenesForMode,
} from "../../lib/workshop/scenes";

const publicDir = path.join(process.cwd(), "public");

test("every manifest file ships in public and is non-empty", () => {
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    const files = [
      scene.plate,
      scene.sources.webm,
      scene.sources.mobileWebm,
      scene.sources.mp4,
      scene.sources.poster,
    ];
    for (const file of files) {
      const disk = path.join(publicDir, file);
      assert.ok(existsSync(disk), `${id}: missing ${file}`);
    }
  }
});

test("no scene advertises a still-moving video in still mode", () => {
  for (const id of SCENE_ORDER) {
    assert.ok(
      !SCENES[id].modes.includes("still"),
      `${id} must not play in still mode`,
    );
    assert.ok(SCENES[id].modes.length > 0, `${id} needs at least one mode`);
  }
  assert.equal(scenesForMode("still").length, 0);
  for (const scene of scenesForMode("gentle")) assert.equal(scene.loop, true);
});

test("phase windows are ordered, bounded and cover the clip", () => {
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    assert.ok(scene.phases.length > 0, `${id} needs phases`);
    assert.equal(scene.phases[0].start, 0, `${id} must start at zero`);
    for (let i = 1; i < scene.phases.length; i++) {
      assert.equal(
        scene.phases[i].start,
        scene.phases[i - 1].end,
        `${id} phase ${i} must start where the previous ends`,
      );
      assert.ok(
        scene.phases[i].end > scene.phases[i].start,
        `${id} phase ${i} must have length`,
      );
    }
    const last = scene.phases.at(-1)!;
    assert.ok(
      last.end <= scene.duration + 0.05,
      `${id} phases must end inside the measured duration`,
    );
    assert.ok(
      last.end >= scene.duration - 0.15,
      `${id} phases must cover the measured duration`,
    );
  }
});

test("measured motion data is recorded per second of clip", () => {
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    assert.ok(scene.duration > 0, `${id} duration`);
    assert.ok(
      Math.abs(
        scene.measured.motionPerSecond.length - Math.round(scene.duration),
      ) <= 1,
      `${id} needs a motion sample per second`,
    );
    assert.ok(scene.measured.seamDiff >= 0, `${id} seam`);
    assert.ok(
      scene.measured.peakAt >= 0 && scene.measured.peakAt <= scene.duration,
      `${id} peak must fall inside the clip`,
    );
  }
});

test("loops sit near the seam tolerance and bridges are one-shots", () => {
  for (const id of SCENE_ORDER) {
    const scene = SCENES[id];
    if (scene.loop) {
      assert.ok(
        scene.measured.seamDiff < 4,
        `${id} loop seam ${scene.measured.seamDiff} is too visible`,
      );
      assert.ok(
        scene.measured.lumaDrift < 2,
        `${id} loop brightness drifts by ${scene.measured.lumaDrift}`,
      );
    } else {
      assert.equal(scene.role, "bridge", `${id} is the only non-loop role`);
    }
  }
});

test("route lookup respects the page map and input ownership", () => {
  assert.equal(sceneForRoute("/")?.id, "meadow");
  assert.equal(sceneForRoute("/systems")?.id, "greenhouse");
  assert.equal(sceneForRoute("/systems/living-ocean")?.id, "greenhouse");
  assert.equal(sceneForRoute("/learning")?.id, "resonance");
  assert.equal(sceneForRoute("/blog")?.id, "notebook");
  assert.equal(sceneForRoute("/blog/a-field-note")?.id, "notebook");
  assert.equal(sceneForRoute("/learning/string-instrument"), null);
  assert.equal(sceneForRoute("/learning/procedural-animation"), null);
  assert.equal(sceneForRoute("/projects/dooit"), null);
  assert.equal(sceneForRoute("/admin"), null);
});

test("playback collapses to the poster under every quiet condition", () => {
  const meadow = SCENES.meadow;
  const bridge = SCENES["dew-bridge"];

  assert.deepEqual(
    playbackFor(meadow, { mode: "gentle", reducedMotion: false }),
    {
      play: true,
      reason: "ok",
    },
  );
  assert.equal(
    playbackFor(meadow, { mode: "expressive", reducedMotion: true }).reason,
    "reduced-motion",
  );
  assert.equal(
    playbackFor(meadow, { mode: "still", reducedMotion: false }).reason,
    "still-mode",
  );
  assert.equal(
    playbackFor(meadow, {
      mode: "gentle",
      reducedMotion: false,
      saveData: true,
    }).reason,
    "save-data",
  );
  assert.equal(
    playbackFor(meadow, {
      mode: "gentle",
      reducedMotion: false,
      visible: false,
    }).reason,
    "offscreen",
  );
  // Bridges belong to expressive mode only.
  assert.equal(
    playbackFor(bridge, { mode: "gentle", reducedMotion: false }).reason,
    "mode-disallowed",
  );
  assert.equal(
    playbackFor(bridge, { mode: "expressive", reducedMotion: false }).play,
    true,
  );
});

test("scene clock reports the measured phase and clamps out of range", () => {
  const resonance = SCENES.resonance;
  assert.equal(phaseAt(resonance, 0)?.id, "rest");
  assert.equal(phaseAt(resonance, 4.8)?.id, "crest");
  assert.equal(phaseAt(resonance, 7.5)?.id, "rest");
  assert.equal(phaseAt(resonance, -4)?.id, "rest");
  assert.equal(phaseAt(resonance, 99)?.id, "rest");
  const bridge = SCENES["dew-bridge"];
  assert.equal(phaseAt(bridge, 3.8)?.id, "cross");
  assert.equal(phaseAt(bridge, 6)?.id, "land");
});
