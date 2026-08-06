import { STORAGE_KEYS } from "./config";

export function readBestScore(): number {
  if (typeof window === "undefined") return 0;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.best);
    const parsed = stored ? Number.parseInt(stored, 10) : 0;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
  } catch {
    return 0;
  }
}

export function writeBestScore(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.best,
      String(Math.max(0, Math.round(value))),
    );
  } catch {
    // localStorage unavailable (private mode, quota, etc) — fail silently.
  }
}

export function readHighestSector(): number {
  if (typeof window === "undefined") return 1;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.highestSector);
    const parsed = stored ? Number.parseInt(stored, 10) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  } catch {
    return 1;
  }
}

export function writeHighestSector(value: number): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEYS.highestSector,
      String(Math.max(1, Math.round(value))),
    );
  } catch {
    // ignore
  }
}

export function readMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEYS.muted) === "1";
  } catch {
    return false;
  }
}

export function writeMuted(value: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.muted, value ? "1" : "0");
  } catch {
    // ignore
  }
}

export type ControlMode = "auto" | "keyboard" | "touch";

export function readControlMode(): ControlMode {
  if (typeof window === "undefined") return "auto";
  try {
    const stored = window.localStorage.getItem(STORAGE_KEYS.controlMode);
    if (stored === "keyboard" || stored === "touch" || stored === "auto") {
      return stored;
    }
    return "auto";
  } catch {
    return "auto";
  }
}

export function writeControlMode(mode: ControlMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEYS.controlMode, mode);
  } catch {
    // ignore
  }
}
