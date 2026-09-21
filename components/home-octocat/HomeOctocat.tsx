"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Heart,
  Pause,
  Play,
  Star,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import usePrefersReducedMotion from "@/hooks/usePreferedRedcedMotion";
import { announceHomeOctocat } from "@/lib/home-octocat/events";
import type {
  GameSnapshot,
  HomeOctocatRuntime,
} from "@/lib/home-octocat/runtime";
import styles from "./HomeOctocat.module.css";

const BEST_KEY = "portfolio:mochi-best:manual-v2";
const INITIAL: GameSnapshot = {
  phase: "idle",
  height: 0,
  stars: 0,
  extraHop: true,
  grounded: true,
  lives: 3,
  checkpoint: 0,
  recovering: false,
};

export default function HomeOctocat() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<HTMLButtonElement>(null);
  const companionRef = useRef<HTMLDivElement>(null);
  const regionRef = useRef<HTMLElement>(null);
  const runtimeRef = useRef<HomeOctocatRuntime | null>(null);
  const activeRef = useRef(false);
  const pausedRef = useRef(false);
  const restoreFocusRef = useRef(false);
  const keys = useRef(new Set<string>());
  const touch = useRef({ left: false, right: false });
  const drag = useRef<{
    id: number;
    x: number;
    y: number;
    moved: boolean;
  } | null>(null);
  const [active, setActive] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ready, setReady] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [sound, setSound] = useState(false);
  const [best, setBest] = useState(0);
  const [game, setGame] = useState<GameSnapshot>(INITIAL);
  const reducedMotion = usePrefersReducedMotion();
  const reducedRef = useRef(reducedMotion);
  reducedRef.current = reducedMotion;
  const clearInput = useCallback(() => {
    keys.current.clear();
    touch.current = { left: false, right: false };
    runtimeRef.current?.motion.clearInput();
  }, []);
  const focusGame = () => regionRef.current?.focus({ preventScroll: true });
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
      url.searchParams.delete("octocat");
      url.searchParams.delete("mochi");
      window.history.replaceState(
        window.history.state,
        "",
        `${url.pathname}${url.search}${url.hash}`,
      );
      restoreFocusRef.current = restoreFocus;
    },
    [clearInput],
  );
  const pause = useCallback(
    (next: boolean) => {
      pausedRef.current = next;
      clearInput();
      runtimeRef.current?.setPaused(next);
      setPaused(next);
      regionRef.current?.focus({ preventScroll: true });
    },
    [clearInput],
  );
  const restart = useCallback(() => {
    clearInput();
    runtimeRef.current?.restart();
    pausedRef.current = false;
    setPaused(false);
    regionRef.current?.focus({ preventScroll: true });
  }, [clearInput]);
  const begin = () => {
    runtimeRef.current?.begin();
    focusGame();
  };
  const jump = () => {
    if (!pausedRef.current) runtimeRef.current?.motion.jump();
  };
  const releaseJump = () => runtimeRef.current?.motion.releaseJump();
  const pet = () => {
    runtimeRef.current?.motion.boop();
    runtimeRef.current?.wake();
  };
  const greet = () => {
    runtimeRef.current?.motion.hover();
    runtimeRef.current?.wake();
  };

  useEffect(() => {
    let cancelled = false;
    const hero = document.getElementById("hero");
    if (!hero) return;
    try {
      const value = Number(localStorage.getItem(BEST_KEY));
      if (Number.isFinite(value) && value > 0) setBest(value);
    } catch {
      /* Best score is optional. */
    }
    const query = new URLSearchParams(window.location.search);
    if (query.get("mochi") === "play" || query.get("octocat") === "play")
      start();
    const timer = setTimeout(async () => {
      try {
        const { HomeOctocatRuntime } = await import(
          "@/lib/home-octocat/runtime"
        );
        if (
          cancelled ||
          !canvasRef.current ||
          !worldRef.current ||
          !playerRef.current
        )
          return;
        const runtime = new HomeOctocatRuntime(
          canvasRef.current,
          worldRef.current,
          playerRef.current,
          hero,
          {
            onGame: setGame,
            onUnavailable: () => {
              stop(false);
              setUnavailable(true);
              setReady(false);
            },
          },
          companionRef.current ?? undefined,
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
    if (!active && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      playerRef.current?.focus({ preventScroll: true });
    }
  }, [active]);
  useEffect(() => {
    if (!active) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [active]);
  useEffect(() => {
    if (game.phase !== "over" || game.height <= best) return;
    setBest(game.height);
    try {
      localStorage.setItem(BEST_KEY, String(game.height));
    } catch {
      /* Storage can be disabled. */
    }
  }, [game.phase, game.height, best]);

  const syncAxis = useCallback(() => {
    const left =
      keys.current.has("ArrowLeft") ||
      keys.current.has("a") ||
      touch.current.left;
    const right =
      keys.current.has("ArrowRight") ||
      keys.current.has("d") ||
      touch.current.right;
    if (runtimeRef.current) {
      runtimeRef.current.motion.axis = Number(right) - Number(left);
      runtimeRef.current.motion.pointerX = null;
    }
  }, []);
  useEffect(() => {
    if (!active) return;
    const keyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']"))
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (key === "Tab") {
        const buttons = Array.from(
          regionRef.current?.querySelectorAll<HTMLButtonElement>(
            "button:not(:disabled)",
          ) ?? [],
        ).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (!first) return;
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === regionRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (
          !event.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === regionRef.current)
        ) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      if (key === " " && target?.closest("button, a")) return;
      if (
        ![
          "ArrowLeft",
          "ArrowRight",
          "ArrowUp",
          " ",
          "a",
          "d",
          "w",
          "p",
          "r",
          "Escape",
          "Enter",
        ].includes(key)
      )
        return;
      if (key === "Enter" && target?.closest("button, a")) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (key === "Escape") {
        stop();
        return;
      }
      if (
        key === "p" &&
        !event.repeat &&
        runtimeRef.current?.motion.phase === "climbing"
      ) {
        pause(!pausedRef.current);
        return;
      }
      if (key === "r" && !event.repeat) {
        restart();
        return;
      }
      if (pausedRef.current) {
        if ((key === " " || key === "Enter") && !event.repeat) pause(false);
        return;
      }
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(key)) {
        keys.current.add(key);
        syncAxis();
      }
      if (!event.repeat && [" ", "ArrowUp", "w", "Enter"].includes(key)) {
        const phase = runtimeRef.current?.motion.phase;
        if (phase === "ready") runtimeRef.current?.begin();
        else if (phase === "over") restart();
        else runtimeRef.current?.motion.jump();
      }
    };
    const keyUp = (event: KeyboardEvent) => {
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (keys.current.delete(key)) syncAxis();
      if ([" ", "ArrowUp", "w", "Enter"].includes(key))
        runtimeRef.current?.motion.releaseJump();
    };
    const blur = () => {
      if (runtimeRef.current?.motion.phase === "climbing") pause(true);
    };
    const hidden = () => {
      if (document.hidden) blur();
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
  }, [active, clearInput, pause, restart, stop, syncAxis]);

  const onGrab = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !ready || activeRef.current) return;
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
      runtimeRef.current?.motion.grab(event.clientX, event.clientY);
      current.moved = true;
      runtimeRef.current?.wake();
    }
    if (current.moved)
      runtimeRef.current?.motion.dragTo(event.clientX, event.clientY);
  };
  const cancelDrag = () => {
    if (drag.current) {
      drag.current = null;
      runtimeRef.current?.motion.release();
    }
  };
  const onRelease = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (current.moved) runtimeRef.current?.motion.release();
    else pet();
  };
  const touchDirection = (
    direction: "left" | "right",
    down: boolean,
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();
    if (down) event.currentTarget.setPointerCapture(event.pointerId);
    touch.current[direction] = down;
    syncAxis();
  };
  const running = game.phase === "climbing";
  const animation = {
    initial: { opacity: 0, y: reducedMotion ? 0 : 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: reducedMotion ? 0 : 5 },
    transition: { type: "spring", stiffness: 260, damping: 26 },
  };

  return (
    <section
      ref={regionRef}
      tabIndex={-1}
      className={styles.layer}
      aria-label={
        active
          ? "Mochi, a little higher. Climbing game"
          : "Mochi home companion"
      }
      role={active ? "dialog" : undefined}
      aria-modal={active || undefined}
      aria-describedby={active ? "mochi-instructions" : undefined}
      data-octocat-ui
      data-active={active}
      data-phase={game.phase}
      data-lenis-prevent
    >
      <canvas
        ref={worldRef}
        className={styles.world}
        aria-hidden="true"
        hidden={!active}
      />
      {active && (
        <div
          className={styles.inputSurface}
          aria-hidden="true"
          onPointerDown={(e) => {
            if (!pausedRef.current) {
              e.currentTarget.setPointerCapture(e.pointerId);
              runtimeRef.current?.motion.steer(e.clientX);
              focusGame();
            }
          }}
          onPointerMove={(e) => {
            if (!pausedRef.current && (e.pointerType === "mouse" || e.buttons))
              runtimeRef.current?.motion.steer(e.clientX);
          }}
          onPointerUp={(e) => {
            if (e.currentTarget.hasPointerCapture(e.pointerId))
              e.currentTarget.releasePointerCapture(e.pointerId);
          }}
          onPointerCancel={() => {
            if (runtimeRef.current) runtimeRef.current.motion.pointerX = null;
          }}
        />
      )}
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
        hidden={active}
        aria-label="Pet Mochi"
        onPointerEnter={greet}
        onFocus={greet}
        disabled={!ready || active}
        onPointerDown={onGrab}
        onPointerMove={onDrag}
        onPointerUp={onRelease}
        onPointerCancel={cancelDrag}
        onLostPointerCapture={cancelDrag}
        onClick={(e) => {
          if (e.detail === 0) pet();
        }}
      >
        <span className={styles.whisper}>psst… hello</span>
      </button>
      <div
        ref={companionRef}
        className={styles.companionControls}
        hidden={active || !ready}
      >
        <button type="button" onClick={start} aria-label="Play with Mochi">
          Play <ArrowUp size={11} />
        </button>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div className={styles.gameUI} {...animation}>
            <header className={styles.hud}>
              <div className={styles.brand}>
                <span className={styles.dot} />
                <div>
                  <strong>Mochi</strong>
                  <span>a little higher</span>
                </div>
              </div>
              <div
                className={styles.score}
                aria-label={`${game.height} metres, ${game.stars} stars`}
              >
                <strong>
                  {game.height}
                  <small>m</small>
                </strong>
                <span>
                  <Star size={11} /> {game.stars}{" "}
                  <i>best {Math.max(best, game.height)}m</i>
                </span>
              </div>
              <div
                className={styles.hearts}
                aria-label={`${game.lives} hearts remaining`}
              >
                {[0, 1, 2].map((i) => (
                  <Heart
                    key={i}
                    size={12}
                    fill={i < game.lives ? "currentColor" : "none"}
                    data-filled={i < game.lives}
                  />
                ))}
              </div>
              <div className={styles.actions}>
                <button
                  type="button"
                  aria-label={sound ? "Mute sound" : "Enable sound"}
                  aria-pressed={sound}
                  onClick={async () => {
                    const enabled = await runtimeRef.current?.audio.toggle();
                    setSound(Boolean(enabled));
                  }}
                >
                  {sound ? <Volume2 size={17} /> : <VolumeX size={17} />}
                </button>
                {running && (
                  <button
                    type="button"
                    aria-label={paused ? "Resume game" : "Pause game"}
                    onClick={() => pause(!paused)}
                  >
                    {paused ? <Play size={16} /> : <Pause size={16} />}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Back to portfolio"
                  onClick={() => stop()}
                >
                  <X size={18} />
                </button>
              </div>
            </header>
            {running && (game.recovering || game.checkpoint > 0) && (
              <div className={styles.checkpointNote} role="status">
                {game.recovering
                  ? "A little tumble. Back to your safe spot…"
                  : "Flower checkpoint saved"}
              </div>
            )}
            <AnimatePresence mode="wait">
              {game.phase === "ready" && (
                <motion.div
                  key="intro"
                  className={`${styles.card} ${styles.intro}`}
                  {...animation}
                >
                  <span className={styles.eyebrow}>a tiny escape</span>
                  <h2>Little bunny. Big sky.</h2>
                  <p>
                    Walk, then jump when you&apos;re ready.
                    <br />
                    Hold for height. Collect stars. Mind the puffs.
                  </p>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={begin}
                    disabled={!ready}
                  >
                    Let&apos;s explore <ArrowRight size={16} />
                  </button>
                  <span className={styles.cardHint}>
                    3 hearts · flower checkpoints · take your time
                  </span>
                </motion.div>
              )}
              {paused && (
                <motion.div key="pause" className={styles.card} {...animation}>
                  <span className={styles.eyebrow}>catch your breath</span>
                  <h2>We can wait.</h2>
                  <p>Your next foothold is right where you left it.</p>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => pause(false)}
                  >
                    Keep hopping <Play size={15} />
                  </button>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => stop()}
                  >
                    Back to portfolio
                  </button>
                </motion.div>
              )}
              {game.phase === "over" && (
                <motion.div key="over" className={styles.card} {...animation}>
                  <span className={styles.eyebrow}>
                    {game.height > 0 && game.height >= best
                      ? "a new little best"
                      : "a lovely little adventure"}
                  </span>
                  <h2 className={styles.finalHeight}>
                    {game.height}
                    <span>m</span>
                  </h2>
                  <p>
                    <Star size={13} /> {game.stars} stars collected · best{" "}
                    {Math.max(best, game.height)}m
                  </p>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={restart}
                  >
                    One more hop <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => stop()}
                  >
                    Back to portfolio
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            <footer className={styles.footer}>
              <p id="mochi-instructions" className={styles.instructions}>
                <span className={styles.desktopHint}>
                  Move your mouse or use <kbd>←</kbd> <kbd>→</kbd> to steer.
                </span>
                <span className={styles.mobileHint}>
                  Drag to steer, or use the arrows.
                </span>{" "}
                <span>
                  <kbd>Space</kbd> jump · hold for height · press again in the
                  air
                </span>
              </p>
              {running && !paused && (
                <div className={styles.controls}>
                  <div className={styles.directions}>
                    {(["left", "right"] as const).map((direction) => (
                      <button
                        key={direction}
                        type="button"
                        aria-label={`Move ${direction}`}
                        onPointerDown={(e) =>
                          touchDirection(direction, true, e)
                        }
                        onPointerUp={(e) => touchDirection(direction, false, e)}
                        onPointerCancel={(e) =>
                          touchDirection(direction, false, e)
                        }
                        onLostPointerCapture={(e) =>
                          touchDirection(direction, false, e)
                        }
                      >
                        {direction === "left" ? (
                          <ArrowLeft size={23} />
                        ) : (
                          <ArrowRight size={23} />
                        )}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    className={styles.jumpButton}
                    aria-label="Jump"
                    data-available={game.grounded || game.extraHop}
                    disabled={game.recovering}
                    onPointerDown={(e) => {
                      if (e.button !== 0) return;
                      e.preventDefault();
                      e.currentTarget.setPointerCapture(e.pointerId);
                      jump();
                      focusGame();
                    }}
                    onPointerUp={(e) => {
                      releaseJump();
                      if (e.currentTarget.hasPointerCapture(e.pointerId))
                        e.currentTarget.releasePointerCapture(e.pointerId);
                    }}
                    onPointerCancel={releaseJump}
                    onLostPointerCapture={releaseJump}
                    onKeyDown={(e) => {
                      if ([" ", "Enter"].includes(e.key)) {
                        e.preventDefault();
                        if (!e.repeat) jump();
                      }
                    }}
                    onKeyUp={(e) => {
                      if ([" ", "Enter"].includes(e.key)) {
                        e.preventDefault();
                        releaseJump();
                      }
                    }}
                    onClick={(e) => {
                      if (e.detail === 0) {
                        jump();
                        releaseJump();
                      }
                    }}
                  >
                    <span className={styles.hopDot} />
                    <ArrowUp size={15} />{" "}
                    {game.grounded
                      ? "Jump"
                      : game.extraHop
                        ? "Double jump"
                        : "Land to refill"}
                  </button>
                </div>
              )}
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
      <span className={styles.srOnly} role="status" aria-live="polite">
        {active &&
          (game.phase === "over"
            ? `Run complete. ${game.height} metres and ${game.stars} stars. Press Space to play again.`
            : paused
              ? "Game paused."
              : game.phase === "ready"
                ? "Ready. Press Space to enter. Arrows move, Space jumps. Hold for a higher jump, press again for a double jump. Land on puffs from above. Flowers save your progress."
                : `${Math.floor(game.height / 25) * 25} metres. ${
                    game.stars
                  } stars. ${game.lives} hearts.`)}
      </span>
      {unavailable && (
        <div className={styles.unavailable} role="status">
          Mochi couldn&apos;t start. Reload to try again.
          <button
            type="button"
            onClick={() => setUnavailable(false)}
            aria-label="Dismiss companion message"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </section>
  );
}
