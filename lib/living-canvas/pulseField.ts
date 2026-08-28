export const MAX_SIGNAL_PULSES = 4;
export const SIGNAL_PULSE_LIFETIME_SECONDS = 2.4;

export type SignalPulseTone = "warm" | "cool";

export interface SignalPulse {
  /** Normalized viewport X, left to right. */
  x: number;
  /** Normalized viewport Y, top to bottom. */
  y: number;
  age: number;
  intensity: number;
  tone: SignalPulseTone;
}

export interface SignalPulseInput {
  x: number;
  y: number;
  intensity?: number;
  tone?: SignalPulseTone;
}

export function clampUnit(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function createSignalPulse(input: SignalPulseInput): SignalPulse {
  return {
    x: clampUnit(input.x),
    y: clampUnit(input.y),
    age: 0,
    intensity: clampUnit(input.intensity ?? 0.7),
    tone: input.tone ?? "warm",
  };
}

export function pushSignalPulse(
  pulses: readonly SignalPulse[],
  pulse: SignalPulse,
  capacity = MAX_SIGNAL_PULSES,
): SignalPulse[] {
  const safeCapacity = Math.max(0, Math.floor(capacity));
  if (safeCapacity === 0) return [];
  return [...pulses, pulse].slice(-safeCapacity);
}

export function advanceSignalPulses(
  pulses: readonly SignalPulse[],
  deltaSeconds: number,
  lifetimeSeconds = SIGNAL_PULSE_LIFETIME_SECONDS,
): SignalPulse[] {
  const safeDelta = Number.isFinite(deltaSeconds)
    ? Math.max(0, deltaSeconds)
    : 0;
  const safeLifetime = Math.max(0.001, lifetimeSeconds);

  return pulses
    .map((pulse) => ({ ...pulse, age: pulse.age + safeDelta }))
    .filter((pulse) => pulse.age < safeLifetime);
}

/**
 * Packs four vec4s for the fragment shader. Y is flipped into WebGL's
 * bottom-left coordinate system and the intensity sign carries warm/cool.
 */
export function packSignalPulseUniforms(
  pulses: readonly SignalPulse[],
  capacity = MAX_SIGNAL_PULSES,
  target?: Float32Array,
): Float32Array {
  const safeCapacity = Math.max(0, Math.floor(capacity));
  const packed =
    target?.length === safeCapacity * 4
      ? target
      : new Float32Array(safeCapacity * 4);
  packed.fill(0);
  const visible = pulses.slice(-safeCapacity);

  visible.forEach((pulse, index) => {
    const offset = index * 4;
    packed[offset] = clampUnit(pulse.x);
    packed[offset + 1] = 1 - clampUnit(pulse.y);
    packed[offset + 2] = Math.max(0, pulse.age);
    packed[offset + 3] =
      clampUnit(pulse.intensity) * (pulse.tone === "cool" ? -1 : 1);
  });

  return packed;
}
