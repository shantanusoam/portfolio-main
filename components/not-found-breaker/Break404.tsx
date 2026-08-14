"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import styles from "./Break404.module.css";
import { createBreak404Audio, type Break404Audio } from "./game/audio";
import { GAME_TUNING, POWER_LABELS } from "./game/config";
import { createModel, resizeModel } from "./game/model";
import { renderGame } from "./game/render";
import type { Break404Model, GameStatus, PowerKind } from "./game/types";
import { updateGame } from "./game/update";

function activePowerLabels(model: Break404Model): PowerKind[] {
  const labels: PowerKind[] = [];
  if (model.time < model.active.wideUntil) labels.push("wide");
  if (model.time < model.active.fireUntil) labels.push("fire");
  if (model.time < model.active.slowUntil) labels.push("slow");
  return labels;
}

export default function Break404() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const modelRef = useRef<Break404Model | null>(null);
  const audioRef = useRef<Break404Audio | null>(null);
  const launchRef = useRef(false);
  const prevStatus = useRef<GameStatus>("ready");

  const [hud, setHud] = useState({
    lives: GAME_TUNING.lives as number,
    combo: 0,
    score: 0,
    status: "ready" as GameStatus,
    muted: false,
    powers: [] as PowerKind[],
  });

  const syncHud = useCallback((model: Break404Model) => {
    setHud({
      lives: model.lives,
      combo: model.combo,
      score: model.score,
      status: model.status,
      muted: model.muted,
      powers: activePowerLabels(model),
    });
  }, []);

  const restart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const muted = audioRef.current?.isMuted() ?? false;
    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const model = createModel(rect.width || 1, rect.height || 1, {
      muted,
      reducedMotion,
    });
    modelRef.current = model;
    prevStatus.current = model.status;
    syncHud(model);
  }, [syncHud]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const audio = createBreak404Audio();
    audioRef.current = audio;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const rect = canvas.getBoundingClientRect();
    const model = createModel(
      rect.width || window.innerWidth,
      rect.height || window.innerHeight,
      {
        muted: audio.isMuted(),
        reducedMotion,
      },
    );
    modelRef.current = model;
    syncHud(model);

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = performance.now();
    let hudAcc = 0;
    let pageVisible = !document.hidden;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = canvas.clientWidth || window.innerWidth;
      const cssH = canvas.clientHeight || window.innerHeight;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (modelRef.current) {
        resizeModel(modelRef.current, cssW, cssH);
      }
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const toLocalX = (clientX: number) => {
      const bounds = canvas.getBoundingClientRect();
      return clientX - bounds.left;
    };

    const onPointerMove = (event: PointerEvent) => {
      const m = modelRef.current;
      if (!m) return;
      m.pointerX = toLocalX(event.clientX);
    };

    const onPointerDown = (event: PointerEvent) => {
      audio.resume();
      const m = modelRef.current;
      if (!m) return;
      m.pointerX = toLocalX(event.clientX);
      if (m.status === "ready" || m.balls.some((b) => b.stuck)) {
        launchRef.current = true;
      }
    };

    const onPointerLeave = () => {
      const m = modelRef.current;
      if (m) m.pointerX = null;
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const m = modelRef.current;
      if (!m) return;
      if (event.code === "ArrowLeft" || event.code === "KeyA") {
        m.keys.left = true;
        m.pointerX = null;
      }
      if (event.code === "ArrowRight" || event.code === "KeyD") {
        m.keys.right = true;
        m.pointerX = null;
      }
      if (event.code === "Space") {
        event.preventDefault();
        audio.resume();
        launchRef.current = true;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      const m = modelRef.current;
      if (!m) return;
      if (event.code === "ArrowLeft" || event.code === "KeyA")
        m.keys.left = false;
      if (event.code === "ArrowRight" || event.code === "KeyD")
        m.keys.right = false;
    };

    const onVisibilityChange = () => {
      pageVisible = !document.hidden;
      // Ignore time spent outside the visible session. The game should
      // resume from the same readable state, not simulate a hidden backlog.
      last = performance.now();
    };

    window.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const tick = (now: number) => {
      const m = modelRef.current;
      if (!m) return;
      if (!pageVisible) {
        last = now;
        raf = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;

      const launch = launchRef.current;
      launchRef.current = false;

      updateGame(m, { dt, launch });

      for (const cue of m.sfx) audio.play(cue);
      prevStatus.current = m.status;

      renderGame(ctx, m);

      hudAcc += dt;
      if (hudAcc > 0.08) {
        hudAcc = 0;
        syncHud(m);
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      audio.destroy();
      audioRef.current = null;
    };
  }, [syncHud]);

  const toggleMute = () => {
    const audio = audioRef.current;
    const model = modelRef.current;
    if (!audio || !model) return;
    const next = !audio.isMuted();
    audio.setMuted(next);
    model.muted = next;
    syncHud(model);
  };

  return (
    <div className={styles.stage}>
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-label="404 brick breaker"
      />

      <div className={styles.hud}>
        <div className={styles.topBar}>
          <div className={styles.meta}>
            <p className={styles.eyebrow}>Signal not found</p>
            <div className={styles.stats}>
              <span>
                Lives <strong>{hud.lives}</strong>
              </span>
              <span>
                Combo <strong>{hud.combo > 1 ? `×${hud.combo}` : "—"}</strong>
              </span>
              <span>
                Score <strong>{hud.score}</strong>
              </span>
            </div>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.iconBtn}
              onClick={toggleMute}
              aria-label={hud.muted ? "Unmute" : "Mute"}
            >
              {hud.muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {hud.powers.length > 0 && (
          <div className={styles.powerRow}>
            {hud.powers.map((kind) => (
              <span key={kind} className={styles.powerChip}>
                {POWER_LABELS[kind]}
              </span>
            ))}
          </div>
        )}

        {hud.status === "stillLost" && (
          <div className={styles.flash}>
            <p className={styles.flashTitle}>Still lost…</p>
            <p className={styles.flashSub}>Serving another ball</p>
          </div>
        )}
      </div>

      {(hud.status === "won" || hud.status === "gameOver") && (
        <div className={styles.overlay}>
          <div className={styles.panel}>
            {hud.status === "won" ? (
              <>
                <h1 className={styles.panelTitle}>
                  You broke the{" "}
                  <span className={styles.panelTitleAccent}>404</span>
                </h1>
                <p className={styles.panelBody}>
                  Route restored. Score {hud.score}. Nice serve.
                </p>
              </>
            ) : (
              <>
                <h1 className={styles.panelTitle}>Still nowhere</h1>
                <p className={styles.panelBody}>
                  The page stayed lost. Try another run — or head home.
                </p>
              </>
            )}
            <div className={styles.ctaRow}>
              <Link href="/" className={`${styles.cta} ${styles.ctaPrimary}`}>
                Go Home
              </Link>
              <button
                type="button"
                className={`${styles.cta} ${styles.ctaGhost}`}
                onClick={restart}
              >
                Play again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
