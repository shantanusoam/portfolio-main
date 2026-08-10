"use client";

import { useEffect, useRef } from "react";
import { PointerInput } from "@/lib/mascot/input/PointerInput";
import { VisibilityController } from "@/lib/mascot/input/VisibilityController";
import { ProceduralCharacterEngine } from "@/lib/procedural-character/ProceduralCharacterEngine";
import { EnvironmentSampler } from "@/lib/procedural-character/environment/EnvironmentSampler";
import { CanvasCharacterRenderer } from "@/lib/procedural-character/rendering/CanvasCharacterRenderer";
import type {
  CharacterSpec,
  ProceduralCharacterCallbacks,
} from "@/lib/procedural-character/types";
import styles from "./ProceduralCharacter.module.css";

export interface ProceduralCharacterProps extends ProceduralCharacterCallbacks {
  spec: CharacterSpec;
  debug?: boolean;
  reducedMotion?: boolean;
  className?: string;
  onEngineReady?: (engine: ProceduralCharacterEngine | null) => void;
}

/**
 * Browser-only lifecycle shell. Every continuously changing value lives in
 * the engine; React never receives per-frame physics state.
 */
export default function ProceduralCharacter({
  spec,
  debug = false,
  reducedMotion = false,
  className,
  onStep,
  onLand,
  onEngineReady,
}: ProceduralCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ProceduralCharacterEngine | null>(null);
  const visibilityRef = useRef<VisibilityController | null>(null);
  const onStepRef = useRef(onStep);
  const onLandRef = useRef(onLand);
  const onEngineReadyRef = useRef(onEngineReady);

  useEffect(() => {
    onStepRef.current = onStep;
  }, [onStep]);

  useEffect(() => {
    onLandRef.current = onLand;
  }, [onLand]);

  useEffect(() => {
    onEngineReadyRef.current = onEngineReady;
  }, [onEngineReady]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const renderer = new CanvasCharacterRenderer({ canvas });
    const visibility = new VisibilityController();
    visibility.attach();
    visibilityRef.current = visibility;

    const coarsePointer = window.matchMedia?.("(pointer: coarse)").matches;
    const lowPower =
      coarsePointer ||
      (typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency <= 4);
    const engine = new ProceduralCharacterEngine({
      spec,
      renderer,
      initialX: width * 0.5,
      initialY: height * 0.5,
      debug,
      reducedMotion: reducedMotion || visibility.isReducedMotion(),
      lowPower,
      onStep: (id, destination) => onStepRef.current?.(id, destination),
      onLand: (id, position) => onLandRef.current?.(id, position),
    });
    engineRef.current = engine;
    onEngineReadyRef.current?.(engine);

    const environmentSampler =
      spec.locomotion.mode === "platform"
        ? new EnvironmentSampler({
            onChange: (surfaces) => engine.setEnvironmentSurfaces(surfaces),
          })
        : null;

    const applySize = () => {
      engine.resize(
        window.innerWidth,
        window.innerHeight,
        window.devicePixelRatio || 1,
      );
    };
    applySize();
    environmentSampler?.attach();

    const pointerInput = new PointerInput({ activeTimeoutMs: 300 });
    const unsubscribePointer = pointerInput.onChange((pointer) => {
      engine.setTarget(pointer.x, pointer.y, pointer.active);
    });
    pointerInput.attach(window);

    const unsubscribeVisibility = visibility.onVisibilityChange((visible) => {
      if (visible) engine.start();
      else engine.pause();
    });
    const unsubscribeReducedMotion = visibility.onReducedMotionChange(
      (systemReducedMotion) => {
        engine.setReducedMotion(reducedMotion || systemReducedMotion);
      },
    );

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(applySize)
        : null;
    resizeObserver?.observe(document.documentElement);
    window.addEventListener("resize", applySize, { passive: true });

    if (visibility.isVisible()) engine.start();

    return () => {
      window.removeEventListener("resize", applySize);
      resizeObserver?.disconnect();
      environmentSampler?.detach();
      unsubscribeReducedMotion();
      unsubscribeVisibility();
      unsubscribePointer();
      pointerInput.detach();
      visibility.detach();
      visibilityRef.current = null;
      engine.destroy();
      engineRef.current = null;
      onEngineReadyRef.current?.(null);
    };
    // The engine's identity follows the immutable character specification.
    // Live booleans and callbacks are pushed through refs/effects below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]);

  useEffect(() => {
    engineRef.current?.setDebug(debug);
  }, [debug]);

  useEffect(() => {
    const systemReduced = visibilityRef.current?.isReducedMotion() ?? false;
    engineRef.current?.setReducedMotion(reducedMotion || systemReduced);
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={[styles.canvas, className].filter(Boolean).join(" ")}
      aria-hidden="true"
    />
  );
}
