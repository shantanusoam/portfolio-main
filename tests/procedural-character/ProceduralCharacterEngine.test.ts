import assert from "node:assert/strict";
import { test } from "node:test";

import { ProceduralCharacterEngine } from "@/lib/procedural-character/ProceduralCharacterEngine";
import { octopodPreset } from "@/lib/procedural-character/presets/octopod";
import type {
  CharacterRenderer,
  CharacterRenderState,
} from "@/lib/procedural-character/rendering/CharacterRenderer";

class NullRenderer implements CharacterRenderer {
  resize(): void {}
  render(_state: CharacterRenderState): void {}
  destroy(): void {}
}

test("abrupt direction changes remain inside speed and appendage reach limits", () => {
  const engine = new ProceduralCharacterEngine({
    spec: octopodPreset,
    renderer: new NullRenderer(),
    initialX: 600,
    initialY: 400,
  });
  const testEngine = engine as unknown as { update: (dt: number) => void };
  const dt = octopodPreset.performance.fixedTimeStep;

  const advance = (frames: number) => {
    for (let frame = 0; frame < frames; frame += 1) {
      testEngine.update(dt);
      assert.ok(
        engine.body.speed <= octopodPreset.dynamics.maxSpeed + 1e-6,
        `body exceeded max speed: ${engine.body.speed}`,
      );
      for (const appendage of engine.appendages) {
        const endpointDistance = Math.hypot(
          appendage.foot.x - appendage.anchor.x,
          appendage.foot.y - appendage.anchor.y,
        );
        assert.ok(
          endpointDistance <= appendage.maxReach + 1e-6,
          `${appendage.spec.id} exceeded reach: ${endpointDistance} > ${appendage.maxReach}`,
        );
      }
    }
  };

  advance(30);
  engine.setTarget(960, 280, true, 0.25);
  advance(80);
  engine.setTarget(320, 560, true, 1);
  advance(65);
  engine.setTarget(820, 590, true, 1.6);
  advance(80);
});
