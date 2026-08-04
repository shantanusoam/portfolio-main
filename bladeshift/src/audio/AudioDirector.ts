/**
 * All sound is synthesized via Web Audio -- no audio assets to source/ship.
 * Call unlock() from a real user gesture (Start button click) before any
 * playback, since browsers keep AudioContext suspended until then.
 */
export class AudioDirector {
  private ctx: AudioContext;
  private master: GainNode;
  private noiseBuffer: AudioBuffer;

  constructor() {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.noiseBuffer = this.buildNoiseBuffer();
  }

  unlock(): void {
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMasterVolume(v: number): void {
    this.master.gain.value = Math.max(0, Math.min(1, v));
  }

  playSlice(combo: number): void {
    const pitch = 1 + Math.min(combo - 1, 8) * 0.06;
    this.noiseBurst(0.12, 3200 * pitch, 0.3, 'bandpass');
    this.tone(680 * pitch, 220 * pitch, 0.09, 0.16, 'sine');
  }

  /** Bright ascending arpeggio for combo milestones -- distinct timbre from
   * the regular slice sound so it reads as a bonus reward, not more slicing. */
  playMilestone(tier: number): void {
    const root = 440 * Math.pow(1.06, Math.min(tier, 6) * 2);
    const notes = [0, 4, 7, 12].map((semi) => root * Math.pow(2, semi / 12));
    notes.forEach((freq, i) => {
      window.setTimeout(() => {
        this.tone(freq, freq * 1.02, 0.16, 0.14, 'triangle');
        this.tone(freq * 2, freq * 2, 0.1, 0.05, 'sine');
      }, i * 55);
    });
  }

  playBomb(): void {
    this.noiseBurst(0.5, 320, 0.55, 'lowpass');
    this.tone(160, 40, 0.4, 0.45, 'sawtooth');
  }

  playMiss(): void {
    this.tone(300, 120, 0.18, 0.1, 'triangle');
  }

  playGameOver(): void {
    const notes = [440, 349, 262];
    notes.forEach((f, i) => {
      window.setTimeout(() => this.tone(f, f * 0.9, 0.28, 0.18, 'sine'), i * 150);
    });
  }

  private buildNoiseBuffer(): AudioBuffer {
    const length = Math.floor(this.ctx.sampleRate * 0.3);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private noiseBurst(duration: number, filterFreq: number, gain: number, filterType: BiquadFilterType): void {
    const now = this.ctx.currentTime;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = filterFreq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.master);
    src.start(now);
    src.stop(now + duration);
  }

  private tone(freqStart: number, freqEnd: number, duration: number, gain: number, type: OscillatorType): void {
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), now + duration);
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(gain, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(g);
    g.connect(this.master);
    osc.start(now);
    osc.stop(now + duration);
  }
}
