import { AudioAnalyser } from "./AudioAnalyser";
import type {
  EnergySnapshot,
  EqualizerSettings,
  SoundroomFilter,
} from "./types";

export interface AudioGraphCallbacks {
  onDuration(duration: number): void;
  onPosition(position: number): void;
  onPlayState(isPlaying: boolean): void;
  onEnded(): void;
  onError(message: string): void;
}

interface Deck {
  element: HTMLAudioElement;
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}

function rampParam(
  parameter: AudioParam,
  value: number,
  context: AudioContext,
  duration = 0.04,
): void {
  const now = context.currentTime;
  parameter.cancelScheduledValues(now);
  parameter.setValueAtTime(parameter.value, now);
  parameter.linearRampToValueAtTime(value, now + duration);
}

export class AudioGraph {
  private readonly context: AudioContext;
  private readonly decks: [Deck, Deck];
  private readonly lowShelf: BiquadFilterNode;
  private readonly midPeak: BiquadFilterNode;
  private readonly highShelf: BiquadFilterNode;
  private readonly characterFilter: BiquadFilterNode;
  private readonly analyserNode: AnalyserNode;
  private readonly masterGain: GainNode;
  private readonly analyser: AudioAnalyser;
  private activeDeck = 0;
  private hasTrack = false;
  private transitionTimer: number | null = null;
  private sessionGain = 1;
  private volume = 0.72;
  private muted = false;

  constructor(private readonly callbacks: AudioGraphCallbacks) {
    const AudioContextConstructor =
      window.AudioContext ??
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextConstructor) {
      throw new Error("Web Audio is not supported in this browser.");
    }
    this.context = new AudioContextConstructor();
    this.lowShelf = this.context.createBiquadFilter();
    this.midPeak = this.context.createBiquadFilter();
    this.highShelf = this.context.createBiquadFilter();
    this.characterFilter = this.context.createBiquadFilter();
    this.analyserNode = this.context.createAnalyser();
    this.masterGain = this.context.createGain();

    this.lowShelf.type = "lowshelf";
    this.lowShelf.frequency.value = 180;
    this.midPeak.type = "peaking";
    this.midPeak.frequency.value = 1_050;
    this.midPeak.Q.value = 0.72;
    this.highShelf.type = "highshelf";
    this.highShelf.frequency.value = 4_200;
    this.characterFilter.type = "allpass";

    this.lowShelf
      .connect(this.midPeak)
      .connect(this.highShelf)
      .connect(this.characterFilter)
      .connect(this.analyserNode)
      .connect(this.masterGain)
      .connect(this.context.destination);

    this.decks = [0, 1].map((index) => {
      const element = document.createElement("audio");
      element.preload = "metadata";
      element.setAttribute("playsinline", "");
      const source = this.context.createMediaElementSource(element);
      const gain = this.context.createGain();
      gain.gain.value = index === 0 ? 1 : 0;
      source.connect(gain).connect(this.lowShelf);
      return { element, source, gain };
    }) as [Deck, Deck];

    this.decks.forEach((deck, index) => {
      deck.element.addEventListener("loadedmetadata", () => {
        if (index !== this.activeDeck) return;
        this.callbacks.onDuration(
          Number.isFinite(deck.element.duration) ? deck.element.duration : 0,
        );
      });
      deck.element.addEventListener("timeupdate", () => {
        if (index !== this.activeDeck) return;
        this.callbacks.onPosition(deck.element.currentTime || 0);
      });
      deck.element.addEventListener("play", () => {
        if (index === this.activeDeck) this.callbacks.onPlayState(true);
      });
      deck.element.addEventListener("pause", () => {
        if (index === this.activeDeck) this.callbacks.onPlayState(false);
      });
      deck.element.addEventListener("ended", () => {
        if (index === this.activeDeck) this.callbacks.onEnded();
      });
      deck.element.addEventListener("error", () => {
        if (index !== this.activeDeck) return;
        this.callbacks.onError(
          "This file could not be decoded. The browser may not support its codec.",
        );
      });
    });

    this.analyser = new AudioAnalyser(
      this.analyserNode,
      this.context.sampleRate,
    );
  }

  async resume(): Promise<void> {
    if (this.context.state === "suspended") await this.context.resume();
  }

  async loadAndPlay(
    url: string,
    startPosition = 0,
    crossfadeSeconds = 0,
  ): Promise<void> {
    await this.resume();
    const previousIndex = this.activeDeck;
    const nextIndex = this.hasTrack
      ? previousIndex === 0
        ? 1
        : 0
      : previousIndex;
    const previous = this.decks[previousIndex];
    const next = this.decks[nextIndex];

    if (this.transitionTimer !== null) {
      window.clearTimeout(this.transitionTimer);
      this.transitionTimer = null;
    }

    next.element.pause();
    next.element.src = url;
    next.element.load();
    next.gain.gain.cancelScheduledValues(this.context.currentTime);
    next.gain.gain.value = this.hasTrack && crossfadeSeconds > 0 ? 0 : 1;
    this.activeDeck = nextIndex;
    this.hasTrack = true;

    const applyStartPosition = () => {
      if (startPosition > 0 && Number.isFinite(next.element.duration)) {
        next.element.currentTime = Math.min(
          startPosition,
          Math.max(0, next.element.duration - 0.2),
        );
      }
    };
    if (next.element.readyState >= 1) applyStartPosition();
    else
      next.element.addEventListener("loadedmetadata", applyStartPosition, {
        once: true,
      });

    try {
      await next.element.play();
    } catch {
      this.callbacks.onError(
        "Playback is waiting for a direct click. Select the track again to continue.",
      );
      throw new Error("Playback was blocked by the browser.");
    }

    if (nextIndex !== previousIndex) {
      const fade = Math.max(0, crossfadeSeconds);
      const now = this.context.currentTime;
      next.gain.gain.cancelScheduledValues(now);
      previous.gain.gain.cancelScheduledValues(now);
      if (fade > 0 && !previous.element.paused) {
        next.gain.gain.setValueAtTime(0, now);
        previous.gain.gain.setValueAtTime(previous.gain.gain.value, now);
        next.gain.gain.linearRampToValueAtTime(1, now + fade);
        previous.gain.gain.linearRampToValueAtTime(0, now + fade);
        this.transitionTimer = window.setTimeout(
          () => {
            previous.element.pause();
            previous.element.removeAttribute("src");
            previous.element.load();
            this.transitionTimer = null;
          },
          fade * 1000 + 80,
        );
      } else {
        previous.element.pause();
        previous.element.removeAttribute("src");
        previous.element.load();
        previous.gain.gain.value = 0;
        next.gain.gain.value = 1;
      }
    }
  }

  async play(): Promise<void> {
    if (!this.hasTrack) return;
    await this.resume();
    await this.decks[this.activeDeck].element.play();
  }

  pause(): void {
    this.decks[this.activeDeck].element.pause();
  }

  stop(): void {
    for (const deck of this.decks) {
      deck.element.pause();
      deck.element.currentTime = 0;
    }
    this.analyser.reset();
    this.callbacks.onPosition(0);
    this.callbacks.onPlayState(false);
  }

  seek(position: number): void {
    const element = this.decks[this.activeDeck].element;
    if (!Number.isFinite(element.duration)) return;
    element.currentTime = Math.min(
      Math.max(0, position),
      Math.max(0, element.duration - 0.05),
    );
    this.callbacks.onPosition(element.currentTime);
  }

  setVolume(volume: number, muted: boolean): void {
    this.volume = Math.min(1, Math.max(0, volume));
    this.muted = muted;
    this.applyMasterGain();
  }

  setSessionGain(value: number, duration = 0.08): void {
    this.sessionGain = Math.min(1, Math.max(0, value));
    this.applyMasterGain(duration);
  }

  private applyMasterGain(duration = 0.04): void {
    const target = this.muted ? 0 : this.volume * this.sessionGain;
    rampParam(this.masterGain.gain, target, this.context, duration);
  }

  setEqualizer(settings: EqualizerSettings): void {
    rampParam(this.lowShelf.gain, settings.bass, this.context, 0.08);
    rampParam(this.midPeak.gain, settings.mid, this.context, 0.08);
    rampParam(this.highShelf.gain, settings.treble, this.context, 0.08);
    this.applyFilter(settings.filter);
  }

  private applyFilter(filter: SoundroomFilter): void {
    const node = this.characterFilter;
    if (filter === "underwater") {
      node.type = "lowpass";
      node.frequency.setTargetAtTime(920, this.context.currentTime, 0.08);
      node.Q.setTargetAtTime(0.72, this.context.currentTime, 0.08);
      return;
    }
    if (filter === "telephone") {
      node.type = "bandpass";
      node.frequency.setTargetAtTime(1_420, this.context.currentTime, 0.08);
      node.Q.setTargetAtTime(0.82, this.context.currentTime, 0.08);
      return;
    }
    if (filter === "night") {
      node.type = "lowpass";
      node.frequency.setTargetAtTime(4_600, this.context.currentTime, 0.08);
      node.Q.setTargetAtTime(0.3, this.context.currentTime, 0.08);
      return;
    }
    node.type = "allpass";
    node.frequency.setTargetAtTime(12_000, this.context.currentTime, 0.04);
    node.Q.setTargetAtTime(0.0001, this.context.currentTime, 0.04);
  }

  getCurrentPosition(): number {
    return this.decks[this.activeDeck].element.currentTime || 0;
  }

  getCurrentDuration(): number {
    const duration = this.decks[this.activeDeck].element.duration;
    return Number.isFinite(duration) ? duration : 0;
  }

  getEnergySnapshot(): EnergySnapshot {
    return this.analyser.read();
  }

  destroy(): void {
    if (this.transitionTimer !== null)
      window.clearTimeout(this.transitionTimer);
    for (const deck of this.decks) {
      deck.element.pause();
      deck.element.removeAttribute("src");
      deck.element.load();
      deck.source.disconnect();
      deck.gain.disconnect();
    }
    this.masterGain.disconnect();
    this.context.close().catch(() => undefined);
  }
}
