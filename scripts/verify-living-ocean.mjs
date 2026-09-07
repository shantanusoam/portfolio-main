import assert from "node:assert/strict";
import path from "node:path";
import { resolveShader } from "@vgpu/wgsl/runtime";
import {
  init,
  effect,
  compute,
  pingPongStorage,
  storage,
  frame,
  target,
} from "vgpu/node";

// Real native WebGPU, not a mock. The bundled Naga validator checks imports/WGSL
// before the same compute passes used in production execute on a small grid.
const root = process.cwd();
const sources = {};
for (const name of [
  "signal-current",
  "advect",
  "diagnostics",
  "pressure",
  "project",
  "present",
]) {
  const resolved = await resolveShader({
    entry: path.join(root, "lib/living-canvas/gpu", name + ".wgsl"),
    rootDir: root,
    validate: "require",
  });
  assert.equal(resolved.validation.ok, true, name);
  sources[name] = resolved.wgsl;
}
const gpu = await init({ powerPreference: "low-power" });
const errors = [];
gpu.onError((error) => errors.push(error));
try {
  const params = Object.fromEntries(
    [
      "viewport",
      "pointer",
      "koi",
      "weather",
      "interaction",
      "command",
      "grid",
      "pulse0",
      "pulse1",
      "pulse2",
      "pulse3",
      "kinds",
      "hero0",
      "hero1",
      "hero2",
      "hero3",
      "node0",
      "node1",
      "node2",
      "tuning",
    ].map((key) => [key, new Float32Array(4)]),
  );
  params.viewport.set([32, 24, 1, 1 / 30]);
  params.koi.set([0.5, 0.5, 0, 0]);
  params.weather.set([0.8, -0.4, 0, 0.3]);
  params.grid.set([16, 12, 0, 0]);
  params.tuning.set([0.025, 1 / 0.62, 0.025, 1 / 2.8]);
  const destination = target(gpu, { size: [32, 24], format: "rgba8unorm" });
  const smoke = effect(gpu, sources["signal-current"], { set: { params } });
  await smoke.compile(destination);
  frame(gpu, (f) => f.pass(destination, smoke));
  assert.ok(
    (await destination.read()).some((value) => value > 0),
    "nonempty smoke frame",
  );

  const cells = 16 * 12;
  const field = pingPongStorage(gpu, cells * 16);
  const pressure = pingPongStorage(gpu, cells * 4);
  const diagnostics = storage(gpu, cells * 8);
  const advect = compute(gpu, sources.advect);
  const divergence = compute(gpu, sources.diagnostics);
  const solve = compute(gpu, sources.pressure);
  const project = compute(gpu, sources.project);
  const present = effect(gpu, sources.present);
  const step = () => {
    advect
      .set({ params, source: field.read, destination: field.write })
      .dispatch(2, 2);
    field.swap();
    divergence.set({ params, source: field.read, diagnostics }).dispatch(2, 2);
    for (let i = 0; i < 5; i++) {
      solve
        .set({
          params,
          source: pressure.read,
          destination: pressure.write,
          diagnostics,
        })
        .dispatch(2, 2);
      pressure.swap();
    }
    project
      .set({
        params,
        source: field.read,
        destination: field.write,
        pressure: pressure.read,
        diagnostics,
      })
      .dispatch(2, 2);
    field.swap();
    params.viewport[2] += 1 / 30;
  };
  // Equilibrium and disabled fish: stale koi velocity must produce no impulse.
  params.koi[2] = 0.25;
  for (let i = 0; i < 3; i++) step();
  assert.ok(
    new Float32Array(await field.read.read()).every((v) => v === 0),
    "disabled fish equilibrium",
  );
  params.interaction[3] = 1;
  params.koi[0] = 8.5 / 16;
  params.koi[1] = 6.5 / 12;
  params.pulse0.set([0.3, 0.4, 0.1, 0.7]);
  params.kinds[0] = 0.15;
  params.command[3] = 1;
  params.hero0.set([0.4, 0.1, 0.6, 0.2]);
  for (let i = 0; i < 16; i++) step();
  const energized = new Float32Array(await field.read.read());
  assert.ok(energized.every(Number.isFinite), "finite velocity/signal/wake");
  const wakeSum = (values) =>
    values.reduce((sum, v, i) => sum + (i % 4 === 3 ? v : 0), 0);
  const initialWake = wakeSum(energized);
  assert.ok(initialWake > 0.001, "koi stores a persistent wake");
  assert.ok(
    new Float32Array(await pressure.read.read()).every(Number.isFinite),
    "finite pressure",
  );
  assert.ok(
    new Float32Array(await diagnostics.read()).every(Number.isFinite),
    "finite curl/divergence",
  );
  present.set({
    params,
    source: field.read,
    pressure: pressure.read,
    diagnostics,
  });
  await present.compile(destination);
  frame(gpu, (f) => f.pass(destination, present));
  assert.ok(
    (await destination.read()).some((v) => v > 0),
    "nonempty computed presentation",
  );

  // Resize and repeated X-Ray / command impulses remain bounded.
  destination.resize([48, 32]);
  params.viewport[0] = 48;
  params.viewport[1] = 32;
  params.node0.set([0.1, 0.2, 0.3, 0.4]);
  params.node1.set([0.5, 0.2, 0.8, 0.4]);
  params.node2.set([0.1, 0.6, 0.8, 0.8]);
  for (let i = 0; i < 12; i++) {
    params.interaction[0] = i % 2 ? 0.5 : 0;
    params.interaction[1] = i % 2;
    step();
  }
  present.set({
    params,
    source: field.read,
    pressure: pressure.read,
    diagnostics,
  });
  frame(gpu, (f) => f.pass(destination, present));
  assert.equal((await destination.read()).length, 48 * 32 * 4);
  for (let view = 1; view <= 7; view++) {
    params.grid[2] = view;
    present.set({
      params,
      source: field.read,
      pressure: pressure.read,
      diagnostics,
    });
    frame(gpu, (f) => f.pass(destination, present));
    assert.ok(
      (await destination.read()).some((v, i) => i % 4 !== 3 && v > 0),
      "nonempty anatomy view " + view,
    );
  }
  params.grid[2] = 0;

  // Shut every source off: memory must settle instead of accumulating forever.
  const beforeRest = wakeSum(new Float32Array(await field.read.read()));
  params.interaction.fill(0);
  params.pulse0.fill(0);
  params.kinds.fill(0);
  params.koi[2] = 0;
  params.koi[3] = 0;
  for (let i = 0; i < 120; i++) step();
  const resting = new Float32Array(await field.read.read());
  assert.ok(resting.every(Number.isFinite));
  assert.ok(
    wakeSum(resting) < beforeRest * 0.3,
    "wake dissipates without input",
  );
  await gpu.settled();
  assert.deepEqual(errors, []);
} finally {
  gpu.dispose();
  assert.equal(gpu.disposed, true);
  gpu.dispose();
}
console.log(
  "Living Ocean passed: 6 validated shaders, native GPU smoke, compute equilibrium, persistent wake, decay, mode cycling, resize, disposal.",
);
