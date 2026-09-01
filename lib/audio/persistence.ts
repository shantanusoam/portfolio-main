import type { SoundroomPreferences, StoredTrackStats } from "./types";

export const SOUNDROOM_STORAGE_KEYS = {
  discovered: "soundroom-discovered-v1",
  preferences: "soundroom-preferences-v1",
  queue: "soundroom-queue-v1",
  stats: "soundroom-stats-v1",
} as const;

export const DEFAULT_SOUNDROOM_PREFERENCES: SoundroomPreferences = {
  volume: 0.72,
  muted: false,
  shuffle: false,
  repeatMode: "off",
  crossfade: 2,
  visualizerMode: "strings",
  reactiveEnabled: false,
  reactiveIntensity: 0.35,
  equalizer: {
    bass: 0,
    mid: 0,
    treble: 0,
    filter: "clean",
  },
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

export function readSoundroomPreferences(): SoundroomPreferences {
  const stored = readJson<Partial<SoundroomPreferences>>(
    SOUNDROOM_STORAGE_KEYS.preferences,
    {},
  );
  return {
    ...DEFAULT_SOUNDROOM_PREFERENCES,
    ...stored,
    equalizer: {
      ...DEFAULT_SOUNDROOM_PREFERENCES.equalizer,
      ...stored.equalizer,
    },
  };
}

export function writeSoundroomPreferences(
  preferences: SoundroomPreferences,
): void {
  writeJson(SOUNDROOM_STORAGE_KEYS.preferences, preferences);
}

export function readQueueIds(): string[] {
  return readJson<string[]>(SOUNDROOM_STORAGE_KEYS.queue, []);
}

export function writeQueueIds(ids: readonly string[]): void {
  writeJson(SOUNDROOM_STORAGE_KEYS.queue, ids);
}

export function readTrackStats(): Record<string, StoredTrackStats> {
  return readJson<Record<string, StoredTrackStats>>(
    SOUNDROOM_STORAGE_KEYS.stats,
    {},
  );
}

export function writeTrackStats(
  stats: Readonly<Record<string, StoredTrackStats>>,
): void {
  writeJson(SOUNDROOM_STORAGE_KEYS.stats, stats);
}

export function hasDiscoveredSoundroom(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.localStorage.getItem(SOUNDROOM_STORAGE_KEYS.discovered) === "true"
    );
  } catch {
    return false;
  }
}

export function rememberSoundroomDiscovery(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SOUNDROOM_STORAGE_KEYS.discovered, "true");
  } catch {
    // Discovery is delightful, not essential state.
  }
}
