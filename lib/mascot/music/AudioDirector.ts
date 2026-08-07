import { clamp } from "../core/NumericGuards";
import { VisibilityController } from "../input/VisibilityController";
import { MASCOT_CONFIG } from "../MascotConfig";
import { EffectsBus } from "./EffectsBus";
import type { MascotQuality } from "../types";

/**
 * Owns the mascot's own, independent `AudioContext` and the safe output
 * graph every voice connects into:
 *
 * ```text
 * voice -> (dry bus) -----------------> compressor -> master gain -> destination
 *          (wet send, optional) -> EffectsBus -----^
 * ```
 *
 * The dry bus and the effects bus's wet output both converge into the
 * compressor *before* master gain, so muting/volume always covers 100% of
 * output regardless of path (a deliberate output-safety property — see
 * docs/mascot/AUDIO_ARCHITECTURE.md).
 *
 * The `AudioContext` is created lazily, only inside `activate()` — never at
 * module load or component mount. Callers must only invoke `activate()` from
 * a real user-gesture handler (see `AudioGestureGate`).
 *
 * This is a completely separate instance from the hand-played hero
 * instrument's own `AudioContext`
 * (components/IntrectiveComponents/StringInstrument.tsx) — they are never
 * shared or reached into.
 */

type AudioContextCtor = typeof AudioContext;

function resolveAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const withWebkit = window as typeof window & {
    webkitAudioContext?: AudioContextCtor;
  };
  return withWebkit.AudioContext ?? withWebkit.webkitAudioContext ?? null;
}

export interface AudioDirectorOptions {
  /** Share an existing VisibilityController (e.g. MascotEngine's) instead of registering a second document-level listener. */
  visibility?: VisibilityController;
  masterVolume?: number;
  quality?: MascotQuality;
}

export class AudioDirector {
  private context: AudioContext | null = null;
  private dryBus: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private masterGain: GainNode | null = null;
  private effectsBus: EffectsBus | null = null;
  private quality: MascotQuality;

  private muted = false;
  private masterVolume: number;
  private unsupported = false;
  private activating: Promise<void> | null = null;

  private readonly visibility: VisibilityController;
  private readonly ownsVisibility: boolean;
  private unsubscribeVisibility: (() => void) | null = null;
  private suspendedByVisibility = false;

  constructor(options: AudioDirectorOptions = {}) {
    this.masterVolume = clamp(
      options.masterVolume ?? MASCOT_CONFIG.audio.masterVolumeDefault,
      0,
      1,
    );
    this.quality = options.quality ?? "medium";

    if (options.visibility) {
      this.visibility = options.visibility;
      this.ownsVisibility = false;
    } else {
      this.visibility = new VisibilityController();
      this.visibility.attach();
      this.ownsVisibility = true;
    }
    this.unsubscribeVisibility = this.visibility.onVisibilityChange((visible) =>
      this.handleVisibilityChange(visible),
    );
  }

  /** Whether the platform exposes a usable `AudioContext` constructor at all. */
  isSupported(): boolean {
    if (this.unsupported) return false;
    return resolveAudioContextCtor() !== null;
  }

  /** True once a real, running `AudioContext` exists (post-activation, not hidden-tab-suspended). */
  isActive(): boolean {
    return this.context !== null && this.context.state === "running";
  }

  /**
   * Creates (first call) or resumes (subsequent calls / after hidden-tab
   * suspend) the `AudioContext`. MUST only be called from inside a real
   * user-gesture handler — see `AudioGestureGate`, which is the intended
   * caller. Never throws; resolves even when unsupported or resume fails,
   * leaving `isActive()` false so callers can fail silently and stay muted.
   */
  activate(): Promise<void> {
    if (this.activating) return this.activating;
    this.activating = this.doActivate().finally(() => {
      this.activating = null;
    });
    return this.activating;
  }

  private async doActivate(): Promise<void> {
    if (this.unsupported) return;

    if (!this.context) {
      const Ctor = resolveAudioContextCtor();
      if (!Ctor) {
        this.unsupported = true;
        return;
      }
      try {
        this.context = new Ctor();
      } catch {
        this.unsupported = true;
        this.context = null;
        return;
      }
      this.buildGraph(this.context);
    }

    if (this.context.state === "suspended") {
      try {
        await this.context.resume();
      } catch {
        // Resume can fail outside a real gesture in some browsers; the
        // caller stays silent/muted rather than throwing.
      }
    }
  }

  private buildGraph(context: AudioContext): void {
    this.dryBus = context.createGain();
    this.dryBus.gain.value = 1;

    this.compressor = context.createDynamicsCompressor();
    const c = MASCOT_CONFIG.audio.compressor;
    this.compressor.threshold.setValueAtTime(
      c.thresholdDb,
      context.currentTime,
    );
    this.compressor.knee.setValueAtTime(c.kneeDb, context.currentTime);
    this.compressor.ratio.setValueAtTime(c.ratio, context.currentTime);
    this.compressor.attack.setValueAtTime(c.attackSeconds, context.currentTime);
    this.compressor.release.setValueAtTime(
      c.releaseSeconds,
      context.currentTime,
    );

    this.masterGain = context.createGain();
    this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;

    this.dryBus.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(context.destination);

    this.effectsBus = new EffectsBus({
      context,
      destination: this.compressor,
      quality: this.quality,
    });
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyGain();
  }

  isMuted(): boolean {
    return this.muted;
  }

  setMasterVolume(value: number): void {
    this.masterVolume = clamp(value, 0, 1);
    this.applyGain();
  }

  getMasterVolume(): number {
    return this.masterVolume;
  }

  setQuality(quality: MascotQuality): void {
    this.quality = quality;
    this.effectsBus?.setQuality(quality);
  }

  private applyGain(): void {
    if (!this.masterGain || !this.context) return;
    const target = this.muted ? 0 : this.masterVolume;
    const now = this.context.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(
      target,
      now,
      MASCOT_CONFIG.audio.masterVolumeSmoothingSeconds,
    );
  }

  /** The node voices should connect to instead of `context.destination` directly (the pre-compressor dry bus). Throws only if called before `activate()` has succeeded — callers must check `isActive()`/`getContext()` first. */
  getMasterDestination(): AudioNode {
    if (!this.dryBus) {
      throw new Error(
        "AudioDirector: call activate() before requesting the master destination.",
      );
    }
    return this.dryBus;
  }

  /** The optional wet-effects send input, or null when unsupported/inactive/gated off by quality. */
  getEffectsSend(): AudioNode | null {
    return this.effectsBus?.getSendInput() ?? null;
  }

  /** The live `AudioContext`, or null before activation / when unsupported. */
  getContext(): AudioContext | null {
    return this.context;
  }

  private handleVisibilityChange(visible: boolean): void {
    if (!this.context) return;
    if (!visible) {
      if (this.context.state === "running") {
        this.suspendedByVisibility = true;
        this.context.suspend().catch(() => undefined);
      }
      return;
    }
    if (this.suspendedByVisibility && this.context.state === "suspended") {
      this.suspendedByVisibility = false;
      this.context.resume().catch(() => undefined);
    }
  }

  destroy(): void {
    if (this.unsubscribeVisibility) {
      this.unsubscribeVisibility();
      this.unsubscribeVisibility = null;
    }
    if (this.ownsVisibility) this.visibility.detach();

    this.effectsBus?.destroy();
    this.effectsBus = null;
    this.dryBus?.disconnect();
    this.compressor?.disconnect();
    this.masterGain?.disconnect();
    this.dryBus = null;
    this.compressor = null;
    this.masterGain = null;

    if (this.context) {
      this.context.close().catch(() => undefined);
      this.context = null;
    }
  }
}
