import assert from "node:assert/strict";
import { test } from "node:test";

import { ProceduralCharacterEngine } from "@/lib/procedural-character/ProceduralCharacterEngine";
import { jellyPreset } from "@/lib/procedural-character/presets/jelly";
import { mantaPreset } from "@/lib/procedural-character/presets/manta";
import type {
  CharacterRenderer,
  CharacterRenderState,
} from "@/lib/procedural-character/rendering/CharacterRenderer";
import type { CharacterSpec } from "@/lib/procedural-character/types";

class NullRenderer implements CharacterRenderer {
  resize(): void {}
  render(_state: CharacterRenderState): void {}
  destroy(): void {}
}

function exercise(spec: CharacterSpec): ProceduralCharacterEngine {
  const engine = new ProceduralCharacterEngine({
    spec,
    renderer: new NullRenderer(),
    initialX: 300,
    initialY: 220,
  });
  const testEngine = engine as unknown as { update(dt: number): void };
  engine.setTarget(520, 140);
  for (let frame = 0; frame < 360; frame += 1) {
    testEngine.update(spec.performance.fixedTimeStep);
  }
  return engine;
}

test("Tinker runs through the shared engine without planted feet", () => {
  const engine = exercise(mantaPreset);
  assert.ok(engine.softBody);
  assert.equal(engine.appendages.length, 3);
  assert.ok(engine.appendages.every((leg) => leg.spec.mode === "trailing"));
  assert.ok(
    engine.softBody.areaRatio > 0.84 && engine.softBody.areaRatio < 1.16,
  );
});

test("Luma runs through the shared engine without planted feet", () => {
  const engine = exercise(jellyPreset);
  assert.ok(engine.softBody);
  assert.equal(engine.appendages.length, 6);
  assert.ok(engine.appendages.every((leg) => leg.spec.mode === "trailing"));
  assert.ok(
    engine.softBody.areaRatio > 0.84 && engine.softBody.areaRatio < 1.16,
  );
});
