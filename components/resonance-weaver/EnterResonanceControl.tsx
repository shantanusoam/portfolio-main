"use client";

import { useEffect, useRef, useState } from "react";
import type {
  MascotEngine as MascotEngineContract,
  MascotQuality,
} from "@/lib/mascot/types";
import {
  ResonanceWeaverRuntime,
  type FracturePhase,
  type WeaverSnapshot,
} from "@/lib/mascot/game/resonance";
import styles from "./HeroFracture.module.css";
import "./hero-fracture-global.css";

export interface EnterResonanceControlProps {
  engine: MascotEngineContract | null;
  quality?: MascotQuality;
}

function readReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type HudBits = Pick<
  WeaverSnapshot,
  "score" | "combo" | "collectedCount" | "targetCollectCount"
>;

/**
 * Accessible Resonance Weaver entry + in-hero overlay (V2 §18 / §38 / §48).
 * No Start modal — fracture → play immediately. Escape / Exit restores hero.
 */
export default function EnterResonanceControl({
  engine,
  quality = "medium",
}: EnterResonanceControlProps) {
  const [phase, setPhase] = useState<FracturePhase>("idle");
  const [hintVisible, setHintVisible] = useState(false);
  const [hud, setHud] = useState<HudBits | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const runtimeRef = useRef<ResonanceWeaverRuntime | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const engineRef = useRef(engine);
  const phaseRef = useRef<FracturePhase>("idle");
  const firstEntryRef = useRef(true);
  const reducedMotionRef = useRef(false);
  const keysRef = useRef({ left: false, right: false });
  const weavingRef = useRef(false);

  engineRef.current = engine;
  phaseRef.current = phase;

  useEffect(() => {
    reducedMotionRef.current = readReducedMotion();
  }, []);

  useEffect(() => {
    if (!hintVisible) return;
    const id = window.setTimeout(() => setHintVisible(false), 2000);
    return () => window.clearTimeout(id);
  }, [hintVisible]);

  const endSession = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    runtimeRef.current?.destroy();
    runtimeRef.current = null;
    phaseRef.current = "idle";
    setPhase("idle");
    setHintVisible(false);
    setHud(null);
    weavingRef.current = false;
    keysRef.current = { left: false, right: false };
    engineRef.current?.resume();
  };

  useEffect(() => () => endSession(), []);

  const applySteer = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    let x = 0;
    if (keysRef.current.left) x -= 1;
    if (keysRef.current.right) x += 1;
    runtime.setSteer(x);
  };

  const launch = (mode: "accessible" | "slingshot") => {
    const current = phaseRef.current;
    if (current !== "idle" && current !== "done") return;

    const hero = document.getElementById("hero");
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;

    endSession();
    engineRef.current?.pause("resonance-weaver");
    engineRef.current?.setSoundEnabled(true).catch(() => undefined);

    let finished = false;
    const finishOnce = () => {
      if (finished) return;
      finished = true;
      endSession();
    };

    const runtime = new ResonanceWeaverRuntime({
      heroRoot: hero,
      fractureTarget: hero,
      reducedMotion: reducedMotionRef.current,
      seed: 0x7e50_a11c,
      isMobile: window.matchMedia("(max-width: 768px)").matches,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      onPhaseChange: (next) => {
        phaseRef.current = next;
        setPhase(next);
        if (next === "done") finishOnce();
      },
      onPlaying: () => {
        if (firstEntryRef.current) {
          setHintVisible(true);
          firstEntryRef.current = false;
        }
      },
      onRestoreComplete: finishOnce,
      onRender: () => {
        const ctx = canvas.getContext("2d");
        if (ctx) runtime.draw(ctx);
        const snap = runtime.getSnapshot();
        setHud({
          score: snap.score,
          combo: snap.combo,
          collectedCount: snap.collectedCount,
          targetCollectCount: snap.targetCollectCount,
        });
        if (!snap.muted) {
          for (const event of runtime.musicalEvents) {
            engineRef.current?.triggerMusicalEvent(event);
          }
          runtime.musicalEvents = [];
        }
      },
    });
    runtimeRef.current = runtime;

    const resize = () => {
      const dprCap =
        quality === "high" ? 2 : quality === "medium" ? 1.75 : 1.25;
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      runtime.setViewport(w, h);
    };
    resize();

    const onResize = () => {
      resize();
      const p = runtime.getPhase();
      if (p !== "idle" && p !== "done" && p !== "playing" && p !== "restore") {
        runtime.interrupt();
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        runtime.requestExit();
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keysRef.current.left = true;
        applySteer();
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keysRef.current.right = true;
        applySteer();
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" || event.key === "a" || event.key === "A") {
        keysRef.current.left = false;
        applySteer();
      }
      if (
        event.key === "ArrowRight" ||
        event.key === "d" ||
        event.key === "D"
      ) {
        keysRef.current.right = false;
        applySteer();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      if (runtime.getPhase() !== "playing") return;
      if (event.button === 2 || event.shiftKey) {
        event.preventDefault();
        weavingRef.current = true;
        runtime.beginWeave(event.clientX, event.clientY);
        return;
      }
      runtime.setPointerSteer(event.clientX, true);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (runtime.getPhase() !== "playing") return;
      if (weavingRef.current) {
        runtime.updateWeave(event.clientX, event.clientY);
        return;
      }
      if (event.buttons === 1) {
        runtime.setPointerSteer(event.clientX, true);
      }
    };
    const onPointerUp = () => {
      if (weavingRef.current) {
        runtime.endWeave();
        weavingRef.current = false;
      }
      runtime.setPointerSteer(0, false);
      applySteer();
    };
    const onContextMenu = (event: Event) => {
      if (runtime.getPhase() === "playing") event.preventDefault();
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("contextmenu", onContextMenu);

    cleanupRef.current = () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
    };

    const started = runtime.begin(mode);
    if (!started) {
      endSession();
      return;
    }

    phaseRef.current = runtime.getPhase();
    setPhase(runtime.getPhase());
    runtime.start();
  };

  useEffect(() => {
    if (!engine) return;
    let raf = 0;
    const poll = () => {
      const idle = phaseRef.current === "idle" || phaseRef.current === "done";
      if (idle && engine.consumeSlingshotTrigger()) {
        launch("slingshot");
      }
      raf = requestAnimationFrame(poll);
    };
    raf = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine]);

  const active = phase !== "idle" && phase !== "done";
  const playing = phase === "playing";

  return (
    <>
      <button
        type="button"
        className={styles.launchButton}
        onClick={() => launch("accessible")}
        disabled={!engine || active}
        aria-label="Enter Resonance, play the hero Resonance Weaver game"
      >
        Enter Resonance
      </button>
      <canvas
        ref={canvasRef}
        className={styles.overlayCanvas}
        data-interactive={playing ? "true" : "false"}
        aria-hidden={!playing}
      />
      {playing && hud ? (
        <div className={styles.hud} role="status" aria-live="polite">
          <span>
            {hud.collectedCount}/{hud.targetCollectCount || "—"}
          </span>
          <span>Score {hud.score}</span>
          {hud.combo > 1 ? <span>×{hud.combo}</span> : null}
        </div>
      ) : null}
      <div
        className={styles.hint}
        data-visible={hintVisible ? "true" : "false"}
        role="status"
      >
        Move ← → · Shift-drag weave · Esc exit
      </div>
      {playing ? (
        <button
          type="button"
          className={styles.exitButton}
          onClick={() => runtimeRef.current?.requestExit()}
          aria-label="Exit Resonance Weaver and restore the hero"
        >
          Exit
        </button>
      ) : null}
    </>
  );
}
