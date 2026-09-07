import {
  init,
  effect,
  compute,
  pingPongStorage,
  storage,
  surface,
  target,
  frame,
  type Gpu,
  type Frame,
} from "vgpu";
import type {
  LivingFieldRenderer,
  LivingRendererOptions,
} from "../fieldRenderer";
import { createFieldUniforms, updateFieldUniforms } from "./uniforms";
import advectSource from "./advect.wgsl";
import diagnosticsSource from "./diagnostics.wgsl";
import pressureSource from "./pressure.wgsl";
import projectSource from "./project.wgsl";
import presentSource from "./present.wgsl";

export async function createVgpuRenderer(
  canvas: HTMLCanvasElement,
  options: LivingRendererOptions,
): Promise<LivingFieldRenderer | null> {
  let gpu: Gpu | undefined;
  let destroyed = false;
  let ready = false;
  let preflightError = false;
  let unsubscribe = () => {};
  const dispose = () => {
    if (destroyed) return;
    destroyed = true;
    unsubscribe();
    gpu?.dispose();
  };
  try {
    gpu = await init({
      powerPreference: "low-power",
      label: "Living Signal Ocean",
    });
    if (options.signal?.aborted) {
      dispose();
      return null;
    }
    const context = gpu;
    unsubscribe = context.onError(() => {
      if (destroyed) return;
      preflightError = true;
      if (ready) options.onRuntimeFailure?.();
    });
    context.gpu.lost.then(() => {
      if (!destroyed && ready) options.onRuntimeFailure?.();
    });
    const params = createFieldUniforms();
    // Fixed grid allocations survive viewport/DPR changes without resource churn.
    const gridX = options.highQuality ? 128 : 96;
    const gridY = options.highQuality ? 80 : 64;
    const iterations = options.highQuality ? 5 : 3;
    params.grid[0] = gridX;
    params.grid[1] = gridY;
    const state = pingPongStorage(context, gridX * gridY * 16);
    const pressure = pingPongStorage(context, gridX * gridY * 4);
    const diagnostics = storage(context, gridX * gridY * 8);
    const advect = compute(context, advectSource, {
      label: "Advection and semantic impulses",
    });
    const divergence = compute(context, diagnosticsSource, {
      label: "Curl and divergence",
    });
    const solve = compute(context, pressureSource, {
      label: "Bounded Jacobi pressure",
    });
    const project = compute(context, projectSource, {
      label: "Projection and vorticity",
    });
    const present = effect(context, presentSource, {
      label: "Signal, wake, hero light and X-Ray",
    });
    const advectionBindings = {
      params,
      source: state.read,
      destination: state.write,
    };
    const divergenceBindings = { params, source: state.read, diagnostics };
    const pressureBindings = {
      params,
      source: pressure.read,
      destination: pressure.write,
      diagnostics,
    };
    const projectionBindings = {
      params,
      source: state.read,
      destination: state.write,
      pressure: pressure.read,
      diagnostics,
    };
    const presentationBindings = {
      params,
      source: state.read,
      pressure: pressure.read,
      diagnostics,
    };
    const gx = Math.ceil(gridX / 8);
    const gy = Math.ceil(gridY / 8);
    const step = () => {
      advectionBindings.source = state.read;
      advectionBindings.destination = state.write;
      advect.set(advectionBindings).dispatch(gx, gy);
      state.swap();
      divergenceBindings.source = state.read;
      divergence.set(divergenceBindings).dispatch(gx, gy);
      for (let i = 0; i < iterations; i++) {
        pressureBindings.source = pressure.read;
        pressureBindings.destination = pressure.write;
        solve.set(pressureBindings).dispatch(gx, gy);
        pressure.swap();
      }
      projectionBindings.source = state.read;
      projectionBindings.destination = state.write;
      projectionBindings.pressure = pressure.read;
      project.set(projectionBindings).dispatch(gx, gy);
      state.swap();
      presentationBindings.source = state.read;
      presentationBindings.pressure = pressure.read;
      present.set(presentationBindings);
    };
    step();
    const probe = target(context, { size: [2, 2], format: "rgba8unorm" });
    await present.compile(probe);
    frame(context, (f) => f.pass(probe, present));
    await context.settled();
    if (options.signal?.aborted || preflightError) {
      dispose();
      return null;
    }
    const screen = surface(context, canvas, {
      autoResize: false,
      size: [2, 2],
      dpr: 1,
      alphaMode: "premultiplied",
      clearColor: [0, 0, 0, 0],
    });
    let width = 2;
    let height = 2;
    let lastTime: number | undefined;
    let accumulator = 0;
    const drawFrame = (f: Frame) => f.pass(screen, present);
    ready = true;
    return {
      kind: "webgpu",
      resize(w, h, dpr) {
        width = Math.max(1, Math.round(w * Math.min(1.25, dpr)));
        height = Math.max(1, Math.round(h * Math.min(1.25, dpr)));
        screen.resize([width, height]);
      },
      render(state) {
        if (destroyed || preflightError) return;
        updateFieldUniforms(params, state, width, height);
        const elapsed =
          lastTime === undefined
            ? 1 / 30
            : Math.min(1 / 15, Math.max(0, state.time - lastTime));
        lastTime = state.time;
        accumulator = Math.min(1 / 15, accumulator + elapsed);
        while (accumulator >= 1 / 30 - 1e-6) {
          step();
          accumulator -= 1 / 30;
        }
        present.set(presentationBindings);
        frame(context, drawFrame);
      },
      destroy: dispose,
    };
  } catch {
    dispose();
    return null;
  }
}
