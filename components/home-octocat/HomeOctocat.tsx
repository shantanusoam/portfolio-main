"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { announceHomeOctocat } from "@/lib/home-octocat/events";
import type { Ledge } from "@/lib/home-octocat/motion";
import type { HomeOctocatRuntime } from "@/lib/home-octocat/runtime";
import styles from "./HomeOctocat.module.css";

const MOVEMENT_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  " ",
  "a",
  "d",
  "w",
]);

export default function HomeOctocat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLButtonElement>(null);
  const regionRef = useRef<HTMLElement>(null);
  const runtimeRef = useRef<HomeOctocatRuntime | null>(null);
  const activeRef = useRef(false);
  const pausedRef = useRef(false);
  const keys = useRef(new Set<string>());
  const touch = useRef({ left: false, right: false });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const jumpTimer = useRef<ReturnType<typeof setTimeout>>();
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [surfaces, setSurfaces] = useState<Ledge[]>([]);
  const [visited, setVisited] = useState<string[]>([]);
  const reducedMotion = usePrefersReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;

  const clearInput = useCallback(() => {
    keys.current.clear();
    touch.current = { left: false, right: false };
    runtimeRef.current?.motion.clearInput();
  }, []);

  const start = useCallback(() => {
    activeRef.current = true;
    pausedRef.current = false;
    setActive(true);
    setPaused(false);
    runtimeRef.current?.play();
    regionRef.current?.focus({ preventScroll: true });
  }, []);

  const stop = useCallback(
    (restoreFocus = true) => {
      activeRef.current = false;
      pausedRef.current = false;
      clearInput();
      drag.current = null;
      runtimeRef.current?.stop();
      setActive(false);
      setPaused(false);
      const url = new URL(window.location.href);
      if (url.searchParams.has("octocat")) {
        url.searchParams.delete("octocat");
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${url.search}${url.hash}`,
        );
      }
      if (restoreFocus) playerRef.current?.focus({ preventScroll: true });
    },
    [clearInput],
  );

  const pause = useCallback(
    (next: boolean) => {
      pausedRef.current = next;
      clearInput();
      runtimeRef.current?.setPaused(next);
      setPaused(next);
    },
    [clearInput],
  );

  const restart = () => {
    clearInput();
    runtimeRef.current?.restart();
    pausedRef.current = false;
    setPaused(false);
    regionRef.current?.focus({ preventScroll: true });
  };

  useEffect(() => {
    let cancelled = false;
    const hero = document.getElementById("hero");
    if (!hero) return;
    if (new URLSearchParams(window.location.search).get("octocat") === "play")
      start();
    const timer = setTimeout(async () => {
      try {
        const { HomeOctocatRuntime } = await import(
          "@/lib/home-octocat/runtime"
        );
        if (cancelled || !canvasRef.current || !playerRef.current) return;
        const runtime = new HomeOctocatRuntime(
          canvasRef.current,
          playerRef.current,
          hero,
          {
            onLayout: setSurfaces,
            onScore: setVisited,
            onLeaveHero: () => stop(false),
            onUnavailable: () => {
              stop(false);
              setUnavailable(true);
              setReady(false);
            },
          },
        );
        runtimeRef.current = runtime;
        runtime.setReducedMotion(reducedRef.current);
        if (activeRef.current) runtime.play();
        setReady(true);
      } catch {
        if (!cancelled) {
          stop(false);
          setUnavailable(true);
        }
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      clearTimeout(jumpTimer.current);
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
      announceHomeOctocat(false);
    };
  }, [start, stop]);

  useEffect(() => {
    runtimeRef.current?.setReducedMotion(reducedMotion);
  }, [reducedMotion]);
  useEffect(() => {
    announceHomeOctocat(active);
  }, [active]);

  const syncAxis = useCallback(() => {
    const left =
      keys.current.has("ArrowLeft") ||
      keys.current.has("a") ||
      touch.current.left;
    const right =
      keys.current.has("ArrowRight") ||
      keys.current.has("d") ||
      touch.current.right;
    if (runtimeRef.current)
      runtimeRef.current.motion.axis = Number(right) - Number(left);
  }, []);

  useEffect(() => {
    if (!active) return;
    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (
        target?.closest(
          "input, textarea, select, [contenteditable='true'], [role='dialog']",
        )
      )
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      // Preserve Space/Enter activation for the HUD's real buttons and links.
      if (key === " " && target?.closest("button, a")) return;
      if (
        !MOVEMENT_KEYS.has(key) &&
        key !== "Escape" &&
        key !== "p" &&
        key !== "r"
      )
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "Escape") {
        stop();
        return;
      }
      if (key === "p" && !event.repeat) {
        pause(!pausedRef.current);
        return;
      }
      if (key === "r" && !event.repeat) {
        clearInput();
        runtimeRef.current?.restart();
        pausedRef.current = false;
        setPaused(false);
        return;
      }
      if (pausedRef.current) return;
      keys.current.add(key);
      syncAxis();
      if (!event.repeat && (key === " " || key === "ArrowUp" || key === "w"))
        runtimeRef.current?.motion.jump();
    };
    const keyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      keys.current.delete(key);
      syncAxis();
      if (key === " " || key === "ArrowUp" || key === "w") {
        if (runtimeRef.current) runtimeRef.current.motion.jumpHeld = false;
      }
    };
    const blur = () => pause(true);
    const hidden = () => {
      if (document.hidden) pause(true);
    };
    window.addEventListener("keydown", keyDown, true);
    window.addEventListener("keyup", keyUp, true);
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearInput();
      window.removeEventListener("keydown", keyDown, true);
      window.removeEventListener("keyup", keyUp, true);
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", hidden);
    };
  }, [active, clearInput, pause, stop, syncAxis]);

  const jumpPulse = () => {
    if (pausedRef.current) return;
    runtimeRef.current?.motion.jump();
    clearTimeout(jumpTimer.current);
    jumpTimer.current = setTimeout(() => {
      if (runtimeRef.current) runtimeRef.current.motion.jumpHeld = false;
    }, 180);
  };

  const onGrab = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !ready || pausedRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
    };
  };
  const onDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    if (
      !current.moved &&
      Math.hypot(event.clientX - current.x, event.clientY - current.y) > 5
    ) {
      if (!activeRef.current) start();
      runtimeRef.current?.motion.grab(event.clientX, event.clientY);
      current.moved = true;
    }
    if (current.moved)
      runtimeRef.current?.motion.dragTo(event.clientX, event.clientY);
  };
  const onRelease = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) runtimeRef.current?.motion.release();
    else if (!activeRef.current) start();
    else jumpPulse();
  };
  const cancelDrag = () => {
    if (!drag.current) return;
    drag.current = null;
    runtimeRef.current?.motion.release();
  };

  const total = surfaces.filter((s) => s.goal).length || 3;
  const won = visited.length >= total;

  return (
    <section
      ref={regionRef}
      tabIndex={-1}
      className={styles.layer}
      aria-label="Octocat home playground"
      data-octocat-ui
      data-active={active}
    >
      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
        hidden={!ready}
      />
      <button
        ref={playerRef}
        type="button"
        className={styles.character}
        data-ready={ready}
        aria-label={
          active
            ? "Octocat. Click to jump, or drag and release."
            : "Play with Octocat"
        }
        aria-describedby={active ? "octocat-instructions" : undefined}
        disabled={!ready}
        onPointerDown={onGrab}
        onPointerMove={onDrag}
        onPointerUp={onRelease}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onClick={(event) => {
          if (event.detail === 0) active ? jumpPulse() : start();
        }}
      >
        {!active && <span className={styles.whisper}>Psst. Play?</span>}
      </button>
      <AnimatePresence>
        {active && (
          <>
            {surfaces
              .filter((s) => s.goal && !visited.includes(s.id))
              .map((surface) => (
                <motion.div
                  key={surface.id}
                  className={styles.ledge}
                  aria-hidden="true"
                  style={{
                    left: surface.x,
                    top: surface.y,
                    width: surface.width,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <span className={styles.spark} />
                </motion.div>
              ))}
            <motion.div
              className={styles.hud}
              initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
              transition={{ type: "spring", stiffness: 240, damping: 26 }}
            >
              <div className={styles.identity}>
                <span className={styles.statusDot} />
                <div>
                  <strong>
                    {!ready
                      ? "Waking up…"
                      : paused
                        ? "Taking a breather"
                        : won
                          ? "A little home run."
                          : "The floor is a portfolio."}
                  </strong>
                  <p id="octocat-instructions">
                    {won
                      ? "All sparks found. Fancy another lap?"
                      : "Reach the 3 glowing ledges. Drag me, too."}
                  </p>
                </div>
                <span
                  className={styles.score}
                  aria-label={`${visited.length} of ${total} ledges reached`}
                >
                  {String(visited.length).padStart(2, "0")}
                  <span> / {String(total).padStart(2, "0")}</span>
                </span>
              </div>
              <div className={styles.toolbar}>
                <span className={styles.keyboardHint}>
                  <kbd>←</kbd>
                  <kbd>→</kbd> move <kbd>Space</kbd> jump
                </span>
                <button
                  type="button"
                  onClick={() => pause(!paused)}
                  disabled={!ready}
                >
                  {paused ? "Resume" : "Pause"}
                </button>
                <button type="button" onClick={restart} disabled={!ready}>
                  {won ? "Again" : "Reset"}
                </button>
                <button
                  type="button"
                  onClick={() => stop()}
                  aria-label="Exit Octocat playground"
                >
                  Exit <span className={styles.escape}>esc</span>
                </button>
              </div>
              <div
                className={styles.touchControls}
                aria-label="Touch game controls"
              >
                {(["left", "right"] as const).map((direction) => (
                  <button
                    key={direction}
                    type="button"
                    aria-label={`Move ${direction}`}
                    disabled={!ready || paused}
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.currentTarget.setPointerCapture(event.pointerId);
                      touch.current[direction] = true;
                      syncAxis();
                    }}
                    onPointerUp={() => {
                      touch.current[direction] = false;
                      syncAxis();
                    }}
                    onPointerCancel={() => {
                      touch.current[direction] = false;
                      syncAxis();
                    }}
                    onLostPointerCapture={() => {
                      touch.current[direction] = false;
                      syncAxis();
                    }}
                  >
                    {direction === "left" ? "←" : "→"}
                  </button>
                ))}
                <button
                  type="button"
                  className={styles.jumpButton}
                  disabled={!ready || paused}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.currentTarget.setPointerCapture(event.pointerId);
                    runtimeRef.current?.motion.jump();
                  }}
                  onPointerUp={() => {
                    if (runtimeRef.current)
                      runtimeRef.current.motion.jumpHeld = false;
                  }}
                  onPointerCancel={() => {
                    if (runtimeRef.current)
                      runtimeRef.current.motion.jumpHeld = false;
                  }}
                  onLostPointerCapture={() => {
                    if (runtimeRef.current)
                      runtimeRef.current.motion.jumpHeld = false;
                  }}
                  onClick={(event) => {
                    if (event.detail === 0) jumpPulse();
                  }}
                >
                  Jump ↑
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {active &&
          (won
            ? "All three ledges reached!"
            : `${visited.length} of ${total} ledges reached.`)}
      </span>
      {unavailable && (
        <div className={styles.unavailable} role="status">
          The companion couldn&apos;t start in this browser. Reload to try
          again.
          <button
            type="button"
            onClick={() => setUnavailable(false)}
            aria-label="Dismiss companion message"
          >
            ×
          </button>
        </div>
      )}
    </section>
  );
}
