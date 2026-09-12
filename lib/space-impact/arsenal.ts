import { WEAPON_ORDER } from "./config";
import type { Arsenal, Weapon } from "./types";
export function isWeapon(value: unknown): value is Weapon { return WEAPON_ORDER.includes(value as Weapon); }
/** Old saves retain their equipped gun; untrusted levels stay in 0..3. */
export function restoreArsenal(raw: unknown, equipped: Weapon = "pulse", level = 1): Arsenal {
  const arsenal: Arsenal = { pulse: 1, split: 0, rail: 0, seeker: 0 };
  if (raw && typeof raw === "object") for (const weapon of WEAPON_ORDER) {
    const n = (raw as Record<string, unknown>)[weapon];
    if (typeof n === "number" && Number.isFinite(n)) arsenal[weapon] = Math.min(3, Math.max(0, Math.floor(n)));
  }
  arsenal.pulse = Math.max(1, arsenal.pulse);
  arsenal[equipped] = Math.min(3, Math.max(1, Number.isFinite(level) ? Math.floor(level) : 1));
  return arsenal;
}
