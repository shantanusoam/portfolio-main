"use client";

import { useEffect, useRef, useState } from "react";
import type { MascotEngine } from "@/lib/mascot/types";
import { subscribeSoundroomEnergy } from "@/lib/audio/reactiveBridge";
import {
  LIVING_CANVAS_PULSE_EVENT,
  LIVING_CANVAS_MODE_EVENT,
  readLivingCanvasModes,
  type LivingCanvasPulseDetail,
  type LivingCanvasModeDetail,
} from "@/lib/living-canvas/events";
import {
  createSignalPulse,
  MAX_SIGNAL_PULSES,
  SIGNAL_PULSE_LIFETIME_SECONDS,
  type SignalPulse,
  type SignalPulseSource,
  type SignalPulseTone,
} from "@/lib/living-canvas/pulseField";
import {
  createLivingFieldRenderer,
  type LivingFieldRenderer,
  type LivingFieldState,
  type LivingFieldRect,
} from "@/lib/living-canvas/fieldRenderer";
import {
  DEFAULT_SIGNAL_ZONE_PROFILE,
  resolveCreatureIntent,
  resolveSignalZoneProfile,
} from "@/lib/living-canvas/zoneField";
import { readLivingDeviceTier } from "@/lib/living-canvas/deviceTier";
import styles from "./LivingSignalField.module.css";

interface LivingSignalFieldProps {
  engine: MascotEngine | null;
  reducedMotion?: boolean;
}

const HIDDEN_FIELD_QUERY =
  "(forced-colors: active), (max-width: 767px), (hover: none) and (pointer: coarse)";
const clamp = (value: number, min = -1, max = 1) =>
  Math.max(min, Math.min(max, value));

function pulseTarget(path: EventTarget[]) {
  return path.find(
    (item): item is HTMLElement =>
      item instanceof HTMLElement && item.hasAttribute("data-canvas-pulse"),
  );
}

/** Read-only semantic bridge. No GPU state can change the DOM or koi physics. */
export default function LivingSignalField({
  engine,
  reducedMotion = false,
}: LivingSignalFieldProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef(engine);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    engineRef.current = engine;
  }, [engine]);
  useEffect(() => {
    const query = matchMedia(HIDDEN_FIELD_QUERY);
    const update = () => setHidden(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || hidden || matchMedia(HIDDEN_FIELD_QUERY).matches) return;
    const abort = new AbortController();
    const tier = readLivingDeviceTier(reducedMotion);
    let renderer: LivingFieldRenderer | null = null;
    let recovery = 0;
    let frame = 0;
    let visible = !document.hidden;
    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = 0;
    let dprCap: number = tier.dprCap;
    let interval = tier.frameIntervalMs;
    let lastPaint = 0;
    let lastGeometry = 0;
    let geometryDirty = true;
    let visibleXray = false;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let scrollTarget = 0;
    let pointerAt = 0;
    let pointerSeen = false;
    let priorVelocityX = 0;
    let priorVelocityY = 0;
    let zoneTarget = DEFAULT_SIGNAL_ZONE_PROFILE.energy;
    let warmthTarget = DEFAULT_SIGNAL_ZONE_PROFILE.warmth;
    let zoneEnergy = zoneTarget;
    let warmth = warmthTarget;
    let commandFocus = 0;
    let commandRelease = 0;
    let xrayStrength = 0;
    let renderCost = 0;
    let renderSamples = 0;
    let musicTarget = 0;
    let musicWarmthTarget = 0;
    let music = 0;
    let musicWarmth = 0;
    let previousBass = 0;
    let lastBassPulse = 0;
    const modes = readLivingCanvasModes();
    const pulses: SignalPulse[] = [];
    const rects = (count: number) =>
      Array.from(
        { length: count },
        (): LivingFieldRect => ({ left: 0, top: 0, right: 0, bottom: 0 }),
      );
    const heroRects = rects(4);
    const nodes = rects(3);
    const state: LivingFieldState = {
      width,
      height,
      time: 0,
      pointerX: 0.5,
      pointerY: 0.42,
      pointerActivity: 0,
      pointerVelocityX: 0,
      pointerVelocityY: 0,
      creatureX: 0.78,
      creatureY: 0.24,
      velocityX: 0,
      velocityY: 0,
      scrollVelocity: 0,
      scrollProgress: 0,
      zoneEnergy,
      warmth,
      creatureIntent: 0.12,
      creaturePresence: 0,
      creatureTurn: 0,
      commandFocus: 0,
      commandRelease: 0,
      commandCenterX: 0.5,
      commandCenterY: 0.4,
      xrayStrength: 0,
      heroVisibility: 0,
      heroOccluders: heroRects,
      xrayNodes: nodes,
      pulses,
    };

    function measure(rect: LivingFieldRect, element?: Element) {
      rect.left = rect.top = rect.right = rect.bottom = 0;
      if (!element) return;
      const bounds = element.getBoundingClientRect();
      if (
        bounds.bottom <= 0 ||
        bounds.top >= height ||
        bounds.right <= 0 ||
        bounds.left >= width
      )
        return;
      rect.left = clamp(bounds.left / width, 0, 1);
      rect.top = clamp(bounds.top / height, 0, 1);
      rect.right = clamp(bounds.right / width, 0, 1);
      rect.bottom = clamp(bounds.bottom / height, 0, 1);
    }
    function syncGeometry() {
      geometryDirty = false;
      const center = document.elementFromPoint(width * 0.5, height * 0.48);
      const zone = center?.closest<HTMLElement>("[data-signal-zone]");
      const profile = resolveSignalZoneProfile(zone?.dataset);
      zoneTarget = profile.energy;
      warmthTarget = profile.warmth;
      host!.dataset.zone = profile.kind;
      state.scrollProgress = clamp(
        window.scrollY /
          Math.max(1, document.documentElement.scrollHeight - height),
        0,
        1,
      );
      const hero = document.getElementById("hero")?.getBoundingClientRect();
      state.heroVisibility = hero
        ? clamp(Math.min(height, hero.bottom) / height, 0, 1)
        : 0;
      const occluders = document.querySelectorAll(
        "[data-living-hero-occluder]",
      );
      for (let i = 0; i < heroRects.length; i++)
        measure(heroRects[i], occluders[i]);
      const active = document.querySelector('[data-system-xray-active="true"]');
      const geometry = active?.querySelectorAll("[data-living-xray-node]");
      visibleXray = false;
      for (let i = 0; i < nodes.length; i++) {
        measure(nodes[i], geometry?.[i]);
        visibleXray ||=
          nodes[i].right > nodes[i].left && nodes[i].bottom > nodes[i].top;
      }
      const palette = document
        .querySelector("[data-living-command-center]")
        ?.getBoundingClientRect();
      if (palette) {
        state.commandCenterX = clamp(
          (palette.left + palette.width / 2) / width,
          0,
          1,
        );
        state.commandCenterY = clamp(
          (palette.top + palette.height / 2) / height,
          0,
          1,
        );
      }
    }
    function schedule() {
      if (!abort.signal.aborted && visible && renderer && !frame)
        frame = requestAnimationFrame(paint);
    }
    function resize() {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      state.width = width;
      state.height = height;
      renderer?.resize(width, height, dpr);
      geometryDirty = true;
      schedule();
    }
    function addPulse(
      x: number,
      y: number,
      intensity: number,
      tone: SignalPulseTone,
      source: SignalPulseSource,
    ) {
      if (reducedMotion || !visible) return;
      if (pulses.length === MAX_SIGNAL_PULSES) pulses.shift();
      pulses.push(createSignalPulse({ x, y, intensity, tone, source }));
    }
    function fromTarget(target: HTMLElement, x: number, y: number) {
      const value = target.dataset.canvasPulseSource;
      const source =
        value === "string" || value === "card" || value === "creature"
          ? value
          : "control";
      addPulse(
        x / width,
        y / height,
        0.6,
        target.dataset.canvasPulse === "cool" ? "cool" : "warm",
        source,
      );
    }
    function onPointer(event: PointerEvent) {
      const now = performance.now();
      const x = event.clientX / width;
      const y = event.clientY / height;
      const dt = Math.max(0.016, (now - pointerAt) / 1000);
      state.pointerVelocityX = pointerSeen
        ? clamp((x - state.pointerX) / dt)
        : 0;
      state.pointerVelocityY = pointerSeen
        ? clamp((y - state.pointerY) / dt)
        : 0;
      state.pointerX = x;
      state.pointerY = y;
      state.pointerActivity = 1;
      pointerAt = now;
      pointerSeen = true;
    }
    function onPointerDown(event: PointerEvent) {
      const target = pulseTarget(event.composedPath());
      if (target) fromTarget(target, event.clientX, event.clientY);
    }
    function onKey(event: KeyboardEvent) {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      const target = pulseTarget(event.composedPath());
      if (!target) return;
      const rect = target.getBoundingClientRect();
      fromTarget(
        target,
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
    }
    function onPulse(event: Event) {
      const detail = (event as CustomEvent<LivingCanvasPulseDetail>).detail;
      if (detail)
        addPulse(
          detail.x,
          detail.y,
          detail.intensity,
          detail.tone,
          detail.source,
        );
    }
    function onMode(event: Event) {
      const detail = (event as CustomEvent<LivingCanvasModeDetail>).detail;
      if (!detail || (detail.mode !== "command" && detail.mode !== "xray"))
        return;
      if (detail.mode === "command" && !detail.active && modes.command)
        commandRelease = commandFocus;
      modes[detail.mode] = detail.active;
      geometryDirty = true;
      schedule();
    }
    function onScroll() {
      const now = performance.now();
      scrollTarget = reducedMotion
        ? 0
        : clamp(
            (window.scrollY - lastScrollY) /
              Math.max(16, now - lastScrollAt) /
              1.4,
          );
      lastScrollY = window.scrollY;
      lastScrollAt = now;
      geometryDirty = true;
      schedule();
    }
    function onVisibility() {
      visible = !document.hidden;
      if (!visible) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        lastPaint = 0;
        pointerSeen = false;
        state.pointerVelocityX = state.pointerVelocityY = 0;
        geometryDirty = true;
        schedule();
      }
    }
    function fail() {
      if (abort.signal.aborted || !renderer) return;
      const kind = renderer.kind;
      cancelAnimationFrame(frame);
      frame = 0;
      renderer.destroy();
      renderer = null;
      host!.dataset.renderer = "static";
      if (kind === "canvas2d") return;
      recovery = kind === "webgpu" ? 1 : 2;
      void initialize();
    }
    function onContextLost(event: Event) {
      if (renderer?.kind !== "webgl") return;
      event.preventDefault();
      fail();
    }
    function paint(timestamp: number) {
      frame = 0;
      if (!visible || !renderer || abort.signal.aborted) return;
      if (
        !reducedMotion &&
        lastPaint &&
        timestamp - lastPaint < interval - 0.5
      ) {
        schedule();
        return;
      }
      const dt = lastPaint
        ? Math.min(0.05, (timestamp - lastPaint) / 1000)
        : 1 / 30;
      lastPaint = timestamp;
      if (dpr !== Math.min(window.devicePixelRatio || 1, dprCap)) resize();
      if (geometryDirty && (reducedMotion || timestamp - lastGeometry > 110)) {
        syncGeometry();
        lastGeometry = timestamp;
      }
      const blend = reducedMotion ? 1 : 1 - Math.exp(-dt * 3.4);
      const signal = engineRef.current?.getSignalSnapshot();
      if (signal && !reducedMotion && state.heroVisibility! > 0) {
        state.creatureX +=
          (signal.rootPosition.x / width - state.creatureX) *
          Math.min(1, blend * 1.5);
        state.creatureY +=
          (signal.rootPosition.y / height - state.creatureY) *
          Math.min(1, blend * 1.5);
        state.velocityX +=
          (signal.velocity.x / width - state.velocityX) * blend;
        state.velocityY +=
          (signal.velocity.y / height - state.velocityY) * blend;
        const speed = Math.hypot(state.velocityX, state.velocityY);
        const priorSpeed = Math.hypot(priorVelocityX, priorVelocityY);
        state.creatureTurn =
          speed > 0.015 && priorSpeed > 0.015
            ? clamp(
                (priorVelocityX * state.velocityY -
                  priorVelocityY * state.velocityX) /
                  (speed * priorSpeed),
              )
            : 0;
        priorVelocityX = state.velocityX;
        priorVelocityY = state.velocityY;
        state.creatureIntent +=
          (resolveCreatureIntent(signal.behavior) - state.creatureIntent) *
          blend;
        state.creaturePresence = 1;
      } else {
        state.velocityX *= Math.exp(-dt * 5);
        state.velocityY *= Math.exp(-dt * 5);
        state.creaturePresence = 0;
        state.creatureTurn = 0;
        state.creatureIntent += (0.12 - state.creatureIntent) * blend;
      }
      zoneEnergy += (zoneTarget - zoneEnergy) * blend;
      warmth += (warmthTarget - warmth) * blend;
      music += (musicTarget - music) * blend;
      musicWarmth += (musicWarmthTarget - musicWarmth) * blend;
      commandFocus +=
        ((modes.command ? 1 : 0) - commandFocus) * (1 - Math.exp(-dt * 6.4));
      commandRelease *= Math.exp(-dt * 5);
      xrayStrength +=
        ((modes.xray && visibleXray ? 1 : 0) - xrayStrength) *
        (1 - Math.exp(-dt * 5.2));
      state.time = reducedMotion ? 0 : timestamp / 1000;
      state.pointerActivity *= Math.exp(-dt * 3);
      state.pointerVelocityX! *= Math.exp(-dt * 6);
      state.pointerVelocityY! *= Math.exp(-dt * 6);
      state.scrollVelocity += (scrollTarget - state.scrollVelocity) * blend;
      scrollTarget *= Math.exp(-dt * 6);
      state.zoneEnergy =
        Math.min(1, zoneEnergy + music * 0.08) * (1 - xrayStrength * 0.35);
      state.warmth = clamp(warmth + musicWarmth * 0.08);
      state.commandFocus = reducedMotion ? 0 : commandFocus;
      state.commandRelease = reducedMotion ? 0 : commandRelease;
      state.xrayStrength = reducedMotion ? 0 : xrayStrength;
      let retained = 0;
      for (let i = 0; i < pulses.length; i++) {
        const pulse = pulses[i];
        pulse.age += dt;
        if (pulse.age < SIGNAL_PULSE_LIFETIME_SECONDS)
          pulses[retained++] = pulse;
      }
      pulses.length = retained;
      const started = performance.now();
      try {
        renderer.render(state);
      } catch {
        fail();
        return;
      }
      renderCost += (performance.now() - started - renderCost) * 0.08;
      if (++renderSamples === 60 && renderCost > 7.5) {
        dprCap = 0.8;
        interval = 1000 / 24;
        resize();
        host!.dataset.quality = "adaptive-low";
      }
      if (!reducedMotion) schedule();
    }
    async function initialize() {
      renderer = await createLivingFieldRenderer(host!, {
        attemptWebGpu: tier.attemptWebGpu && recovery === 0,
        highQuality: tier.highQuality,
        skipWebGl: recovery >= 2,
        signal: abort.signal,
        onRuntimeFailure: fail,
      });
      if (abort.signal.aborted) {
        renderer?.destroy();
        renderer = null;
        return;
      }
      host!.dataset.renderer = renderer?.kind ?? "static";
      host!.dataset.quality = tier.tier;
      lastPaint = 0;
      resize();
    }

    const unsubscribeSoundroom = reducedMotion
      ? () => {}
      : subscribeSoundroomEnergy((signal) => {
          if (!signal.enabled || !signal.playing) {
            musicTarget = musicWarmthTarget = previousBass = 0;
            return;
          }
          musicTarget = signal.overall * signal.intensity;
          musicWarmthTarget =
            (signal.mid * 0.65 - signal.high * 0.26) * signal.intensity;
          const now = performance.now();
          const transient = signal.bass - previousBass;
          if (
            transient > 0.16 &&
            signal.intensity > 0.08 &&
            now - lastBassPulse > 400
          ) {
            addPulse(
              state.creatureX,
              state.creatureY,
              Math.min(0.42, 0.12 + transient * signal.intensity),
              signal.high > signal.bass ? "cool" : "warm",
              "control",
            );
            lastBassPulse = now;
          }
          previousBass = signal.bass;
        });
    const observer = new ResizeObserver(() => {
      geometryDirty = true;
      schedule();
    });
    observer.observe(document.body);
    document.fonts.ready.then(() => {
      if (!abort.signal.aborted) {
        geometryDirty = true;
        schedule();
      }
    });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener(LIVING_CANVAS_MODE_EVENT, onMode);
    document.addEventListener("visibilitychange", onVisibility);
    host.addEventListener("webglcontextlost", onContextLost, true);
    if (!reducedMotion) {
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("pointerdown", onPointerDown, { passive: true });
      window.addEventListener("keydown", onKey);
      window.addEventListener(LIVING_CANVAS_PULSE_EVENT, onPulse);
    }
    void initialize();
    return () => {
      abort.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      unsubscribeSoundroom();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(LIVING_CANVAS_PULSE_EVENT, onPulse);
      window.removeEventListener(LIVING_CANVAS_MODE_EVENT, onMode);
      document.removeEventListener("visibilitychange", onVisibility);
      host.removeEventListener("webglcontextlost", onContextLost, true);
      renderer?.destroy();
    };
  }, [reducedMotion, hidden]);

  return (
    <div
      ref={hostRef}
      className={styles.field}
      aria-hidden="true"
      data-renderer="static"
      data-zone="bridge"
    />
  );
}
