"use client";

import { useEffect, useRef, useState } from "react";
import {
  StrumriseRuntime,
  type StrumriseSnapshot,
} from "@/lib/mascot/game/StrumriseRuntime";
import { drawGameMascot } from "@/lib/mascot/game/GameMascotRenderer";
import { drawPlatform } from "@/lib/mascot/game/GamePlatformRenderer";
import { getAppearancePreset } from "@/lib/mascot/appearance/AppearancePresets";
import { getQualityDprCap } from "@/lib/mascot/MascotConfig";
import { clamp } from "@/lib/mascot/core/NumericGuards";
import type {
  MascotEngine as MascotEngineContract,
  MascotQuality,
} from "@/lib/mascot/types";
import StrumriseHud from "./StrumriseHud";
import StrumriseMenu from "./StrumriseMenu";
import StrumriseControls from "./StrumriseControls";
import styles from "./Strumrise.module.css";

export interface StrumriseOverlayProps {
  engine: MascotEngineContract | null;
  quality: MascotQuality;
  reducedMotion: boolean;
  seed?: number;
  onExit: () => void;
}

const KEYBOARD_MOVE_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "a",
  "A",
  "d",
  "D",
]);

function renderFrame(
  ctx: CanvasRenderingContext2D,
  snapshot: StrumriseSnapshot,
  palette: ReturnType<typeof getAppearancePreset>["palette"],
  width: number,
  height: number,
  reducedMotion: boolean,
): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#05050a";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(0, -snapshot.cameraY);

  for (const platform of snapshot.platforms) {
    drawPlatform(ctx, platform, palette, false);
  }

  drawGameMascot(ctx, {
    x: snapshot.player.x,
    y: snapshot.player.y,
    velocityX: snapshot.player.velocityX,
    velocityY: snapshot.player.velocityY,
    deformation: snapshot.deformation,
    palette,
    radius: 22,
    reducedMotion,
  });

  ctx.restore();
}

/**
 * Full-screen Strumrise canvas + HUD + menus + input. Owns exactly one
 * `StrumriseRuntime` for its lifetime (mirrors `ProceduralMascotCanvas`'s
 * relationship to `MascotEngine`) and forwards its bounded per-frame
 * `musicalEvents` to the shared mascot audio engine via
 * `triggerMusicalEvent` — never a second, duplicate audio system.
 */
export default function StrumriseOverlay({
  engine,
  quality,
  reducedMotion,
  seed = 4242,
  onExit,
}: StrumriseOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<StrumriseRuntime | null>(null);
  const engineRef = useRef(engine);
  engineRef.current = engine;
  const keyboardInputRef = useRef(0);
  const touchInputRef = useRef(0);

  const [snapshot, setSnapshot] = useState<StrumriseSnapshot | null>(null);
  const [visible, setVisible] = useState(false);

  const applyInput = () => {
    runtimeRef.current?.setInput(
      clamp(keyboardInputRef.current + touchInputRef.current, -1, 1),
    );
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;

    const dpr = Math.min(
      window.devicePixelRatio || 1,
      getQualityDprCap(quality),
    );
    const palette = getAppearancePreset("cute-bean").palette;

    const runtime = new StrumriseRuntime({
      seed,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      reducedMotion,
      onRender: () => {
        const snap = runtime.getSnapshot();
        setSnapshot(snap);
        renderFrame(
          ctx,
          snap,
          palette,
          canvas.clientWidth,
          canvas.clientHeight,
          reducedMotion,
        );
        for (const event of runtime.musicalEvents) {
          engineRef.current?.triggerMusicalEvent(event);
        }
      },
    });
    runtimeRef.current = runtime;

    const applySize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      runtime.resize(width, height);
    };
    applySize();
    window.addEventListener("resize", applySize, { passive: true });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    runtime.begin();
    setVisible(true);

    // Gesture-gated: this effect only runs after StrumriseGate's launch
    // click, which is the real user gesture `setSoundEnabled` requires.
    const initialMuted = runtime.getSnapshot().muted;
    engineRef.current?.setSoundEnabled(!initialMuted).catch(() => undefined);

    return () => {
      window.removeEventListener("resize", applySize);
      document.body.style.overflow = previousOverflow;
      runtime.destroy();
      runtimeRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        KEYBOARD_MOVE_KEYS.has(event.key) ||
        event.key === " " ||
        event.key === "Enter" ||
        event.key === "p" ||
        event.key === "P" ||
        event.key === "Escape"
      ) {
        event.preventDefault();
      }

      if (event.key === "p" || event.key === "P" || event.key === "Escape") {
        togglePause();
        return;
      }
      if (event.key === "Enter" || event.key === " ") {
        handlePrimaryAction();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keyboardInputRef.current = -1;
        applyInput();
      } else if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keyboardInputRef.current = 1;
        applyInput();
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (KEYBOARD_MOVE_KEYS.has(event.key)) {
        keyboardInputRef.current = 0;
        applyInput();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot?.state]);

  const togglePause = () => {
    const state = runtimeRef.current?.controller.getState();
    if (state === "playing") runtimeRef.current?.pause();
    else if (state === "paused") runtimeRef.current?.resume();
  };

  const handlePrimaryAction = () => {
    const state = runtimeRef.current?.controller.getState();
    if (state === "ready") runtimeRef.current?.start();
    else if (state === "paused") runtimeRef.current?.resume();
    else if (
      state === "gameOver" ||
      state === "sectorComplete" ||
      state === "victory"
    ) {
      runtimeRef.current?.retry();
    }
  };

  const handleExit = () => {
    runtimeRef.current?.exit();
    onExit();
  };

  const handleMuteToggle = () => {
    const nextMuted = !(snapshot?.muted ?? false);
    runtimeRef.current?.setMuted(nextMuted);
    engineRef.current?.setSoundEnabled(!nextMuted).catch(() => undefined);
  };

  return (
    <div className={styles.root} data-visible={visible}>
      <canvas ref={canvasRef} className={styles.canvas} />
      {snapshot && (
        <StrumriseHud
          snapshot={snapshot}
          muted={snapshot.muted}
          onMuteToggle={handleMuteToggle}
          onPause={togglePause}
        />
      )}
      <StrumriseControls
        onInputChange={(x) => {
          touchInputRef.current = x;
          applyInput();
        }}
      />
      <StrumriseMenu
        state={snapshot?.state ?? "inactive"}
        snapshot={snapshot}
        onStart={() => runtimeRef.current?.start()}
        onResume={() => runtimeRef.current?.resume()}
        onRetry={() => runtimeRef.current?.retry()}
        onExit={handleExit}
      />
    </div>
  );
}
