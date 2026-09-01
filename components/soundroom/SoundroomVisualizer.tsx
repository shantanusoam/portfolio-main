"use client";

import { useEffect, useRef } from "react";
import type { SoundroomEngine } from "@/lib/audio/SoundroomEngine";
import type { EnergySnapshot, VisualizerMode } from "@/lib/audio/types";
import styles from "./Soundroom.module.css";

interface SoundroomVisualizerProps {
  engine: SoundroomEngine;
  mode: VisualizerMode;
  playing: boolean;
  reducedMotion: boolean;
  accent: string;
}

function accentWithAlpha(accent: string, alpha: number): string {
  const hex = accent.replace("#", "");
  if (hex.length !== 6) return `rgba(255,105,70,${alpha})`;
  const number = Number.parseInt(hex, 16);
  return `rgba(${(number >> 16) & 255},${(number >> 8) & 255},${number & 255},${alpha})`;
}

function clear(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  context.clearRect(0, 0, width, height);
  const gradient = context.createRadialGradient(
    width * 0.5,
    height * 0.46,
    0,
    width * 0.5,
    height * 0.46,
    Math.max(width, height) * 0.68,
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.035)");
  gradient.addColorStop(1, "rgba(0,0,0,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
}

function drawWave(
  context: CanvasRenderingContext2D,
  energy: EnergySnapshot,
  width: number,
  height: number,
  accent: string,
): void {
  context.beginPath();
  const middle = height * 0.5;
  const step = width / Math.max(1, energy.waveform.length - 1);
  for (let index = 0; index < energy.waveform.length; index += 1) {
    const normalized = (energy.waveform[index] - 128) / 128;
    const x = index * step;
    const y = middle + normalized * height * 0.34;
    if (index === 0) context.moveTo(x, y);
    else context.lineTo(x, y);
  }
  context.strokeStyle = accentWithAlpha(accent, 0.88);
  context.lineWidth = 1.4;
  context.shadowBlur = 16;
  context.shadowColor = accentWithAlpha(accent, 0.46);
  context.stroke();
  context.shadowBlur = 0;
}

function drawSpectrum(
  context: CanvasRenderingContext2D,
  energy: EnergySnapshot,
  width: number,
  height: number,
  accent: string,
): void {
  const columns = Math.min(72, Math.floor(width / 8));
  const gap = 3;
  const columnWidth = (width - gap * (columns - 1)) / columns;
  for (let index = 0; index < columns; index += 1) {
    const sourceIndex = Math.floor(
      (index / columns) ** 1.8 * energy.frequencyBins.length * 0.72,
    );
    const value = energy.frequencyBins[sourceIndex] / 255;
    const lineHeight = Math.max(1, value * height * 0.78);
    context.fillStyle = accentWithAlpha(accent, 0.18 + value * 0.66);
    context.fillRect(
      index * (columnWidth + gap),
      height - lineHeight,
      Math.max(1, columnWidth),
      lineHeight,
    );
  }
}

function drawStrings(
  context: CanvasRenderingContext2D,
  energy: EnergySnapshot,
  width: number,
  height: number,
  accent: string,
  phases: Float32Array,
  timestamp: number,
): void {
  const energies = [
    energy.bassEnergy,
    energy.lowMidEnergy,
    energy.midEnergy,
    energy.midEnergy * 0.72 + energy.highEnergy * 0.28,
    energy.highEnergy,
    energy.highEnergy * 0.7,
  ];
  for (let index = 0; index < phases.length; index += 1) {
    phases[index] +=
      (energies[index] - phases[index]) *
      (energies[index] > phases[index] ? 0.32 : 0.07);
    const y = ((index + 1) / (phases.length + 1)) * height;
    const amplitude = phases[index] * height * (0.1 + index * 0.008);
    context.beginPath();
    context.moveTo(0, y);
    const segments = 28;
    for (let segment = 1; segment <= segments; segment += 1) {
      const ratio = segment / segments;
      const envelope = Math.sin(ratio * Math.PI);
      const vibration =
        Math.sin(
          ratio * Math.PI * (2 + index * 0.22) +
            timestamp * (0.005 + index * 0.0006),
        ) *
        amplitude *
        envelope;
      context.lineTo(ratio * width, y + vibration);
    }
    context.strokeStyle = accentWithAlpha(accent, 0.25 + phases[index] * 0.68);
    context.lineWidth = index === 0 ? 1.8 : 1;
    context.stroke();
  }
}

function drawWater(
  context: CanvasRenderingContext2D,
  energy: EnergySnapshot,
  width: number,
  height: number,
  accent: string,
  timestamp: number,
): void {
  const centerX = width * (0.46 + Math.sin(timestamp * 0.00016) * 0.06);
  const centerY = height * 0.54;
  const count = 7;
  for (let index = 0; index < count; index += 1) {
    const phase = (((timestamp * 0.00012 + index / count) % 1) + 1) % 1;
    const radius =
      phase * Math.max(width, height) * (0.24 + energy.bassEnergy * 0.2);
    context.beginPath();
    context.ellipse(centerX, centerY, radius, radius * 0.34, 0, 0, Math.PI * 2);
    context.strokeStyle = accentWithAlpha(
      accent,
      (1 - phase) * (0.08 + energy.overallEnergy * 0.35),
    );
    context.lineWidth = 1 + energy.bassEnergy * 1.2;
    context.stroke();
  }
}

interface Particle {
  x: number;
  y: number;
  phase: number;
  size: number;
}

function drawParticles(
  context: CanvasRenderingContext2D,
  energy: EnergySnapshot,
  width: number,
  height: number,
  accent: string,
  particles: readonly Particle[],
  timestamp: number,
): void {
  for (const particle of particles) {
    const lift = energy.highEnergy * 42;
    const x =
      (particle.x * width +
        Math.sin(timestamp * 0.00022 + particle.phase) * 14) %
      width;
    const y =
      (particle.y * height -
        timestamp * 0.006 * (0.3 + energy.overallEnergy) -
        lift +
        height * 4) %
      height;
    context.beginPath();
    context.arc(x, y, particle.size + energy.highEnergy * 1.8, 0, Math.PI * 2);
    context.fillStyle = accentWithAlpha(accent, 0.12 + energy.highEnergy * 0.5);
    context.fill();
  }
}

export default function SoundroomVisualizer({
  engine,
  mode,
  playing,
  reducedMotion,
  accent,
}: SoundroomVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return undefined;

    let frame = 0;
    let visible = document.visibilityState === "visible";
    let width = 1;
    let height = 1;
    const phases = new Float32Array(6);
    const particleCount =
      navigator.hardwareConcurrency > 0 && navigator.hardwareConcurrency <= 4
        ? 26
        : 48;
    const particles: Particle[] = Array.from(
      { length: particleCount },
      (_, index) => ({
        x: ((index * 47) % 101) / 101,
        y: ((index * 73) % 103) / 103,
        phase: index * 1.618,
        size: 0.7 + (index % 4) * 0.38,
      }),
    );

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const paint = (timestamp: number) => {
      frame = 0;
      if (!visible) return;
      const energy = engine.getEnergySnapshot();
      clear(context, width, height);
      if (mode === "wave") drawWave(context, energy, width, height, accent);
      if (mode === "spectrum")
        drawSpectrum(context, energy, width, height, accent);
      if (mode === "strings")
        drawStrings(context, energy, width, height, accent, phases, timestamp);
      if (mode === "water")
        drawWater(context, energy, width, height, accent, timestamp);
      if (mode === "particles")
        drawParticles(
          context,
          energy,
          width,
          height,
          accent,
          particles,
          timestamp,
        );
      if (mode === "album") {
        drawWater(
          context,
          energy,
          width,
          height,
          accent,
          reducedMotion ? 0 : timestamp * 0.5,
        );
        drawStrings(
          context,
          energy,
          width,
          height,
          accent,
          phases,
          reducedMotion ? 0 : timestamp * 0.35,
        );
      }
      if (!reducedMotion && playing && mode !== "none") {
        frame = window.requestAnimationFrame(paint);
      }
    };

    const observer = new ResizeObserver(() => {
      resize();
      if (!frame) frame = window.requestAnimationFrame(paint);
    });
    const handleVisibility = () => {
      visible = document.visibilityState === "visible";
      if (!visible && frame) {
        window.cancelAnimationFrame(frame);
        frame = 0;
      } else if (visible && !frame) {
        frame = window.requestAnimationFrame(paint);
      }
    };

    resize();
    observer.observe(canvas);
    document.addEventListener("visibilitychange", handleVisibility);
    frame = window.requestAnimationFrame(paint);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [accent, engine, mode, playing, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.visualizerCanvas}
      aria-hidden="true"
      data-mode={mode}
    />
  );
}
