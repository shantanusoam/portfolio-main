import type { Settings, Sound } from "./types";

const NOTES = [110, 164.81, 220, 196, 146.83, 164.81, 130.81, 146.83];
/** Original procedural score. All scheduled nodes are bounded and disposed. */
export class GameAudio {
  private context: AudioContext | null = null;
  private nodes = new Set<OscillatorNode>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private settings: Settings;
  private active = false;
  private boss = false;
  private lastShot = -1;
  constructor(settings: Settings) {
    this.settings = settings;
  }

  async unlock(): Promise<void> {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") await this.context.resume();
    } catch {
      /* A denied audio device must never block gameplay. */
    }
  }

  configure(settings: Settings): void {
    this.settings = settings;
    if (settings.muted) this.silence();
  }

  private tone(
    frequency: number,
    duration: number,
    volume: number,
    type: "sine" | "square" | "sawtooth" | "triangle" = "triangle",
    target?: number,
  ): void {
    const ctx = this.context;
    if (
      !ctx ||
      ctx.state !== "running" ||
      this.settings.muted ||
      this.nodes.size >= 24 ||
      volume <= 0
    )
      return;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    if (target)
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, target),
        ctx.currentTime + duration,
      );
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + duration + 0.02);
    this.nodes.add(oscillator);
    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
      this.nodes.delete(oscillator);
    };
  }

  play(sound: Sound): void {
    if (!this.context || this.settings.muted) return;
    const level = this.settings.effects * 0.08;
    if (sound === "shot" && this.context.currentTime - this.lastShot < 0.1)
      return;
    if (sound === "shot") {
      this.lastShot = this.context.currentTime;
      this.tone(660, 0.05, level * 0.25, "square", 300);
    }
    if (sound === "rail") this.tone(1000, 0.12, level * 0.3, "sawtooth", 180);
    if (sound === "hit") this.tone(320, 0.06, level * 0.3, "triangle", 120);
    if (sound === "explode") this.tone(100, 0.18, level * 0.6, "sawtooth", 28);
    if (sound === "damage") {
      this.tone(140, 0.22, level, "sawtooth", 40);
      this.tone(77, 0.3, level * 0.5);
    }
    if (sound === "pulse") {
      this.tone(65, 0.5, level, "sawtooth", 240);
      this.tone(330, 0.5, level * 0.6, "sine", 660);
    }
    if (sound === "warning") this.tone(220, 0.28, level * 0.55, "square", 200);
    if (sound === "pickup") this.tone(660, 0.2, level * 0.7, "sine", 990);
    if (sound === "secret" || sound === "clear") {
      this.tone(440, 0.6, level * 0.6);
      this.tone(554.37, 0.65, level * 0.4);
      this.tone(659.25, 0.8, level * 0.4);
    }
  }

  setActive(active: boolean, boss = false): void {
    this.boss = boss;
    if (active === this.active) return;
    this.active = active;
    if (!active) {
      if (this.timer) clearInterval(this.timer);
      this.timer = null;
      this.silence();
      return;
    }
    this.timer = setInterval(() => {
      if (!this.active) return;
      const note = NOTES[this.step % NOTES.length];
      const level = this.settings.music * 0.045;
      this.tone(note / 2, 0.8, level, "sine");
      if (this.step % 2 === 0 || this.boss)
        this.tone(
          note * (this.boss ? 4 : 2),
          0.32,
          level * 0.5,
          this.settings.skin === "lcd" ? "square" : "triangle",
        );
      this.step++;
    }, 360);
  }

  private silence(): void {
    this.nodes.forEach((node) => {
      try {
        node.stop();
      } catch {
        /* already stopped */
      }
    });
  }

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.active = false;
    this.silence();
    this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
