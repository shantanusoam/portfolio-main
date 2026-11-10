"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  createGarden,
  stepGarden,
  takeQuietStep,
  GARDEN_HEIGHT,
  GARDEN_WIDTH,
  type CanopyState,
} from "@/lib/garden-game/canopy";
import { SecondOrderDynamics } from "@/lib/mascot/motion/SecondOrderDynamics";
import styles from "./GardenArcade.module.css";

function drawGarden(
  ctx: CanvasRenderingContext2D,
  state: CanopyState,
  squash: number,
  quiet: boolean,
) {
  const w = GARDEN_WIDTH,
    h = GARDEN_HEIGHT,
    camera = state.camera;
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#274e3e");
  sky.addColorStop(1, "#10281f");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const light = ctx.createRadialGradient(380, 70, 4, 380, 70, 220);
  light.addColorStop(0, "#eddba43d");
  light.addColorStop(1, "#eddba400");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = "#d7d9ab";
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  ctx.arc(380, 70, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  for (let layer = 0; layer < 3; layer++) {
    const shift = quiet ? 0 : Math.min(camera * 0.06 * (layer + 1), 80);
    ctx.fillStyle = ["#244633", "#1d3d2c", "#173422"][layer];
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(0, 340 + layer * 34 + shift);
    ctx.bezierCurveTo(
      120,
      230 + layer * 55 + shift,
      270,
      420 + layer * 20 + shift,
      w,
      270 + layer * 58 + shift,
    );
    ctx.lineTo(w, h);
    ctx.fill();
  }
  // Tiny firefly-like seeds are static location markers, not independent particle emitters.
  for (let i = 0; i < 14; i++) {
    ctx.fillStyle = "#d5dfa529";
    ctx.beginPath();
    ctx.arc(
      (i * 139 + 43) % w,
      (i * 87 + 37) % h,
      i % 3 === 0 ? 2 : 1,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
  const sy = (worldY: number) => h - (worldY - camera);
  state.leaves.forEach((leaf) => {
    const y = sy(leaf.y);
    if (y < -60 || y > h + 65) return;
    const bend = quiet ? 0 : leaf.bend * 8;
    ctx.strokeStyle = "#c4dc9a55";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(leaf.x, y + 16);
    ctx.quadraticCurveTo(leaf.x - 16, y + 45, leaf.x - 9, y + 70);
    ctx.stroke();
    ctx.fillStyle = leaf.id === state.highestLeaf ? "#bedb8d" : "#8aaa73";
    ctx.beginPath();
    ctx.moveTo(leaf.x - leaf.width * 0.5, y);
    ctx.bezierCurveTo(
      leaf.x - leaf.width * 0.2,
      y - 14 + bend,
      leaf.x + leaf.width * 0.25,
      y - 12 + bend,
      leaf.x + leaf.width * 0.5,
      y,
    );
    ctx.bezierCurveTo(
      leaf.x + leaf.width * 0.15,
      y + 8 + bend,
      leaf.x - leaf.width * 0.22,
      y + 12 + bend,
      leaf.x - leaf.width * 0.5,
      y,
    );
    ctx.fill();
    ctx.strokeStyle = "#dce8b38a";
    ctx.beginPath();
    ctx.moveTo(leaf.x - leaf.width * 0.4, y);
    ctx.quadraticCurveTo(leaf.x, y + 3 + bend, leaf.x + leaf.width * 0.4, y);
    ctx.stroke();
    if (leaf.seed) {
      ctx.fillStyle = "#ead79f";
      ctx.beginPath();
      ctx.ellipse(leaf.x, y - 27, 4, 6, -0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (leaf.id === state.leaves.length - 1) {
      ctx.strokeStyle = "#f0deae";
      ctx.beginPath();
      ctx.moveTo(leaf.x, y - 19);
      ctx.lineTo(leaf.x, y - 45);
      ctx.stroke();
      ctx.fillStyle = "#f0deae";
      for (let petal = 0; petal < 5; petal++) {
        const a = (petal * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.ellipse(
          leaf.x + Math.cos(a) * 7,
          y - 48 + Math.sin(a) * 7,
          5,
          3,
          a,
          0,
          Math.PI * 2,
        );
        ctx.fill();
      }
    }
  });
  const p = state.player,
    x = p.x,
    y = sy(p.y) - 15;
  const recovery =
    state.recovery > 0 ? Math.sin(state.time * 10) * 0.1 + 0.9 : 1;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1 / Math.max(0.72, squash), squash);
  ctx.globalAlpha = recovery;
  const tilt = quiet ? 0 : Math.max(-0.18, Math.min(0.18, p.vx / 750));
  ctx.rotate(tilt);
  ctx.fillStyle = "#f0e5c7";
  ctx.beginPath();
  ctx.moveTo(0, -17);
  ctx.bezierCurveTo(15, -10, 18, 10, 7, 15);
  ctx.bezierCurveTo(-12, 22, -21, 4, -11, -8);
  ctx.quadraticCurveTo(-5, -16, 0, -17);
  ctx.fill();
  ctx.strokeStyle = "#a6c982";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -14);
  ctx.quadraticCurveTo(2, -23, 0, -27);
  ctx.stroke();
  ctx.fillStyle = "#c0d98e";
  ctx.beginPath();
  ctx.ellipse(-6, -26, 8, 4, 0.5, 0, Math.PI * 2);
  ctx.ellipse(7, -29, 9, 4, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#294b34";
  ctx.beginPath();
  ctx.ellipse(-5, -1, 1.4, 2, 0, 0, Math.PI * 2);
  ctx.ellipse(5, -1, 1.4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#486847";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 3, 3, 0.25, Math.PI - 0.25);
  ctx.stroke();
  ctx.restore();
  if (state.won) {
    ctx.fillStyle = "#10251edf";
    ctx.fillRect(50, 163, 380, 114);
    ctx.fillStyle = "#f0e5c7";
    ctx.font = "italic 30px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("A little closer to the sun.", 240, 208);
    ctx.font = "13px system-ui";
    ctx.fillStyle = "#c8d6b2";
    ctx.fillText("You found the canopy. Take your time here.", 240, 239);
    ctx.textAlign = "start";
  }
}

export default function Canopy({ onClose }: { onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null),
    region = useRef<HTMLDivElement>(null);
  const model = useRef(createGarden()),
    input = useRef(0),
    pressed = useRef(new Set<string>()),
    draw = useRef<() => void>(() => {});
  const [paused, setPaused] = useState(false),
    [quiet, setQuiet] = useState(false),
    [progress, setProgress] = useState({ leaf: 0, seeds: 0, won: false }),
    [ready, setReady] = useState(false);
  const pausedRef = useRef(false),
    quietRef = useRef(false),
    progressRef = useRef({ leaf: 0, seeds: 0, won: false });
  const sync = useCallback(() => {
    const s = model.current,
      previous = progressRef.current;
    if (
      previous.leaf === s.highestLeaf &&
      previous.seeds === s.collected &&
      previous.won === s.won
    )
      return;
    const next = { leaf: s.highestLeaf, seeds: s.collected, won: s.won };
    progressRef.current = next;
    setProgress(next);
  }, []);
  const clearInput = useCallback(() => {
    pressed.current.clear();
    input.current = 0;
  }, []);
  const pause = useCallback(() => {
    pausedRef.current = true;
    setPaused(true);
    clearInput();
  }, [clearInput]);
  const reset = () => {
    model.current = createGarden();
    sync();
    draw.current();
  };
  const step = () => {
    takeQuietStep(model.current);
    sync();
    draw.current();
  };
  const claim = () =>
    window.dispatchEvent(
      new CustomEvent("portfolio:playground-start", {
        detail: { id: "canopy" },
      }),
    );
  const resume = () => {
    claim();
    pausedRef.current = false;
    setPaused(false);
    canvas.current?.focus();
  };
  useEffect(() => {
    claim();
    canvas.current?.focus();
    setReady(true);
  }, []);
  useEffect(() => {
    const otherStarted = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail?.id !== "canopy")
        pause();
    };
    window.addEventListener("portfolio:playground-start", otherStarted);
    return () =>
      window.removeEventListener("portfolio:playground-start", otherStarted);
  }, [pause]);
  useEffect(() => {
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.querySelector(".workshop-home");
    const update = () => {
      const value =
        media.matches || root?.getAttribute("data-motion") === "quiet";
      quietRef.current = value;
      setQuiet(value);
      clearInput();
      draw.current();
    };
    update();
    media.addEventListener("change", update);
    const observer = new MutationObserver(update);
    if (root)
      observer.observe(root, {
        attributes: true,
        attributeFilter: ["data-motion"],
      });
    return () => {
      media.removeEventListener("change", update);
      observer.disconnect();
    };
  }, [clearInput]);
  useEffect(() => {
    const el = canvas.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    let raf = 0,
      disposed = false,
      last = 0,
      accumulator = 0,
      visible = true;
    const shape = new SecondOrderDynamics(
      { frequency: 4, damping: 0.65, response: 0 },
      1,
    );
    const render = () => {
      const s = model.current;
      const target = quietRef.current
        ? 1
        : s.landed >= 0
          ? 0.73
          : 1 + Math.min(0.19, Math.abs(s.player.vy) / 2500);
      const squash = quietRef.current ? 1 : shape.update(1 / 60, target);
      drawGarden(ctx, s, squash, quietRef.current);
    };
    draw.current = render;
    const resize = () => {
      const dpr = Math.min(
        devicePixelRatio || 1,
        matchMedia("(pointer:coarse)").matches ? 1.25 : 1.5,
      );
      el.width = GARDEN_WIDTH * dpr;
      el.height = GARDEN_HEIGHT * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      render();
    };
    const tick = (time: number) => {
      raf = 0;
      if (disposed) return;
      if (
        !visible ||
        document.hidden ||
        pausedRef.current ||
        quietRef.current ||
        model.current.won
      ) {
        last = 0;
        render();
        return;
      }
      const elapsed = last ? Math.min((time - last) / 1000, 0.08) : 1 / 60;
      last = time;
      accumulator += elapsed;
      let landed = false;
      while (accumulator >= 1 / 120) {
        stepGarden(model.current, input.current, 1 / 120);
        if (model.current.landed >= 0) landed = true;
        accumulator -= 1 / 120;
      }
      if (landed) shape.reset(0.73, 2);
      render();
      sync();
      raf = requestAnimationFrame(tick);
    };
    const wake = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (!visible) pause();
        else wake();
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    const visibility = () => {
      if (document.hidden) pause();
      else wake();
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("blur", pause);
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();
    wake();
    // Explicit changes wake the same single RAF owner; stopped frames do not spin.
    const wakeEvent = () => wake();
    el.addEventListener("canopy-wake", wakeEvent);
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("blur", pause);
      el.removeEventListener("canopy-wake", wakeEvent);
      draw.current = () => {};
      clearInput();
    };
  }, [pause, sync, clearInput]);
  useEffect(() => {
    canvas.current?.dispatchEvent(new Event("canopy-wake"));
  }, [paused, quiet, progress.won]);
  const keyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (["ArrowLeft", "ArrowRight", "a", "A", "d", "D"].includes(e.key)) {
      e.preventDefault();
      pressed.current.add(e.key.toLowerCase());
      input.current =
        pressed.current.has("arrowleft") || pressed.current.has("a")
          ? -1
          : pressed.current.has("arrowright") || pressed.current.has("d")
            ? 1
            : 0;
    }
    if (e.key === " " || e.key === "p" || e.key === "P") {
      e.preventDefault();
      if (e.repeat) return;
      if (quietRef.current) step();
      else pausedRef.current ? resume() : pause();
    }
  };
  const keyUp = (e: React.KeyboardEvent<HTMLElement>) => {
    pressed.current.delete(e.key.toLowerCase());
    input.current =
      pressed.current.has("arrowleft") || pressed.current.has("a")
        ? -1
        : pressed.current.has("arrowright") || pressed.current.has("d")
          ? 1
          : 0;
  };
  return (
    <div
      ref={region}
      data-canopy-stage
      tabIndex={-1}
      role="group"
      aria-label="Canopy garden game"
      aria-describedby="canopy-instructions"
      className={styles.stage}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) pause();
      }}
      onKeyUp={(e) => {
        if (e.target === e.currentTarget) keyUp(e);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        } else if (e.target === e.currentTarget) keyDown(e);
      }}
    >
      <div className={styles.gameHeading}>
        <div>
          <span className={styles.eyebrow}>Canopy / a quiet ascent</span>
          <p>
            {quiet
              ? "Still garden · one leaf at a time"
              : "Steer a little. Let the leaves do the lifting."}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className={styles.close}
          aria-label="Close Canopy and return to the portfolio"
        >
          Close ×
        </button>
      </div>
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvas}
          className={styles.canvas}
          tabIndex={0}
          role="img"
          aria-label={`Canopy garden. Leaf ${progress.leaf} of 12. ${
            quiet
              ? "Use Next leaf or Space for a still journey."
              : "Use left and right arrows or A and D to steer. Space pauses. Escape closes."
          }`}
          aria-describedby="canopy-instructions"
          onKeyDown={keyDown}
          onKeyUp={keyUp}
          onBlur={clearInput}
        />
        {paused && !quiet && !progress.won && (
          <div className={styles.pauseOverlay}>
            <span>A moment of stillness.</span>
            <button type="button" onClick={resume}>
              Continue growing →
            </button>
          </div>
        )}
      </div>
      <div className={styles.gameFooter}>
        <p className={styles.progress}>
          {progress.won ? "The canopy is yours." : `Leaf ${progress.leaf} / 12`}
          <span>{progress.seeds} sunlight seeds found</span>
        </p>
        <div className={styles.actions}>
          {quiet ? (
            <button type="button" onClick={step} disabled={progress.won}>
              Next leaf →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (pausedRef.current ? resume() : pause())}
              disabled={progress.won}
            >
              {paused ? "Resume" : "Pause"}
            </button>
          )}
          <button type="button" onClick={reset}>
            Start over
          </button>
        </div>
      </div>
      {!quiet && (
        <div className={styles.touchControls} aria-label="Steering controls">
          {([-1, 1] as const).map((direction) => (
            <button
              type="button"
              key={direction}
              aria-label={direction < 0 ? "Steer left" : "Steer right"}
              onPointerDown={(e) => {
                e.currentTarget.setPointerCapture(e.pointerId);
                input.current = direction;
              }}
              onPointerUp={() => {
                input.current = 0;
              }}
              onPointerCancel={clearInput}
              onLostPointerCapture={clearInput}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  input.current = direction;
                }
              }}
              onKeyUp={() => {
                input.current = 0;
              }}
              onBlur={clearInput}
            >
              {direction < 0 ? "←" : "→"}
            </button>
          ))}
        </div>
      )}
      <p className={styles.instructions} id="canopy-instructions">
        {quiet
          ? "A still version of the garden. Each step finds the next leaf, with no continuous movement."
          : "← → or A / D to steer · Space to pause · Escape to leave. A missed leaf brings you gently back to your last landing."}
      </p>
      <p className={styles.srOnly} role="status" aria-live="polite">
        {ready && progress.won
          ? "You found the canopy. All twelve leaves reached."
          : paused
            ? "Garden paused."
            : quiet
              ? "Still garden mode enabled."
              : ""}
      </p>
    </div>
  );
}
