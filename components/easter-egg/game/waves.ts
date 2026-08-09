import { createBoss, createMiniBoss } from "./bosses";
import {
  BOSS_NAMES,
  DIFFICULTY_PRESETS,
  MINI_BOSS_NAMES,
  MINI_BOSS_WAVE_IN_SECTOR,
  WAVES_PER_SECTOR,
  WAVE_MODIFIER_META,
  getSectorForWave,
  getWaveInSector,
} from "./config";
import { createEnemyFromSlot } from "./enemies";
import { buildFormation, pickFormationKind } from "./formations";
import type { EnemyKind, GameModel, WaveModifierKind } from "./types";
import { clamp } from "./utils";

export function chooseEnemyKind(wave: number, row: number, column: number): EnemyKind {
  const key = row + column;
  if ((key + wave) % 11 === 0) return "popcorn";
  if (wave >= 16 && (key * 3 + column) % 13 === 0) return "elite";
  if (wave >= 13 && (key + row) % 10 === 0) return "healer";
  if (wave >= 10 && (key * 2 + row) % 9 === 0) return "splitter";
  if (wave >= 8 && (key + column) % 7 === 0) return "diver";
  if (wave >= 6 && (row * 2 + column) % 7 === 0) return "armored";
  if (wave >= 4 && (row + column) % 4 === 0) return "ufo";
  if (wave >= 2 && column % 3 === 1) return "shooter";
  return "grunt";
}

const SECTOR_MODIFIER_ROTATION: WaveModifierKind[] = [
  "meteorStorm",
  "lowGravity",
  "armoredUp",
  "aggressiveDivers",
  "regen",
  "rotatingFormation",
];

export function pickWaveModifier(
  waveInSector: number,
  sectorIndex: number,
): WaveModifierKind | null {
  if (waveInSector === 2) return "fastEntry";
  if (waveInSector === 3) return "richDrops";
  if (waveInSector === 5) {
    return SECTOR_MODIFIER_ROTATION[sectorIndex % SECTOR_MODIFIER_ROTATION.length];
  }
  return null;
}

export function spawnNextWave(model: GameModel): WaveModifierKind[] {
  model.wave += 1;
  const wave = model.wave;
  const sector = getSectorForWave(wave);
  const waveInSector = getWaveInSector(wave);
  model.sector = sector.id;

  if (waveInSector === 1) {
    model.banner = {
      kind: "sector",
      subtitle: sector.tagline,
      timer: 3,
      title: `Sector ${sector.id}: ${sector.name}`,
    };
  }

  if (waveInSector === WAVES_PER_SECTOR) {
    const info = BOSS_NAMES[sector.bossArchetype];
    model.banner = {
      kind: "boss",
      subtitle: info.title,
      timer: 2.8,
      title: `Warning: ${info.name}`,
    };
    model.sfxQueue.push("bossWarning");
    model.screenFlash = { color: "#ff1744", timer: 0.22 };
    model.shake = Math.max(model.shake, 14);
    model.enemies.push(createBoss(model, sector.bossArchetype));
    model.activeModifiers = [];
    return [];
  }

  if (waveInSector === MINI_BOSS_WAVE_IN_SECTOR) {
    const info = MINI_BOSS_NAMES[sector.miniBossArchetype];
    model.banner = {
      kind: "boss",
      subtitle: info.title,
      timer: 2.4,
      title: `Mini-boss: ${info.name}`,
    };
    model.sfxQueue.push("bossWarning");
    model.screenFlash = { color: "#ff1744", timer: 0.22 };
    model.shake = Math.max(model.shake, 10);
    model.enemies.push(createMiniBoss(model, sector.miniBossArchetype));
    model.activeModifiers = [];
    return [];
  }

  const modifier = pickWaveModifier(waveInSector, sector.id - 1);
  const modifiers = modifier ? [modifier] : [];
  model.activeModifiers = modifiers;

  if (modifier) {
    const meta = WAVE_MODIFIER_META[modifier];
    model.banner = { kind: "modifier", subtitle: meta.sub, timer: 2, title: meta.label };
  } else {
    model.banner = {
      kind: "wave",
      subtitle: "Cluck squad inbound",
      timer: 1.4,
      title: `Wave ${wave}`,
    };
  }

  const columns = clamp(
    4 + Math.floor(wave / 3) + DIFFICULTY_PRESETS[model.difficulty].extraColumns,
    3,
    10,
  );
  const rows = clamp(2 + Math.floor(wave / 5), 2, 4);
  const spacing = Math.min(78, model.width / (columns + 0.8));
  const formationKind = modifiers.includes("rotatingFormation")
    ? "orbitRing"
    : pickFormationKind(waveInSector);
  const slots = buildFormation(formationKind, columns, rows, spacing, model.width);

  slots.forEach((slotDef, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const kind = chooseEnemyKind(wave, row, column);
    const enemy = createEnemyFromSlot(model, kind, slotDef, modifiers);
    model.enemies.push(enemy);
  });

  return modifiers;
}
