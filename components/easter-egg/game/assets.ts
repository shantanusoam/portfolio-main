export type SpriteCell = { column: number; row: number };

export type AtlasKey = "cluckerAtlas" | "spaceAtlas";
export type BackgroundKey = "cluckerBackground" | "cockpitBackdrop";
export type TextureKey = "holoGrid" | "speedRing" | "starfield";
export type SpriteV2Key =
  | "bossAdmiralDrumstick"
  | "bossOmeletteEngine"
  | "classicBossAdmiralDrumstick"
  | "classicBossOmeletteEngine"
  | "classicEliteBird"
  | "classicHealerSupportBird"
  | "classicKamikazeDiverBird"
  | "classicMiniBossSergeantYolk"
  | "classicSplitterBird"
  | "classicSplitterling"
  | "bombProjectileTopdown"
  | "armoredBirdTopdown"
  | "eliteBird"
  | "healerSupportBird"
  | "kamikazeDiverBird"
  | "miniBossSergeantYolk"
  | "laserBoltTopdown"
  | "missileProjectileTopdown"
  | "playerCourierTopdown"
  | "gruntBirdTopdown"
  | "powerupNovaIcon"
  | "powerupTimewarpIcon"
  | "popcornAsteroidTopdown"
  | "shooterBirdTopdown"
  | "splitterBird"
  | "splitterling"
  | "ufoBirdTopdown";

export type AssetKey = AtlasKey | BackgroundKey | SpriteV2Key | TextureKey;
export type GameAssets = Partial<Record<AssetKey, HTMLImageElement>>;

export const ASSET_SOURCES: Record<AssetKey, string> = {
  bossAdmiralDrumstick:
    "/easter-egg/generated/shmup-sprites-v2/boss-admiral-drumstick.png",
  bossOmeletteEngine:
    "/easter-egg/generated/shmup-sprites-v2/boss-omelette-engine.png",
  classicBossAdmiralDrumstick:
    "/easter-egg/generated/shmup-sprites-v2/classic-boss-admiral-drumstick.png",
  classicBossOmeletteEngine:
    "/easter-egg/generated/shmup-sprites-v2/classic-boss-omelette-engine.png",
  classicEliteBird:
    "/easter-egg/generated/shmup-sprites-v2/classic-elite-bird.png",
  classicHealerSupportBird:
    "/easter-egg/generated/shmup-sprites-v2/classic-healer-support-bird.png",
  classicKamikazeDiverBird:
    "/easter-egg/generated/shmup-sprites-v2/classic-kamikaze-diver-bird.png",
  classicMiniBossSergeantYolk:
    "/easter-egg/generated/shmup-sprites-v2/classic-miniboss-sergeant-yolk.png",
  classicSplitterBird:
    "/easter-egg/generated/shmup-sprites-v2/classic-splitter-bird.png",
  classicSplitterling:
    "/easter-egg/generated/shmup-sprites-v2/classic-splitterling.png",
  bombProjectileTopdown:
    "/easter-egg/generated/shmup-sprites-v2/bomb-projectile-topdown.png",
  armoredBirdTopdown:
    "/easter-egg/generated/shmup-sprites-v2/armored-bird-topdown.png",
  cluckerAtlas: "/easter-egg/generated/clucker-atlas.png",
  cluckerBackground: "/easter-egg/generated/clucker-space-bg.webp",
  cockpitBackdrop: "/easter-egg/generated/cockpit-backdrop.webp",
  eliteBird: "/easter-egg/generated/shmup-sprites-v2/elite-bird.png",
  gruntBirdTopdown:
    "/easter-egg/generated/shmup-sprites-v2/grunt-bird-topdown.png",
  healerSupportBird:
    "/easter-egg/generated/shmup-sprites-v2/healer-support-bird.png",
  holoGrid: "/easter-egg/textures/holo-grid.svg",
  kamikazeDiverBird:
    "/easter-egg/generated/shmup-sprites-v2/kamikaze-diver-bird.png",
  laserBoltTopdown:
    "/easter-egg/generated/shmup-sprites-v2/laser-bolt-topdown.png",
  miniBossSergeantYolk:
    "/easter-egg/generated/shmup-sprites-v2/miniboss-sergeant-yolk.png",
  missileProjectileTopdown:
    "/easter-egg/generated/shmup-sprites-v2/missile-projectile-topdown.png",
  playerCourierTopdown:
    "/easter-egg/generated/shmup-sprites-v2/player-courier-topdown.png",
  popcornAsteroidTopdown:
    "/easter-egg/generated/shmup-sprites-v2/popcorn-asteroid-topdown.png",
  powerupNovaIcon:
    "/easter-egg/generated/shmup-sprites-v2/powerup-nova-icon.png",
  powerupTimewarpIcon:
    "/easter-egg/generated/shmup-sprites-v2/powerup-timewarp-icon.png",
  spaceAtlas: "/easter-egg/generated/space-opera-atlas.png",
  speedRing: "/easter-egg/fx/speed-ring.svg",
  shooterBirdTopdown:
    "/easter-egg/generated/shmup-sprites-v2/shooter-bird-topdown.png",
  splitterBird: "/easter-egg/generated/shmup-sprites-v2/splitter-bird.png",
  splitterling: "/easter-egg/generated/shmup-sprites-v2/splitterling.png",
  starfield: "/easter-egg/textures/starfield-tile.svg",
  ufoBirdTopdown:
    "/easter-egg/generated/shmup-sprites-v2/ufo-bird-topdown.png",
};

export const GAME_ASSET_COUNT = Object.keys(ASSET_SOURCES).length;

export const ATLAS_GRID = 4;

export type SpaceSpriteKey =
  | "boostPickup"
  | "bossWarning"
  | "courierShip"
  | "drone"
  | "engineFlame"
  | "privateBadge"
  | "radarPing"
  | "rareShard"
  | "shieldPickup"
  | "sparkBurst";

export const SPACE_SPRITES: Record<SpaceSpriteKey, SpriteCell> = {
  boostPickup: { column: 3, row: 1 },
  bossWarning: { column: 3, row: 3 },
  courierShip: { column: 0, row: 0 },
  drone: { column: 1, row: 0 },
  engineFlame: { column: 1, row: 3 },
  privateBadge: { column: 2, row: 3 },
  radarPing: { column: 3, row: 2 },
  rareShard: { column: 3, row: 0 },
  shieldPickup: { column: 2, row: 1 },
  sparkBurst: { column: 0, row: 3 },
};

export type CluckerSpriteKey =
  | "armored"
  | "boss"
  | "egg"
  | "explosion"
  | "feather"
  | "grunt"
  | "health"
  | "laser"
  | "meteor"
  | "miniBoss"
  | "missileCrate"
  | "popcorn"
  | "shield"
  | "shooter"
  | "ufo"
  | "wingCannon";

export const CLUCKER_SPRITES: Record<CluckerSpriteKey, SpriteCell> = {
  armored: { column: 2, row: 0 },
  boss: { column: 1, row: 3 },
  egg: { column: 1, row: 1 },
  explosion: { column: 3, row: 3 },
  feather: { column: 2, row: 1 },
  grunt: { column: 0, row: 0 },
  health: { column: 1, row: 2 },
  laser: { column: 3, row: 2 },
  meteor: { column: 3, row: 1 },
  miniBoss: { column: 0, row: 3 },
  missileCrate: { column: 2, row: 2 },
  popcorn: { column: 0, row: 1 },
  shield: { column: 0, row: 2 },
  shooter: { column: 1, row: 0 },
  ufo: { column: 3, row: 0 },
  wingCannon: { column: 2, row: 3 },
};

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function loadGameAssets(): Promise<GameAssets> {
  const entries = await Promise.all(
    Object.entries(ASSET_SOURCES).map(async ([key, src]) => {
      try {
        return [key, await loadImage(src)] as const;
      } catch {
        return [key, undefined] as const;
      }
    }),
  );

  return entries.reduce<GameAssets>((assets, [key, image]) => {
    if (image) assets[key as AssetKey] = image;
    return assets;
  }, {});
}

export function imageReady(
  image: HTMLImageElement | undefined,
): image is HTMLImageElement {
  return Boolean(image?.complete && image.naturalWidth > 0);
}

export function drawAtlasSprite<K extends string>(
  context: CanvasRenderingContext2D,
  atlas: HTMLImageElement | undefined,
  spriteMap: Record<K, SpriteCell>,
  sprite: K,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  alpha = 1,
): boolean {
  if (!imageReady(atlas)) return false;
  const cellWidth = atlas.naturalWidth / ATLAS_GRID;
  const cellHeight = atlas.naturalHeight / ATLAS_GRID;
  const { column, row } = spriteMap[sprite];

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = alpha;
  context.drawImage(
    atlas,
    column * cellWidth,
    row * cellHeight,
    cellWidth,
    cellHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  );
  context.restore();
  return true;
}

export function drawCenteredImage(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation = 0,
  alpha = 1,
): boolean {
  if (!imageReady(image)) return false;

  context.save();
  context.translate(x, y);
  context.rotate(rotation);
  context.globalAlpha = alpha;
  context.drawImage(image, -width / 2, -height / 2, width, height);
  context.restore();
  return true;
}
