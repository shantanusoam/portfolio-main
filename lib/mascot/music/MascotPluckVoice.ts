import { clamp } from "../core/NumericGuards";
import { SeededRandom } from "../core/SeededRandom";
import { MASCOT_CONFIG } from "../MascotConfig";
import type { MascotQuality } from "../types";
import type { AudioDirector } from "./AudioDirector";
import { VoicePool } from "./VoicePool";

/**
 * The mascot's own small Karplus-Strong-style pre-rendered pluck voice
 * ("Prototype 2: pre-rendered procedural pluck buffers" in the upgrade
 * spec's AUDIO PROTOTYPE LADDER) — the same technique as this repo's
 * existing, tuned hand-played instrument
 * (components/IntrectiveComponents/stringSynth.ts's `createKarplusStrongBuffer`
 * + `playPhysicalString`), reimplemented independently here and connected to
 * the mascot's own `AudioDirector` bus instead of sharing that component's
 * graph or `AudioContext`.
 *
 * Public entry point for the not-yet-built string-contact/harmony layer:
 *
 * ```ts
 * pluckVoices.play({ frequency, intensity, pan });
 * ```
 *
 * `lib/mascot` must never call `Math.random()` — noise excitation uses the
 * repo's `SeededRandom` (mulberry32) with a fixed seed. This makes the
 * timbre deterministic and reproducible, not audibly random-feeling; that's
 * fine here since seed-per-note variety isn't a design goal for a short
 * decaying pluck.
 */

// --- pure, unit-testable pieces -------------------------------------------

export interface PluckRequest {
  frequency: number;
  /** 0-1 normalized intensity. Perceptually curved internally — do not pre-curve it. */
  intensity: number;
  /** -1 (left) to 1 (right). */
  pan: number;
}

export function clampFrequency(frequency: number): number {
  const { min, max } = MASCOT_CONFIG.audio.frequencyClamp;
  if (!Number.isFinite(frequency)) return min;
  return clamp(frequency, min, max);
}

export function clampPan(pan: number): number {
  if (!Number.isFinite(pan)) return 0;
  const limit = MASCOT_CONFIG.audio.panClamp;
  return clamp(pan, -limit, limit);
}

/** Concave perceptual curve (spec: "Do not map speed linearly to raw gain"), then floored so quiet contacts stay audible. */
export function perceptualIntensity(rawIntensity: number): number {
  const normalized = clamp(
    Number.isFinite(rawIntensity) ? rawIntensity : 0,
    0,
    1,
  );
  const curved = Math.pow(
    normalized,
    MASCOT_CONFIG.audio.velocityCurveExponent,
  );
  return clamp(curved, MASCOT_CONFIG.audio.minAudibleIntensity, 1);
}

/**
 * Renders one channel of Karplus-Strong pluck samples: a seeded-noise burst
 * for one period, then each later sample is a damped average of the
 * corresponding delayed samples — the same recurrence as `stringSynth.ts`,
 * reimplemented independently with a seeded RNG instead of `Math.random()`.
 * Pure — no `AudioContext` — so it's directly testable.
 */
export function renderKarplusStrongSamples(
  sampleRate: number,
  frequency: number,
  durationSeconds: number,
  rng: SeededRandom,
): Float32Array {
  const clampedFrequency = clampFrequency(frequency);
  const frameCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const samples = new Float32Array(frameCount);
  const period = Math.max(2, Math.round(sampleRate / clampedFrequency));
  const damping = clampedFrequency < 150 ? 0.997 : 0.994;

  for (let frame = 0; frame < Math.min(period, frameCount); frame += 1) {
    samples[frame] = rng.next() * 2 - 1;
  }

  for (let frame = period; frame < frameCount; frame += 1) {
    const delayed = frame - period;
    samples[frame] = damping * 0.5 * (samples[delayed] + samples[delayed + 1]);
  }

  return samples;
}

/** Bounded FIFO eviction: drops the oldest entry before insertion once `cache` is at `maxSize`. Pure/generic so it's testable without real `AudioBuffer`s. */
export function evictOldestIfAtCapacity<K, V>(
  cache: Map<K, V>,
  maxSize: number,
): void {
  if (maxSize <= 0 || cache.size < maxSize) return;
  const oldestKey = cache.keys().next().value;
  if (oldestKey !== undefined) cache.delete(oldestKey);
}

// --- the pool facade (needs a real AudioContext; not unit-tested) ---------

interface VoiceHandle {
  stop: () => void;
}

export interface MascotPluckVoicePoolOptions {
  director: AudioDirector;
  quality: MascotQuality;
  /** Fixed seed for the noise-excitation RNG — deterministic, not per-instance random. */
  seed?: number;
}

export class MascotPluckVoicePool {
  private readonly director: AudioDirector;
  private readonly noise: SeededRandom;
  private readonly bufferCache = new Map<number, AudioBuffer>();
  private readonly pendingTimers = new Set<ReturnType<typeof setTimeout>>();
  private pool: VoicePool<VoiceHandle>;

  constructor(options: MascotPluckVoicePoolOptions) {
    this.director = options.director;
    this.noise = new SeededRandom(options.seed ?? 1337);
    this.pool = new VoicePool<VoiceHandle>({
      capacity: MASCOT_CONFIG.audio.voicePoolCapacity[options.quality],
      stop: (handle) => handle.stop(),
    });
  }

  getCapacity(): number {
    return this.pool.getCapacity();
  }

  getActiveCount(): number {
    return this.pool.getActiveCount();
  }

  setQuality(quality: MascotQuality): void {
    const capacity = MASCOT_CONFIG.audio.voicePoolCapacity[quality];
    if (capacity === this.pool.getCapacity()) return;
    this.pool.clear();
    this.pool = new VoicePool<VoiceHandle>({
      capacity,
      stop: (handle) => handle.stop(),
    });
  }

  /**
   * Public entry point for the (not-yet-built) string-contact/harmony
   * layer: resolve a frequency from CHORDS, then call this. Silently no-ops
   * before sound activation, at zero capacity, or when Web Audio is
   * unsupported — never throws, never queues up sound to play later.
   */
  play({ frequency, intensity, pan }: PluckRequest): void {
    const context = this.director.getContext();
    if (!context || !this.director.isActive()) return;

    const reservation = this.pool.acquire();
    if (!reservation) return;

    const clampedFrequency = clampFrequency(frequency);
    const level = perceptualIntensity(intensity);
    const clampedPan = clampPan(pan);

    const buffer = this.getOrRenderBuffer(context, clampedFrequency);

    const now = context.currentTime;
    const startAt = now + MASCOT_CONFIG.audio.gestureSafetyOffsetSeconds;
    const stopAt = startAt + MASCOT_CONFIG.audio.bufferDurationSeconds;

    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const gain = context.createGain();
    const panner = context.createStereoPanner();

    source.buffer = buffer;
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(
      Math.min(1200 + level * 3600, context.sampleRate * 0.4),
      startAt,
    );
    filter.frequency.setTargetAtTime(900, startAt + 0.02, 0.45);
    filter.Q.value = 0.55;

    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, 0.22 * level),
      startAt + MASCOT_CONFIG.audio.attackSeconds,
    );
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      startAt + MASCOT_CONFIG.audio.releaseTailSeconds,
    );

    panner.pan.value = clampedPan;

    source.connect(filter).connect(gain).connect(panner);
    panner.connect(this.director.getMasterDestination());

    this.pool.assign(reservation.id, {
      stop: () => {
        try {
          source.stop();
        } catch {
          // Already stopped/ended — nothing to clean up here.
        }
      },
    });

    source.start(startAt);
    source.stop(stopAt);

    const releaseDelayMs = Math.max(
      0,
      (MASCOT_CONFIG.audio.attackSeconds +
        MASCOT_CONFIG.audio.gestureSafetyOffsetSeconds) *
        1000,
    );
    const releaseTimer = setTimeout(() => {
      this.pendingTimers.delete(releaseTimer);
      this.pool.release(reservation.id);
    }, releaseDelayMs);
    this.pendingTimers.add(releaseTimer);

    source.addEventListener("ended", () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      panner.disconnect();
      this.pool.free(reservation.id);
    });
  }

  private getOrRenderBuffer(
    context: AudioContext,
    frequency: number,
  ): AudioBuffer {
    const cacheKey = Math.round(frequency * 100);
    const cached = this.bufferCache.get(cacheKey);
    if (cached) return cached;

    evictOldestIfAtCapacity(
      this.bufferCache,
      MASCOT_CONFIG.audio.bufferCacheMaxSize,
    );

    const duration = MASCOT_CONFIG.audio.bufferDurationSeconds;
    const buffer = context.createBuffer(
      1,
      Math.max(1, Math.floor(context.sampleRate * duration)),
      context.sampleRate,
    );
    const samples = renderKarplusStrongSamples(
      context.sampleRate,
      frequency,
      duration,
      this.noise,
    );
    buffer.getChannelData(0).set(samples);
    this.bufferCache.set(cacheKey, buffer);
    return buffer;
  }

  destroy(): void {
    this.pendingTimers.forEach((timer) => clearTimeout(timer));
    this.pendingTimers.clear();
    this.pool.clear();
    this.bufferCache.clear();
  }
}
