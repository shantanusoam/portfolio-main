"use client";

import { useEffect, useRef } from "react";
import type { MascotEngine } from "@/lib/mascot/types";
import {
  LIVING_CANVAS_PULSE_EVENT,
  type LivingCanvasPulseDetail,
} from "@/lib/living-canvas/events";
import {
  advanceSignalPulses,
  createSignalPulse,
  MAX_SIGNAL_PULSES,
  packSignalPulseUniforms,
  pushSignalPulse,
  type SignalPulse,
  type SignalPulseTone,
} from "@/lib/living-canvas/pulseField";
import styles from "./LivingSignalField.module.css";

interface LivingSignalFieldProps {
  engine: MascotEngine | null;
  reducedMotion?: boolean;
}

interface FieldState {
  width: number;
  height: number;
  time: number;
  pointerX: number;
  pointerY: number;
  pointerActivity: number;
  creatureX: number;
  creatureY: number;
  velocityX: number;
  velocityY: number;
  scrollVelocity: number;
  pulses: readonly SignalPulse[];
}

interface FieldRenderer {
  resize(width: number, height: number, dpr: number): void;
  render(state: FieldState): void;
  destroy(): void;
  kind: "webgl" | "canvas2d";
}

const VERTEX_SHADER = `
  attribute vec2 a_position;

  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;

  uniform vec2 u_resolution;
  uniform float u_time;
  uniform vec2 u_pointer;
  uniform vec2 u_creature;
  uniform vec2 u_velocity;
  uniform float u_scroll;
  uniform float u_activity;
  uniform vec4 u_pulses[4];

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float valueNoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1.0, 0.0)), f.x),
      mix(hash21(i + vec2(0.0, 1.0)), hash21(i + vec2(1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 4; i++) {
      value += amplitude * valueNoise(p);
      p = mat2(1.62, 1.18, -1.18, 1.62) * p + 7.3;
      amplitude *= 0.5;
    }
    return value;
  }

  float segmentDistance(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a;
    vec2 ba = b - a;
    float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.0001), 0.0, 1.0);
    return length(pa - ba * h);
  }

  void main() {
    vec2 normalized = gl_FragCoord.xy / u_resolution.xy;
    float aspect = u_resolution.x / max(1.0, u_resolution.y);
    vec2 uv = (normalized - 0.5) * vec2(aspect, 1.0);
    vec2 pointer = (u_pointer - 0.5) * vec2(aspect, 1.0);
    vec2 creature = (u_creature - 0.5) * vec2(aspect, 1.0);
    vec2 velocity = u_velocity * vec2(aspect, 1.0);

    float slowTime = u_time * 0.075;
    vec2 flowUv = uv * 3.1;
    flowUv.x += u_scroll * 0.12;
    float warpA = fbm(flowUv + vec2(slowTime, -slowTime * 0.65));
    float warpB = fbm(flowUv * 1.45 + vec2(-slowTime * 0.7, slowTime));
    float band = sin((uv.y + warpA * 0.15 + warpB * 0.07) * 28.0 - u_time * 0.22);
    float caustic = pow(max(0.0, band), 10.0) * (0.35 + warpB * 0.65);

    float pointerDistance = length(uv - pointer);
    float pointerCurrent = exp(-pointerDistance * 8.5) * u_activity;
    pointerCurrent *= 0.55 + 0.45 * sin(pointerDistance * 34.0 - u_time * 1.2);

    float velocityMagnitude = length(velocity);
    vec2 direction = velocityMagnitude > 0.0001
      ? normalize(velocity)
      : vec2(-1.0, 0.0);
    vec2 wakeStart = creature - direction * (0.16 + min(0.26, velocityMagnitude * 0.9));
    float wakeDistance = segmentDistance(uv, wakeStart, creature);
    float wake = exp(-wakeDistance * 30.0) * smoothstep(0.004, 0.11, velocityMagnitude);
    wake *= 0.62 + 0.38 * sin((uv.x + uv.y) * 46.0 - u_time * 2.1);

    vec3 cool = vec3(0.32, 0.78, 0.86);
    vec3 warm = vec3(1.0, 0.28, 0.075);
    vec3 color = cool * (caustic * 0.18 + pointerCurrent * 0.085 + wake * 0.24);
    float alpha = caustic * 0.035 + pointerCurrent * 0.04 + wake * 0.09;

    for (int i = 0; i < 4; i++) {
      vec4 pulse = u_pulses[i];
      float pulseStrength = abs(pulse.w);
      float life = 1.0 - smoothstep(0.0, 2.4, pulse.z);
      float radius = pulse.z * 0.095;
      vec2 pulsePoint = (pulse.xy - 0.5) * vec2(aspect, 1.0);
      float distanceToPulse = length(uv - pulsePoint);
      float ring = exp(-abs(distanceToPulse - radius) * 72.0);
      float core = exp(-distanceToPulse * 18.0) * max(0.0, 0.35 - pulse.z * 0.2);
      float signal = (ring + core) * pulseStrength * life;
      vec3 pulseColor = pulse.w < 0.0 ? cool : warm;
      color += pulseColor * signal * 0.5;
      alpha += signal * 0.16;
    }

    float edgeFade = 1.0 - smoothstep(0.28, 0.86, length(normalized - 0.5));
    alpha *= 0.62 + edgeFade * 0.38;
    float grain = hash21(gl_FragCoord.xy + floor(u_time * 12.0)) - 0.5;
    color += grain * 0.012;

    gl_FragColor = vec4(max(color, 0.0), clamp(alpha, 0.0, 0.22));
  }
`;

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

function createWebGlRenderer(canvas: HTMLCanvasElement): FieldRenderer | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    powerPreference: "low-power",
  });
  if (!gl) return null;

  const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
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
  const activity = gl.getUniformLocation(program, "u_activity");
  const pulses = gl.getUniformLocation(program, "u_pulses[0]");
  const pulseUniformBuffer = new Float32Array(MAX_SIGNAL_PULSES * 4);

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
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, state.time);
      gl.uniform2f(pointer, state.pointerX, 1 - state.pointerY);
      gl.uniform2f(creature, state.creatureX, 1 - state.creatureY);
      gl.uniform2f(velocity, state.velocityX, -state.velocityY);
      gl.uniform1f(scroll, state.scrollVelocity);
      gl.uniform1f(activity, state.pointerActivity);
      gl.uniform4fv(
        pulses,
        packSignalPulseUniforms(
          state.pulses,
          MAX_SIGNAL_PULSES,
          pulseUniformBuffer,
        ),
      );
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    },
    destroy() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}

function createCanvas2DRenderer(
  canvas: HTMLCanvasElement,
): FieldRenderer | null {
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

      const creatureGradient = context.createRadialGradient(
        state.creatureX * state.width,
        state.creatureY * state.height,
        0,
        state.creatureX * state.width,
        state.creatureY * state.height,
        Math.min(state.width, state.height) * 0.28,
      );
      creatureGradient.addColorStop(0, "rgba(87, 205, 224, 0.075)");
      creatureGradient.addColorStop(1, "rgba(87, 205, 224, 0)");
      context.fillStyle = creatureGradient;
      context.fillRect(0, 0, state.width, state.height);

      for (const pulse of state.pulses) {
        const life = Math.max(0, 1 - pulse.age / 2.4);
        const radius = pulse.age * Math.min(state.width, state.height) * 0.095;
        context.beginPath();
        context.arc(
          pulse.x * state.width,
          pulse.y * state.height,
          radius,
          0,
          Math.PI * 2,
        );
        context.strokeStyle =
          pulse.tone === "cool"
            ? `rgba(92, 211, 228, ${life * pulse.intensity * 0.16})`
            : `rgba(255, 93, 47, ${life * pulse.intensity * 0.18})`;
        context.lineWidth = 1.5;
        context.stroke();
      }
    },
    destroy() {
      context.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

function resolvePulseTone(value: string | undefined): SignalPulseTone {
  return value === "cool" ? "cool" : "warm";
}

export default function LivingSignalField({
  engine,
  reducedMotion = false,
}: LivingSignalFieldProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef(engine);

  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const renderer =
      createWebGlRenderer(canvas) ?? createCanvas2DRenderer(canvas);
    canvas.dataset.renderer = renderer?.kind ?? "static";
    if (!renderer) return undefined;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let pointerX = 0.5;
    let pointerY = 0.42;
    let pointerActivity = reducedMotion ? 0 : 0.12;
    let creatureX = 0.78;
    let creatureY = 0.24;
    let velocityX = 0;
    let velocityY = 0;
    let scrollVelocity = 0;
    let scrollTarget = 0;
    let pulses: SignalPulse[] = [];
    let frame = 0;
    let previousFrame = performance.now();
    let lastPaint = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let visible = document.visibilityState !== "hidden";

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
      renderer.resize(width, height, dpr);
    };

    const addPulse = (
      x: number,
      y: number,
      intensity: number,
      tone: SignalPulseTone,
    ) => {
      if (reducedMotion) return;
      pulses = pushSignalPulse(
        pulses,
        createSignalPulse({ x, y, intensity, tone }),
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, width);
      pointerY = event.clientY / Math.max(1, height);
      pointerActivity = 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = event
        .composedPath()
        .find(
          (item): item is HTMLElement =>
            item instanceof HTMLElement &&
            item.hasAttribute("data-canvas-pulse"),
        );
      if (!target) return;
      addPulse(
        event.clientX / Math.max(1, width),
        event.clientY / Math.max(1, height),
        0.64,
        resolvePulseTone(target.dataset.canvasPulse),
      );
    };

    const handleCustomPulse = (event: Event) => {
      const detail = (event as CustomEvent<LivingCanvasPulseDetail>).detail;
      if (!detail) return;
      addPulse(detail.x, detail.y, detail.intensity, detail.tone);
    };

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(16, now - lastScrollAt);
      const delta = window.scrollY - lastScrollY;
      scrollTarget = Math.min(1, Math.max(-1, delta / elapsed / 1.4));
      lastScrollY = window.scrollY;
      lastScrollAt = now;
    };

    const paint = (timestamp: number) => {
      frame = 0;
      if (!visible) {
        return;
      }

      // The atmosphere does not need 60fps. A 30fps cap keeps it soft and
      // protects the content/mascot animation budget on integrated GPUs.
      if (!reducedMotion && timestamp - lastPaint < 32) {
        frame = window.requestAnimationFrame(paint);
        return;
      }

      const deltaSeconds = Math.min(
        0.05,
        Math.max(0, (timestamp - previousFrame) / 1000),
      );
      previousFrame = timestamp;
      lastPaint = timestamp;

      const signal = engineRef.current?.getSignalSnapshot();
      if (signal) {
        const targetX = signal.rootPosition.x / Math.max(1, width);
        const targetY = signal.rootPosition.y / Math.max(1, height);
        creatureX += (targetX - creatureX) * 0.34;
        creatureY += (targetY - creatureY) * 0.34;
        velocityX +=
          (signal.velocity.x / Math.max(1, width) - velocityX) * 0.22;
        velocityY +=
          (signal.velocity.y / Math.max(1, height) - velocityY) * 0.22;
      } else {
        velocityX *= 0.88;
        velocityY *= 0.88;
      }

      pointerActivity += (0.08 - pointerActivity) * 0.045;
      scrollVelocity += (scrollTarget - scrollVelocity) * 0.12;
      scrollTarget *= 0.84;
      pulses = advanceSignalPulses(pulses, deltaSeconds);

      renderer.render({
        width,
        height,
        time: reducedMotion ? 0 : timestamp / 1000,
        pointerX,
        pointerY,
        pointerActivity: reducedMotion ? 0 : pointerActivity,
        creatureX,
        creatureY,
        velocityX: reducedMotion ? 0 : velocityX,
        velocityY: reducedMotion ? 0 : velocityY,
        scrollVelocity: reducedMotion ? 0 : scrollVelocity,
        pulses: reducedMotion ? [] : pulses,
      });

      if (!reducedMotion) frame = window.requestAnimationFrame(paint);
    };

    const handleResize = () => {
      resize();
      if (reducedMotion) frame = window.requestAnimationFrame(paint);
    };

    const handleVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (visible && !frame) {
        previousFrame = performance.now();
        frame = window.requestAnimationFrame(paint);
      } else if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    resize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(LIVING_CANVAS_PULSE_EVENT, handleCustomPulse);
    document.addEventListener("visibilitychange", handleVisibility);
    frame = window.requestAnimationFrame(paint);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(LIVING_CANVAS_PULSE_EVENT, handleCustomPulse);
      document.removeEventListener("visibilitychange", handleVisibility);
      renderer.destroy();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.field}
      aria-hidden="true"
      data-renderer="static"
    />
  );
}
