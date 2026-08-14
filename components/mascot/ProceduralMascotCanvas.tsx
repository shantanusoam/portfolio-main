"use client";

import { useEffect, useRef } from "react";
import { MascotEngine } from "@/lib/mascot/MascotEngine";
import {
  getQualityDprCap,
  MASCOT_CONFIG,
} from "@/lib/mascot/MascotConfig";
import { PointerInput } from "@/lib/mascot/input/PointerInput";
import { ScrollInput } from "@/lib/mascot/input/ScrollInput";
import type {
  MascotEngine as MascotEngineContract,
  MascotEcosystemStatus,
  MascotQuality,
  MascotStatus,
} from "@/lib/mascot/types";
import styles from "./Mascot.module.css";

export interface ProceduralMascotCanvasProps {
  quality?: MascotQuality;
  reducedMotion?: boolean;
  enabled?: boolean;
  debug?: boolean;
  seed?: number;
  onEngineReady?: (engine: MascotEngineContract | null) => void;
  onStatus?: (status: MascotStatus) => void;
  onEcosystemStatus?: (status: MascotEcosystemStatus | null) => void;
  /** Homepage mode: pointer following begins only after the fish itself is selected. */
  requireFishActivation?: boolean;
  onFollowChange?: (following: boolean) => void;
  /** Optional viewport-space arena; the canvas remains full-screen for clean compositing. */
  arenaSelector?: string;
}

/**
 * The only Client Component that touches window/document/canvas directly.
 * Owns exactly one MascotEngine instance for its lifetime and every
 * listener/observer that feeds it — all torn down on unmount. See
 * .claude/skills/integrating-next-canvas/references/lifecycle-checklist.md.
 */
export default function ProceduralMascotCanvas({
  quality = "medium",
  reducedMotion = false,
  enabled = true,
  debug = false,
  seed = 1337,
  onEngineReady,
  onStatus,
  onEcosystemStatus,
  requireFishActivation = false,
  onFollowChange,
  arenaSelector,
}: ProceduralMascotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<MascotEngineContract | null>(null);
  const qualityRef = useRef(quality);
  const onFollowChangeRef = useRef(onFollowChange);

  useEffect(() => {
    qualityRef.current = quality;
  }, [quality]);

  useEffect(() => {
    onFollowChangeRef.current = onFollowChange;
  }, [onFollowChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const engine = new MascotEngine({
      canvas,
      seed,
      quality: qualityRef.current,
      debug,
      reducedMotion,
      autoEcology: Boolean(arenaSelector),
      onStatus,
      onEcosystemStatus,
    });
    engine.setFollowEnabled(!requireFishActivation);
    engineRef.current = engine;
    onEngineReady?.(engine);

    const pointerInput = new PointerInput();
    const unsubscribePointer = pointerInput.onChange((state) => {
      engine.setPointer(state.x, state.y, state.active);
    });
    pointerInput.attach(window);

    const handlePointerDown = (event: PointerEvent) => {
      if (!requireFishActivation) return;
      if (engine.toggleFollowAt(event.clientX, event.clientY)) {
        onFollowChangeRef.current?.(engine.isFollowEnabled());
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!requireFishActivation || event.key !== "Escape") return;
      engine.setFollowEnabled(false);
      onFollowChangeRef.current?.(false);
    };
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    window.addEventListener("keydown", handleKeyDown);

    const scrollInput = new ScrollInput();
    const unsubscribeScroll = scrollInput.onChange((velocity) => {
      engine.setScrollVelocity(velocity);
    });
    scrollInput.attach();

    const applyArenaBounds = () => {
      if (!arenaSelector) return;
      const arena = document.querySelector<HTMLElement>(arenaSelector);
      if (!arena) return;
      const rect = arena.getBoundingClientRect();
      const margin = MASCOT_CONFIG.wanderBoundsMargin;
      const minX = Math.max(margin, rect.left + margin);
      const minY = Math.max(margin, rect.top + margin);
      const maxX = Math.min(window.innerWidth - margin, rect.right - margin);
      const maxY = Math.min(window.innerHeight - margin, rect.bottom - margin);
      if (maxX <= minX || maxY <= minY) return;
      engine.setArenaBounds({ minX, minY, maxX, maxY });
    };

    const applySize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const dpr = Math.min(
        window.devicePixelRatio || 1,
        getQualityDprCap(qualityRef.current),
      );
      engine.resize(width, height, dpr);
      applyArenaBounds();
    };
    applySize();

    let arenaFrame = 0;
    const syncArenaOnScroll = () => {
      if (arenaFrame) return;
      arenaFrame = window.requestAnimationFrame(() => {
        arenaFrame = 0;
        applyArenaBounds();
      });
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(applySize)
        : null;
    resizeObserver?.observe(document.documentElement);
    window.addEventListener("resize", applySize, { passive: true });
    if (arenaSelector) {
      window.addEventListener("scroll", syncArenaOnScroll, { passive: true });
    }

    engine.setEnabled(enabled);
    engine.start();

    return () => {
      window.removeEventListener("resize", applySize);
      window.removeEventListener("scroll", syncArenaOnScroll);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
      resizeObserver?.disconnect();
      if (arenaFrame) window.cancelAnimationFrame(arenaFrame);
      unsubscribePointer();
      unsubscribeScroll();
      pointerInput.detach();
      scrollInput.detach();
      engine.destroy();
      engineRef.current = null;
      onEngineReady?.(null);
      onEcosystemStatus?.(null);
    };
    // Engine identity is tied to `seed` only; quality/enabled/reducedMotion/debug
    // are pushed to the running engine imperatively below instead of remounting it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed, requireFishActivation, arenaSelector]);

  useEffect(() => {
    engineRef.current?.setQuality(quality);
  }, [quality]);

  useEffect(() => {
    engineRef.current?.setEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    engineRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    engineRef.current?.setDebug(debug);
  }, [debug]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
      data-enabled={enabled}
      aria-hidden="true"
    />
  );
}
