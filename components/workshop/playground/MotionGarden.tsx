"use client";
import { useEffect, useRef, useState } from "react";
import { SecondOrderDynamics } from "@/lib/mascot/motion/SecondOrderDynamics";
import { subscribe, wake } from "../cinema/motion";
import { createFlock, stepFlock, type FlockMode } from "./flock";
import styles from "./MotionGarden.module.css";

export default function MotionGarden() {
  const stage = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null);
  const seeds = useRef(createFlock());
  const target = useRef({ x: 500, y: 250 });
  const mode = useRef<FlockMode>("release");
  const elapsed = useRef(0);
  const [started, setStarted] = useState(false),
    [playing, setPlaying] = useState(false),
    [quiet, setQuiet] = useState(false),
    [choice, setChoice] = useState<FlockMode>("release");
  const [visible, setVisible] = useState(false),
    [hidden, setHidden] = useState(false),
    [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const root = document.querySelector(".workshop-home");
    const media = matchMedia("(prefers-reduced-motion:reduce)");
    const preference = () =>
      setQuiet(media.matches || root?.getAttribute("data-motion") === "quiet");
    preference();
    media.addEventListener("change", preference);
    const mutation = new MutationObserver(preference);
    if (root)
      mutation.observe(root, {
        attributes: true,
        attributeFilter: ["data-motion"],
      });
    const intersection = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
      { threshold: 0.05 },
    );
    intersection.observe(el);
    const otherExperiment = (event: Event) => {
      if ((event as CustomEvent<{ id: string }>).detail?.id !== "motion-garden")
        setPlaying(false);
    };
    window.addEventListener("portfolio:playground-start", otherExperiment);
    const visibility = () => setHidden(document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => {
      media.removeEventListener("change", preference);
      mutation.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("portfolio:playground-start", otherExperiment);
    };
  }, []);
  useEffect(() => {
    const el = canvas.current;
    if (!el || !started) return;
    const ctx = el.getContext("2d");
    if (!ctx) {
      setUnavailable(true);
      return;
    }
    let width = 1,
      height = 1,
      last = 0;
    const sx = new SecondOrderDynamics(
        { frequency: 0.6, damping: 1, response: 0 },
        target.current.x,
      ),
      sy = new SecondOrderDynamics(
        { frequency: 0.6, damping: 1, response: 0 },
        target.current.y,
      );
    const paint = () => {
      const dpr = el.width / width;
      ctx.setTransform((dpr * width) / 1000, 0, 0, (dpr * height) / 500, 0, 0);
      ctx.fillStyle = "#102a21";
      ctx.fillRect(0, 0, 1000, 500);
      const light = ctx.createRadialGradient(500, 220, 20, 500, 220, 500);
      light.addColorStop(0, "#d3dba916");
      light.addColorStop(1, "#102a2100");
      ctx.fillStyle = light;
      ctx.fillRect(0, 0, 1000, 500);
      ctx.strokeStyle = "#d8e4b512";
      ctx.lineWidth = 1;
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.ellipse(500, 250, 140 + i * 65, 65 + i * 36, -0.1, 0, Math.PI * 2);
        ctx.stroke();
      }
      const point = target.current;
      ctx.strokeStyle = "#e9dca94a";
      ctx.beginPath();
      ctx.moveTo(point.x - 5, point.y);
      ctx.lineTo(point.x + 5, point.y);
      ctx.moveTo(point.x, point.y - 5);
      ctx.lineTo(point.x, point.y + 5);
      ctx.stroke();
      seeds.current.forEach((seed, i) => {
        const angle = Math.atan2(seed.vy, seed.vx),
          sway = Math.sin(elapsed.current * 2 + seed.phase) * 0.12;
        ctx.save();
        ctx.translate(seed.x, seed.y);
        ctx.rotate(angle + sway);
        ctx.strokeStyle = "#c4d5aa55";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.moveTo(-18, Math.sin(seed.phase + elapsed.current) * 3);
        ctx.quadraticCurveTo(-10, 0, -2, 0);
        ctx.stroke();
        ctx.fillStyle = i % 6 === 0 ? "#f3dca3" : "#d5e2b9";
        ctx.beginPath();
        ctx.moveTo(11, 0);
        ctx.bezierCurveTo(1, -9, -8, -8, -9, 0);
        ctx.bezierCurveTo(-5, 7, 5, 6, 11, 0);
        ctx.fill();
        ctx.strokeStyle = "#244737";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-7, 0);
        ctx.lineTo(7, 0);
        ctx.stroke();
        ctx.restore();
      });
    };
    const resize = () => {
      const r = el.getBoundingClientRect();
      width = Math.max(1, r.width);
      height = Math.max(1, r.height);
      const dpr = Math.min(devicePixelRatio || 1, 1.5);
      el.width = Math.round(width * dpr);
      el.height = Math.round(height * dpr);
      paint();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(el);
    resize();
    const running = playing && visible && !hidden && !quiet;
    const off = running
      ? subscribe(({ time }) => {
          const dt = last ? Math.min((time - last) / 1000, 1 / 30) : 1 / 60;
          last = time;
          elapsed.current += dt;
          const smooth = {
            x: sx.update(dt, target.current.x),
            y: sy.update(dt, target.current.y),
          };
          stepFlock(seeds.current, dt, smooth, mode.current, elapsed.current);
          paint();
          wake(80);
        })
      : () => {};
    return () => {
      off();
      observer.disconnect();
    };
  }, [started, playing, visible, hidden, quiet]);
  const start = () => {
    window.dispatchEvent(
      new CustomEvent("portfolio:playground-start", {
        detail: { id: "motion-garden" },
      }),
    );
    setStarted(true);
    setPlaying(true);
    requestAnimationFrame(() => stage.current?.focus());
  };
  const setMode = (value: FlockMode) => {
    mode.current = value;
    setChoice(value);
    wake();
  };
  const reset = () => {
    seeds.current = createFlock();
    elapsed.current = 0;
    target.current = { x: 500, y: 250 };
    setMode("release");
    setStarted(false);
    setPlaying(false);
    stage.current?.focus();
  };
  return (
    <section className={styles.garden} aria-labelledby="motion-garden-title">
      <div className={styles.heading}>
        <div>
          <p className={styles.eyebrow}>A living sketch</p>
          <h3 id="motion-garden-title">
            A little room to <em>flow.</em>
          </h3>
        </div>
        <span className={styles.tag}>Steering · springs · shared rhythm</span>
      </div>
      <div
        ref={stage}
        className={styles.stage}
        tabIndex={started ? 0 : -1}
        role="group"
        aria-label="Interactive seed flock"
        aria-describedby="motion-garden-instructions"
        onPointerMove={(event) => {
          if (!started || !playing) return;
          const r = event.currentTarget.getBoundingClientRect();
          target.current = {
            x: ((event.clientX - r.left) / r.width) * 1000,
            y: ((event.clientY - r.top) / r.height) * 500,
          };
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || !started) return;
          const moves: Record<string, [number, number]> = {
            ArrowLeft: [-40, 0],
            ArrowRight: [40, 0],
            ArrowUp: [0, -35],
            ArrowDown: [0, 35],
          };
          if (moves[event.key]) {
            event.preventDefault();
            target.current = {
              x: Math.max(
                90,
                Math.min(910, target.current.x + moves[event.key][0]),
              ),
              y: Math.max(
                80,
                Math.min(420, target.current.y + moves[event.key][1]),
              ),
            };
          }
          if (event.code === "Space") {
            event.preventDefault();
            if (event.repeat) return;
            if (playing) setPlaying(false);
            else start();
          }
        }}
      >
        {started ? (
          <canvas ref={canvas} aria-hidden="true" />
        ) : (
          <svg
            viewBox="0 0 1000 500"
            className={styles.preview}
            aria-hidden="true"
          >
            <defs>
              <radialGradient id="garden-glow">
                <stop stopColor="#74845a" stopOpacity=".2" />
                <stop offset="1" stopColor="#102a21" stopOpacity="0" />
              </radialGradient>
            </defs>
            <rect width="1000" height="500" fill="#102a21" />
            <ellipse
              cx="500"
              cy="250"
              rx="400"
              ry="230"
              fill="url(#garden-glow)"
            />
            {[0, 1, 2, 3].map((i) => (
              <ellipse
                key={i}
                cx="500"
                cy="250"
                rx={140 + i * 65}
                ry={65 + i * 36}
                fill="none"
                stroke="#d8e4b512"
              />
            ))}
            {createFlock(30).map((seed, i) => (
              <path
                key={i}
                d="M 11 0 C 1 -9 -8 -8 -9 0 C -5 7 5 6 11 0"
                fill={i % 6 === 0 ? "#f3dca3" : "#d5e2b9"}
                transform={`translate(${seed.x} ${seed.y}) rotate(${
                  i * 137.5
                })`}
              />
            ))}
          </svg>
        )}
        {!started && (
          <div className={styles.invitation}>
            <span>
              One small movement.
              <br />A shared direction.
            </span>
            <button
              type="button"
              disabled={quiet}
              onClick={() => {
                start();
              }}
            >
              Let it grow <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
        {started && (!playing || quiet || hidden) && (
          <span className={styles.paused}>
            {quiet ? "Stillness, by preference." : "Taking a breath."}
          </span>
        )}
      </div>
      <div className={styles.bottom}>
        <p id="motion-garden-instructions">
          {quiet
            ? "Motion is off. The garden stays still."
            : started
              ? "Move or touch to guide the seeds. Arrow keys guide; Space pauses."
              : "A flock finding its way together. Start it when you have a moment."}
        </p>
        {started && (
          <div className={styles.controls}>
            <button
              type="button"
              aria-pressed={choice === "gather"}
              onClick={() => setMode("gather")}
            >
              Gather
            </button>
            <button
              type="button"
              aria-pressed={choice === "release"}
              onClick={() => setMode("release")}
            >
              Release
            </button>
            <button
              type="button"
              disabled={quiet}
              onClick={() => {
                if (playing) setPlaying(false);
                else start();
              }}
            >
              {playing ? "Pause" : "Resume"}
            </button>
            <button type="button" onClick={reset}>
              Reset
            </button>
          </div>
        )}
      </div>
      {unavailable && (
        <p role="status">
          This browser cannot draw the garden. The rest of the portfolio is
          ready to explore.
        </p>
      )}
    </section>
  );
}
