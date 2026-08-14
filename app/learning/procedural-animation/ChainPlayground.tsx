"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

export interface PlaygroundPreset {
  joints: number;
  segment: number;
  angle: number;
  damping: number;
  response: number;
  width: number;
  debug: boolean;
}

export interface ChainPlaygroundProps {
  preset: PlaygroundPreset;
  title: string;
}

interface Point {
  x: number;
  y: number;
  angle: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const wrapAngle = (value: number) => {
  let angle = value;
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

export default function ChainPlayground({ preset, title }: ChainPlaygroundProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(0);
  const requestFrameRef = useRef<(() => void) | null>(null);
  const pointerRef = useRef({ x: 0, y: 0, initialized: false });
  const [settings, setSettings] = useState(preset);
  const [running, setRunning] = useState(true);
  const [autoPilot, setAutoPilot] = useState(true);
  const [broken, setBroken] = useState(false);
  const settingsRef = useRef(settings);
  const runningRef = useRef(running);
  const autoPilotRef = useRef(autoPilot);

  settingsRef.current = settings;
  runningRef.current = running;
  autoPilotRef.current = autoPilot;

  useEffect(() => {
    setSettings(preset);
    setBroken(false);
  }, [preset]);

  useEffect(() => {
    // Wake a sleeping paused canvas for one redraw after a control changes;
    // while playing, the guarded scheduler already owns the next frame.
    requestFrameRef.current?.();
  }, [autoPilot, running, settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");
    if (!context) return undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) setRunning(false);

    let width = 1;
    let height = 1;
    let previous = performance.now();
    let elapsed = 0;
    const points: Point[] = [];
    const root = { x: 0, y: 0, vx: 0, vy: 0 };

    const resetChain = () => {
      const config = settingsRef.current;
      root.x = width * 0.48;
      root.y = height * 0.48;
      root.vx = 0;
      root.vy = 0;
      points.length = 0;
      for (let index = 0; index < config.joints; index += 1) {
        points.push({
          x: root.x - index * config.segment,
          y: root.y,
          angle: Math.PI,
        });
      }
      if (!pointerRef.current.initialized) {
        pointerRef.current = { x: width * 0.72, y: height * 0.42, initialized: true };
      }
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      resetChain();
      requestFrame();
    };

    const solveChain = () => {
      const config = settingsRef.current;
      if (points.length !== config.joints) resetChain();
      points[0].x = root.x;
      points[0].y = root.y;
      let previousAngle = Math.atan2(-root.vy || 0, -root.vx || -1);
      if (!Number.isFinite(previousAngle)) previousAngle = Math.PI;
      points[0].angle = previousAngle;
      const angleLimit = (config.angle * Math.PI) / 180;
      for (let index = 1; index < points.length; index += 1) {
        const parent = points[index - 1];
        const point = points[index];
        let angle = Math.atan2(point.y - parent.y, point.x - parent.x);
        const limit = angleLimit * (0.7 + (index / points.length) * 0.55);
        angle = previousAngle + clamp(wrapAngle(angle - previousAngle), -limit, limit);
        point.x = parent.x + Math.cos(angle) * config.segment;
        point.y = parent.y + Math.sin(angle) * config.segment;
        point.angle = angle;
        previousAngle = angle;
      }
    };

    const draw = () => {
      const config = settingsRef.current;
      context.clearRect(0, 0, width, height);
      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.45,
        10,
        width * 0.5,
        height * 0.45,
        width * 0.62,
      );
      gradient.addColorStop(0, "rgba(52, 113, 132, 0.16)");
      gradient.addColorStop(1, "rgba(5, 14, 23, 0)");
      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);

      const left: Point[] = [];
      const right: Point[] = [];
      for (let index = 0; index < points.length; index += 1) {
        const t = index / Math.max(1, points.length - 1);
        const tangent = points[Math.min(points.length - 1, index + 1)];
        const before = points[Math.max(0, index - 1)];
        const angle = Math.atan2(tangent.y - before.y, tangent.x - before.x);
        const bodyWidth =
          Math.sin(Math.pow(1 - t, 1.15) * Math.PI * 0.92) *
          config.width *
          (0.7 + (1 - t) * 0.3);
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        left.push({ x: points[index].x + nx * bodyWidth, y: points[index].y + ny * bodyWidth, angle });
        right.push({ x: points[index].x - nx * bodyWidth, y: points[index].y - ny * bodyWidth, angle });
      }

      context.save();
      context.fillStyle = "#4389a7";
      context.strokeStyle = "rgba(225, 248, 250, 0.76)";
      context.lineWidth = 1.25;
      context.beginPath();
      context.moveTo(left[0].x, left[0].y);
      for (let index = 1; index < left.length; index += 1) context.lineTo(left[index].x, left[index].y);
      for (let index = right.length - 1; index >= 0; index -= 1) context.lineTo(right[index].x, right[index].y);
      context.closePath();
      context.fill();
      context.stroke();

      const finIndex = Math.min(points.length - 1, Math.floor(points.length * 0.28));
      const fin = points[finIndex];
      context.fillStyle = "#8fd3df";
      context.beginPath();
      context.ellipse(fin.x, fin.y + config.width * 0.78, config.width * 0.48, config.width * 0.2, 0.7, 0, Math.PI * 2);
      context.fill();

      const heading = Math.atan2(root.vy || -1, root.vx || 0);
      const eyeX = root.x + Math.cos(heading) * 5;
      const eyeY = root.y + Math.sin(heading) * 5;
      context.fillStyle = "#f7feff";
      context.beginPath();
      context.arc(eyeX - Math.sin(heading) * config.width * 0.36, eyeY + Math.cos(heading) * config.width * 0.36, 2.7, 0, Math.PI * 2);
      context.arc(eyeX + Math.sin(heading) * config.width * 0.36, eyeY - Math.cos(heading) * config.width * 0.36, 2.7, 0, Math.PI * 2);
      context.fill();

      if (config.debug) {
        context.strokeStyle = "rgba(111, 238, 206, 0.72)";
        context.fillStyle = "#8ee8d3";
        context.lineWidth = 1;
        context.beginPath();
        context.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index += 1) context.lineTo(points[index].x, points[index].y);
        context.stroke();
        for (const point of points) {
          context.beginPath();
          context.arc(point.x, point.y, 1.7, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.restore();

      context.strokeStyle = autoPilotRef.current ? "rgba(126, 211, 225, 0.3)" : "rgba(234, 190, 112, 0.42)";
      context.lineWidth = 1;
      context.beginPath();
      context.arc(pointerRef.current.x, pointerRef.current.y, 8, 0, Math.PI * 2);
      context.stroke();
    };

    const frame = (time: number) => {
      frameRef.current = 0;
      const dt = Math.min(0.033, Math.max(0, (time - previous) / 1000));
      previous = time;
      elapsed += dt;
      if (runningRef.current) {
        const config = settingsRef.current;
        const target = autoPilotRef.current
          ? {
              x: width * 0.5 + Math.cos(elapsed * 0.78) * width * 0.28,
              y: height * 0.49 + Math.sin(elapsed * 1.13) * height * 0.26,
          }
          : pointerRef.current;
        if (autoPilotRef.current) pointerRef.current = { ...target, initialized: true };
        const stiffness = 15 + config.response * 36;
        root.vx += (target.x - root.x) * stiffness * dt;
        root.vy += (target.y - root.y) * stiffness * dt;
        const drag = Math.exp(-config.damping * 5.6 * dt);
        root.vx *= drag;
        root.vy *= drag;
        const maxSpeed = 290;
        const velocity = Math.hypot(root.vx, root.vy);
        if (velocity > maxSpeed) {
          root.vx *= maxSpeed / velocity;
          root.vy *= maxSpeed / velocity;
        }
        root.x = clamp(root.x + root.vx * dt, 34, width - 34);
        root.y = clamp(root.y + root.vy * dt, 34, height - 34);
        solveChain();
      }
      draw();
      if (runningRef.current) requestFrame();
    };

    const requestFrame = () => {
      if (frameRef.current === 0) {
        frameRef.current = window.requestAnimationFrame(frame);
      }
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    requestFrameRef.current = requestFrame;
    requestFrame();
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      requestFrameRef.current = null;
    };
  }, [preset]);

  const update = <K extends keyof PlaygroundPreset>(key: K, value: PlaygroundPreset[K]) => {
    setSettings((current) => ({ ...current, [key]: value }));
    setBroken(false);
  };

  const breakIt = () => {
    setSettings((current) => ({
      ...current,
      angle: 86,
      damping: 0.08,
      response: 1,
      segment: 15,
      debug: true,
    }));
    setRunning(true);
    setBroken(true);
  };

  const repair = () => {
    setSettings(preset);
    setBroken(false);
  };

  return (
    <section className={styles.playground} aria-label={`${title} interactive motion lab`}>
      <div className={styles.playgroundHead}>
        <div>
          <span>Live chain lab</span>
          <h3>{title}</h3>
        </div>
        <div className={styles.playgroundActions}>
          <button type="button" onClick={() => setRunning((value) => !value)}>{running ? "Pause" : "Play"}</button>
          <button type="button" onClick={() => setAutoPilot((value) => !value)}>{autoPilot ? "Take pointer control" : "Use autopilot"}</button>
          <button type="button" data-danger={broken} onClick={broken ? repair : breakIt}>{broken ? "Repair" : "Break it"}</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className={styles.playgroundCanvas}
        onPointerMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          pointerRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
            initialized: true,
          };
          if (autoPilot) setAutoPilot(false);
        }}
        aria-label="Animated fish driven by a constrained spine"
      />
      <div className={styles.playgroundControls}>
        <label><span>Joints</span><input type="range" min="5" max="30" value={settings.joints} onChange={(event) => update("joints", Number(event.target.value))} /><output>{settings.joints}</output></label>
        <label><span>Link length</span><input type="range" min="4" max="16" step="0.5" value={settings.segment} onChange={(event) => update("segment", Number(event.target.value))} /><output>{settings.segment}px</output></label>
        <label><span>Turn limit</span><input type="range" min="3" max="60" value={settings.angle} onChange={(event) => update("angle", Number(event.target.value))} /><output>{settings.angle}°</output></label>
        <label><span>Damping</span><input type="range" min="0.05" max="1.2" step="0.05" value={settings.damping} onChange={(event) => update("damping", Number(event.target.value))} /><output>{settings.damping.toFixed(2)}</output></label>
        <label><span>Response</span><input type="range" min="0.05" max="1" step="0.05" value={settings.response} onChange={(event) => update("response", Number(event.target.value))} /><output>{settings.response.toFixed(2)}</output></label>
        <label><span>Body width</span><input type="range" min="6" max="30" value={settings.width} onChange={(event) => update("width", Number(event.target.value))} /><output>{settings.width}px</output></label>
        <button type="button" className={styles.debugToggle} data-active={settings.debug} onClick={() => update("debug", !settings.debug)}>Rig overlay</button>
      </div>
      {broken ? <p className={styles.breakNote}>You removed the guardrails: huge links, loose turns and almost no damping. Notice the folding and overshoot—then repair it.</p> : null}
    </section>
  );
}
