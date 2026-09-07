import {
  MAX_SIGNAL_PULSES,
  packSignalPulseKinds,
  packSignalPulseUniforms,
  type SignalPulse,
} from "./pulseField";
import {
  LIVING_FIELD_FRAGMENT_SHADER,
  LIVING_FIELD_VERTEX_SHADER,
} from "./shaders";
import type { LivingAnatomySettings } from "./anatomy";

export interface LivingFieldState {
  width: number;
  height: number;
  time: number;
  pointerX: number;
  pointerY: number;
  pointerActivity: number;
  pointerVelocityX?: number;
  pointerVelocityY?: number;
  creatureX: number;
  creatureY: number;
  velocityX: number;
  velocityY: number;
  scrollVelocity: number;
  scrollProgress: number;
  zoneEnergy: number;
  warmth: number;
  creatureIntent: number;
  creaturePresence?: number;
  creatureTurn?: number;
  commandFocus?: number;
  commandRelease?: number;
  commandCenterX?: number;
  commandCenterY?: number;
  xrayStrength?: number;
  heroVisibility?: number;
  heroOccluders?: readonly LivingFieldRect[];
  xrayNodes?: readonly LivingFieldRect[];
  anatomy?: LivingAnatomySettings;
  pulses: readonly SignalPulse[];
}

export interface LivingFieldRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

export interface LivingFieldRenderer {
  resize(width: number, height: number, dpr: number): void;
  render(state: LivingFieldState): void;
  destroy(): void;
  kind: "webgpu" | "webgl" | "canvas2d";
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createWebGlRenderer(
  canvas: HTMLCanvasElement,
): LivingFieldRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compileShader(
    gl,
    gl.VERTEX_SHADER,
    LIVING_FIELD_VERTEX_SHADER,
  );
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    LIVING_FIELD_FRAGMENT_SHADER,
  );
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );

  const position = gl.getAttribLocation(program, "a_position");
  const resolution = gl.getUniformLocation(program, "u_resolution");
  const time = gl.getUniformLocation(program, "u_time");
  const pointer = gl.getUniformLocation(program, "u_pointer");
  const creature = gl.getUniformLocation(program, "u_creature");
  const velocity = gl.getUniformLocation(program, "u_velocity");
  const scroll = gl.getUniformLocation(program, "u_scroll");
  const scrollProgress = gl.getUniformLocation(program, "u_scrollProgress");
  const activity = gl.getUniformLocation(program, "u_activity");
  const zoneEnergy = gl.getUniformLocation(program, "u_zoneEnergy");
  const warmth = gl.getUniformLocation(program, "u_warmth");
  const intent = gl.getUniformLocation(program, "u_intent");
  const pulses = gl.getUniformLocation(program, "u_pulses[0]");
  const pulseKinds = gl.getUniformLocation(program, "u_pulseKinds[0]");
  const pulseUniformBuffer = new Float32Array(MAX_SIGNAL_PULSES * 4);
  const pulseKindBuffer = new Float32Array(MAX_SIGNAL_PULSES);

  gl.useProgram(program);
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.clearColor(0, 0, 0, 0);

  return {
    kind: "webgl",
    resize(width, height, dpr) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    render(state) {
      if (gl.isContextLost()) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, state.time);
      gl.uniform2f(pointer, state.pointerX, 1 - state.pointerY);
      gl.uniform2f(creature, state.creatureX, 1 - state.creatureY);
      gl.uniform2f(velocity, state.velocityX, -state.velocityY);
      gl.uniform1f(scroll, state.scrollVelocity);
      gl.uniform1f(scrollProgress, state.scrollProgress);
      gl.uniform1f(activity, state.pointerActivity);
      gl.uniform1f(zoneEnergy, state.zoneEnergy);
      gl.uniform1f(warmth, state.warmth);
      gl.uniform1f(intent, state.creatureIntent);
      gl.uniform4fv(
        pulses,
        packSignalPulseUniforms(
          state.pulses,
          MAX_SIGNAL_PULSES,
          pulseUniformBuffer,
        ),
      );
      gl.uniform1fv(
        pulseKinds,
        packSignalPulseKinds(state.pulses, MAX_SIGNAL_PULSES, pulseKindBuffer),
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    destroy() {
      if (gl.isContextLost()) return;
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

function drawCanvasWake(
  context: CanvasRenderingContext2D,
  state: LivingFieldState,
): void {
  const velocityLength = Math.hypot(state.velocityX, state.velocityY);
  if (velocityLength < 0.002) return;
  const x = state.creatureX * state.width;
  const y = state.creatureY * state.height;
  const dx = state.velocityX / velocityLength;
  const dy = state.velocityY / velocityLength;
  const wakeLength = Math.min(state.width, state.height) * 0.24;
  const wakeWidth = wakeLength * (0.11 + state.creatureIntent * 0.045);

  context.save();
  context.globalAlpha = Math.min(0.18, velocityLength * 2.2);
  context.strokeStyle = "rgba(102, 214, 229, 0.45)";
  context.lineWidth = 1.1;
  for (const side of [-1, 1]) {
    context.beginPath();
    context.moveTo(x, y);
    context.quadraticCurveTo(
      x - dx * wakeLength * 0.48 + -dy * wakeWidth * side,
      y - dy * wakeLength * 0.48 + dx * wakeWidth * side,
      x - dx * wakeLength + -dy * wakeWidth * 1.8 * side,
      y - dy * wakeLength + dx * wakeWidth * 1.8 * side,
    );
    context.stroke();
  }
  context.restore();
}

function createCanvas2DRenderer(
  canvas: HTMLCanvasElement,
): LivingFieldRenderer | null {
  const context = canvas.getContext("2d", { alpha: true });
  if (!context) return null;

  return {
    kind: "canvas2d",
    resize(width, height, dpr) {
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    render(state) {
      context.clearRect(0, 0, state.width, state.height);

      const coolWeight = 0.5 - state.warmth * 0.35;
      const creatureGradient = context.createRadialGradient(
        state.creatureX * state.width,
        state.creatureY * state.height,
        0,
        state.creatureX * state.width,
        state.creatureY * state.height,
        Math.min(state.width, state.height) * 0.28,
      );
      creatureGradient.addColorStop(
        0,
        coolWeight > 0.5
          ? `rgba(87, 205, 224, ${0.065 * state.zoneEnergy})`
          : `rgba(255, 93, 47, ${0.052 * state.zoneEnergy})`,
      );
      creatureGradient.addColorStop(1, "rgba(87, 205, 224, 0)");
      context.fillStyle = creatureGradient;
      context.fillRect(0, 0, state.width, state.height);

      // Six low-alpha filaments provide a static-system fallback for the
      // shader's current lines without touching or redrawing the DOM.
      context.save();
      context.strokeStyle =
        state.warmth > 0.2
          ? `rgba(255, 93, 47, ${0.018 * state.zoneEnergy})`
          : `rgba(92, 211, 228, ${0.018 * state.zoneEnergy})`;
      context.lineWidth = 1;
      for (let line = 0; line < 6; line++) {
        const baseY = ((line + 0.5) / 6) * state.height;
        context.beginPath();
        for (let step = 0; step <= 12; step++) {
          const x = (step / 12) * state.width;
          const y =
            baseY +
            Math.sin(
              step * 0.72 +
                line * 1.3 +
                state.time * 0.22 +
                state.scrollProgress * 4,
            ) *
              8;
          if (step === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
      context.restore();

      drawCanvasWake(context, state);

      for (const pulse of state.pulses) {
        const life = Math.max(0, 1 - pulse.age / 2.4);
        const radius = pulse.age * Math.min(state.width, state.height) * 0.095;
        const x = pulse.x * state.width;
        const y = pulse.y * state.height;
        const color = pulse.tone === "cool" ? "92, 211, 228" : "255, 93, 47";
        const echoes = pulse.source === "card" ? 2 : 1;

        context.save();
        context.strokeStyle = `rgba(${color}, ${
          life * pulse.intensity * 0.17
        })`;
        context.lineWidth = pulse.source === "control" ? 1.2 : 1.5;
        for (let echo = 0; echo < echoes; echo++) {
          context.beginPath();
          context.arc(x, y, radius * (1 - echo * 0.36), 0, Math.PI * 2);
          context.stroke();
        }
        if (pulse.source === "string") {
          context.beginPath();
          context.moveTo(x - radius * 1.8, y);
          context.bezierCurveTo(
            x - radius * 0.6,
            y - 7 * life,
            x + radius * 0.6,
            y + 7 * life,
            x + radius * 1.8,
            y,
          );
          context.stroke();
        }
        context.restore();
      }
    },
    destroy() {
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

export interface LivingRendererOptions {
  attemptWebGpu?: boolean;
  highQuality?: boolean;
  skipWebGl?: boolean;
  signal?: AbortSignal;
  onRuntimeFailure?: () => void;
}

/** Every backend gets its own canvas: a claimed GPU context cannot become 2D. */
export async function createLivingFieldRenderer(
  host: HTMLElement,
  options: LivingRendererOptions = {},
): Promise<LivingFieldRenderer | null> {
  const factories: Array<
    (
      canvas: HTMLCanvasElement,
    ) => Promise<LivingFieldRenderer | null> | LivingFieldRenderer | null
  > = [];
  if (options.attemptWebGpu)
    factories.push(async (canvas) => {
      const { createVgpuRenderer } = await import("./gpu/renderer");
      return createVgpuRenderer(canvas, options);
    });
  if (!options.skipWebGl) factories.push(createWebGlRenderer);
  factories.push(createCanvas2DRenderer);
  for (const factory of factories) {
    if (options.signal?.aborted) return null;
    const canvas = host.ownerDocument.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "width:100%;height:100%;display:block;pointer-events:none";
    let renderer: LivingFieldRenderer | null = null;
    try {
      renderer = await factory(canvas);
    } catch {
      /* Try next backend on a fresh canvas. */
    }
    if (!renderer) continue;
    if (options.signal?.aborted) {
      renderer.destroy();
      return null;
    }
    host.replaceChildren(canvas);
    const inner = renderer;
    let destroyed = false;
    return {
      kind: inner.kind,
      resize: (width, height, dpr) => inner.resize(width, height, dpr),
      render: (state) => inner.render(state),
      destroy() {
        if (destroyed) return;
        destroyed = true;
        inner.destroy();
        canvas.remove();
      },
    };
  }
  return null;
}
