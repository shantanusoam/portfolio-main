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

function createEngine(): {
  engine: ProceduralCharacterEngine;
  update: (dt: number) => void;
} {
  const engine = new ProceduralCharacterEngine({
    spec: octopodPreset,
    renderer: new NullRenderer(),
    initialX: 500,
    initialY: 430,
  });
  engine.resize(1000, 800, 1);
  return {
    engine,
    update: (engine as unknown as { update: (dt: number) => void }).update.bind(
      engine,
    ),
  };
}

test("a grapple stretches one tentacle and couples its contact back into root motion", () => {
  const { engine, update } = createEngine();
  const dt = octopodPreset.performance.fixedTimeStep;
  const start = { ...engine.body.position };

  engine.setTarget(720, 220, true, 0);
  engine.setManualControl(0, { enabled: true, grab: true });
  for (let frame = 0; frame < 42; frame += 1) update(dt);

  const snapshot = engine.getDebugSnapshot();
  assert.equal(snapshot.grapple.attached, true);
  assert.ok(snapshot.grapple.appendageIndex >= 0);
  assert.ok(snapshot.grapple.reachScale > 1.2);
  assert.ok(engine.body.position.x > start.x);
  assert.ok(engine.body.position.y < start.y);

  const selected = engine.appendages[snapshot.grapple.appendageIndex];
  const endpointDistance = Math.hypot(
    selected.foot.x - selected.anchor.x,
    selected.foot.y - selected.anchor.y,
  );
  assert.ok(endpointDistance <= selected.maxReach + 1e-6);
});

test("release keeps swing momentum and retracts the selected tentacle", () => {
  const { engine, update } = createEngine();
  const dt = octopodPreset.performance.fixedTimeStep;

  engine.setTarget(725, 230, true, 0);
  engine.setManualControl(0, { enabled: true, grab: true });
  for (let frame = 0; frame < 38; frame += 1) update(dt);
  const selectedIndex = engine.grapple.appendageIndex;
  const extendedScale = engine.grapple.reachScale;
  const speedBeforeRelease = Math.hypot(
    engine.body.velocity.x,
    engine.body.velocity.y,
  );

  engine.setManualControl(0, { enabled: true, grab: false });
  update(dt);
  const speedAfterRelease = Math.hypot(
    engine.body.velocity.x,
    engine.body.velocity.y,
  );
  assert.equal(engine.grapple.attached, false);
  assert.ok(speedAfterRelease >= speedBeforeRelease * 0.96);

  for (let frame = 0; frame < 90; frame += 1) update(dt);
  assert.ok(engine.appendages[selectedIndex].reachScale < extendedScale);
  assert.ok(engine.appendages[selectedIndex].reachScale < 1.02);
});

test("a grounded jump visibly winds up before applying launch velocity", () => {
  const { engine, update } = createEngine();
  const dt = octopodPreset.performance.fixedTimeStep;
  engine.setEnvironmentSurfaces([
    { id: "test-ledge", left: 300, top: 482, right: 700, bottom: 492 },
  ]);

  update(dt);
  assert.equal(engine.getLocomotionState().grounded, true);
  engine.requestJump();
  update(dt);
  assert.equal(engine.body.velocity.y, 0);

  for (let frame = 0; frame < 12; frame += 1) update(dt);
  assert.ok(engine.body.velocity.y < 0);
  assert.equal(engine.getLocomotionState().grounded, false);
});
