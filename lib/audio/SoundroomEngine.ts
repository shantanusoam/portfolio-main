import { AudioGraph } from "./AudioGraph";
import { LocalLibraryAdapter } from "./adapters/LocalLibraryAdapter";
import { PortfolioRadioAdapter } from "./adapters/PortfolioRadioAdapter";
import {
  DEFAULT_SOUNDROOM_PREFERENCES,
  readQueueIds,
  readSoundroomPreferences,
  readTrackStats,
  writeQueueIds,
  writeSoundroomPreferences,
  writeTrackStats,
} from "./persistence";
import { publishSoundroomTrackChange } from "./reactiveBridge";
import type {
  EnergySnapshot,
  EqualizerSettings,
  PlayerSnapshot,
  RepeatMode,
  SoundroomFilter,
  SoundroomPreferences,
  SoundroomSource,
  SoundroomTrack,
  SourceAdapter,
  VisualizerMode,
} from "./types";

type Listener = () => void;
export type SessionMix =
  "recent" | "favorites" | "unplayed" | "most-played" | "random-walk";

const silentEnergy: EnergySnapshot = {
  bassEnergy: 0,
  lowMidEnergy: 0,
  midEnergy: 0,
  highEnergy: 0,
  overallEnergy: 0,
  smoothedEnergy: 0,
  waveform: new Uint8Array(1024).fill(128),
  frequencyBins: new Uint8Array(512),
  timestamp: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isCrossfade(value: number): value is 0 | 2 | 4 | 6 | 8 {
  return (
    value === 0 || value === 2 || value === 4 || value === 6 || value === 8
  );
}

function shuffleTracks(tracks: readonly SoundroomTrack[]): SoundroomTrack[] {
  const copy = [...tracks];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export class SoundroomEngine {
  private readonly listeners = new Set<Listener>();
  private readonly radioAdapter = new PortfolioRadioAdapter();
  private readonly localAdapter = new LocalLibraryAdapter();
  private readonly adapters: Record<SoundroomSource, SourceAdapter> = {
    portfolio: this.radioAdapter,
    local: this.localAdapter,
  };

  private graph: AudioGraph | null = null;
  private hydrated = false;
  private hydrating: Promise<void> | null = null;
  private autoAdvanceArmed = false;
  private windDownTimer: number | null = null;
  private previousFocusVolume = 1;
  private snapshot: PlayerSnapshot;

  constructor() {
    const preferences =
      typeof window === "undefined"
        ? DEFAULT_SOUNDROOM_PREFERENCES
        : readSoundroomPreferences();
    this.snapshot = {
      ...preferences,
      status: "idle",
      source: "portfolio",
      currentTrack: null,
      queue: [],
      history: [],
      radioTracks: [],
      localTracks: [],
      isPlaying: false,
      duration: 0,
      position: 0,
      error: null,
      windDown: { endsAt: null, fadeOut: true },
      stats: typeof window === "undefined" ? {} : readTrackStats(),
    };
  }

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  getSnapshot = (): PlayerSnapshot => this.snapshot;

  getServerSnapshot = (): PlayerSnapshot => this.snapshot;

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    if (this.hydrating) return this.hydrating;
    this.hydrating = this.performHydration();
    await this.hydrating;
  }

  private async performHydration(): Promise<void> {
    this.patch({ status: "loading", error: null });
    const [radioTracks, localTracks] = await Promise.all([
      this.radioAdapter.list(),
      this.localAdapter.list().catch(() => []),
    ]);
    const withFavorites = (track: SoundroomTrack): SoundroomTrack => ({
      ...track,
      favorite: Boolean(this.snapshot.stats[track.id]?.favorite),
    });
    const radio = radioTracks.map(withFavorites);
    const local = localTracks.map(withFavorites);
    const byId = new Map(
      [...radio, ...local].map((track) => [track.id, track]),
    );
    const savedQueue = readQueueIds()
      .map((id) => byId.get(id))
      .filter((track): track is SoundroomTrack => Boolean(track));
    this.hydrated = true;
    this.patch({
      status: "ready",
      radioTracks: radio,
      localTracks: local,
      queue: savedQueue.length ? savedQueue : radio,
    });
    this.hydrating = null;
  }

  private ensureGraph(): AudioGraph {
    if (this.graph) return this.graph;
    this.graph = new AudioGraph({
      onDuration: (duration) => this.patch({ duration }),
      onPosition: (position) => this.handlePosition(position),
      onPlayState: (isPlaying) =>
        this.patch({
          isPlaying,
          status: isPlaying
            ? "playing"
            : this.snapshot.currentTrack
              ? "paused"
              : "ready",
        }),
      onEnded: () => {
        this.handleEnded().catch(() => undefined);
      },
      onError: (error) =>
        this.patch({ status: "error", error, isPlaying: false }),
    });
    this.graph.setVolume(this.snapshot.volume, this.snapshot.muted);
    this.graph.setEqualizer(this.snapshot.equalizer);
    return this.graph;
  }

  async playTrack(
    track: SoundroomTrack,
    options?: { crossfade?: boolean; resume?: boolean },
  ): Promise<void> {
    await this.hydrate();
    const graph = this.ensureGraph();
    await graph.resume();
    const adapter = this.adapters[track.source];
    this.patch({ status: "loading", error: null, source: track.source });
    try {
      const resolved = await adapter.resolve(track);
      const previous = this.snapshot.currentTrack;
      const stats = { ...this.snapshot.stats };
      const existingStats = stats[track.id] ?? { playCount: 0 };
      const startPosition =
        options?.resume && existingStats.lastPosition
          ? existingStats.lastPosition
          : 0;
      stats[track.id] = {
        ...existingStats,
        playCount:
          existingStats.playCount + (previous?.id === track.id ? 0 : 1),
        lastPlayedAt: Date.now(),
      };
      const history =
        previous && previous.id !== track.id
          ? [
              previous,
              ...this.snapshot.history.filter(
                (item) => item.id !== previous.id,
              ),
            ].slice(0, 24)
          : this.snapshot.history;
      const queue = [...this.snapshot.queue];
      if (!queue.some((item) => item.id === track.id)) queue.push(track);
      this.autoAdvanceArmed = false;
      this.patch({
        currentTrack: track,
        source: track.source,
        queue,
        history,
        position: 0,
        duration: track.duration ?? 0,
        stats,
      });
      writeTrackStats(stats);
      writeQueueIds(queue.map((item) => item.id));
      this.updateMediaSession(track);
      publishSoundroomTrackChange(track);
      await graph.loadAndPlay(
        resolved.url,
        startPosition,
        options?.crossfade && previous ? this.snapshot.crossfade : 0,
      );
      this.patch({ status: "playing", isPlaying: true, error: null });
    } catch (error) {
      this.patch({
        status: "error",
        isPlaying: false,
        error:
          error instanceof Error
            ? error.message
            : "The record could not be opened.",
      });
    }
  }

  async togglePlayback(): Promise<void> {
    const graph = this.ensureGraph();
    await graph.resume();
    await this.hydrate();
    if (!this.snapshot.currentTrack) {
      const first =
        this.snapshot.queue[0] ??
        this.snapshot.radioTracks[0] ??
        this.snapshot.localTracks[0];
      if (first) await this.playTrack(first, { resume: true });
      return;
    }
    if (this.snapshot.isPlaying) graph.pause();
    else {
      try {
        await graph.play();
      } catch {
        this.patch({
          status: "error",
          error: "Playback is waiting for another click.",
        });
      }
    }
  }

  pause(): void {
    this.graph?.pause();
  }

  stop(): void {
    this.graph?.stop();
    this.patch({ isPlaying: false, status: "paused", position: 0 });
  }

  seek(position: number): void {
    this.graph?.seek(position);
  }

  seekBy(seconds: number): void {
    this.seek(this.snapshot.position + seconds);
  }

  async next(automatic = false): Promise<void> {
    const queue = this.snapshot.queue;
    if (!queue.length) return;
    const currentIndex = Math.max(
      0,
      queue.findIndex((track) => track.id === this.snapshot.currentTrack?.id),
    );
    if (this.snapshot.repeatMode === "track" && automatic) {
      this.seek(0);
      await this.graph?.play();
      this.autoAdvanceArmed = false;
      return;
    }
    let nextIndex = currentIndex + 1;
    if (this.snapshot.shuffle && queue.length > 1) {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (nextIndex === currentIndex)
        nextIndex = (nextIndex + 1) % queue.length;
    }
    if (nextIndex >= queue.length) {
      if (this.snapshot.repeatMode === "queue") nextIndex = 0;
      else {
        this.pause();
        this.seek(0);
        this.autoAdvanceArmed = false;
        return;
      }
    }
    await this.playTrack(queue[nextIndex], {
      crossfade: automatic || this.snapshot.isPlaying,
    });
  }

  async previous(): Promise<void> {
    if (this.snapshot.position > 4) {
      this.seek(0);
      return;
    }
    const queue = this.snapshot.queue;
    const index = queue.findIndex(
      (track) => track.id === this.snapshot.currentTrack?.id,
    );
    const previous = queue[index > 0 ? index - 1 : queue.length - 1];
    if (previous)
      await this.playTrack(previous, { crossfade: this.snapshot.isPlaying });
  }

  setQueue(tracks: readonly SoundroomTrack[]): void {
    const unique = tracks.filter(
      (track, index, all) =>
        all.findIndex((candidate) => candidate.id === track.id) === index,
    );
    this.patch({ queue: unique });
    writeQueueIds(unique.map((track) => track.id));
  }

  playNext(track: SoundroomTrack): void {
    const queue = [...this.snapshot.queue].filter(
      (item) => item.id !== track.id,
    );
    const currentIndex = Math.max(
      0,
      queue.findIndex((item) => item.id === this.snapshot.currentTrack?.id),
    );
    queue.splice(currentIndex + 1, 0, track);
    this.setQueue(queue);
  }

  moveQueueItem(trackId: string, direction: -1 | 1): void {
    const queue = [...this.snapshot.queue];
    const index = queue.findIndex((track) => track.id === trackId);
    const nextIndex = index + direction;
    if (index < 0 || nextIndex < 0 || nextIndex >= queue.length) return;
    [queue[index], queue[nextIndex]] = [queue[nextIndex], queue[index]];
    this.setQueue(queue);
  }

  reorderQueue(trackId: string, beforeTrackId: string): void {
    if (trackId === beforeTrackId) return;
    const queue = [...this.snapshot.queue];
    const from = queue.findIndex((track) => track.id === trackId);
    const to = queue.findIndex((track) => track.id === beforeTrackId);
    if (from < 0 || to < 0) return;
    const [moved] = queue.splice(from, 1);
    const destination = queue.findIndex((track) => track.id === beforeTrackId);
    queue.splice(destination < 0 ? queue.length : destination, 0, moved);
    this.setQueue(queue);
  }

  removeFromQueue(trackId: string): void {
    this.setQueue(this.snapshot.queue.filter((track) => track.id !== trackId));
  }

  async importLocalFiles(files: readonly File[]): Promise<SoundroomTrack[]> {
    this.patch({ status: "loading", error: null });
    try {
      const imported = await this.localAdapter.importFiles(files);
      const byId = new Map(
        this.snapshot.localTracks.map((track) => [track.id, track]),
      );
      for (const track of imported) byId.set(track.id, track);
      const localTracks = Array.from(byId.values());
      this.patch({ status: "ready", source: "local", localTracks });
      return imported;
    } catch (error) {
      this.patch({
        status: "error",
        error:
          error instanceof Error
            ? error.message
            : "The local files could not be added.",
      });
      return [];
    }
  }

  async removeLocalTrack(trackId: string): Promise<void> {
    if (this.snapshot.currentTrack?.id === trackId) this.stop();
    await this.localAdapter.remove(trackId);
    this.patch({
      localTracks: this.snapshot.localTracks.filter(
        (track) => track.id !== trackId,
      ),
      queue: this.snapshot.queue.filter((track) => track.id !== trackId),
      currentTrack:
        this.snapshot.currentTrack?.id === trackId
          ? null
          : this.snapshot.currentTrack,
    });
    writeQueueIds(this.snapshot.queue.map((track) => track.id));
  }

  toggleFavorite(trackId: string): void {
    const stats = { ...this.snapshot.stats };
    const nextFavorite = !stats[trackId]?.favorite;
    stats[trackId] = {
      ...(stats[trackId] ?? { playCount: 0 }),
      favorite: nextFavorite,
    };
    const update = (tracks: readonly SoundroomTrack[]) =>
      tracks.map((track) =>
        track.id === trackId ? { ...track, favorite: nextFavorite } : track,
      );
    const currentTrack =
      this.snapshot.currentTrack?.id === trackId
        ? { ...this.snapshot.currentTrack, favorite: nextFavorite }
        : this.snapshot.currentTrack;
    this.patch({
      stats,
      currentTrack,
      radioTracks: update(this.snapshot.radioTracks),
      localTracks: update(this.snapshot.localTracks),
      queue: update(this.snapshot.queue),
    });
    writeTrackStats(stats);
  }

  async playMix(kind: SessionMix): Promise<void> {
    const all = [...this.snapshot.localTracks, ...this.snapshot.radioTracks];
    let tracks = [...all];
    if (kind === "favorites")
      tracks = tracks.filter(
        (track) => this.snapshot.stats[track.id]?.favorite,
      );
    if (kind === "unplayed")
      tracks = tracks.filter(
        (track) => !this.snapshot.stats[track.id]?.playCount,
      );
    if (kind === "recent")
      tracks.sort(
        (a, b) =>
          (this.snapshot.stats[b.id]?.lastPlayedAt ?? 0) -
          (this.snapshot.stats[a.id]?.lastPlayedAt ?? 0),
      );
    if (kind === "most-played")
      tracks.sort(
        (a, b) =>
          (this.snapshot.stats[b.id]?.playCount ?? 0) -
          (this.snapshot.stats[a.id]?.playCount ?? 0),
      );
    if (kind === "random-walk") tracks = shuffleTracks(tracks);
    if (!tracks.length) return;
    this.setQueue(tracks);
    await this.playTrack(tracks[0]);
  }

  setVolume(value: number): void {
    const volume = clamp(value, 0, 1);
    this.graph?.setVolume(volume, this.snapshot.muted);
    this.updatePreferences({ volume });
  }

  toggleMuted(): void {
    const muted = !this.snapshot.muted;
    this.graph?.setVolume(this.snapshot.volume, muted);
    this.updatePreferences({ muted });
  }

  setShuffle(shuffle: boolean): void {
    this.updatePreferences({ shuffle });
  }

  setRepeatMode(repeatMode: RepeatMode): void {
    this.updatePreferences({ repeatMode });
  }

  cycleRepeatMode(): void {
    const next: Record<RepeatMode, RepeatMode> = {
      off: "queue",
      queue: "track",
      track: "off",
    };
    this.setRepeatMode(next[this.snapshot.repeatMode]);
  }

  setCrossfade(value: number): void {
    if (isCrossfade(value)) this.updatePreferences({ crossfade: value });
  }

  setVisualizerMode(visualizerMode: VisualizerMode): void {
    this.updatePreferences({ visualizerMode });
  }

  setReactiveEnabled(reactiveEnabled: boolean): void {
    this.updatePreferences({ reactiveEnabled });
  }

  setReactiveIntensity(reactiveIntensity: number): void {
    this.updatePreferences({
      reactiveIntensity: clamp(reactiveIntensity, 0, 1),
    });
  }

  setEqualizerBand(band: "bass" | "mid" | "treble", value: number): void {
    const equalizer = {
      ...this.snapshot.equalizer,
      [band]: clamp(value, -12, 12),
    };
    this.graph?.setEqualizer(equalizer);
    this.updatePreferences({ equalizer });
  }

  setFilter(filter: SoundroomFilter): void {
    const equalizer: EqualizerSettings = { ...this.snapshot.equalizer, filter };
    this.graph?.setEqualizer(equalizer);
    this.updatePreferences({ equalizer });
  }

  startWindDown(minutes: number, fadeOut: boolean): void {
    this.cancelWindDown();
    const endsAt = Date.now() + Math.max(1, minutes) * 60_000;
    this.previousFocusVolume = 1;
    this.patch({ windDown: { endsAt, fadeOut } });
    this.windDownTimer = window.setInterval(() => {
      const remaining = endsAt - Date.now();
      if (fadeOut && remaining < 30_000) {
        const gain = clamp(remaining / 30_000, 0, 1);
        this.previousFocusVolume = gain;
        this.graph?.setSessionGain(gain, 0.7);
      }
      if (remaining <= 0) {
        this.stop();
        this.cancelWindDown();
      }
    }, 1000);
  }

  cancelWindDown(): void {
    if (this.windDownTimer !== null) window.clearInterval(this.windDownTimer);
    this.windDownTimer = null;
    if (this.previousFocusVolume < 1) this.graph?.setSessionGain(1, 0.4);
    this.previousFocusVolume = 1;
    if (this.snapshot.windDown.endsAt !== null) {
      this.patch({ windDown: { endsAt: null, fadeOut: true } });
    }
  }

  getEnergySnapshot(): EnergySnapshot {
    return this.graph?.getEnergySnapshot() ?? silentEnergy;
  }

  destroy(): void {
    this.cancelWindDown();
    this.graph?.destroy();
    this.radioAdapter.destroy();
    this.localAdapter.destroy();
    this.listeners.clear();
  }

  private handlePosition(position: number): void {
    const duration = this.graph?.getCurrentDuration() ?? this.snapshot.duration;
    const currentTrack = this.snapshot.currentTrack;
    let stats = this.snapshot.stats;
    if (currentTrack && Math.floor(position) % 4 === 0) {
      stats = {
        ...stats,
        [currentTrack.id]: {
          ...(stats[currentTrack.id] ?? { playCount: 0 }),
          lastPosition: position,
        },
      };
      writeTrackStats(stats);
    }
    this.patch({ position, duration, stats });
    if (
      this.snapshot.isPlaying &&
      this.snapshot.crossfade > 0 &&
      duration > 0 &&
      duration - position <= this.snapshot.crossfade + 0.16 &&
      !this.autoAdvanceArmed
    ) {
      this.autoAdvanceArmed = true;
      this.next(true).catch(() => undefined);
    }
  }

  private async handleEnded(): Promise<void> {
    this.autoAdvanceArmed = false;
    await this.next(true);
  }

  private updatePreferences(patch: Partial<SoundroomPreferences>): void {
    this.patch(patch);
    const preferences: SoundroomPreferences = {
      volume: this.snapshot.volume,
      muted: this.snapshot.muted,
      shuffle: this.snapshot.shuffle,
      repeatMode: this.snapshot.repeatMode,
      crossfade: this.snapshot.crossfade,
      visualizerMode: this.snapshot.visualizerMode,
      reactiveEnabled: this.snapshot.reactiveEnabled,
      reactiveIntensity: this.snapshot.reactiveIntensity,
      equalizer: this.snapshot.equalizer,
    };
    writeSoundroomPreferences(preferences);
  }

  private patch(patch: Partial<PlayerSnapshot>): void {
    this.snapshot = { ...this.snapshot, ...patch };
    this.listeners.forEach((listener) => listener());
  }

  private updateMediaSession(track: SoundroomTrack): void {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator))
      return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.album ?? "Soundroom",
        artwork: track.artworkUrl
          ? [{ src: track.artworkUrl, sizes: "512x512" }]
          : undefined,
      });
      navigator.mediaSession.setActionHandler("play", () => {
        this.togglePlayback().catch(() => undefined);
      });
      navigator.mediaSession.setActionHandler("pause", () => this.pause());
      navigator.mediaSession.setActionHandler("previoustrack", () => {
        this.previous().catch(() => undefined);
      });
      navigator.mediaSession.setActionHandler("nexttrack", () => {
        this.next().catch(() => undefined);
      });
      navigator.mediaSession.setActionHandler("seekto", (details) => {
        if (typeof details.seekTime === "number") this.seek(details.seekTime);
      });
      navigator.mediaSession.setActionHandler("seekbackward", (details) =>
        this.seekBy(-(details.seekOffset ?? 10)),
      );
      navigator.mediaSession.setActionHandler("seekforward", (details) =>
        this.seekBy(details.seekOffset ?? 10),
      );
    } catch {
      // Media Session support differs between browsers; playback remains usable.
    }
  }
}

let engineSingleton: SoundroomEngine | null = null;

export function getSoundroomEngine(): SoundroomEngine {
  if (!engineSingleton) engineSingleton = new SoundroomEngine();
  return engineSingleton;
}
