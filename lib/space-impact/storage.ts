import { isWeapon, restoreArsenal } from "./arsenal";
import { clamp, DEFAULT_SETTINGS, STORAGE_KEY } from "./config";
import { SECRET_IDS } from "./content/secrets";
import type {
  Checkpoint,
  Game,
  Point,
  Profile,
  Secret,
  Settings,
  Weapon,
} from "./types";

const number = (value: unknown, fallback: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, max)
    : fallback;
const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const weapon = (value: unknown): Weapon =>
  isWeapon(value) ? value : "pulse";
export function emptyProfile(): Profile {
  return {
    version: 1,
    settings: { ...DEFAULT_SETTINGS },
    secrets: [],
    highestSector: 0,
    best: {},
    checkpoint: null,
    ghost: null,
    completed: false,
  };
}
/** Parse a versioned envelope. Malformed and unsupported versions fall back to a safe empty profile. */
export function parseProfile(raw: string | null): Profile {
  const result = emptyProfile();
  if (!raw) return result;
  try {
    const value = object(JSON.parse(raw));
    if (value.version !== 1) return result;
    const settings = object(value.settings);
    for (const key of [
      "muted",
      "reducedMotion",
      "lowFlashes",
      "highContrast",
      "lowEffects",
      "leftHanded",
      "assist",
    ] as const) {
      const setting = settings[key];
      if (typeof setting === "boolean") result.settings[key] = setting;
    }
    result.settings.music = number(settings.music, DEFAULT_SETTINGS.music, 1);
    result.settings.effects = number(
      settings.effects,
      DEFAULT_SETTINGS.effects,
      1,
    );
    result.settings.control = settings.control === "stick" ? "stick" : "drag";
    result.secrets = Array.isArray(value.secrets)
      ? Array.from(
          new Set(
            value.secrets.filter((id): id is Secret =>
              SECRET_IDS.includes(id as Secret),
            ),
          ),
        )
      : [];
    result.settings.skin =
      settings.skin === "lcd" && result.secrets.includes("lcd")
        ? "lcd"
        : "color";
    result.highestSector = Math.floor(number(value.highestSector, 0, 4));
    result.completed = value.completed === true;
    const best = object(value.best);
    for (const mode of ["campaign", "arcade", "practice", "challenge"]) {
      for (const kind of [":assist", ":standard"])
        result.best[mode + kind] = Math.floor(
          number(best[mode + kind], 0, 1e9),
        );
    }
    const cp = object(value.checkpoint);
    if (
      typeof cp.sector === "number" &&
      cp.sector >= 0 &&
      cp.sector <= result.highestSector
    ) {
      result.checkpoint = {
        sector: Math.floor(cp.sector),
        weapon: weapon(cp.weapon),
        level: Math.max(1, Math.floor(number(cp.level, 1, 3))),
        score: number(cp.score, 0, 1e9),
        seed: Math.max(1, Math.floor(number(cp.seed, 331042, 0xffffffff))),
        assist: cp.assist === true,
        arsenal: restoreArsenal(cp.arsenal, weapon(cp.weapon), Math.max(1, Math.floor(number(cp.level, 1, 3)))),
      };
    }
    const ghost = object(value.ghost);
    if (
      Array.isArray(ghost.points) &&
      typeof ghost.sector === "number" &&
      ghost.sector >= 0 &&
      ghost.sector < 5
    ) {
      const points: Point[] = [];
      for (const point of ghost.points.slice(-300)) {
        const p = object(point);
        if (
          typeof p.x === "number" &&
          typeof p.y === "number" &&
          Number.isFinite(p.x) &&
          Number.isFinite(p.y)
        ) {
          points.push({ x: clamp(p.x, 0, 480), y: clamp(p.y, 0, 270) });
        }
      }
      if (points.length)
        result.ghost = { sector: Math.floor(ghost.sector), points };
    }
    return result;
  } catch {
    return result;
  }
}
export function readProfile(): Profile {
  try {
    return parseProfile(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return emptyProfile();
  }
}
export function writeProfile(profile: Profile): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}
export function persistGame(profile: Profile, game: Game): Profile {
  const result: Profile = {
    ...profile,
    secrets: Array.from(new Set([...profile.secrets, ...game.secrets])),
    best: { ...profile.best },
    settings: { ...profile.settings },
  };
  const key = game.mode + (game.assist ? ":assist" : ":standard");
  result.best[key] = Math.max(result.best[key] || 0, game.score);
  if (game.mode === "campaign") {
    result.highestSector = Math.max(
      profile.highestSector,
      game.sector,
      game.checkpoint?.sector ?? 0,
    );
    if (game.checkpoint) result.checkpoint = { ...game.checkpoint };
    if (game.status === "victory") {
      result.completed = true;
      result.checkpoint = null;
    }
  }
  if (game.status === "dead" && game.trace.length)
    result.ghost = { sector: game.sector, points: game.trace.slice(-300) };
  return result;
}
export function checkpointFor(game: Game, sector: number): Checkpoint {
  return {
    sector,
    weapon: game.player.weapon,
    level: game.player.level,
    score: game.score,
    seed: game.seed,
    assist: game.assist,
    arsenal: { ...game.player.arsenal, [game.player.weapon]: game.player.level },
  };
}
export function updateSettings(
  profile: Profile,
  settings: Partial<Settings>,
): Profile {
  return parseProfile(
    JSON.stringify({
      ...profile,
      settings: { ...profile.settings, ...settings },
    }),
  );
}
