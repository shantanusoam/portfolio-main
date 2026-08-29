import { clampUnit, type SignalPulseTone } from "./pulseField";

export const LIVING_CANVAS_PULSE_EVENT = "portfolio:living-canvas-pulse";

export type LivingCanvasPulseSource =
  "string" | "card" | "control" | "creature";

export interface LivingCanvasPulseDetail {
  x: number;
  y: number;
  intensity: number;
  tone: SignalPulseTone;
  source: LivingCanvasPulseSource;
}

export interface DispatchLivingCanvasPulseOptions {
  clientX: number;
  clientY: number;
  intensity?: number;
  tone?: SignalPulseTone;
  source?: LivingCanvasPulseSource;
}

export function dispatchLivingCanvasPulse({
  clientX,
  clientY,
  intensity = 0.7,
  tone = "warm",
  source = "control",
}: DispatchLivingCanvasPulseOptions): void {
  if (typeof window === "undefined") return;
  const width = Math.max(1, window.innerWidth);
  const height = Math.max(1, window.innerHeight);
  const detail: LivingCanvasPulseDetail = {
    x: clampUnit(clientX / width),
    y: clampUnit(clientY / height),
    intensity: clampUnit(intensity),
    tone,
    source,
  };

  window.dispatchEvent(
    new CustomEvent<LivingCanvasPulseDetail>(LIVING_CANVAS_PULSE_EVENT, {
      detail,
    }),
  );
}
