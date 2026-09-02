import type { EnergySnapshot, SoundroomTrack } from "./types";

export interface SoundroomReactiveSnapshot {
  bass: number;
  lowMid: number;
  mid: number;
  high: number;
  overall: number;
  intensity: number;
  enabled: boolean;
  playing: boolean;
  trackId: string | null;
  trackAccent: string;
  timestamp: number;
}

type ReactiveSubscriber = (snapshot: SoundroomReactiveSnapshot) => void;
type TrackSubscriber = (track: SoundroomTrack) => void;

const subscribers = new Set<ReactiveSubscriber>();
const trackSubscribers = new Set<TrackSubscriber>();

const sharedSnapshot: SoundroomReactiveSnapshot = {
  bass: 0,
  lowMid: 0,
  mid: 0,
  high: 0,
  overall: 0,
  intensity: 0,
  enabled: false,
  playing: false,
  trackId: null,
  trackAccent: "#ff7448",
  timestamp: 0,
};

export function publishSoundroomEnergy(
  energy: EnergySnapshot,
  options: {
    intensity: number;
    enabled: boolean;
    playing: boolean;
    track: SoundroomTrack | null;
  },
): void {
  sharedSnapshot.bass = energy.bassEnergy;
  sharedSnapshot.lowMid = energy.lowMidEnergy;
  sharedSnapshot.mid = energy.midEnergy;
  sharedSnapshot.high = energy.highEnergy;
  sharedSnapshot.overall = energy.smoothedEnergy;
  sharedSnapshot.intensity = options.intensity;
  sharedSnapshot.enabled = options.enabled;
  sharedSnapshot.playing = options.playing;
  sharedSnapshot.trackId = options.track?.id ?? null;
  sharedSnapshot.trackAccent = options.track?.accent ?? "#ff7448";
  sharedSnapshot.timestamp = energy.timestamp;
  subscribers.forEach((subscriber) => subscriber(sharedSnapshot));
}

export function publishSoundroomSilence(): void {
  sharedSnapshot.bass = 0;
  sharedSnapshot.lowMid = 0;
  sharedSnapshot.mid = 0;
  sharedSnapshot.high = 0;
  sharedSnapshot.overall = 0;
  sharedSnapshot.playing = false;
  sharedSnapshot.timestamp =
    typeof performance === "undefined" ? 0 : performance.now();
  subscribers.forEach((subscriber) => subscriber(sharedSnapshot));
}

export function publishSoundroomTrackChange(track: SoundroomTrack): void {
  trackSubscribers.forEach((subscriber) => subscriber(track));
}

export function subscribeSoundroomEnergy(
  subscriber: ReactiveSubscriber,
): () => void {
  subscribers.add(subscriber);
  return () => subscribers.delete(subscriber);
}

export function subscribeSoundroomTrackChange(
  subscriber: TrackSubscriber,
): () => void {
  trackSubscribers.add(subscriber);
  return () => trackSubscribers.delete(subscriber);
}
