import { STORAGE_MUTE_KEY } from "./config";

export type BreakSfx = "hit" | "power" | "lose" | "win" | "launch";

export interface Break404Audio {
  play(kind: BreakSfx): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  resume(): void;
  destroy(): void;
}

function readStoredMute(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredMute(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_MUTE_KEY, muted ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export function createBreak404Audio(): Break404Audio {
  let muted = readStoredMute();
  let ctx: AudioContext | null = null;

  function ensureCtx(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AC =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AC) return null;
    if (!ctx) ctx = new AC();
    return ctx;
  }

  function blip(
    frequency: number,
    duration: number,
    type: OscillatorType,
    gainValue: number,
  ): void {
    if (muted) return;
    const audio = ensureCtx();
    if (!audio) return;
    const now = audio.currentTime;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(gainValue, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(audio.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  return {
    play(kind) {
      if (kind === "hit") blip(420 + Math.random() * 80, 0.06, "triangle", 0.05);
      else if (kind === "power") blip(660, 0.12, "sine", 0.06);
      else if (kind === "launch") blip(280, 0.08, "square", 0.03);
      else if (kind === "lose") blip(140, 0.28, "sawtooth", 0.04);
      else if (kind === "win") {
        blip(520, 0.12, "sine", 0.05);
        setTimeout(() => blip(780, 0.18, "sine", 0.05), 90);
      }
    },
    setMuted(next) {
      muted = next;
      writeStoredMute(next);
    },
    isMuted() {
      return muted;
    },
    resume() {
      const audio = ensureCtx();
      if (audio?.state === "suspended") void audio.resume();
    },
    destroy() {
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
