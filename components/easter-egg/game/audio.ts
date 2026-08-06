import type { SfxKind } from "./types";

type ToneLayer = {
  delay?: number;
  detune?: boolean;
  duration: number;
  freq: number;
  gain: number;
  reverb?: boolean;
  toFreq?: number;
  type: OscillatorType;
};

type NoiseLayer = {
  delay?: number;
  duration: number;
  filterFreq?: number;
  gain: number;
  kind: "noise";
  reverb?: boolean;
};

type SfxLayer = NoiseLayer | ToneLayer;

function isNoise(layer: SfxLayer): layer is NoiseLayer {
  return (layer as NoiseLayer).kind === "noise";
}

const RECIPES: Record<SfxKind, SfxLayer[]> = {
  bossPhase: [
    { duration: 0.42, freq: 220, gain: 0.09, reverb: true, toFreq: 60, type: "sawtooth" },
    { delay: 0.05, detune: true, duration: 0.3, freq: 440, gain: 0.05, reverb: true, toFreq: 110, type: "square" },
  ],
  bossWarning: [
    { duration: 0.16, freq: 440, gain: 0.07, reverb: true, toFreq: 440, type: "square" },
    { delay: 0.22, duration: 0.16, freq: 330, gain: 0.07, reverb: true, toFreq: 330, type: "square" },
    { delay: 0.44, duration: 0.16, freq: 440, gain: 0.07, reverb: true, toFreq: 440, type: "square" },
  ],
  comboUp: [
    { duration: 0.05, freq: 600, gain: 0.04, toFreq: 620, type: "triangle" },
    { delay: 0.05, duration: 0.06, freq: 760, gain: 0.045, toFreq: 780, type: "triangle" },
  ],
  enemyDeath: [
    { duration: 0.18, freq: 320, gain: 0.05, toFreq: 70, type: "sawtooth" },
    { duration: 0.1, filterFreq: 1400, gain: 0.03, kind: "noise" },
  ],
  enemyHit: [{ duration: 0.04, freq: 340, gain: 0.028, toFreq: 220, type: "square" }],
  gameOver: [
    { duration: 0.18, freq: 440, gain: 0.06, reverb: true, toFreq: 420, type: "triangle" },
    { delay: 0.18, duration: 0.18, freq: 392, gain: 0.06, reverb: true, toFreq: 370, type: "triangle" },
    { delay: 0.36, duration: 0.18, freq: 330, gain: 0.06, reverb: true, toFreq: 310, type: "triangle" },
    { delay: 0.54, detune: true, duration: 0.32, freq: 220, gain: 0.07, reverb: true, toFreq: 140, type: "triangle" },
  ],
  graze: [{ duration: 0.03, freq: 1200, gain: 0.018, toFreq: 1400, type: "sine" }],
  missileExplode: [
    { duration: 0.32, filterFreq: 1200, gain: 0.09, kind: "noise", reverb: true },
    { duration: 0.3, freq: 90, gain: 0.08, toFreq: 28, type: "sawtooth" },
  ],
  pickup: [{ duration: 0.14, freq: 520, gain: 0.05, toFreq: 920, type: "triangle" }],
  playerDamage: [
    { duration: 0.24, filterFreq: 900, gain: 0.07, kind: "noise" },
    { duration: 0.24, freq: 180, gain: 0.08, toFreq: 65, type: "sawtooth" },
  ],
  shieldImpact: [{ duration: 0.12, freq: 900, gain: 0.05, toFreq: 560, type: "triangle" }],
  shootBomb: [
    { duration: 0.2, filterFreq: 420, gain: 0.06, kind: "noise" },
    { duration: 0.24, freq: 150, gain: 0.055, toFreq: 62, type: "triangle" },
  ],
  shootLaser: [
    { duration: 0.11, freq: 900, gain: 0.04, toFreq: 1500, type: "sawtooth" },
    { duration: 0.11, filterFreq: 2400, gain: 0.02, kind: "noise" },
  ],
  shootMissile: [
    { duration: 0.16, filterFreq: 500, gain: 0.05, kind: "noise" },
    { duration: 0.16, freq: 100, gain: 0.05, toFreq: 55, type: "sine" },
  ],
  shootPulse: [{ duration: 0.08, freq: 520, gain: 0.045, toFreq: 300, type: "square" }],
  shootRapid: [{ duration: 0.045, freq: 700, gain: 0.03, toFreq: 480, type: "square" }],
  shootSpread: [
    { duration: 0.07, freq: 480, gain: 0.035, toFreq: 340, type: "square" },
    { delay: 0.01, duration: 0.07, freq: 560, gain: 0.03, toFreq: 380, type: "square" },
  ],
  superActivate: [
    { duration: 0.5, filterFreq: 1800, gain: 0.09, kind: "noise", reverb: true },
    { duration: 0.55, detune: true, freq: 130, gain: 0.09, reverb: true, toFreq: 340, type: "sawtooth" },
    { delay: 0.08, duration: 0.4, freq: 660, gain: 0.05, reverb: true, toFreq: 990, type: "triangle" },
  ],
  superReady: [
    { duration: 0.09, freq: 660, gain: 0.045, toFreq: 660, type: "triangle" },
    { delay: 0.09, duration: 0.09, freq: 880, gain: 0.045, toFreq: 880, type: "triangle" },
    { delay: 0.18, duration: 0.14, freq: 1100, gain: 0.05, toFreq: 1100, type: "triangle" },
  ],
  weaponSwitch: [{ duration: 0.06, freq: 800, gain: 0.035, toFreq: 1000, type: "square" }],
};

// Sounds that repeat rapidly (weapon fire, hits, grazes) get a small random
// pitch jitter per play so a burst of the same sound doesn't turn into a
// robotic machine-gun loop — a standard game-audio trick for ear fatigue.
const JITTER_KINDS = new Set<SfxKind>([
  "enemyHit",
  "graze",
  "shootLaser",
  "shootPulse",
  "shootRapid",
  "shootSpread",
]);

export type AudioEngine = {
  getMuted: () => boolean;
  play: (kind: SfxKind) => void;
  setAmbience: (active: boolean) => void;
  setMuted: (value: boolean) => void;
};

export function createAudioEngine(initialMuted: boolean): AudioEngine {
  let muted = initialMuted;
  let ctx: AudioContext | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  let reverbSend: { convolver: ConvolverNode; input: AudioNode } | null = null;
  let activeVoices = 0;
  const MAX_VOICES = 14;

  let ambienceActive = false;
  let ambienceNodes: {
    filter: BiquadFilterNode;
    gains: GainNode[];
    lfo: OscillatorNode;
    oscillators: OscillatorNode[];
  } | null = null;

  function ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (ctx) return ctx;
    const Ctor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    try {
      ctx = new Ctor();
    } catch {
      return null;
    }
    return ctx;
  }

  function getNoiseBuffer(context: AudioContext): AudioBuffer {
    if (noiseBuffer) return noiseBuffer;
    const length = Math.floor(context.sampleRate * 0.3);
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  /** Shared send bus: a synthetic decaying-noise impulse response gives
   * "boss room" depth to dramatic moments without loading any audio file. */
  function getReverbSend(context: AudioContext) {
    if (reverbSend) return reverbSend;
    const convolver = context.createConvolver();
    const length = Math.floor(context.sampleRate * 1.1);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel += 1) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i += 1) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.2;
      }
    }
    convolver.buffer = impulse;
    const wetGain = context.createGain();
    wetGain.gain.value = 0.32;
    convolver.connect(wetGain);
    wetGain.connect(context.destination);
    reverbSend = { convolver, input: convolver };
    return reverbSend;
  }

  function trackVoice(node: AudioScheduledSourceNode) {
    activeVoices += 1;
    node.addEventListener("ended", () => {
      activeVoices = Math.max(0, activeVoices - 1);
    });
  }

  function connectOut(context: AudioContext, gain: GainNode, reverb?: boolean) {
    gain.connect(context.destination);
    if (reverb) {
      gain.connect(getReverbSend(context).input);
    }
  }

  function playTone(context: AudioContext, layer: ToneLayer, jitter: number) {
    const now = context.currentTime + (layer.delay || 0);
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = layer.type;
    oscillator.frequency.setValueAtTime(layer.freq * jitter, now);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(30, (layer.toFreq ?? layer.freq) * jitter),
      now + layer.duration,
    );
    gain.gain.setValueAtTime(layer.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + layer.duration);
    oscillator.connect(gain);
    connectOut(context, gain, layer.reverb);
    oscillator.start(now);
    oscillator.stop(now + layer.duration + 0.02);
    trackVoice(oscillator);

    if (layer.detune) {
      const detuned = context.createOscillator();
      const detunedGain = context.createGain();
      detuned.type = layer.type;
      detuned.frequency.setValueAtTime(layer.freq * jitter * 1.006, now);
      detuned.frequency.exponentialRampToValueAtTime(
        Math.max(30, (layer.toFreq ?? layer.freq) * jitter * 1.006),
        now + layer.duration,
      );
      detunedGain.gain.setValueAtTime(layer.gain * 0.5, now);
      detunedGain.gain.exponentialRampToValueAtTime(0.0001, now + layer.duration);
      detuned.connect(detunedGain);
      connectOut(context, detunedGain, layer.reverb);
      detuned.start(now);
      detuned.stop(now + layer.duration + 0.02);
      trackVoice(detuned);
    }
  }

  function playNoise(context: AudioContext, layer: NoiseLayer) {
    const now = context.currentTime + (layer.delay || 0);
    const source = context.createBufferSource();
    source.buffer = getNoiseBuffer(context);
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = layer.filterFreq ?? 1500;
    const gain = context.createGain();
    gain.gain.setValueAtTime(layer.gain, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + layer.duration);
    source.connect(filter);
    filter.connect(gain);
    connectOut(context, gain, layer.reverb);
    source.start(now);
    source.stop(now + layer.duration + 0.02);
    trackVoice(source);
  }

  function play(kind: SfxKind) {
    if (muted) return;
    const context = ensureContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume().catch(() => undefined);
    }
    if (activeVoices >= MAX_VOICES) return;

    const jitter = JITTER_KINDS.has(kind) ? 1 + (Math.random() * 2 - 1) * 0.035 : 1;
    const recipe = RECIPES[kind];
    recipe.forEach((layer) => {
      if (activeVoices >= MAX_VOICES) return;
      if (isNoise(layer)) {
        playNoise(context, layer);
      } else {
        playTone(context, layer, jitter);
      }
    });
  }

  function startAmbience(context: AudioContext) {
    if (ambienceNodes) return;
    const master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(0.05, context.currentTime + 1.2);

    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    filter.connect(master);
    master.connect(context.destination);

    const lfo = context.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = 0.06;
    const lfoGain = context.createGain();
    lfoGain.gain.value = 260;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfo.start();

    const rootFreqs = [55, 82.5, 110];
    const oscillators = rootFreqs.map((freq, index) => {
      const osc = context.createOscillator();
      osc.type = index === 2 ? "triangle" : "sine";
      osc.frequency.value = freq;
      const voiceGain = context.createGain();
      voiceGain.gain.value = index === 0 ? 1 : 0.5;
      osc.connect(voiceGain);
      voiceGain.connect(filter);
      osc.start();
      return osc;
    });

    ambienceNodes = { filter, gains: [master], lfo, oscillators };
  }

  function stopAmbience() {
    if (!ambienceNodes) return;
    const { oscillators, lfo, gains } = ambienceNodes;
    const master = gains[0];
    const context = ctx;
    if (context) {
      master.gain.linearRampToValueAtTime(0, context.currentTime + 0.6);
      window.setTimeout(() => {
        oscillators.forEach((osc) => osc.stop());
        lfo.stop();
      }, 650);
    } else {
      oscillators.forEach((osc) => osc.stop());
      lfo.stop();
    }
    ambienceNodes = null;
  }

  function setAmbience(active: boolean) {
    ambienceActive = active;
    if (!active) {
      stopAmbience();
      return;
    }
    if (muted) return;
    const context = ensureContext();
    if (!context) return;
    if (context.state === "suspended") {
      context.resume().catch(() => undefined);
    }
    startAmbience(context);
  }

  return {
    getMuted: () => muted,
    play,
    setAmbience,
    setMuted: (value: boolean) => {
      muted = value;
      if (value) {
        stopAmbience();
      } else if (ambienceActive) {
        const context = ensureContext();
        if (context) startAmbience(context);
      }
    },
  };
}
