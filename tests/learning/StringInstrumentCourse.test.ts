import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";
import {
  STRING_COURSE_SETUP,
  STRING_TUTORIALS,
} from "../../app/learning/string-instrument/courseTutorials";

const lessonIds = [
  "unlock",
  "geometry",
  "interaction",
  "motion",
  "synthesis",
  "tuning",
  "strumming",
  "tone",
  "effects",
  "performance",
  "ship",
] as const;

test("every string course module is a complete hands-on tutorial", () => {
  assert.deepEqual(Object.keys(STRING_TUTORIALS), lessonIds);

  for (const id of lessonIds) {
    const tutorial = STRING_TUTORIALS[id];
    assert.ok(tutorial.outcome.length >= 60, `${id} needs a concrete outcome`);
    assert.equal(tutorial.steps.length, 3, `${id} needs three build steps`);
    assert.ok(tutorial.controls.length >= 2, `${id} needs control guidance`);
    assert.ok(tutorial.verify.length >= 3, `${id} needs verification criteria`);
    assert.ok(tutorial.debug.length >= 2, `${id} needs failure recovery`);
    assert.ok(tutorial.sources.length >= 2, `${id} needs production sources`);

    for (const step of tutorial.steps) {
      assert.ok(step.file.length > 0);
      assert.ok(step.action.length >= 60);
      assert.ok(
        step.code.includes("\n"),
        `${id}/${step.title} needs real multiline code`,
      );
      assert.ok(step.expected.length >= 50);
    }

    for (const source of tutorial.sources) {
      assert.ok(
        existsSync(resolve(process.cwd(), source.path)),
        `${id} source does not exist: ${source.path}`,
      );
    }
  }
});

test("the course teaches the full instrument and effects control surface", () => {
  const controls = new Set(
    Object.values(STRING_TUTORIALS).flatMap((tutorial) =>
      tutorial.controls.map((control) => control.control),
    ),
  );

  for (const control of [
    "audio",
    "tension",
    "damping",
    "tone",
    "drive",
    "delay",
    "feedback",
    "reverb",
    "output",
    "chord",
    "preset",
    "strum",
    "stop",
  ] as const) {
    assert.ok(controls.has(control), `missing control guidance: ${control}`);
  }

  assert.match(STRING_COURSE_SETUP.commands, /npm create vite/);
  assert.ok(STRING_COURSE_SETUP.files.includes("src/audio.ts"));
  assert.ok(STRING_COURSE_SETUP.files.includes("src/effects.ts"));
});

test("standalone guitar files contain the expected runnable boundaries", () => {
  const starter = readFileSync(
    resolve(process.cwd(), "public/course-files/browser-guitar-starter.html"),
    "utf8",
  );
  const complete = readFileSync(
    resolve(process.cwd(), "public/course-files/browser-guitar-complete.html"),
    "utf8",
  );

  for (const source of [starter, complete]) {
    assert.match(source, /<canvas/);
    assert.match(source, /setPointerCapture/);
    assert.match(source, /Content-Security-Policy/);
  }

  assert.match(complete, /AudioContext/);
  assert.match(complete, /createWaveShaper/);
  assert.match(complete, /createDelay/);
  assert.match(complete, /createConvolver/);
  assert.match(complete, /createDynamicsCompressor/);
  assert.match(complete, /requestAnimationFrame/);
  assert.match(complete, /prefers-reduced-motion/);
});
