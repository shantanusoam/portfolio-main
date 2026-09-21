import { test } from "node:test";
import assert from "node:assert/strict";
import { timeOfDay } from "../../components/workshop/cinema/motion";
test("journey clamps invalid inputs and reaches sunrise at the document end", () => {
  assert.deepEqual(timeOfDay(-10), timeOfDay(0));
  assert.deepEqual(timeOfDay(NaN), timeOfDay(0));
  assert.deepEqual(timeOfDay(20), timeOfDay(1));
  assert.equal(timeOfDay(1).name, "First light");
});
test("lighting changes continuously at chapter boundaries", () => {
  const rgb = (s: string) => s.match(/\d+/g)!.map(Number);
  for (let chapter = 1; chapter < 6; chapter++) {
    const before = timeOfDay(chapter / 6 - 0.0001),
      after = timeOfDay(chapter / 6 + 0.0001);
    for (const key of ["background", "accent"] as const) {
      const a = rgb(before[key]),
        b = rgb(after[key]);
      a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) <= 1));
    }
  }
});
