import type { GameEvent, Settings, Sound } from "./types";
import {
  composeStep,
  DEFAULT_SCENE,
  musicTempo,
  type MusicScene,
} from "./music";
export type AudioStatus = "locked" | "running" | "suspended" | "unavailable";

/** Preserve decisive feedback when a single action destroys a whole fleet. */
export function selectSounds(events: GameEvent[], limit = 6): Sound[] {
  const priority: Record<Sound, number> = {
    damage: 0,
    pulse: 1,
    clear: 1,
    secret: 1,
    shield: 2,
    overdrive: 2,
    pickup: 3,
    combo: 4,
    warning: 4,
    explode: 5,
    hit: 6,
    rail: 7,
    seeker: 7,
    shot: 8,
  };
  return events
    .flatMap((event) =>
      event.kind === "sound" && event.sound ? [event.sound] : [],
    )
    .sort((a, b) => priority[a] - priority[b])
    .slice(0, limit);
}

/** Original chiptune score. Activation belongs to a user gesture; never autoplay. */
export class GameAudio {
  private context: AudioContext | null = null;
  private bus: DynamicsCompressorNode | null = null;
  private master: GainNode | null = null;
  private nodes = new Map<OscillatorNode, GainNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private nextNote = 0;
  private active = false;
  private scene: MusicScene = { ...DEFAULT_SCENE };
  private disposed = false;
  private lastShot = -1;
  private statusValue: AudioStatus = "locked";
  private settings: Settings;
  private onStatus?: (status: AudioStatus) => void;
  constructor(settings: Settings, onStatus?: (status: AudioStatus) => void) {
    this.settings = settings;
    this.onStatus = onStatus;
  }

  get status(): AudioStatus {
    return this.statusValue;
  }

  private report(status: AudioStatus): void {
    if (this.disposed || status === this.statusValue) return;
    this.statusValue = status;
    this.onStatus?.(status);
  }

  /** Call directly from Start, Resume, or a sound control, before any await. */
  async unlock(): Promise<boolean> {
    if (this.disposed) return false;
    try {
      if (!this.context) {
        const AudioCtor =
          globalThis.AudioContext ??
          (
            globalThis as typeof globalThis & {
              webkitAudioContext?: typeof AudioContext;
            }
          ).webkitAudioContext;
        if (!AudioCtor) {
          this.report("unavailable");
          return false;
        }
        const ctx = new AudioCtor();
        this.context = ctx;
        this.bus = ctx.createDynamicsCompressor();
        this.master = ctx.createGain();
        this.bus.threshold.value = -18;
        this.bus.knee.value = 12;
        this.bus.ratio.value = 8;
        this.bus.attack.value = 0.003;
        this.bus.release.value = 0.12;
        this.master.gain.value = 0.8;
        this.bus.connect(this.master);
        this.master.connect(ctx.destination);
        ctx.onstatechange = () => {
          if (this.disposed || this.context !== ctx) return;
          this.report(ctx.state === "running" ? "running" : "suspended");
          if (ctx.state !== "running") this.silence();
          this.syncMusic();
        };
      }
      const ctx = this.context;
      if (ctx.state !== "running") await ctx.resume();
      if (this.disposed || this.context !== ctx) return false;
      this.report(ctx.state === "running" ? "running" : "suspended");
      this.syncMusic();
      return ctx.state === "running";
    } catch {
      this.releaseContext();
      this.report("unavailable");
      return false;
    }
  }

  configure(settings: Settings): void {
    this.settings = settings;
    if (settings.muted) this.silence();
    this.syncMusic();
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: "sine" | "square" | "sawtooth" | "triangle" = "triangle",
    target?: number,
    when = this.context?.currentTime ?? 0,
  ): void {
    const ctx = this.context;
    if (
      !ctx ||
      !this.bus ||
      ctx.state !== "running" ||
      this.disposed ||
      this.settings.muted ||
      this.nodes.size >= 24 ||
      volume <= 0
    )
      return;
    const start = Math.max(ctx.currentTime, when);
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (target)
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, target),
        start + duration,
      );
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(Math.min(0.12, volume), start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(this.bus);
    this.nodes.set(oscillator, gain);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.nodes.delete(oscillator);
    };
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  play(sound: Sound): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running" || this.settings.muted) return;
    const level = this.settings.effects * 0.12;
    if (sound === "shot") {
      if (ctx.currentTime - this.lastShot < 0.1) return;
      this.lastShot = ctx.currentTime;
      this.tone(880, 0.075, level * 0.35, "square", 220);
    }
    if (sound === "seeker") this.tone(560, 0.18, level * 0.32, "triangle", 160);
    if (sound === "shield") {
      this.tone(740, 0.24, level * 0.45, "sine", 370);
      this.tone(1108, 0.3, level * 0.22, "triangle");
    }
    if (sound === "overdrive" || sound === "combo")
      [587.33, 739.99, 880].forEach((note, i) =>
        this.tone(
          note,
          0.13,
          level * 0.45,
          "square",
          undefined,
          ctx.currentTime + i * 0.055,
        ),
      );
    if (sound === "rail") this.tone(1100, 0.15, level * 0.5, "sawtooth", 120);
    if (sound === "hit") this.tone(360, 0.08, level * 0.5, "triangle", 110);
    if (sound === "explode") {
      this.tone(140, 0.23, level * 0.7, "sawtooth", 30);
      this.tone(81, 0.25, level * 0.3, "square", 24);
    }
    if (sound === "damage") {
      this.tone(180, 0.22, level, "sawtooth", 45);
      this.tone(90, 0.3, level * 0.5);
    }
    if (sound === "pulse") {
      this.tone(80, 0.5, level, "sawtooth", 280);
      this.tone(330, 0.5, level * 0.6, "sine", 880);
    }
    if (sound === "warning") this.tone(440, 0.2, level * 0.45, "square", 330);
    if (sound === "pickup") {
      this.tone(660, 0.12, level * 0.6, "square");
      this.tone(
        990,
        0.18,
        level * 0.5,
        "square",
        undefined,
        ctx.currentTime + 0.09,
      );
    }
    if (sound === "secret" || sound === "clear") {
      [440, 554.37, 659.25, 880].forEach((note, i) =>
        this.tone(
          note,
          0.28,
          level * 0.6,
          "triangle",
          undefined,
          ctx.currentTime + i * 0.09,
        ),
      );
    }
  }

  setScene(scene: Omit<MusicScene, "boss">): void {
    this.scene = { ...scene, boss: this.scene.boss };
  }

  setActive(active: boolean, boss = false): void {
    this.scene.boss = boss;
    if (active === this.active) return;
    this.active = active;
    if (!active) this.silence();
    this.syncMusic();
  }

  /** Explicit pause/background interruption also stops one-shot effects. */
  suspendPlayback(): void {
    this.active = false;
    this.stopTimer();
    this.silence();
  }

  private stopTimer(): void {
    if (this.timer !== null) clearInterval(this.timer);
    this.timer = null;
  }

  private syncMusic(): void {
    if (
      this.disposed ||
      !this.active ||
      this.settings.muted ||
      this.settings.music <= 0 ||
      this.context?.state !== "running"
    ) {
      this.stopTimer();
      return;
    }
    if (this.timer !== null) return;
    this.nextNote = this.context.currentTime + 0.025;
    this.scheduleMusic();
    this.timer = setInterval(() => this.scheduleMusic(), 25);
  }

  private scheduleMusic(): void {
    const ctx = this.context;
    if (
      !ctx ||
      ctx.state !== "running" ||
      !this.active ||
      this.disposed ||
      this.settings.muted ||
      this.settings.music <= 0
    )
      return;
    const now = ctx.currentTime;
    if (this.nextNote < now) this.nextNote = now + 0.025;
    let scheduled = 0;
    while (this.nextNote < now + 0.1 && scheduled++ < 2) {
      const level = this.settings.music * 0.095;
      for (const note of composeStep(this.step, this.scene)) {
        // Reserve six voices for emergency sound effects.
        if (this.nodes.size >= 18) break;
        this.tone(
          note.frequency,
          note.duration,
          level * note.gain,
          note.wave,
          note.target,
          this.nextNote,
        );
      }
      this.step++;
      this.nextNote += 60 / musicTempo(this.scene) / 4;
    }
  }

  private silence(): void {
    this.nodes.forEach((gain, node) => {
      node.onended = null;
      try {
        node.stop();
      } catch {
        /* Already stopped. */
      }
      node.disconnect();
      gain.disconnect();
    });
    this.nodes.clear();
    this.lastShot = -1;
  }

  private releaseContext(): void {
    this.stopTimer();
    this.silence();
    this.bus?.disconnect();
    this.master?.disconnect();
    if (this.context) {
      this.context.onstatechange = null;
      this.context.close().catch(() => undefined);
    }
    this.context = null;
    this.bus = null;
    this.master = null;
  }

  dispose(): void {
    this.disposed = true;
    this.active = false;
    this.releaseContext();
  }
}
