import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { resolve } from "node:path";
import {
  COURSE_SETUP,
  TUTORIALS,
} from "../../app/learning/procedural-animation/courseTutorials";

const lessonIds = [
  "intent",
  "vectors",
  "damping",
  "chains",
  "angles",
  "silhouette",
  "secondary",
  "behavior",
  "timestep",
  "ship",
] as const;

test("every course module is a complete hands-on tutorial", () => {
  assert.deepEqual(Object.keys(TUTORIALS), lessonIds);

  for (const id of lessonIds) {
    const tutorial = TUTORIALS[id];
    assert.ok(tutorial.outcome.length >= 60, `${id} needs a concrete outcome`);
    assert.ok(
      tutorial.steps.length >= 3,
      `${id} needs at least three build steps`,
    );
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

test("course setup and standalone files are runnable-shaped", () => {
  assert.match(COURSE_SETUP.commands, /npm create vite/);
  assert.deepEqual(COURSE_SETUP.files, [
    "index.html",
    "src/main.ts",
    "src/fish.ts",
  ]);

  for (const name of [
    "procedural-fish-starter.html",
    "procedural-fish-complete.html",
  ]) {
    const file = resolve(process.cwd(), "public/course-files", name);
    const source = readFileSync(file, "utf8");
    assert.match(source, /<canvas/);
    assert.match(source, /requestAnimationFrame/);
    assert.match(source, /prefers-reduced-motion/);
    assert.match(source, /Content-Security-Policy/);
  }
});
