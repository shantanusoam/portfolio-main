import { MASCOT_CONFIG } from "../MascotConfig";
import type { MascotQuality } from "../types";

/**
 * Optional, sparse reverb-ish send: a lightweight feedback delay network,
 * not a `ConvolverNode` — the spec explicitly allows "no reverb, or a
 * lightweight delay network" at low quality, and forbids requiring
 * convolution. Gated off entirely below "medium" quality.
 *
 * Not wired into `MascotPluckVoice` this pass (kept deliberately unused —
 * see docs/mascot/AUDIO_ARCHITECTURE.md's integration-points note) so a
 * later strum/harmony workstream can send lush multi-note phrases into it
 * without this pass needing to guess at the right wet levels for that case.
 */

/** Pure — no AudioContext needed — so it's directly unit-testable. */
export function shouldEnableEffects(quality: MascotQuality): boolean {
  return quality === "medium" || quality === "high";
}

export interface EffectsBusOptions {
  context: AudioContext;
  /** Node the wet signal should ultimately reach (typically AudioDirector's compressor input). */
  destination: AudioNode;
  quality: MascotQuality;
}

export class EffectsBus {
  private readonly context: AudioContext;
  private readonly destination: AudioNode;
  private sendGain: GainNode | null = null;
  private delay: DelayNode | null = null;
  private feedback: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private enabled = false;

  constructor(options: EffectsBusOptions) {
    this.context = options.context;
    this.destination = options.destination;
    this.setQuality(options.quality);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /** The node voices should connect a wet send to, or null when disabled (low/reduced quality, or unsupported). */
  getSendInput(): AudioNode | null {
    return this.sendGain;
  }

  setQuality(quality: MascotQuality): void {
    const shouldEnable = shouldEnableEffects(quality);
    if (shouldEnable === this.enabled) return;
    if (shouldEnable) {
      this.build();
    } else {
      this.teardown();
    }
  }

  private build(): void {
    const ctx = this.context;
    const cfg = MASCOT_CONFIG.audio.effects;

    this.sendGain = ctx.createGain();
    this.sendGain.gain.value = cfg.sendLevel;

    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = cfg.delaySeconds;

    this.feedback = ctx.createGain();
    this.feedback.gain.value = cfg.feedback;

    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = cfg.wetLevel;

    this.sendGain.connect(this.delay);
    this.delay.connect(this.feedback);
    this.feedback.connect(this.delay);
    this.delay.connect(this.wetGain);
    this.wetGain.connect(this.destination);

    this.enabled = true;
  }

  private teardown(): void {
    this.sendGain?.disconnect();
    this.delay?.disconnect();
    this.feedback?.disconnect();
    this.wetGain?.disconnect();
    this.sendGain = null;
    this.delay = null;
    this.feedback = null;
    this.wetGain = null;
    this.enabled = false;
  }

  destroy(): void {
    this.teardown();
  }
}
