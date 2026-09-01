import type { ImportedLocalTrack, SoundroomTrack } from "./types";

const AUDIO_EXTENSIONS = /\.(mp3|m4a|aac|wav|ogg|oga|flac|webm)$/i;
const ACCENTS = ["#ff6946", "#74d7c4", "#d7a8ff", "#f2c86b", "#7eb6ff"];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function syncSafe(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] & 0x7f) << 21) |
    ((bytes[offset + 1] & 0x7f) << 14) |
    ((bytes[offset + 2] & 0x7f) << 7) |
    (bytes[offset + 3] & 0x7f)
  );
}

function integer32(bytes: Uint8Array, offset: number): number {
  return (
    bytes[offset] * 0x1000000 +
    (bytes[offset + 1] << 16) +
    (bytes[offset + 2] << 8) +
    bytes[offset + 3]
  );
}

function trimText(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .replace(/\0/g, "")
    .trim();
}

function decodeText(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) return "";
  try {
    if (encoding === 1 || encoding === 2) {
      const littleEndian = encoding === 1 && bytes[0] === 0xff;
      const start =
        encoding === 1 && (bytes[0] === 0xff || bytes[0] === 0xfe) ? 2 : 0;
      return trimText(
        new TextDecoder(littleEndian ? "utf-16le" : "utf-16be").decode(
          bytes.subarray(start),
        ),
      );
    }
    return trimText(
      new TextDecoder(encoding === 3 ? "utf-8" : "windows-1252").decode(bytes),
    );
  } catch {
    return "";
  }
}

function findTerminator(
  bytes: Uint8Array,
  start: number,
  wide: boolean,
): number {
  if (!wide) {
    const index = bytes.indexOf(0, start);
    return index < 0 ? bytes.length : index;
  }
  for (let index = start; index + 1 < bytes.length; index += 2) {
    if (bytes[index] === 0 && bytes[index + 1] === 0) return index;
  }
  return bytes.length;
}

interface Id3Metadata {
  title?: string;
  artist?: string;
  album?: string;
  year?: number;
  trackNumber?: number;
  artwork?: Blob;
}

function ascii(bytes: Uint8Array, start: number, length: number): string {
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += String.fromCharCode(bytes[start + index] ?? 0);
  }
  return value;
}

async function parseId3(file: File): Promise<Id3Metadata> {
  if (!/\.(mp3|aac)$/i.test(file.name)) return {};
  const header = new Uint8Array(await file.slice(0, 10).arrayBuffer());
  if (header.length < 10 || ascii(header, 0, 3) !== "ID3") return {};

  const version = header[3];
  const tagSize = Math.min(syncSafe(header, 6) + 10, 2_000_000, file.size);
  const bytes = new Uint8Array(await file.slice(0, tagSize).arrayBuffer());
  const result: Id3Metadata = {};
  let offset = 10;

  while (offset + 10 <= bytes.length) {
    const frameId = ascii(bytes, offset, 4);
    if (!/^[A-Z0-9]{4}$/.test(frameId)) break;
    const frameSize =
      version === 4
        ? syncSafe(bytes, offset + 4)
        : integer32(bytes, offset + 4);
    if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) break;
    const frame = bytes.subarray(offset + 10, offset + 10 + frameSize);

    if (["TIT2", "TPE1", "TALB", "TDRC", "TYER", "TRCK"].includes(frameId)) {
      const value = decodeText(frame.subarray(1), frame[0]);
      if (frameId === "TIT2") result.title = value;
      if (frameId === "TPE1") result.artist = value;
      if (frameId === "TALB") result.album = value;
      if (frameId === "TDRC" || frameId === "TYER") {
        const year = Number.parseInt(value.slice(0, 4), 10);
        if (Number.isFinite(year)) result.year = year;
      }
      if (frameId === "TRCK") {
        const trackNumber = Number.parseInt(value.split("/")[0], 10);
        if (Number.isFinite(trackNumber)) result.trackNumber = trackNumber;
      }
    }

    if (frameId === "APIC" && frame.length > 4) {
      const encoding = frame[0];
      const mimeEnd = findTerminator(frame, 1, false);
      const mime = decodeText(frame.subarray(1, mimeEnd), 0) || "image/jpeg";
      const descriptionStart = mimeEnd + 2;
      const descriptionEnd = findTerminator(
        frame,
        descriptionStart,
        encoding === 1 || encoding === 2,
      );
      const imageStart =
        descriptionEnd + (encoding === 1 || encoding === 2 ? 2 : 1);
      if (imageStart < frame.length) {
        result.artwork = new Blob([frame.subarray(imageStart)], { type: mime });
      }
    }

    offset += 10 + frameSize;
  }
  return result;
}

function filenameMetadata(file: File): { title: string; artist: string } {
  const clean = file.name
    .replace(AUDIO_EXTENSIONS, "")
    .replace(/[_]+/g, " ")
    .trim();
  const parts = clean.split(/\s+-\s+/);
  if (parts.length >= 2) {
    return {
      artist: parts.shift() ?? "Local artist",
      title: parts.join(" — "),
    };
  }
  return { title: clean || "Untitled recording", artist: "Local file" };
}

export function isSupportedAudioFile(file: File): boolean {
  return file.type.startsWith("audio/") || AUDIO_EXTENSIONS.test(file.name);
}

export async function readAudioDuration(
  file: File,
): Promise<number | undefined> {
  if (typeof document === "undefined") return undefined;
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<number | undefined>((resolve) => {
      const audio = document.createElement("audio");
      const timeout = window.setTimeout(() => resolve(undefined), 4000);
      audio.preload = "metadata";
      audio.onloadedmetadata = () => {
        window.clearTimeout(timeout);
        resolve(Number.isFinite(audio.duration) ? audio.duration : undefined);
      };
      audio.onerror = () => {
        window.clearTimeout(timeout);
        resolve(undefined);
      };
      audio.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function importLocalFile(file: File): Promise<ImportedLocalTrack> {
  const fallback = filenameMetadata(file);
  const idHash = hashString(
    `${file.name}:${file.size}:${file.lastModified}`,
  ).toString(36);
  const tags = await parseId3(file).catch(() => ({}) as Id3Metadata);
  const duration = await readAudioDuration(file);
  const title = tags.title || fallback.title;
  const artist = tags.artist || fallback.artist;
  const seed = hashString(`${artist}:${tags.album ?? ""}:${title}`);
  const track: SoundroomTrack = {
    id: `local-${idHash}`,
    source: "local",
    sourceKey: `local-${idHash}`,
    title,
    artist,
    album: tags.album,
    year: tags.year,
    trackNumber: tags.trackNumber,
    duration,
    accent: ACCENTS[seed % ACCENTS.length],
    note: "This file remains inside this browser.",
  };
  return { track, file, artwork: tags.artwork };
}

export function deterministicCoverSeed(track: SoundroomTrack): number {
  return hashString(`${track.artist}:${track.album ?? ""}:${track.title}`);
}
