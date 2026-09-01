import {
  deleteStoredLocalTrack,
  getStoredLocalTrack,
  listStoredLocalTracks,
  putStoredLocalTracks,
  type StoredLocalTrack,
} from "../localLibraryDb";
import { importLocalFile, isSupportedAudioFile } from "../metadata";
import type {
  ResolvedAudioSource,
  SoundroomTrack,
  SourceAdapter,
} from "../types";

export class LocalLibraryAdapter implements SourceAdapter {
  readonly source = "local" as const;
  private audioUrls = new Map<string, string>();
  private artworkUrls = new Map<string, string>();

  async list(): Promise<SoundroomTrack[]> {
    const records = await listStoredLocalTracks();
    return records.map((record) => this.hydrateArtwork(record));
  }

  async importFiles(files: readonly File[]): Promise<SoundroomTrack[]> {
    const supported = files.filter(isSupportedAudioFile);
    const imported = await Promise.all(supported.map(importLocalFile));
    const records: StoredLocalTrack[] = imported.map((item, index) => ({
      id: item.track.id,
      track: item.track,
      file: item.file,
      artwork: item.artwork,
      addedAt: Date.now() + index,
    }));
    await putStoredLocalTracks(records);
    return records.map((record) => this.hydrateArtwork(record));
  }

  async resolve(track: SoundroomTrack): Promise<ResolvedAudioSource> {
    const cached = this.audioUrls.get(track.id);
    if (cached) return { url: cached };
    const record = await getStoredLocalTrack(track.id);
    if (!record) {
      throw new Error(
        "This local file is no longer available. Import it again from your device.",
      );
    }
    const url = URL.createObjectURL(record.file);
    this.audioUrls.set(track.id, url);
    return { url };
  }

  async remove(trackId: string): Promise<void> {
    await deleteStoredLocalTrack(trackId);
    const audioUrl = this.audioUrls.get(trackId);
    const artworkUrl = this.artworkUrls.get(trackId);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    if (artworkUrl) URL.revokeObjectURL(artworkUrl);
    this.audioUrls.delete(trackId);
    this.artworkUrls.delete(trackId);
  }

  supportsAnalysis(): boolean {
    return true;
  }

  supportsDsp(): boolean {
    return true;
  }

  destroy(): void {
    this.audioUrls.forEach((url) => URL.revokeObjectURL(url));
    this.artworkUrls.forEach((url) => URL.revokeObjectURL(url));
    this.audioUrls.clear();
    this.artworkUrls.clear();
  }

  private hydrateArtwork(record: StoredLocalTrack): SoundroomTrack {
    if (!record.artwork) return record.track;
    let artworkUrl = this.artworkUrls.get(record.id);
    if (!artworkUrl) {
      artworkUrl = URL.createObjectURL(record.artwork);
      this.artworkUrls.set(record.id, artworkUrl);
    }
    return { ...record.track, artworkUrl };
  }
}
