/**
 * Lost Signal: Pocket Edition — save envelope.
 *
 * Separate key `portfolio-space-impact:pocket:v2` with a validated
 * `version: 2` envelope. The original edition's `portfolio-space-impact:v1`
 * key is never read or written here. Import of v1 unlocks/checkpoints is a
 * later milestone; this envelope stores only Pocket-owned progress.
 */
import { isWeapon, restoreArsenal } from "../arsenal";
import type { Checkpoint, Game, Settings } from "../types";
import type { PresetName } from "./palette";
import type { PaletteName } from "./atlas";

export const POCKET_STORAGE_KEY = "portfolio-space-impact:pocket:v2";

export interface PocketSettings extends Settings {
  preset: PresetName;
  palette: PaletteName;
}

export interface PocketSave {
  version: 2;
  edition: "pocket";
  settings: PocketSettings;
  checkpoint: Checkpoint | null;
  best: Record<string, number>;
}

const BASE_SETTINGS: Settings = {
  music: 0.3,
  effects: 0.55,
  muted: false,
  reducedMotion: false,
  lowFlashes: true,
  highContrast: false,
  lowEffects: false,
  leftHanded: false,
  control: "drag",
  skin: "lcd",
  assist: false,
};

export function defaultPocketSettings(): PocketSettings {
  return { ...BASE_SETTINGS, preset: "crt", palette: "olive" };
}

export function emptyPocketSave(): PocketSave {
  return {
    version: 2,
    edition: "pocket",
    settings: defaultPocketSettings(),
    checkpoint: null,
    best: {},
  };
}

const PRESET_NAMES: PresetName[] = ["clean", "pocket", "worn", "crt"];
const PALETTE_NAMES: PaletteName[] = ["olive", "mint"];

function clamp01(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(1, Math.max(0, value))
    : fallback;
}

function bool(value: unknown, fallback = false): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function checkpoint(value: unknown): Checkpoint | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const finite = (n: unknown, fallback: number, min: number, max: number) => typeof n === "number" && Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback;
  if (typeof raw.sector !== "number" || !Number.isFinite(raw.sector) || raw.sector < 0 || raw.sector > 4) return null;
  const weapon = isWeapon(raw.weapon) ? raw.weapon : "pulse"; const level = finite(raw.level, 1, 1, 3);
  return { sector: Math.floor(raw.sector), weapon, level, score: finite(raw.score, 0, 0, 1e9), seed: finite(raw.seed, 331042, 1, 0xffffffff), assist: bool(raw.assist), arsenal: restoreArsenal(raw.arsenal, weapon, level) };
}

export function parsePocketSave(raw: string | null): PocketSave {
  if (!raw) return emptyPocketSave();
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return emptyPocketSave();
    const value = parsed as Record<string, unknown>;
    if (value.version !== 2 || value.edition !== "pocket")
      return emptyPocketSave();
    const source = emptyPocketSave();
    const settings = value.settings as Record<string, unknown> | undefined;
    if (settings && typeof settings === "object") {
      const s = source.settings;
      s.music = clamp01(settings.music, BASE_SETTINGS.music);
      s.effects = clamp01(settings.effects, BASE_SETTINGS.effects);
      s.muted = bool(settings.muted);
      s.reducedMotion = bool(settings.reducedMotion);
      s.lowFlashes = bool(settings.lowFlashes, true);
      s.highContrast = bool(settings.highContrast);
      s.lowEffects = bool(settings.lowEffects);
      s.leftHanded = bool(settings.leftHanded);
      s.control = settings.control === "stick" ? "stick" : "drag";
      s.assist = bool(settings.assist);
      s.skin = "lcd";
      s.preset = PRESET_NAMES.includes(settings.preset as PresetName)
        ? (settings.preset as PresetName)
        : s.preset;
      s.palette = PALETTE_NAMES.includes(settings.palette as PaletteName)
        ? (settings.palette as PaletteName)
        : "olive";
    }
    source.checkpoint = checkpoint(value.checkpoint);
    if (value.best && typeof value.best === "object")
      for (const [key, score] of Object.entries(
        value.best as Record<string, unknown>,
      ))
        if (
          typeof score === "number" &&
          Number.isFinite(score) &&
          /^[a-z:]+$/.test(key)
        )
          source.best[key] = Math.max(0, score);
    return source;
  } catch {
    return emptyPocketSave();
  }
}

export function readPocketSave(): PocketSave {
  try {
    return parsePocketSave(window.localStorage.getItem(POCKET_STORAGE_KEY));
  } catch {
    return emptyPocketSave();
  }
}

export function writePocketSave(save: PocketSave): boolean {
  try {
    window.localStorage.setItem(POCKET_STORAGE_KEY, JSON.stringify(save));
    return true;
  } catch {
    return false;
  }
}

export function persistPocketGame(save: PocketSave, game: Game): PocketSave {
  const next: PocketSave = {
    ...save,
    settings: { ...save.settings },
    best: { ...save.best },
  };
  if (game.mode === "campaign" && game.checkpoint) next.checkpoint = { ...game.checkpoint, arsenal: game.checkpoint.arsenal ? { ...game.checkpoint.arsenal } : undefined };
  if (game.mode === "campaign" && game.status === "victory") next.checkpoint = null;
  const key = game.mode + (game.assist ? ":assist" : ":standard");
  if (game.score > (next.best[key] ?? 0)) next.best[key] = game.score;
  return next;
}
