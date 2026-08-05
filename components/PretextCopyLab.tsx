"use client";

import type { CSSProperties } from "react";
import type { LayoutLine, PrepareOptions } from "@chenglou/pretext";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import Heading from "./ui/Heading";
import { cn } from "@/lib/utils";
import { useSectionExitFade } from "@/hooks/useSectionExitFade";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import styles from "./PretextCopyLab.module.css";

type PretextModule = typeof import("@chenglou/pretext");

type CopyStudy = {
  id: string;
  label: string;
  eyebrow: string;
  accent: string;
  copy: string;
  signature: string;
  options?: PrepareOptions;
};

type ShaderMode = {
  id: "trace" | "bloom" | "fracture";
  label: string;
  uniform: number;
  energy: number;
};

const TEXT_FONT = "500 18px Inter";
const LINE_HEIGHT = 29;
const SHADER_VERTEX = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const SHADER_FRAGMENT = `
precision mediump float;

uniform sampler2D u_text;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform vec3 u_accent;
uniform float u_time;
uniform float u_energy;
uniform float u_mode;
uniform float u_pointerActive;
varying vec2 v_uv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = v_uv;
  vec2 pointer = vec2(u_pointer.x, 1.0 - u_pointer.y);
  float pointerField = smoothstep(0.48, 0.0, distance(uv, pointer)) * u_pointerActive;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 center = vec2(0.5);
  vec2 fromCenter = uv - center;

  float grain = noise(uv * vec2(18.0 * aspect, 22.0) + u_time * 0.35);
  float scan = sin((uv.y * u_resolution.y * 1.55) + u_time * 9.0) * 0.5 + 0.5;
  float wave = sin((uv.y * 24.0) + (grain * 5.0) + u_time * 1.8);
  float field = 0.003 + u_energy * 0.025;

  if (u_mode < 0.5) {
    uv.x += wave * field * (0.55 + pointerField * 1.6);
    uv.y += cos(uv.x * 18.0 - u_time * 1.1) * field * 0.22;
  } else if (u_mode < 1.5) {
    float r = length(fromCenter);
    float spin = sin(r * 18.0 - u_time * 2.2) * field * 1.5;
    uv += vec2(-fromCenter.y, fromCenter.x) * spin;
    uv += normalize(fromCenter + 0.0001) * pointerField * field * 2.1;
  } else {
    float slice = step(0.83, noise(vec2(floor(uv.y * 38.0), floor(u_time * 12.0))));
    uv.x += (slice * 2.0 - 0.18) * field * (0.65 + pointerField);
    uv.y += sin((uv.x + u_time) * 34.0) * field * 0.14;
  }

  vec2 chroma = vec2((0.004 + u_energy * 0.012) * (1.0 + pointerField), 0.0);
  float red = texture2D(u_text, uv + chroma).a;
  float green = texture2D(u_text, uv).a;
  float blue = texture2D(u_text, uv - chroma).a;
  float textMask = max(max(red, green), blue);

  float grid = max(
    1.0 - smoothstep(0.0, 0.014, abs(fract(uv.x * 20.0) - 0.5)),
    1.0 - smoothstep(0.0, 0.014, abs(fract(uv.y * 11.0) - 0.5))
  );
  float halo = smoothstep(0.9, 0.0, length(fromCenter * vec2(aspect, 1.0)));
  vec3 base = vec3(0.018, 0.017, 0.014);
  vec3 chromaticText = vec3(red * 1.25, green * 0.96, blue * 1.45);
  vec3 glow = u_accent * textMask * (0.9 + scan * 0.35 + pointerField * 0.75);
  vec3 atmosphere = u_accent * (halo * 0.1 + grain * 0.035 + grid * 0.018);
  vec3 color = base + atmosphere + chromaticText * 0.68 + glow;

  color += vec3(0.18, 0.08, 0.03) * pow(scan, 7.0) * textMask;
  gl_FragColor = vec4(color, 1.0);
}
`;

const copyStudies: CopyStudy[] = [
  {
    id: "craft",
    label: "Craft",
    eyebrow: "studio signal",
    accent: "#ff6b35",
    signature: "taste + systems",
    copy:
      "Paintbrushes taught me taste. Computers taught me systems. I keep trying to build interfaces where both hands agree: precise, playful, and a little impossible to ignore.",
  },
  {
    id: "pressure",
    label: "Pressure",
    eyebrow: "production signal",
    accent: "#35d9c6",
    signature: "calm outside",
    options: { wordBreak: "keep-all" },
    copy:
      "Good software should survive resizing, messy data, mixed languages, handoffs, deadlines, and the weird day when everything breaks at once. Calm surface, serious machinery underneath.",
  },
  {
    id: "play",
    label: "Play",
    eyebrow: "secret signal",
    accent: "#b6a0ff",
    signature: "room behind the wall",
    options: { whiteSpace: "pre-wrap" },
    copy:
      "Somewhere inside every serious product, I want one tiny door.\nA hidden room. A strange interaction. A moment that makes the machine feel handmade.",
  },
];

const shaderModes: ShaderMode[] = [
  { id: "trace", label: "Trace", uniform: 0, energy: 0.5 },
  { id: "bloom", label: "Bloom", uniform: 1, energy: 0.68 },
  { id: "fracture", label: "Fracture", uniform: 2, energy: 0.84 },
];

function lineDisplayWidth(line: Pick<LayoutLine, "width">, maxWidth: number) {
  return Math.max(10, Math.min(maxWidth, Math.round(line.width)));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
) {
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

function createShaderProgram(gl: WebGLRenderingContext) {
  const vertex = compileShader(gl, gl.VERTEX_SHADER, SHADER_VERTEX);
  const fragment = compileShader(gl, gl.FRAGMENT_SHADER, SHADER_FRAGMENT);
  if (!vertex || !fragment) return null;

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

  return program;
}

function drawTextTexture(
  lines: Array<Pick<LayoutLine, "text" | "width">>,
  maxWidth: number,
  copyHeight: number,
  accent: string
) {
  const textureCanvas = document.createElement("canvas");
  const safeWidth = Math.ceil(Math.max(maxWidth + 150, 520));
  const safeHeight = Math.ceil(Math.max(copyHeight + 150, 300));
  textureCanvas.width = safeWidth;
  textureCanvas.height = safeHeight;

  const ctx = textureCanvas.getContext("2d");
  if (!ctx) return textureCanvas;

  ctx.clearRect(0, 0, safeWidth, safeHeight);
  ctx.font = TEXT_FONT;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  ctx.fillStyle = "rgba(255, 255, 255, 0.92)";

  const top = Math.max(58, (safeHeight - copyHeight) / 2);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const x = (safeWidth - line.width) / 2;
    const y = top + (i + 1) * LINE_HEIGHT;
    ctx.fillText(line.text || " ", x, y);
  }

  ctx.shadowBlur = 0;
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255, 255, 255, 0.18)";
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const x = (safeWidth - line.width) / 2;
    const y = top + (i + 1) * LINE_HEIGHT;
    ctx.fillRect(x, y + 7, Math.max(14, line.width), 1);
  }

  return textureCanvas;
}

function PretextShaderCanvas({
  accent,
  copyHeight,
  energy,
  lines,
  maxWidth,
  mode,
  prefersReducedMotion,
}: {
  accent: string;
  copyHeight: number;
  energy: number;
  lines: Array<Pick<LayoutLine, "text" | "width">>;
  maxWidth: number;
  mode: ShaderMode;
  prefersReducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5, active: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl", {
      alpha: false,
      antialias: false,
      depth: false,
      preserveDrawingBuffer: false,
    });
    if (!gl) return;

    const renderer = gl;
    const target = canvas;
    const program = createShaderProgram(gl);
    if (!program) return;

    const positionBuffer = gl.createBuffer();
    const texture = gl.createTexture();
    if (!positionBuffer || !texture) {
      gl.deleteProgram(program);
      return;
    }

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const positionLocation = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      drawTextTexture(lines, maxWidth, copyHeight, accent)
    );

    const textLocation = gl.getUniformLocation(program, "u_text");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
    const pointerLocation = gl.getUniformLocation(program, "u_pointer");
    const accentLocation = gl.getUniformLocation(program, "u_accent");
    const timeLocation = gl.getUniformLocation(program, "u_time");
    const energyLocation = gl.getUniformLocation(program, "u_energy");
    const modeLocation = gl.getUniformLocation(program, "u_mode");
    const pointerActiveLocation = gl.getUniformLocation(program, "u_pointerActive");
    const accentRgb = hexToRgb(accent);
    let frame = 0;
    let disposed = false;

    function resize() {
      const rect = target.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextWidth = Math.max(1, Math.floor(rect.width * dpr));
      const nextHeight = Math.max(1, Math.floor(rect.height * dpr));
      if (target.width !== nextWidth || target.height !== nextHeight) {
        target.width = nextWidth;
        target.height = nextHeight;
      }
      renderer.viewport(0, 0, target.width, target.height);
    }

    function render(now: number) {
      if (disposed) return;

      resize();
      renderer.useProgram(program);
      renderer.uniform1i(textLocation, 0);
      renderer.uniform2f(resolutionLocation, target.width, target.height);
      renderer.uniform2f(pointerLocation, pointerRef.current.x, pointerRef.current.y);
      renderer.uniform3f(accentLocation, accentRgb[0], accentRgb[1], accentRgb[2]);
      renderer.uniform1f(timeLocation, prefersReducedMotion ? 0 : now / 1000);
      renderer.uniform1f(energyLocation, prefersReducedMotion ? 0.18 : energy);
      renderer.uniform1f(modeLocation, mode.uniform);
      renderer.uniform1f(pointerActiveLocation, pointerRef.current.active);
      renderer.drawArrays(renderer.TRIANGLES, 0, 6);

      if (!prefersReducedMotion) {
        frame = window.requestAnimationFrame(render);
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    render(performance.now());

    return () => {
      disposed = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      gl.deleteBuffer(positionBuffer);
      gl.deleteTexture(texture);
      gl.deleteProgram(program);
    };
  }, [accent, copyHeight, energy, lines, maxWidth, mode, prefersReducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.shaderCanvas}
      aria-hidden="true"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: (event.clientX - rect.left) / rect.width,
          y: (event.clientY - rect.top) / rect.height,
          active: 1,
        };
      }}
      onPointerEnter={() => {
        pointerRef.current.active = 1;
      }}
      onPointerLeave={() => {
        pointerRef.current.active = 0;
      }}
    />
  );
}

export default function PretextCopyLab() {
  const sectionRef = useRef<HTMLElement>(null);
  const visualRef = useRef<HTMLDivElement>(null);
  const sectionOpacity = useSectionExitFade(sectionRef);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [pretext, setPretext] = useState<PretextModule | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [activeId, setActiveId] = useState(copyStudies[0].id);
  const [shaderMode, setShaderMode] = useState(shaderModes[0]);
  const [signalWidth, setSignalWidth] = useState(460);
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    import("@chenglou/pretext")
      .then((module) => {
        if (!cancelled) setPretext(module);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const node = visualRef.current;
    if (!node) return;

    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      setSignalWidth(Math.round(Math.max(260, Math.min(680, width * 0.72))));
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const activeStudy =
    copyStudies.find((study) => study.id === activeId) ?? copyStudies[0];

  const prepared = useMemo(() => {
    if (!pretext) return null;
    return pretext.prepareWithSegments(
      activeStudy.copy,
      TEXT_FONT,
      activeStudy.options
    );
  }, [activeStudy, pretext]);

  const layoutData = useMemo(() => {
    if (!pretext || !prepared) return null;

    const width = Math.max(240, Math.min(680, signalWidth));
    const layout = pretext.layoutWithLines(prepared, width, LINE_HEIGHT);

    return {
      ...layout,
      width,
    };
  }, [prepared, pretext, signalWidth]);

  const displayLines =
    layoutData?.lines.map((line) => ({ text: line.text, width: line.width })) ??
    [
      {
        text: loadError ? "Signal temporarily lost" : "Tuning signal",
        width: 220,
      },
    ];

  const stageStyle = {
    "--measure-width": `${layoutData?.width ?? signalWidth}px`,
    "--copy-height": `${Math.max(layoutData?.height ?? 92, 92)}px`,
    "--active-accent": activeStudy.accent,
  } as CSSProperties;

  return (
    <motion.section
      id="signal-room"
      ref={sectionRef}
      style={{ opacity: sectionOpacity }}
      className={styles.section}
    >
      <div className={styles.header}>
        <Heading>Signal Room</Heading>
        <div className={styles.headerCopy}>
          <p className={styles.kicker}>Signal room</p>
          <h2>A hidden message that behaves like an interface.</h2>
        </div>
      </div>

      <div className={styles.labGrid}>
        <div className={styles.compositor} style={stageStyle}>
          <div className={styles.compositorHeader}>
            <div>
              <p>{activeStudy.eyebrow}</p>
              <strong>{activeStudy.label}</strong>
            </div>
            <span>{activeStudy.signature}</span>
          </div>

          <div className={styles.shaderViewport} ref={visualRef}>
            <PretextShaderCanvas
              accent={activeStudy.accent}
              copyHeight={layoutData?.height ?? 92}
              energy={
                prefersReducedMotion
                  ? 0.18
                  : isPulsing
                    ? 1
                    : shaderMode.energy
              }
              lines={displayLines}
              maxWidth={layoutData?.width ?? signalWidth}
              mode={shaderMode}
              prefersReducedMotion={prefersReducedMotion}
            />
            <div className={styles.shaderHud} aria-hidden="true">
              <span>{activeStudy.eyebrow}</span>
              <strong>{shaderMode.label}</strong>
            </div>
          </div>

          <div className={styles.copyStage}>
            {displayLines.map((line, index) => (
              <motion.div
                key={`${activeStudy.id}-${index}-${line.text}`}
                initial={
                  prefersReducedMotion ? false : { opacity: 0, y: 8, scaleX: 0.98 }
                }
                animate={{ opacity: 1, y: 0, scaleX: 1 }}
                transition={{ duration: 0.28, delay: prefersReducedMotion ? 0 : index * 0.03 }}
                className={styles.lineRow}
              >
                <span
                  className={styles.lineMeasure}
                  style={{
                    width: `${lineDisplayWidth(line, layoutData?.width ?? signalWidth)}px`,
                  }}
                  aria-hidden="true"
                />
                <span className={styles.lineText}>{line.text || " "}</span>
              </motion.div>
            ))}
          </div>

          <div className={styles.microMap} aria-hidden="true">
            {displayLines.map((line, index) => (
              <span
                key={`${activeStudy.id}-map-${index}`}
                style={{
                  width: `${lineDisplayWidth(line, layoutData?.width ?? signalWidth)}px`,
                }}
              />
            ))}
          </div>
        </div>

        <div className={styles.controls}>
          <div className={styles.signalBrief}>
            <p>
              This is the part of the portfolio that is less resume and more
              fingerprint: how the work should feel when the machinery is
              allowed to show a little.
            </p>
          </div>

          <div className={styles.shaderControl}>
            <div className={styles.controlHeader}>
              <span>Signal mood</span>
              <strong>{shaderMode.label}</strong>
            </div>
            <div className={styles.modeList}>
              {shaderModes.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setShaderMode(mode)}
                  className={cn(
                    styles.modeButton,
                    shaderMode.id === mode.id && styles.activeMode
                  )}
                >
                  {mode.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              className={styles.pulseButton}
              onPointerDown={() => setIsPulsing(true)}
              onPointerUp={() => setIsPulsing(false)}
              onPointerLeave={() => setIsPulsing(false)}
              onClick={() => {
                const nextIndex =
                  (shaderModes.findIndex((mode) => mode.id === shaderMode.id) + 1) %
                  shaderModes.length;
                setShaderMode(shaderModes[nextIndex]);
              }}
            >
              Pulse signal
            </button>
          </div>

          <div className={styles.studyList}>
            {copyStudies.map((study, index) => (
              <button
                key={study.id}
                type="button"
                onClick={() => setActiveId(study.id)}
                className={cn(
                  styles.studyCard,
                  activeStudy.id === study.id && styles.activeStudy
                )}
                style={{ "--study-accent": study.accent } as CSSProperties}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{study.label}</strong>
                <small>{study.eyebrow}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
