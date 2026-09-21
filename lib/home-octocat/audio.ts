import type { MotionEvent } from "./motion";
/** Quiet synthesized notes, created only by an explicit Sound button gesture. */
export class MochiAudio {
  private context: AudioContext | null = null;
  private enabled = false;
  private note = 0;
  async toggle() {
    this.enabled = !this.enabled;
    if (this.enabled) {
      try {
        this.context ??= new AudioContext();
        await this.context.resume();
      } catch {
        this.enabled = false;
      }
    } else await this.context?.suspend();
    return this.enabled;
  }

  play(event: MotionEvent) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== "running") return;
    const soft = event === "land";
    const frequency = soft
      ? 155
      : event === "boop"
        ? 740
        : event === "hurt"
          ? 220
          : event === "checkpoint"
            ? 1046
            : event === "stomp"
              ? 784
              : event === "star"
                ? 880
                : event === "spring"
                  ? 659
                  : event === "extra"
                    ? 587
                    : event === "over"
                      ? 196
                      : [330, 392, 440, 494, 587][this.note++ % 5];
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(
      frequency * (event === "over" || event === "hurt" || soft ? 0.7 : 1.05),
      ctx.currentTime + 0.15,
    );
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(
      soft ? 0.016 : 0.04,
      ctx.currentTime + 0.008,
    );
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.24);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  destroy() {
    this.enabled = false;
    this.context?.close().catch(() => undefined);
    this.context = null;
  }
}
