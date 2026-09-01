import type {
  ResolvedAudioSource,
  SoundroomTrack,
  SourceAdapter,
} from "../types";

interface PortfolioManifest {
  tracks?: Array<{
    id: string;
    title: string;
    artist: string;
    album?: string;
    src: string;
    year?: number;
    note?: string;
    accent?: string;
  }>;
}

const GENERATED_TRACKS: readonly SoundroomTrack[] = [
  {
    id: "radio-signal-drift",
    source: "portfolio",
    sourceKey: "generated:signal-drift:7321",
    title: "Signal Drift",
    artist: "Browser oscillator",
    album: "Portfolio Radio",
    duration: 24,
    accent: "#ff6946",
    note: "An original procedural loop generated on your device.",
  },
  {
    id: "radio-fry-lanterns",
    source: "portfolio",
    sourceKey: "generated:fry-lanterns:9184",
    title: "Fry Lanterns",
    artist: "Browser oscillator",
    album: "Portfolio Radio",
    duration: 24,
    accent: "#74d7c4",
    note: "A tiny generative current for the signal shoal.",
  },
  {
    id: "radio-after-hours",
    source: "portfolio",
    sourceKey: "generated:after-hours:4207",
    title: "After Hours Current",
    artist: "Browser oscillator",
    album: "Portfolio Radio",
    duration: 24,
    accent: "#d7a8ff",
    note: "A slow original sketch made from harmonics and filtered noise.",
  },
];

function writeAscii(view: DataView, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    view.setUint8(offset + index, value.charCodeAt(index));
  }
}

function createProceduralWav(seed: number, variant: string): Blob {
  const sampleRate = 24_000;
  const duration = 24;
  const sampleCount = sampleRate * duration;
  const buffer = new ArrayBuffer(44 + sampleCount * 2);
  const view = new DataView(buffer);
  writeAscii(view, 0, "RIFF");
  view.setUint32(4, 36 + sampleCount * 2, true);
  writeAscii(view, 8, "WAVE");
  writeAscii(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(view, 36, "data");
  view.setUint32(40, sampleCount * 2, true);

  let randomState = seed >>> 0;
  let smoothedNoise = 0;
  const base =
    variant === "fry-lanterns" ? 73.42 : variant === "after-hours" ? 49 : 55;
  const chord =
    variant === "fry-lanterns"
      ? [1, 1.5, 2.25, 3]
      : variant === "after-hours"
        ? [1, 1.25, 1.875, 2.5]
        : [1, 4 / 3, 2, 8 / 3];

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    randomState ^= randomState << 13;
    randomState ^= randomState >>> 17;
    randomState ^= randomState << 5;
    const noise = ((randomState >>> 0) / 0xffffffff) * 2 - 1;
    smoothedNoise += (noise - smoothedNoise) * 0.008;

    const slowPulse = 0.6 + Math.sin(time * Math.PI * 0.21) * 0.18;
    const step = Math.floor(time / 3) % chord.length;
    const note = base * chord[step];
    const beatPhase = (time % 3) / 3;
    const pluckEnvelope = Math.exp(-beatPhase * 9);
    const bed =
      Math.sin(Math.PI * 2 * base * time) * 0.12 +
      Math.sin(Math.PI * 2 * base * 1.5 * time + 0.7) * 0.07 +
      Math.sin(Math.PI * 2 * base * 2.01 * time + Math.sin(time * 0.17)) * 0.04;
    const pluck =
      (Math.sin(Math.PI * 2 * note * time) +
        Math.sin(Math.PI * 2 * note * 2.003 * time) * 0.32) *
      pluckEnvelope *
      0.1;
    const fade = Math.min(1, time / 1.2, (duration - time) / 1.2);
    const sample =
      Math.tanh((bed * slowPulse + pluck + smoothedNoise * 0.12) * 1.8) * fade;
    view.setInt16(44 + index * 2, Math.round(sample * 0x5fff), true);
  }
  return new Blob([buffer], { type: "audio/wav" });
}

export class PortfolioRadioAdapter implements SourceAdapter {
  readonly source = "portfolio" as const;
  private generatedUrls = new Map<string, string>();

  async list(): Promise<SoundroomTrack[]> {
    let manifestTracks: SoundroomTrack[] = [];
    try {
      const response = await fetch("/music/manifest.json", {
        cache: "no-store",
      });
      if (response.ok) {
        const manifest = (await response.json()) as PortfolioManifest;
        manifestTracks = (manifest.tracks ?? [])
          .filter((track) => track.src.startsWith("/music/"))
          .map((track) => ({
            id: `radio-${track.id}`,
            source: "portfolio" as const,
            sourceKey: track.src,
            title: track.title,
            artist: track.artist,
            album: track.album,
            year: track.year,
            note: track.note,
            accent: track.accent ?? "#ff6946",
          }));
      }
    } catch {
      // The original procedural records still make the room usable offline.
    }
    return [...GENERATED_TRACKS, ...manifestTracks];
  }

  async resolve(track: SoundroomTrack): Promise<ResolvedAudioSource> {
    if (!track.sourceKey.startsWith("generated:")) {
      return { url: track.sourceKey };
    }
    const existing = this.generatedUrls.get(track.id);
    if (existing) return { url: existing };
    const [, variant, seedText] = track.sourceKey.split(":");
    const blob = createProceduralWav(Number(seedText) || 1, variant);
    const url = URL.createObjectURL(blob);
    this.generatedUrls.set(track.id, url);
    return { url };
  }

  supportsAnalysis(): boolean {
    return true;
  }

  supportsDsp(): boolean {
    return true;
  }

  destroy(): void {
    this.generatedUrls.forEach((url) => URL.revokeObjectURL(url));
    this.generatedUrls.clear();
  }
}
