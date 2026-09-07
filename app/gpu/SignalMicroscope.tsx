"use client";

import { useEffect, useRef, useState } from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import {
  ANATOMY_MODES,
  DEFAULT_ANATOMY_SETTINGS,
  type LivingAnatomySettings,
} from "@/lib/living-canvas/anatomy";
import type {
  LivingFieldRenderer,
  LivingFieldState,
} from "@/lib/living-canvas/fieldRenderer";
import type { SignalPulse } from "@/lib/living-canvas/pulseField";
import styles from "./microscope.module.css";

const sliders = [
  {
    key: "speed",
    label: "Simulation speed",
    min: 0.25,
    max: 1.5,
    step: 0.05,
    unit: "×",
  },
  {
    key: "viscosity",
    label: "Viscosity",
    min: 0,
    max: 0.12,
    step: 0.005,
    unit: "",
  },
  {
    key: "wakePersistence",
    label: "Wake persistence",
    min: 0.5,
    max: 3,
    step: 0.1,
    unit: "s",
  },
  {
    key: "signalDiffusion",
    label: "Signal diffusion",
    min: 0,
    max: 0.12,
    step: 0.005,
    unit: "",
  },
  {
    key: "lightPersistence",
    label: "Light persistence",
    min: 0.15,
    max: 0.7,
    step: 0.05,
    unit: "s",
  },
] as const;

export default function SignalMicroscope() {
  const hostRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [forcedColors, setForcedColors] = useState(false);
  const [running, setRunning] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [backend, setBackend] = useState("static");
  const [status, setStatus] = useState("Nothing runs until you start it.");
  const [settings, setSettings] = useState<LivingAnatomySettings>({
    ...DEFAULT_ANATOMY_SETTINGS,
  });
  const settingsRef = useRef(settings);
  const input = useRef({
    x: 0.5,
    y: 0.5,
    vx: 0,
    vy: 0,
    seen: false,
    time: 0,
    pluck: 0,
    probe: 0,
  });
  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);
  useEffect(() => {
    const query = matchMedia("(forced-colors: active)");
    const update = () => setForcedColors(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    const stage = stageRef.current;
    if (
      !host ||
      !stage ||
      !running ||
      reducedMotion ||
      forcedColors ||
      matchMedia("(forced-colors: active)").matches
    )
      return;
    const abort = new AbortController();
    let renderer: LivingFieldRenderer | null = null;
    let raf = 0;
    let lastFrame = 0;
    let elapsed = 0;
    let inView = true;
    let dpr = 0;
    let pluckSeen = input.current.pluck;
    let probeSeen = input.current.probe;
    let probeUntil = 0;
    const pulses: SignalPulse[] = [];
    const pulse: SignalPulse = {
      x: 0.24,
      y: 0.56,
      age: 0,
      intensity: 0.9,
      tone: "warm",
      source: "string",
    };
    const state: LivingFieldState = {
      width: 2,
      height: 2,
      time: 0,
      pointerX: 0.5,
      pointerY: 0.5,
      pointerActivity: 0,
      creatureX: 0.5,
      creatureY: 0.5,
      velocityX: 0,
      velocityY: 0,
      creaturePresence: 0,
      scrollVelocity: 0,
      scrollProgress: 0,
      zoneEnergy: 0.9,
      warmth: -0.4,
      creatureIntent: 0.4,
      heroVisibility: 1,
      heroOccluders: [{ left: 0.46, top: 0.28, right: 0.58, bottom: 0.7 }],
      pulses,
    };
    function schedule() {
      if (
        !abort.signal.aborted &&
        !document.hidden &&
        inView &&
        renderer &&
        !raf
      )
        raf = requestAnimationFrame(paint);
    }
    function resize() {
      const bounds = stage!.getBoundingClientRect();
      state.width = Math.max(1, bounds.width);
      state.height = Math.max(1, bounds.height);
      dpr = Math.min(window.devicePixelRatio || 1, 1);
      renderer?.resize(state.width, state.height, dpr);
    }
    function stopOnFailure() {
      if (abort.signal.aborted) return;
      cancelAnimationFrame(raf);
      raf = 0;
      renderer?.destroy();
      renderer = null;
      setBackend("static");
      setRunning(false);
      setStatus(
        "The rendering device stopped. All explanations remain available; you can start a fresh session.",
      );
    }
    function paint(now: number) {
      raf = 0;
      if (!renderer || abort.signal.aborted || document.hidden || !inView)
        return;
      if (lastFrame && now - lastFrame < 1000 / 30 - 0.5) {
        schedule();
        return;
      }
      const dt = lastFrame ? Math.min(0.05, (now - lastFrame) / 1000) : 1 / 30;
      lastFrame = now;
      elapsed += dt;
      if (dpr !== Math.min(window.devicePixelRatio || 1, 1)) resize();
      const signal = input.current;
      state.time = elapsed;
      state.anatomy = settingsRef.current;
      state.pointerX = signal.x;
      state.pointerY = signal.y;
      state.pointerVelocityX = signal.vx;
      state.pointerVelocityY = signal.vy;
      state.pointerActivity = Math.min(1, Math.hypot(signal.vx, signal.vy));
      signal.vx *= Math.exp(-dt * 6);
      signal.vy *= Math.exp(-dt * 6);
      if (signal.pluck !== pluckSeen) {
        pluckSeen = signal.pluck;
        pulse.age = 0;
        pulses[0] = pulse;
      } else if (pulses.length) {
        pulse.age += dt;
        if (pulse.age > 2.4) pulses.length = 0;
      }
      if (signal.probe !== probeSeen) {
        probeSeen = signal.probe;
        probeUntil = elapsed + 6;
      }
      const probing = elapsed < probeUntil;
      state.creaturePresence = probing ? 1 : 0;
      if (probing) {
        state.creatureX = 0.5 + Math.cos(elapsed) * 0.24;
        state.creatureY = 0.5 + Math.sin(elapsed) * 0.2;
        state.velocityX = -Math.sin(elapsed) * 0.24;
        state.velocityY = Math.cos(elapsed) * 0.2;
        state.creatureTurn = 0.04;
      } else {
        state.velocityX = state.velocityY = 0;
        state.creatureTurn = 0;
      }
      try {
        renderer.render(state);
      } catch {
        stopOnFailure();
        return;
      }
      schedule();
    }
    function onVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastFrame = 0;
        schedule();
      }
    }
    const sizeObserver = new ResizeObserver(resize);
    const intersection = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (!inView) {
        cancelAnimationFrame(raf);
        raf = 0;
      } else {
        lastFrame = 0;
        schedule();
      }
    });
    sizeObserver.observe(stage);
    intersection.observe(stage);
    document.addEventListener("visibilitychange", onVisibility);
    setBackend("starting");
    setStatus("Preparing the same render passes used on the homepage…");
    async function start() {
      const { createLivingFieldRenderer } = await import(
        "@/lib/living-canvas/fieldRenderer"
      );
      if (abort.signal.aborted) return;
      renderer = await createLivingFieldRenderer(host!, {
        attemptWebGpu: "gpu" in navigator,
        highQuality: false,
        signal: abort.signal,
        onRuntimeFailure: stopOnFailure,
      });
      if (abort.signal.aborted) {
        renderer?.destroy();
        return;
      }
      setBackend(renderer?.kind ?? "static");
      setStatus(
        renderer?.kind === "webgpu"
          ? "Live · 96 × 64 cells · 30 fps ceiling · no GPU readback"
          : "WebGPU is unavailable on this device. The composite fallback works; buffer inspection needs WebGPU.",
      );
      resize();
      schedule();
    }
    start().catch(stopOnFailure);
    return () => {
      abort.abort();
      cancelAnimationFrame(raf);
      sizeObserver.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      renderer?.destroy();
    };
  }, [running, generation, reducedMotion, forcedColors]);

  const blocked = reducedMotion || forcedColors;
  const gpuReady = running && !blocked && backend === "webgpu";
  const selected = ANATOMY_MODES.find((mode) => mode.id === settings.mode)!;
  return (
    <section className={styles.instrument} aria-label="Signal microscope">
      <div className={styles.toolbar}>
        <button
          type="button"
          disabled={blocked}
          onClick={() => {
            setRunning(!running);
            if (running) setStatus("Stopped. GPU resources released.");
          }}
        >
          {running && !blocked ? "Stop simulation" : "Start simulation"}
        </button>
        <button
          type="button"
          disabled={!running || blocked || backend === "starting"}
          onClick={() => {
            input.current.pluck++;
          }}
        >
          Pluck a light wave
        </button>
        <button
          type="button"
          disabled={!running || blocked || backend === "starting"}
          onClick={() => {
            input.current.probe++;
          }}
        >
          Launch wake probe · 6s
        </button>
        <button
          type="button"
          disabled={!running || blocked}
          onClick={() => setGeneration((value) => value + 1)}
        >
          Clear field
        </button>
      </div>
      <p className={styles.status} role="status">
        {blocked
          ? "Simulation is off for reduced-motion, Focus or forced-colors preferences. The guide remains readable."
          : status}
      </p>
      <div
        ref={stageRef}
        className={styles.stage}
        onPointerDown={(event) => {
          input.current.seen = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!event.buttons || !running || blocked) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const signal = input.current;
          const x = (event.clientX - rect.left) / rect.width;
          const y = (event.clientY - rect.top) / rect.height;
          const now = performance.now();
          const dt = Math.max(0.016, (now - signal.time) / 1000);
          signal.vx = signal.seen
            ? Math.max(-1, Math.min(1, (x - signal.x) / dt))
            : 0;
          signal.vy = signal.seen
            ? Math.max(-1, Math.min(1, (y - signal.y) / dt))
            : 0;
          signal.x = x;
          signal.y = y;
          signal.time = now;
          signal.seen = true;
        }}
      >
        <div ref={hostRef} className={styles.surface} aria-hidden="true" />
        <div className={styles.boundary} aria-hidden="true">
          <span>boundary</span>
        </div>
        <span className={styles.stageLabel} aria-hidden="true">
          {running && !blocked
            ? "Drag to push current · controls also work by keyboard"
            : "A quiet field. Waiting for an input."}
        </span>
      </div>
      <div className={styles.modes} role="group" aria-label="Rendering pass">
        {ANATOMY_MODES.map((mode) => (
          <button
            type="button"
            key={mode.id}
            aria-pressed={settings.mode === mode.id}
            onClick={() =>
              setSettings((value) => ({ ...value, mode: mode.id }))
            }
          >
            {mode.label}
          </button>
        ))}
      </div>
      <div className={styles.explanation} aria-live="polite">
        <h2>{selected.label}</h2>
        <p>{selected.note}</p>
        {!gpuReady && settings.mode !== "composite" ? (
          <p className={styles.status}>
            The explanation is available now. Start on a WebGPU-capable device
            to see this buffer.
          </p>
        ) : null}
      </div>
      <fieldset className={styles.sliders} disabled={!gpuReady}>
        <legend>Bounded controls / try one change at a time</legend>
        {sliders.map((slider) => (
          <label key={slider.key}>
            <span>
              {slider.label}
              <output>
                {settings[slider.key].toFixed(slider.step < 0.01 ? 3 : 2)}
                {slider.unit}
              </output>
            </span>
            <input
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={settings[slider.key]}
              onChange={(event) =>
                setSettings((value) => ({
                  ...value,
                  [slider.key]: Number(event.target.value),
                }))
              }
            />
          </label>
        ))}
      </fieldset>
    </section>
  );
}
