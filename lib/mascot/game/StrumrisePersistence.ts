/**
 * Safe localStorage read/write for Strumrise's best score, best height, and
 * mute setting — spec: "Use safe localStorage parsing." Accepts an
 * injectable `StorageLike` so the parsing logic is unit-testable under
 * plain Node (no `window`) without mocking globals; production callers
 * omit it and get `window.localStorage` when available.
 */

export interface StrumriseSaveData {
  bestScore: number;
  bestHeight: number;
  muted: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const STORAGE_KEY = "strumrise:save";

const DEFAULT_SAVE: StrumriseSaveData = {
  bestScore: 0,
  bestHeight: 0,
  muted: false,
};

function isValidSave(value: unknown): value is StrumriseSaveData {
  if (!value || typeof value !== "object") return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.bestScore === "number" &&
    Number.isFinite(record.bestScore) &&
    typeof record.bestHeight === "number" &&
    Number.isFinite(record.bestHeight) &&
    typeof record.muted === "boolean"
  );
}

function resolveStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function loadStrumriseSave(storage?: StorageLike): StrumriseSaveData {
  const target = resolveStorage(storage);
  if (!target) return { ...DEFAULT_SAVE };
  try {
    const raw = target.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SAVE };
    const parsed: unknown = JSON.parse(raw);
    return isValidSave(parsed) ? parsed : { ...DEFAULT_SAVE };
  } catch {
    return { ...DEFAULT_SAVE };
  }
}

export function saveStrumriseSave(
  partial: Partial<StrumriseSaveData>,
  storage?: StorageLike,
): StrumriseSaveData {
  const next = { ...loadStrumriseSave(storage), ...partial };
  const target = resolveStorage(storage);
  if (target) {
    try {
      target.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage can be unavailable in privacy-restricted browsing contexts.
    }
  }
  return next;
}
