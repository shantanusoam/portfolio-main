import assert from "node:assert/strict";
import { test } from "node:test";

import { ScoreDirector } from "@/lib/mascot/game/ScoreDirector";

test("registerLanding awards points and increments combo", () => {
  const score = new ScoreDirector();
  const first = score.registerLanding("normal", 0);
  assert.ok(first.pointsAwarded > 0);
  assert.equal(first.combo, 1);
  const second = score.registerLanding("normal", 0);
  assert.equal(second.combo, 2);
});

test("combo is capped and does not grow unbounded", () => {
  const score = new ScoreDirector();
  let combo = 0;
  for (let i = 0; i < 30; i += 1) {
    combo = score.registerLanding("normal", 0).combo;
  }
  assert.equal(combo, 12);
});

test("a longer silence than comboResetSeconds resets the combo to zero", () => {
  const score = new ScoreDirector();
  score.registerLanding("normal", 0);
  score.tick(3);
  assert.equal(score.getCombo(), 0);
});

test("landings within the reset window keep the combo alive", () => {
  const score = new ScoreDirector();
  score.registerLanding("normal", 0);
  score.tick(1);
  score.registerLanding("normal", 0);
  assert.equal(score.getCombo(), 2);
});

test("bass and treble bonuses outscore normal at the same height/combo", () => {
  const normalScore = new ScoreDirector();
  const bassScore = new ScoreDirector();
  const trebleScore = new ScoreDirector();
  const normal = normalScore.registerLanding("normal", 100);
  const bass = bassScore.registerLanding("bass", 100);
  const treble = trebleScore.registerLanding("treble", 100);
  assert.ok(bass.pointsAwarded > normal.pointsAwarded);
  assert.ok(treble.pointsAwarded > normal.pointsAwarded);
});

test("higher heightClimbed awards more points at the same kind/combo", () => {
  const lowScore = new ScoreDirector();
  const highScore = new ScoreDirector();
  const low = lowScore.registerLanding("normal", 10);
  const high = highScore.registerLanding("normal", 5000);
  assert.ok(high.pointsAwarded > low.pointsAwarded);
});

test("resetCombo breaks the streak without zeroing the accumulated score", () => {
  const score = new ScoreDirector();
  score.registerLanding("normal", 0);
  score.registerLanding("normal", 0);
  const scoreBefore = score.getScore();
  score.resetCombo();
  assert.equal(score.getCombo(), 0);
  assert.equal(score.getScore(), scoreBefore);
});

test("reset zeroes both score and combo", () => {
  const score = new ScoreDirector();
  score.registerLanding("normal", 0);
  score.reset();
  assert.equal(score.getScore(), 0);
  assert.equal(score.getCombo(), 0);
});
