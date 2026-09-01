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
  pushSignalPulse,
  type SignalPulse,
  type SignalPulseSource,
  type SignalPulseTone,
} from "@/lib/living-canvas/pulseField";
import {
  createLivingFieldRenderer,
  type LivingFieldRenderer,
} from "@/lib/living-canvas/fieldRenderer";
import {
  DEFAULT_SIGNAL_ZONE_PROFILE,
  resolveCreatureIntent,
  resolveSignalZoneProfile,
} from "@/lib/living-canvas/zoneField";
import styles from "./LivingSignalField.module.css";
import { subscribeSoundroomEnergy } from "@/lib/audio/reactiveBridge";

interface LivingSignalFieldProps {
  engine: MascotEngine | null;
  reducedMotion?: boolean;
}

function resolvePulseTone(value: string | undefined): SignalPulseTone {
  return value === "cool" ? "cool" : "warm";
}

function resolvePulseSource(value: string | undefined): SignalPulseSource {
  if (
    value === "string" ||
    value === "card" ||
    value === "control" ||
    value === "creature"
  ) {
    return value;
  }
  return "control";
}

function findPulseTarget(path: EventTarget[]): HTMLElement | null {
  return (
    path.find(
      (item): item is HTMLElement =>
        item instanceof HTMLElement && item.hasAttribute("data-canvas-pulse"),
    ) ?? null
  );
}

/**
 * Shared atmospheric compositor. The real DOM remains the interaction and
 * accessibility layer; this canvas only visualizes existing page signals.
 */
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

    let renderer: LivingFieldRenderer | null =
      createLivingFieldRenderer(canvas);
    canvas.dataset.renderer = renderer?.kind ?? "static";
    if (!renderer) return undefined;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let pointerX = 0.5;
    let pointerY = 0.42;
    let pointerActivity = reducedMotion ? 0 : 0.1;
    let creatureX = 0.78;
    let creatureY = 0.24;
    let velocityX = 0;
    let velocityY = 0;
    let creatureIntent = 0.3;
    let creatureIntentTarget = 0.3;
    let scrollVelocity = 0;
    let scrollTarget = 0;
    let scrollProgress = 0;
    let zoneEnergy = DEFAULT_SIGNAL_ZONE_PROFILE.energy;
    let zoneEnergyTarget = zoneEnergy;
    let warmth = DEFAULT_SIGNAL_ZONE_PROFILE.warmth;
    let warmthTarget = warmth;
    let musicBassTarget = 0;
    let musicMidTarget = 0;
    let musicHighTarget = 0;
    let musicOverallTarget = 0;
    let musicIntensityTarget = 0;
    let musicOverall = 0;
    let musicWarmth = 0;
    let previousMusicBass = 0;
    let pulses: SignalPulse[] = [];
    let frame = 0;
    let previousFrame = performance.now();
    let lastPaint = 0;
    let lastScrollY = window.scrollY;
    let lastScrollAt = performance.now();
    let lastZoneCheck = 0;
    let visible = document.visibilityState !== "hidden";
    let contextLost = false;

    const conservativeHardware =
      navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4;
    let dprCap = conservativeHardware ? 0.9 : 1.25;
    let targetFrameInterval = conservativeHardware ? 40 : 32;
    let renderCostAverage = 0;
    let renderSamples = 0;
    let qualityReduced = conservativeHardware;
    canvas.dataset.quality = conservativeHardware ? "conservative" : "balanced";

    const updateScrollProgress = () => {
      const scrollRange = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      scrollProgress = Math.min(1, Math.max(0, window.scrollY / scrollRange));
    };

    const syncZoneFromViewport = () => {
      const centerElement = document.elementFromPoint(
        width * 0.5,
        height * 0.48,
      );
      const zone = centerElement?.closest<HTMLElement>("[data-signal-zone]");
      const profile = resolveSignalZoneProfile(zone?.dataset);
      zoneEnergyTarget = profile.energy;
      warmthTarget = profile.warmth;
      canvas.dataset.zone = profile.kind;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      renderer?.resize(width, height, dpr);
      updateScrollProgress();
      syncZoneFromViewport();
    };

    const addPulse = (
      x: number,
      y: number,
      intensity: number,
      tone: SignalPulseTone,
      source: SignalPulseSource,
    ) => {
      if (reducedMotion) return;
      pulses = pushSignalPulse(
        pulses,
        createSignalPulse({ x, y, intensity, tone, source }),
      );
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointerX = event.clientX / Math.max(1, width);
      pointerY = event.clientY / Math.max(1, height);
      pointerActivity = 1;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const target = findPulseTarget(event.composedPath());
      if (!target) return;
      addPulse(
        event.clientX / Math.max(1, width),
        event.clientY / Math.max(1, height),
        0.64,
        resolvePulseTone(target.dataset.canvasPulse),
        resolvePulseSource(target.dataset.canvasPulseSource),
      );
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || (event.key !== "Enter" && event.key !== " ")) return;
      const target = findPulseTarget(event.composedPath());
      if (!target) return;
      const rect = target.getBoundingClientRect();
      addPulse(
        (rect.left + rect.width / 2) / Math.max(1, width),
        (rect.top + rect.height / 2) / Math.max(1, height),
        0.58,
        resolvePulseTone(target.dataset.canvasPulse),
        resolvePulseSource(target.dataset.canvasPulseSource),
      );
    };

    const handleCustomPulse = (event: Event) => {
      const detail = (event as CustomEvent<LivingCanvasPulseDetail>).detail;
      if (!detail) return;
      addPulse(
        detail.x,
        detail.y,
        detail.intensity,
        detail.tone,
        detail.source,
      );
    };

    const unsubscribeSoundroom = subscribeSoundroomEnergy((signal) => {
      if (reducedMotion || !signal.enabled || !signal.playing) {
        musicBassTarget = 0;
        musicMidTarget = 0;
        musicHighTarget = 0;
        musicOverallTarget = 0;
        musicIntensityTarget = 0;
        previousMusicBass = 0;
        return;
      }
      const bassTransient = signal.bass - previousMusicBass;
      musicBassTarget = signal.bass;
      musicMidTarget = signal.mid;
      musicHighTarget = signal.high;
      musicOverallTarget = signal.overall;
      musicIntensityTarget = signal.intensity;
      if (bassTransient > 0.16 && signal.intensity > 0.08) {
        addPulse(
          creatureX,
          creatureY,
          Math.min(0.42, 0.12 + bassTransient * signal.intensity),
          musicHighTarget > musicBassTarget ? "cool" : "warm",
          "control",
        );
      }
      previousMusicBass = signal.bass;
    });

    const handleScroll = () => {
      const now = performance.now();
      const elapsed = Math.max(16, now - lastScrollAt);
      const delta = window.scrollY - lastScrollY;
      scrollTarget = Math.min(1, Math.max(-1, delta / elapsed / 1.4));
      lastScrollY = window.scrollY;
      lastScrollAt = now;
      updateScrollProgress();
      if (now - lastZoneCheck > 120) {
        lastZoneCheck = now;
        syncZoneFromViewport();
      }
      if (reducedMotion && !frame) {
        frame = window.requestAnimationFrame(paint);
      }
    };

    const paint = (timestamp: number) => {
      frame = 0;
      if (!visible || !renderer || contextLost) return;

      if (!reducedMotion && timestamp - lastPaint < targetFrameInterval) {
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
        creatureIntentTarget = resolveCreatureIntent(signal.behavior);
      } else {
        velocityX *= 0.88;
        velocityY *= 0.88;
        creatureIntentTarget = 0.12;
      }

      const zoneBlend = reducedMotion
        ? 1
        : Math.min(1, Math.max(0.02, deltaSeconds * 2.8));
      zoneEnergy += (zoneEnergyTarget - zoneEnergy) * zoneBlend;
      warmth += (warmthTarget - warmth) * zoneBlend;
      musicOverall +=
        (musicOverallTarget - musicOverall) *
        Math.min(1, Math.max(0.025, deltaSeconds * 3.4));
      const musicWarmthTarget =
        (musicMidTarget * 0.65 - musicHighTarget * 0.26) * musicIntensityTarget;
      musicWarmth +=
        (musicWarmthTarget - musicWarmth) *
        Math.min(1, Math.max(0.02, deltaSeconds * 2.2));
      creatureIntent +=
        (creatureIntentTarget - creatureIntent) * Math.min(1, zoneBlend * 1.5);
      const pointerRest = 0.035 + zoneEnergy * 0.025;
      pointerActivity += (pointerRest - pointerActivity) * 0.045;
      scrollVelocity += (scrollTarget - scrollVelocity) * 0.12;
      scrollTarget *= 0.84;
      pulses = advanceSignalPulses(pulses, deltaSeconds);

      const renderStarted = performance.now();
      renderer.render({
        width,
        height,
        time: reducedMotion ? 0 : timestamp / 1000,
        pointerX,
        pointerY,
        pointerActivity: reducedMotion
          ? 0
          : pointerActivity + musicHighTarget * musicIntensityTarget * 0.035,
        creatureX,
        creatureY,
        velocityX: reducedMotion ? 0 : velocityX,
        velocityY: reducedMotion ? 0 : velocityY,
        scrollVelocity: reducedMotion ? 0 : scrollVelocity,
        scrollProgress,
        zoneEnergy: Math.min(
          1,
          zoneEnergy + musicOverall * musicIntensityTarget * 0.1,
        ),
        warmth: Math.min(1, Math.max(0, warmth + musicWarmth * 0.08)),
        creatureIntent: reducedMotion
          ? 0
          : Math.min(
              1,
              creatureIntent + musicOverall * musicIntensityTarget * 0.06,
            ),
        pulses: reducedMotion ? [] : pulses,
      });

      if (!reducedMotion && !qualityReduced) {
        const renderCost = performance.now() - renderStarted;
        renderCostAverage += (renderCost - renderCostAverage) * 0.08;
        renderSamples += 1;
        if (renderSamples > 45 && renderCostAverage > 7.5) {
          qualityReduced = true;
          dprCap = 0.8;
          targetFrameInterval = 42;
          canvas.dataset.quality = "adaptive-low";
          resize();
        }
      }

      if (!reducedMotion) frame = window.requestAnimationFrame(paint);
    };

    const handleResize = () => {
      resize();
      if (reducedMotion && !frame) frame = window.requestAnimationFrame(paint);
    };

    const handleVisibility = () => {
      visible = document.visibilityState !== "hidden";
      if (visible && !frame && renderer && !contextLost) {
        previousFrame = performance.now();
        frame = window.requestAnimationFrame(paint);
      } else if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      }
    };

    const handleContextLost = (event: Event) => {
      if (renderer?.kind !== "webgl") return;
      event.preventDefault();
      contextLost = true;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      renderer = null;
      canvas.dataset.renderer = "static";
    };

    const handleContextRestored = () => {
      contextLost = false;
      renderer = createLivingFieldRenderer(canvas);
      canvas.dataset.renderer = renderer?.kind ?? "static";
      if (!renderer) return;
      resize();
      previousFrame = performance.now();
      if (visible && !frame) frame = window.requestAnimationFrame(paint);
    };

    resize();
    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener(LIVING_CANVAS_PULSE_EVENT, handleCustomPulse);
    document.addEventListener("visibilitychange", handleVisibility);
    canvas.addEventListener("webglcontextlost", handleContextLost);
    canvas.addEventListener("webglcontextrestored", handleContextRestored);
    frame = window.requestAnimationFrame(paint);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener(LIVING_CANVAS_PULSE_EVENT, handleCustomPulse);
      unsubscribeSoundroom();
      document.removeEventListener("visibilitychange", handleVisibility);
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      canvas.removeEventListener("webglcontextrestored", handleContextRestored);
      renderer?.destroy();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.field}
      aria-hidden="true"
      data-quality="balanced"
      data-renderer="static"
      data-zone="bridge"
    />
  );
}
