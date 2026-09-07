import assert from "node:assert/strict";
import test from "node:test";
import { selectLivingDeviceTier } from "../../lib/living-canvas/deviceTier";
import {
  createFieldUniforms,
  updateFieldUniforms,
} from "../../lib/living-canvas/gpu/uniforms";
import type { LivingFieldState } from "../../lib/living-canvas/fieldRenderer";
import { createLivingFieldRenderer } from "../../lib/living-canvas/fieldRenderer";

const hints = {
  reducedMotion: false,
  forcedColors: false,
  webgpu: true,
  cores: 8,
  memory: 8,
};
test("device tiers conservatively gate WebGPU and bound DPR/painting", () => {
  assert.equal(selectLivingDeviceTier(hints).tier, "balanced");
  assert.equal(selectLivingDeviceTier(hints).frameIntervalMs, 1000 / 30);
  for (const constraint of [
    { reducedMotion: true },
    { forcedColors: true },
    { webgpu: false },
    { saveData: true },
    { cores: 4 },
    { memory: 2 },
  ]) {
    assert.equal(
      selectLivingDeviceTier({ ...hints, ...constraint }).attemptWebGpu,
      false,
    );
  }
  const high = selectLivingDeviceTier({ ...hints, cores: 12 });
  assert.equal(high.tier, "high");
  assert.ok(high.dprCap <= 1.25);
});

function state(): LivingFieldState {
  return {
    width: 800,
    height: 600,
    time: 2,
    pointerX: 0.2,
    pointerY: 0.3,
    pointerActivity: 0,
    creatureX: 0.4,
    creatureY: 0.5,
    velocityX: 0.1,
    velocityY: 0.2,
    scrollVelocity: 0,
    scrollProgress: 0,
    zoneEnergy: 0.4,
    warmth: -0.4,
    creatureIntent: 0.2,
    pulses: [],
  };
}

test("GPU uniforms reuse vectors, retain top-left coordinates and cool signed warmth", () => {
  const p = createFieldUniforms();
  const pointer = p.pointer;
  const pulse = p.pulse0;
  const s = state();
  s.pulses = [
    {
      x: 0.25,
      y: 0.2,
      age: 0.1,
      intensity: 0.8,
      tone: "cool",
      source: "string",
    },
  ];
  updateFieldUniforms(p, s, 1000, 750);
  assert.equal(pointer, p.pointer);
  assert.equal(pulse, p.pulse0);
  assert.ok(Math.abs(p.pulse0[1] - 0.2) < 1e-6);
  assert.ok(Math.abs(p.pulse0[3] + 0.8) < 1e-6);
  assert.ok(p.weather[1] < 0);
  assert.equal(p.viewport[0], 1000);
  assert.equal(p.interaction[3], 0, "missing fish must not inject a wake");
  s.pulses = [];
  updateFieldUniforms(p, s, 800, 600);
  assert.deepEqual(Array.from(p.pulse0), [0, 0, 0, 0]);
  assert.deepEqual(Array.from(p.kinds), [0, 0, 0, 0]);
});

test("GPU contract bounds fast inputs and clears vanished DOM geometry", () => {
  const p = createFieldUniforms();
  const s = state();
  s.pointerVelocityX = Number.NaN;
  s.velocityY = 200;
  s.commandFocus = 40;
  s.heroOccluders = [{ left: -20, top: 0.3, right: 2, bottom: 0.7 }];
  updateFieldUniforms(p, s, 800, 600);
  assert.equal(p.pointer[2], 0);
  assert.equal(p.koi[3], 1);
  assert.equal(p.interaction[0], 1);
  assert.equal(p.hero0[0], 0);
  assert.equal(p.hero0[2], 1);
  s.heroOccluders = [];
  updateFieldUniforms(p, s, 800, 600);
  assert.deepEqual(Array.from(p.hero0), [0, 0, 0, 0]);
});

function fakeHost(context: (kind: string) => unknown) {
  const kinds: string[] = [];
  let mounts = 0;
  let removals = 0;
  let canvases = 0;
  const host = {
    ownerDocument: {
      createElement: () => {
        canvases++;
        return {
          style: {},
          setAttribute() {},
          remove() {
            removals++;
          },
          getContext(kind: string) {
            kinds.push(kind);
            return context(kind);
          },
        };
      },
    },
    replaceChildren() {
      mounts++;
    },
  } as unknown as HTMLElement;
  return { host, kinds, count: () => ({ mounts, removals, canvases }) };
}

test("unavailable backends leave the DOM alone and use fresh canvas candidates", async () => {
  const mock = fakeHost(() => null);
  assert.equal(await createLivingFieldRenderer(mock.host), null);
  assert.deepEqual(mock.kinds, ["webgl", "2d"]);
  assert.deepEqual(mock.count(), { mounts: 0, removals: 0, canvases: 2 });
});

test("context failure falls back to 2D, owns one canvas and disposes once", async () => {
  let clears = 0;
  const mock = fakeHost((kind) => {
    if (kind === "webgl") throw new Error("context unavailable");
    return {
      clearRect() {
        clears++;
      },
      setTransform() {},
      scale() {},
    };
  });
  const renderer = await createLivingFieldRenderer(mock.host);
  assert.equal(renderer?.kind, "canvas2d");
  renderer?.resize(800, 600, 1);
  renderer?.resize(980, 680, 1.25);
  renderer?.destroy();
  renderer?.destroy();
  assert.equal(clears, 1);
  assert.deepEqual(mock.count(), { mounts: 1, removals: 1, canvases: 2 });
});

test("aborted initialization allocates/mounts nothing", async () => {
  const abort = new AbortController();
  abort.abort();
  const mock = fakeHost(() => null);
  assert.equal(
    await createLivingFieldRenderer(mock.host, {
      attemptWebGpu: true,
      signal: abort.signal,
    }),
    null,
  );
  assert.deepEqual(mock.count(), { mounts: 0, removals: 0, canvases: 0 });
});

test("runtime recovery can skip a failed WebGL context", async () => {
  const mock = fakeHost(() => null);
  await createLivingFieldRenderer(mock.host, { skipWebGl: true });
  assert.deepEqual(mock.kinds, ["2d"]);
});
