import type {
  BossArchetype,
  EnemySkin,
  GameDifficulty,
  MiniBossArchetype,
  PowerKind,
  ShipSkin,
  WaveModifierKind,
  WeaponType,
} from "./types";

export const STORAGE_KEYS = {
  best: "portfolio-cluckstorm-high-score",
  controlMode: "portfolio-cluckstorm-control-mode",
  highestSector: "portfolio-cluckstorm-highest-sector",
  muted: "portfolio-cluckstorm-muted",
} as const;

export const PLAYER_TUNING = {
  acceleration: 1600,
  contactDamage: 26,
  dragPerSecond: 0.035,
  hullMax: 100,
  invincibleFlashHz: 18,
  magnetRadius: 260,
  maxSpeed: 440,
  r: 18,
  respawnDuration: 1.4,
  respawnInvincible: 2.4,
  shieldMax: 60,
};

/** Keep the ship clear of DOM HUD chrome (taller bottom pad on portrait phones). */
export function getPlayerYBounds(width: number, height: number) {
  const portrait = height / Math.max(1, width) >= 1.3;
  const top = height * (portrait ? 0.4 : 0.42);
  const bottomPad = portrait ? Math.max(108, Math.round(height * 0.14)) : 72;
  return {
    bottom: height - bottomPad,
    respawnY: height - bottomPad - 28,
    top,
  };
}

export const WEAPON_MAX_LEVEL = 5;

export const WEAPON_NAMES: Record<WeaponType, string> = {
  bomb: "Nova Bombs",
  laser: "Laser",
  missile: "Homing Missiles",
  pulse: "Pulse Cannon",
  rapid: "Rapid Fire",
  spread: "Spread Shot",
};

export const WEAPON_COLORS: Record<WeaponType, string> = {
  bomb: "#ff6b8f",
  laser: "#8df6ff",
  missile: "#ffb23f",
  pulse: "#fff0c5",
  rapid: "#ffe45e",
  spread: "#7dffb0",
};

export const POWER_LABELS: Record<PowerKind, string> = {
  drone: "Drone Companion",
  health: "Repair Crate",
  invincible: "Invincibility",
  magnet: "Magnet",
  nova: "Nova Charge",
  shield: "Shield",
  timewarp: "Time Warp",
};

export const POWER_COLORS: Record<PowerKind, string> = {
  drone: "#c9a8ff",
  health: "#7dffb0",
  invincible: "#fff566",
  magnet: "#8df6ff",
  nova: "#ff9ad1",
  shield: "#65eaff",
  timewarp: "#7ad7ff",
};

export const SUPER_TUNING = {
  costOnActivate: 100,
  gainCombo: 1.4,
  gainGraze: 2.2,
  gainKill: {
    armored: 3.5,
    boss: 0,
    diver: 2,
    elite: 4,
    grunt: 1.6,
    healer: 3,
    miniBoss: 0,
    popcorn: 1.2,
    shooter: 2.2,
    splitter: 2.4,
    splitterling: 0.8,
    ufo: 2.6,
  } as Record<string, number>,
  gainNova: 42,
  max: 100,
};

export const GRAZE_TUNING = {
  band: 30,
  comboBonus: 1,
  scoreBonus: 12,
};

export const RANKS: { name: string; score: number }[] = [
  { name: "Egg Cadet", score: 0 },
  { name: "Feather Ace", score: 12000 },
  { name: "Coop Commander", score: 35000 },
  { name: "Galactic Rooster", score: 80000 },
  { name: "Poultry Legend", score: 160000 },
];

export const WAVE_MODIFIER_META: Record<
  WaveModifierKind,
  { label: string; sub: string }
> = {
  aggressiveDivers: {
    label: "Aggressive Divers",
    sub: "Kamikaze birds dive early and often",
  },
  armoredUp: { label: "Armor Plating", sub: "Enemies shrug off more hits" },
  fastEntry: { label: "Fast Entry", sub: "Formations rush into position" },
  lowGravity: { label: "Low Gravity", sub: "Enemies drift wider and slower" },
  meteorStorm: { label: "Meteor Storm", sub: "Roasted rocks rain from above" },
  regen: { label: "Flock Regeneration", sub: "Wounded birds slowly heal" },
  richDrops: { label: "Rich Drops", sub: "Crates fall more generously" },
  rotatingFormation: {
    label: "Rotating Formation",
    sub: "The flock wheels around the sky",
  },
};

export const BOSS_NAMES: Record<BossArchetype, { name: string; title: string }> = {
  admiralDrumstick: {
    name: "Admiral Drumstick",
    title: "Armor. Ambition. An unreasonable amount of gravy.",
  },
  mothercluckerPrime: {
    name: "Motherclucker Prime",
    title: "Sovereign of the Omelette Nebula",
  },
  omeletteEngine: {
    name: "The Omelette Engine",
    title: "A reactor core with anger issues",
  },
};

export const MINI_BOSS_NAMES: Record<
  MiniBossArchetype,
  { name: string; title: string }
> = {
  colonelCluckles: {
    name: "Colonel Cluckles",
    title: "Decorated. Deranged. Diving at your face.",
  },
  sergeantYolk: {
    name: "Sergeant Yolk",
    title: "Monocle polished, missiles loaded",
  },
};

export type SectorDef = {
  bgFrom: string;
  bgTo: string;
  bossArchetype: BossArchetype;
  completion: string;
  id: number;
  miniBossArchetype: MiniBossArchetype;
  name: string;
  tagline: string;
  wavesPerSector: number;
};

export const WAVES_PER_SECTOR = 6;
export const MINI_BOSS_WAVE_IN_SECTOR = 4;

export const SECTOR_DEFS: SectorDef[] = [
  {
    bgFrom: "#120735",
    bgTo: "#030312",
    bossArchetype: "mothercluckerPrime",
    completion: "Training Coop cleared. The real henhouse awaits.",
    id: 1,
    miniBossArchetype: "colonelCluckles",
    name: "Training Coop",
    tagline: "Basic drills for basic birds",
    wavesPerSector: WAVES_PER_SECTOR,
  },
  {
    bgFrom: "#2a0b3f",
    bgTo: "#0a0420",
    bossArchetype: "admiralDrumstick",
    completion: "The Omelette Nebula stops jiggling. For now.",
    id: 2,
    miniBossArchetype: "sergeantYolk",
    name: "The Omelette Nebula",
    tagline: "Runny, glowing, and hostile",
    wavesPerSector: WAVES_PER_SECTOR,
  },
  {
    bgFrom: "#3a1208",
    bgTo: "#160402",
    bossArchetype: "omeletteEngine",
    completion: "Rooster Reactor SCRAM'd. Core temperature: smug.",
    id: 3,
    miniBossArchetype: "colonelCluckles",
    name: "Rooster Reactor",
    tagline: "Do not feed the core",
    wavesPerSector: WAVES_PER_SECTOR,
  },
  {
    bgFrom: "#031a2e",
    bgTo: "#01060f",
    bossArchetype: "mothercluckerPrime",
    completion: "Featherstorm Belt calm at last. Mostly feathers now.",
    id: 4,
    miniBossArchetype: "sergeantYolk",
    name: "Featherstorm Belt",
    tagline: "Turbulence, but make it poultry",
    wavesPerSector: WAVES_PER_SECTOR,
  },
  {
    bgFrom: "#2d0018",
    bgTo: "#08000a",
    bossArchetype: "admiralDrumstick",
    completion: "The Henpire kneels. History will remember this omelette.",
    id: 5,
    miniBossArchetype: "colonelCluckles",
    name: "Throne of the Henpire",
    tagline: "The final coop",
    wavesPerSector: WAVES_PER_SECTOR,
  },
];

export function getSectorForWave(wave: number): SectorDef {
  const safeWave = Math.max(1, wave);
  const index = Math.min(
    SECTOR_DEFS.length - 1,
    Math.floor((safeWave - 1) / WAVES_PER_SECTOR),
  );
  return SECTOR_DEFS[index];
}

export function getWaveInSector(wave: number): number {
  const safeWave = Math.max(1, wave);
  return ((safeWave - 1) % WAVES_PER_SECTOR) + 1;
}

export function isEndlessWave(wave: number): boolean {
  return wave > WAVES_PER_SECTOR * SECTOR_DEFS.length;
}

export const DIFFICULTY_TUNING = {
  bulletSpeedPerWave: 5,
  hpScalePerWave: 0.1,
  softenBulletsAtOneLife: 0.82,
  spawnScalePerWave: 0.03,
};

export const DIFFICULTY_PRESETS: Record<
  GameDifficulty,
  {
    enemyHp: number;
    enemyPressure: number;
    extraColumns: number;
    label: string;
  }
> = {
  easy: {
    enemyHp: 0.78,
    enemyPressure: 0.78,
    extraColumns: -1,
    label: "Easy",
  },
  hard: {
    enemyHp: 1.22,
    enemyPressure: 1.28,
    extraColumns: 1,
    label: "Hard",
  },
};

export const SHIP_SKIN_NAMES: Record<ShipSkin, string> = {
  circuit: "Circuit Courier",
  classic: "Classic Comet",
  ghost: "Ghost Signal",
  solar: "Solar Flare",
};

export const ENEMY_SKIN_NAMES: Record<EnemySkin, string> = {
  classic: "Classic Flock",
  topdown: "Top-down Flock",
};
