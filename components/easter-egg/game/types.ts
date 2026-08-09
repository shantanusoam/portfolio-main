export type GameStatus = "ready" | "running" | "paused" | "ended";

export type GameDifficulty = "easy" | "hard";
export type EnemySkin = "classic" | "topdown";
export type ShipSkin = "circuit" | "classic" | "ghost" | "solar";

export type WeaponType =
  | "bomb"
  | "laser"
  | "missile"
  | "pulse"
  | "rapid"
  | "spread";

export type PowerKind =
  | "drone"
  | "health"
  | "invincible"
  | "magnet"
  | "nova"
  | "shield"
  | "timewarp";

export type EnemyKind =
  | "armored"
  | "boss"
  | "diver"
  | "elite"
  | "grunt"
  | "healer"
  | "miniBoss"
  | "popcorn"
  | "shooter"
  | "splitter"
  | "splitterling"
  | "ufo";

export type BossArchetype =
  | "admiralDrumstick"
  | "mothercluckerPrime"
  | "omeletteEngine";

export type MiniBossArchetype = "colonelCluckles" | "sergeantYolk";

export type AiState =
  | "attacking"
  | "diving"
  | "entering"
  | "enraged"
  | "forming"
  | "phaseTransition"
  | "retreating"
  | "stunned"
  | "supporting";

export type FormationKind =
  | "convoy"
  | "gridRanks"
  | "orbitRing"
  | "pincer"
  | "snake"
  | "spiralEntry"
  | "staggeredColumns"
  | "vFormation";

export type WaveModifierKind =
  | "aggressiveDivers"
  | "armoredUp"
  | "fastEntry"
  | "lowGravity"
  | "meteorStorm"
  | "regen"
  | "richDrops"
  | "rotatingFormation";

export type BulletKind =
  | "bomb"
  | "droneBolt"
  | "egg"
  | "feather"
  | "laser"
  | "meteor"
  | "missile"
  | "pulse"
  | "rapidBolt"
  | "spreadPellet";

export type BulletSource = "drone" | "enemy" | "player";

export type SfxKind =
  | "bossPhase"
  | "bossWarning"
  | "comboUp"
  | "enemyDeath"
  | "enemyHit"
  | "gameOver"
  | "graze"
  | "missileExplode"
  | "pickup"
  | "playerDamage"
  | "shieldImpact"
  | "shootBomb"
  | "shootLaser"
  | "shootMissile"
  | "shootPulse"
  | "shootRapid"
  | "shootSpread"
  | "superActivate"
  | "superReady"
  | "weaponSwitch";

export type BannerKind = "sector" | "wave" | "boss" | "victory" | "modifier";

export type Banner = {
  kind: BannerKind;
  subtitle: string;
  timer: number;
  title: string;
};

export type Telegraph = {
  data: Record<string, number>;
  duration: number;
  kind: string;
  timer: number;
};

export type BossComponent = {
  destroyed: boolean;
  hp: number;
  id: string;
  label: string;
  maxHp: number;
  offsetX: number;
  offsetY: number;
  radius: number;
};

export type DroneCompanion = {
  angleOffset: number;
  fireCooldown: number;
  life: number;
};

export type Player = {
  bankTilt: number;
  drones: DroneCompanion[];
  fireCooldown: number;
  hull: number;
  hullMax: number;
  invincibleTimer: number;
  lives: number;
  magnetTimer: number;
  powerInvincibleTimer: number;
  r: number;
  respawnTimer: number;
  shieldHp: number;
  shieldMax: number;
  shotParity: number;
  super: number;
  superActiveTimer: number;
  vx: number;
  vy: number;
  weapon: WeaponType;
  weaponLevel: number;
  x: number;
  y: number;
};

export type Enemy = {
  age: number;
  aiState: AiState;
  baseX: number;
  bossArchetype?: BossArchetype;
  bossPhase?: number;
  components?: BossComponent[];
  dead?: boolean;
  enrageTimer: number;
  fireCooldown: number;
  flashTimer: number;
  formation?: FormationKind;
  formationCenterX?: number;
  formationCenterY?: number;
  formationRadius?: number;
  hasSpawnedAdd?: boolean;
  homeY: number;
  hp: number;
  id: number;
  kind: EnemyKind;
  maxHp: number;
  miniBossArchetype?: MiniBossArchetype;
  phase: number;
  r: number;
  score: number;
  stateTimer: number;
  telegraph?: Telegraph;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type Bullet = {
  age: number;
  damage: number;
  dead?: boolean;
  grazed?: boolean;
  homing?: boolean;
  id: number;
  kind: BulletKind;
  pierce: number;
  r: number;
  source: BulletSource;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type WeaponPickup = {
  age: number;
  id: number;
  r: number;
  spin: number;
  vx: number;
  vy: number;
  weapon: WeaponType;
  x: number;
  y: number;
};

export type PowerUp = {
  age: number;
  id: number;
  kind: PowerKind;
  r: number;
  spin: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type HazardZone = {
  age: number;
  damage: number;
  hit: boolean;
  id: number;
  life: number;
  r: number;
  telegraphTime: number;
  x: number;
  y: number;
};

export type Particle = {
  age: number;
  color: string;
  life: number;
  r: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

export type Shockwave = {
  age: number;
  color: string;
  id: number;
  life: number;
  maxRadius: number;
  x: number;
  y: number;
};

export type FloatText = {
  age: number;
  color: string;
  life: number;
  text: string;
  x: number;
  y: number;
};

export type PointerState = {
  active: boolean;
  x: number;
  y: number;
};

export type ScreenFlash = {
  color: string;
  timer: number;
};

export type GameModel = {
  activeModifiers: WaveModifierKind[];
  banner: Banner | null;
  best: number;
  bullets: Bullet[];
  combo: number;
  comboPulseId: number;
  comboTimer: number;
  dpr: number;
  difficulty: GameDifficulty;
  dropsSincePowerup: number;
  dropsSinceWeapon: number;
  elapsed: number;
  enemySkin: EnemySkin;
  enemies: Enemy[];
  floats: FloatText[];
  hazards: HazardZone[];
  height: number;
  hitStop: number;
  noDamageStreakWaves: number;
  particles: Particle[];
  player: Player;
  pointer: PointerState;
  powerUps: PowerUp[];
  score: number;
  screenFlash: ScreenFlash | null;
  sector: number;
  shipSkin: ShipSkin;
  sfxQueue: SfxKind[];
  shake: number;
  shockwaves: Shockwave[];
  status: GameStatus;
  timewarpTimer: number;
  wave: number;
  waveClearedNoDamage: boolean;
  waveCooldown: number;
  weaponPickups: WeaponPickup[];
  width: number;
};

export type HudState = {
  banner: Banner | null;
  best: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
  bossPhase: number;
  bossPhaseMax: number;
  combo: number;
  comboPulseId: number;
  droneCount: number;
  enemySkin: EnemySkin;
  difficulty: GameDifficulty;
  hull: number;
  hullMax: number;
  invincibleTimer: number;
  lives: number;
  magnetTimer: number;
  multiplier: number;
  rank: string;
  score: number;
  sector: number;
  shipSkin: ShipSkin;
  shieldHp: number;
  shieldMax: number;
  status: GameStatus;
  timewarpTimer: number;
  super: number;
  superReady: boolean;
  wave: number;
  waveInSector: number;
  wavesPerSector: number;
  weapon: WeaponType;
  weaponLevel: number;
};
