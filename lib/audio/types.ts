export type SoundroomSource = "portfolio" | "local";

export type RepeatMode = "off" | "track" | "queue";

export type VisualizerMode =
  "strings" | "wave" | "spectrum" | "water" | "particles" | "album" | "none";

export type SoundroomFilter = "clean" | "underwater" | "telephone" | "night";

export interface SoundroomTrack {
  id: string;
  source: SoundroomSource;
  title: string;
  artist: string;
  album?: string;
  year?: number;
  trackNumber?: number;
  duration?: number;
  artworkUrl?: string;
  accent: string;
  note?: string;
  favorite?: boolean;
  /** Adapter-private key. It is never sent to analytics or a server. */
  sourceKey: string;
}

export interface StoredTrackStats {
  playCount: number;
  lastPlayedAt?: number;
  lastPosition?: number;
  favorite?: boolean;
}

export interface EqualizerSettings {
  bass: number;
  mid: number;
  treble: number;
  filter: SoundroomFilter;
}

export interface SoundroomPreferences {
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeatMode: RepeatMode;
  crossfade: 0 | 2 | 4 | 6 | 8;
  visualizerMode: VisualizerMode;
  reactiveEnabled: boolean;
  reactiveIntensity: number;
  equalizer: EqualizerSettings;
}

export interface WindDownState {
  endsAt: number | null;
  fadeOut: boolean;
}

export type PlayerStatus =
  "idle" | "loading" | "ready" | "playing" | "paused" | "error";

export interface PlayerSnapshot extends SoundroomPreferences {
  status: PlayerStatus;
  source: SoundroomSource;
  currentTrack: SoundroomTrack | null;
  queue: readonly SoundroomTrack[];
  history: readonly SoundroomTrack[];
  radioTracks: readonly SoundroomTrack[];
  localTracks: readonly SoundroomTrack[];
  isPlaying: boolean;
  duration: number;
  position: number;
  error: string | null;
  windDown: WindDownState;
  stats: Readonly<Record<string, StoredTrackStats>>;
}

export interface EnergySnapshot {
  bassEnergy: number;
  lowMidEnergy: number;
  midEnergy: number;
  highEnergy: number;
  overallEnergy: number;
  smoothedEnergy: number;
  waveform: Uint8Array;
  frequencyBins: Uint8Array;
  timestamp: number;
}

export interface ResolvedAudioSource {
  url: string;
  release?: () => void;
}

export interface SourceAdapter {
  readonly source: SoundroomSource;
  list(): Promise<SoundroomTrack[]>;
  resolve(track: SoundroomTrack): Promise<ResolvedAudioSource>;
  remove?(trackId: string): Promise<void>;
  supportsAnalysis(): boolean;
  supportsDsp(): boolean;
  destroy?(): void;
}

export interface ImportedLocalTrack {
  track: SoundroomTrack;
  file: File;
  artwork?: Blob;
}
