import {
  CLUCKER_SPRITES,
  drawAtlasSprite,
  drawCenteredImage,
  imageReady,
  SPACE_SPRITES,
  type GameAssets,
} from "./assets";
import { getComponentWorldPosition } from "./bosses";
import { getSectorForWave, POWER_COLORS, WEAPON_COLORS } from "./config";
import { getActiveBoss } from "./update";
import type { Bullet, Enemy, GameModel, PowerKind, WeaponType } from "./types";
import { clamp, randomBetween } from "./utils";

const ENEMY_VISUAL_SCALE = 1.4;
const PROJECTILE_VISUAL_SCALE = 1.4;
const PICKUP_VISUAL_SCALE = 1.35;

export type RenderOptions = {
  reducedMotion: boolean;
};

function drawBackground(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
  options: RenderOptions,
) {
  const { width, height } = model;
  const sector = getSectorForWave(Math.max(1, model.wave));

  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, sector.bgFrom);
  gradient.addColorStop(1, sector.bgTo);
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  // Farthest depth layer: a sparse, slow-drifting star field behind the
  // nebula art so the scene reads as near/mid/far instead of one flat drop.
  const farTile = assets.starfield;
  if (imageReady(farTile)) {
    const tileSize = 340;
    const farSpeed = options.reducedMotion ? 3 : 11;
    const offset = (model.elapsed * farSpeed) % tileSize;
    context.save();
    context.globalAlpha = 0.16;
    for (let x = -tileSize; x < width + tileSize; x += tileSize) {
      for (let y = -tileSize + offset; y < height + tileSize; y += tileSize) {
        context.drawImage(farTile, x, y, tileSize, tileSize);
      }
    }
    context.restore();
  }

  const background = assets.cluckerBackground;
  if (imageReady(background)) {
    const scale = Math.max(width / background.naturalWidth, height / background.naturalHeight);
    const drawWidth = background.naturalWidth * scale;
    const drawHeight = background.naturalHeight * scale;
    const x = (width - drawWidth) / 2;
    const scrollSpeed = options.reducedMotion ? 18 : 52;
    const scroll = (model.elapsed * scrollSpeed) % drawHeight;

    context.save();
    context.globalAlpha = 0.85;
    for (let y = scroll - drawHeight; y < height + drawHeight; y += drawHeight) {
      context.drawImage(background, x, y, drawWidth, drawHeight);
    }
    context.restore();

    context.fillStyle = "rgba(2, 1, 12, 0.24)";
    context.fillRect(0, 0, width, height);
  }

  const tile = sector.id === 3 ? assets.holoGrid : assets.starfield;
  if (imageReady(tile)) {
    const tileSize = 128;
    const offsetSpeed = options.reducedMotion ? 10 : 38;
    const offset = (model.elapsed * offsetSpeed) % tileSize;
    context.save();
    context.globalAlpha = sector.id === 3 ? 0.16 : 0.3;
    for (let x = -tileSize; x < width + tileSize; x += tileSize) {
      for (let y = -tileSize + offset; y < height + tileSize; y += tileSize) {
        context.drawImage(tile, x, y, tileSize, tileSize);
      }
    }
    context.restore();
  }

  const boss = getActiveBoss(model);
  if (boss && imageReady(assets.cockpitBackdrop)) {
    context.save();
    context.globalAlpha = 0.14;
    context.drawImage(assets.cockpitBackdrop, 0, height - height * 0.4, width, height * 0.4);
    context.restore();
  }

  if (boss && (boss.bossPhase || 1) >= 3) {
    context.save();
    context.globalAlpha = 0.1 + Math.sin(model.elapsed * 6) * 0.03;
    context.fillStyle = "#ff2d55";
    context.fillRect(0, 0, width, height);
    context.restore();
  }

  if (model.timewarpTimer > 0) {
    context.save();
    context.globalAlpha = 0.14;
    context.fillStyle = "#7ad7ff";
    context.fillRect(0, 0, width, height);
    context.restore();
  }
}

function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full = clean.length === 3
    ? clean.split("").map((c) => c + c).join("")
    : clean;
  const value = Number.parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Soft breathing glow halo behind pickups — replaces the old hard-stroked
 * spinning diamond, which read as a harsh neon border against the painterly
 * background. Purely additive light, no geometric outline. */
function drawPickupGlow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string,
  pulse: number,
) {
  const radius = size * 0.68 * pulse;
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, hexToRgba(color, 0.38));
  gradient.addColorStop(0.55, hexToRgba(color, 0.14));
  gradient.addColorStop(1, hexToRgba(color, 0));
  context.save();
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawWeaponIcon(
  context: CanvasRenderingContext2D,
  weapon: WeaponType,
  x: number,
  y: number,
  size: number,
  age: number,
  elapsed: number,
  assets: GameAssets,
) {
  const pulse = 1 + Math.sin(elapsed * 3 + age) * 0.08;
  drawPickupGlow(context, x, y, size, WEAPON_COLORS[weapon], pulse);

  const bob = Math.sin(elapsed * 2.4 + age * 1.7) * size * 0.05;

  if (weapon === "laser") {
    drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "laser", x, y + bob, size * 0.78, size * 0.52, 0);
    return;
  }
  if (weapon === "missile") {
    drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "missileCrate", x, y + bob, size * 0.68, size * 0.68, 0);
    return;
  }
  if (weapon === "bomb") {
    if (
      drawCenteredImage(
        context,
        assets.bombProjectileTopdown,
        x,
        y + bob,
        size * 0.7,
        size * 0.7,
      )
    ) {
      return;
    }
  }

  const slowSpin = age * 0.6;
  context.save();
  context.translate(x, y);
  context.rotate(slowSpin);
  context.fillStyle = WEAPON_COLORS[weapon];
  context.strokeStyle = WEAPON_COLORS[weapon];
  if (weapon === "pulse") {
    context.beginPath();
    context.arc(0, 0, size * 0.16, 0, Math.PI * 2);
    context.fill();
  } else if (weapon === "rapid") {
    context.lineWidth = 3;
    [-4, 4].forEach((offset) => {
      context.beginPath();
      context.moveTo(offset - 3, -size * 0.2);
      context.lineTo(offset + 3, 0);
      context.lineTo(offset - 3, size * 0.2);
      context.stroke();
    });
  } else if (weapon === "spread") {
    [-0.4, 0, 0.4].forEach((angle) => {
      context.save();
      context.rotate(angle);
      context.beginPath();
      context.moveTo(0, size * 0.22);
      context.lineTo(0, -size * 0.22);
      context.lineWidth = 2.4;
      context.stroke();
      context.restore();
    });
  }
  context.restore();
}

function drawPowerIcon(
  context: CanvasRenderingContext2D,
  kind: PowerKind,
  x: number,
  y: number,
  size: number,
  age: number,
  elapsed: number,
  assets: GameAssets,
) {
  const pulse = 1 + Math.sin(elapsed * 3 + age) * 0.08;
  drawPickupGlow(context, x, y, size, POWER_COLORS[kind], pulse);

  const bob = Math.sin(elapsed * 2.4 + age * 1.7) * size * 0.05;
  const slowSpin = age * 0.5;

  if (kind === "health") {
    drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "health", x, y + bob, size * 0.7, size * 0.7, 0);
    return;
  }
  if (kind === "shield") {
    drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "shield", x, y, size * 0.7, size * 0.7, slowSpin);
    return;
  }
  if (kind === "magnet") {
    drawAtlasSprite(context, assets.spaceAtlas, SPACE_SPRITES, "radarPing", x, y, size * 0.7, size * 0.7, slowSpin);
    return;
  }
  if (kind === "invincible") {
    drawAtlasSprite(context, assets.spaceAtlas, SPACE_SPRITES, "rareShard", x, y, size * 0.7, size * 0.7, slowSpin);
    return;
  }
  if (kind === "drone") {
    drawAtlasSprite(context, assets.spaceAtlas, SPACE_SPRITES, "drone", x, y, size * 0.7, size * 0.7, slowSpin);
    return;
  }
  if (kind === "timewarp") {
    drawCenteredImage(context, assets.powerupTimewarpIcon, x, y, size * 0.72, size * 0.72, slowSpin);
    return;
  }
  if (kind === "nova") {
    drawCenteredImage(context, assets.powerupNovaIcon, x, y, size * 0.72, size * 0.72, slowSpin);
  }
}

function enemySpriteDraw(
  context: CanvasRenderingContext2D,
  enemy: Enemy,
  model: GameModel,
  assets: GameAssets,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): boolean {
  if (model.enemySkin === "classic") {
    switch (enemy.kind) {
      case "diver":
        return drawCenteredImage(context, assets.classicKamikazeDiverBird, x, y, width, height, rotation);
      case "healer":
        return drawCenteredImage(context, assets.classicHealerSupportBird, x, y, width, height, rotation);
      case "splitter":
        return drawCenteredImage(context, assets.classicSplitterBird, x, y, width, height, rotation);
      case "splitterling":
        return drawCenteredImage(context, assets.classicSplitterling, x, y, width, height, rotation);
      case "elite":
        return drawCenteredImage(context, assets.classicEliteBird, x, y, width, height, rotation);
      case "miniBoss":
        if (enemy.miniBossArchetype === "sergeantYolk") {
          return drawCenteredImage(context, assets.classicMiniBossSergeantYolk, x, y, width, height, rotation);
        }
        return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "miniBoss", x, y, width, height, rotation);
      case "boss":
        if (enemy.bossArchetype === "admiralDrumstick") {
          return drawCenteredImage(context, assets.classicBossAdmiralDrumstick, x, y, width, height, rotation);
        }
        if (enemy.bossArchetype === "omeletteEngine") {
          return drawCenteredImage(context, assets.classicBossOmeletteEngine, x, y, width, height, rotation);
        }
        return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "boss", x, y, width, height, rotation);
      default:
        return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, enemy.kind, x, y, width, height, rotation);
    }
  }

  switch (enemy.kind) {
    case "grunt":
      return drawCenteredImage(context, assets.gruntBirdTopdown, x, y, width, height, rotation);
    case "shooter":
      return drawCenteredImage(context, assets.shooterBirdTopdown, x, y, width, height, rotation);
    case "armored":
      return drawCenteredImage(context, assets.armoredBirdTopdown, x, y, width, height, rotation);
    case "ufo":
      return drawCenteredImage(context, assets.ufoBirdTopdown, x, y, width, height, rotation);
    case "popcorn":
      return drawCenteredImage(context, assets.popcornAsteroidTopdown, x, y, width, height, rotation);
    case "diver":
      return drawCenteredImage(context, assets.kamikazeDiverBird, x, y, width, height, rotation);
    case "healer":
      return drawCenteredImage(context, assets.healerSupportBird, x, y, width, height, rotation);
    case "splitter":
      return drawCenteredImage(context, assets.splitterBird, x, y, width, height, rotation);
    case "splitterling":
      return drawCenteredImage(context, assets.splitterling, x, y, width, height, rotation);
    case "elite":
      return drawCenteredImage(context, assets.eliteBird, x, y, width, height, rotation);
    case "miniBoss":
      if (enemy.miniBossArchetype === "sergeantYolk") {
        return drawCenteredImage(context, assets.miniBossSergeantYolk, x, y, width, height, rotation);
      }
      return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "miniBoss", x, y, width, height, rotation);
    case "boss":
      if (enemy.bossArchetype === "admiralDrumstick") {
        return drawCenteredImage(context, assets.bossAdmiralDrumstick, x, y, width, height, rotation);
      }
      if (enemy.bossArchetype === "omeletteEngine") {
        return drawCenteredImage(context, assets.bossOmeletteEngine, x, y, width, height, rotation);
      }
      return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "boss", x, y, width, height, rotation);
    default:
      return drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, enemy.kind, x, y, width, height, rotation);
  }
}

function drawBossComponents(context: CanvasRenderingContext2D, enemy: Enemy, assets: GameAssets) {
  if (!enemy.components?.length) return;

  enemy.components.forEach((component) => {
    const pos = getComponentWorldPosition(enemy, component);
    if (component.destroyed) {
      context.save();
      context.globalAlpha = 0.28;
      context.fillStyle = "#2a2233";
      context.beginPath();
      context.arc(pos.x, pos.y, component.radius * 0.7, 0, Math.PI * 2);
      context.fill();
      context.restore();
      return;
    }

    if (component.id === "armorPlate") {
      context.save();
      context.translate(pos.x, pos.y);
      const grad = context.createLinearGradient(-component.radius, 0, component.radius, 0);
      grad.addColorStop(0, "#7a6248");
      grad.addColorStop(0.5, "#c9a876");
      grad.addColorStop(1, "#7a6248");
      context.fillStyle = grad;
      context.strokeStyle = "#3c2e1c";
      context.lineWidth = 2.5;
      context.beginPath();
      context.roundRect(-component.radius, -component.radius * 0.62, component.radius * 2, component.radius * 1.24, 8);
      context.fill();
      context.stroke();
      if (component.hp < component.maxHp * 0.5) {
        context.strokeStyle = "rgba(20,10,5,0.6)";
        context.lineWidth = 1.4;
        context.beginPath();
        context.moveTo(-component.radius * 0.4, -component.radius * 0.5);
        context.lineTo(component.radius * 0.1, 0);
        context.lineTo(-component.radius * 0.2, component.radius * 0.5);
        context.stroke();
      }
      context.restore();
    } else {
      drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, "wingCannon", pos.x, pos.y, component.radius * 2.5, component.radius * 2.5, component.offsetX < 0 ? 0 : Math.PI);
    }

    const barWidth = component.radius * 1.8;
    context.fillStyle = "rgba(0,0,0,0.5)";
    context.fillRect(pos.x - barWidth / 2, pos.y + component.radius + 4, barWidth, 3);
    context.fillStyle = "#ffcf4b";
    context.fillRect(pos.x - barWidth / 2, pos.y + component.radius + 4, barWidth * clamp(component.hp / component.maxHp, 0, 1), 3);
  });
}

/** Soft squashed drop shadow to lift flat sprites off the background —
 * the single highest-impact cheap trick for scene depth. */
function drawContactShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  alpha = 0.32,
) {
  context.save();
  context.translate(x, y + radius * 0.62);
  context.scale(1, 0.4);
  const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, `rgba(2, 0, 10, ${alpha})`);
  gradient.addColorStop(1, "rgba(2, 0, 10, 0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(0, 0, radius, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

const SHADOW_CAST_KINDS = new Set(["armored", "boss", "elite", "miniBoss", "ufo"]);

function drawEnemy(context: CanvasRenderingContext2D, enemy: Enemy, model: GameModel, assets: GameAssets) {
  const pulse = 1 + Math.sin(model.elapsed * 5 + enemy.phase) * 0.035;
  const isBossTier = enemy.kind === "boss" || enemy.kind === "miniBoss";
  // ponytail: visual-only scale keeps the forgiving collision radii unchanged.
  const width =
    (isBossTier
      ? enemy.r * 2.7
      : enemy.kind === "elite"
        ? enemy.r * 2.3
        : enemy.r * 2.15) * ENEMY_VISUAL_SCALE;
  const height = width;
  const rotation =
    enemy.kind === "popcorn" ? enemy.age * 0.8 : Math.sin(enemy.age * 2 + enemy.phase) * 0.07;

  if (SHADOW_CAST_KINDS.has(enemy.kind)) {
    drawContactShadow(context, enemy.x, enemy.y, width * 0.42, isBossTier ? 0.4 : 0.28);
  }

  context.save();
  context.shadowColor = isBossTier ? "rgba(255, 73, 191, 0.6)" : "rgba(255, 240, 197, 0.22)";
  context.shadowBlur = isBossTier ? 26 : enemy.kind === "elite" ? 18 : 12;
  if (enemy.flashTimer > 0) {
    context.filter = "brightness(4) saturate(0)";
  }
  const drew = enemySpriteDraw(context, enemy, model, assets, enemy.x, enemy.y, width * pulse, height * pulse, rotation);
  context.filter = "none";
  context.restore();

  if (!drew) {
    context.save();
    context.translate(enemy.x, enemy.y);
    context.fillStyle = isBossTier ? "#ff4bbb" : "#fff0c5";
    context.strokeStyle = "#7a39ff";
    context.lineWidth = 2;
    context.beginPath();
    context.arc(0, 0, enemy.r, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.restore();
  }

  if (enemy.kind === "boss") drawBossComponents(context, enemy, assets);

  if (isBossTier) {
    const barWidth = enemy.r * 1.9;
    context.fillStyle = "rgba(0, 0, 0, 0.45)";
    context.fillRect(enemy.x - barWidth / 2, enemy.y + enemy.r * 0.95, barWidth, 5);
    context.fillStyle = enemy.kind === "boss" ? "#ff4bbb" : "#ffcf4b";
    context.fillRect(enemy.x - barWidth / 2, enemy.y + enemy.r * 0.95, barWidth * clamp(enemy.hp / enemy.maxHp, 0, 1), 5);
  }
}

function drawTelegraphs(context: CanvasRenderingContext2D, model: GameModel) {
  model.enemies.forEach((enemy) => {
    if (!enemy.telegraph) return;
    const t = enemy.telegraph;
    const progress = clamp(1 - t.timer / t.duration, 0, 1);

    if (t.kind === "sweepLaser") {
      context.save();
      context.globalAlpha = 0.35 + Math.sin(model.elapsed * 20) * 0.25;
      context.strokeStyle = "#ff3b6b";
      context.lineWidth = 4;
      context.beginPath();
      context.moveTo(0, t.data.y);
      context.lineTo(model.width, t.data.y);
      context.stroke();
      context.restore();
    } else if (t.kind === "hazard") {
      context.save();
      const radius = 56 * progress;
      context.globalAlpha = 0.5;
      context.strokeStyle = "#ff3b6b";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(t.data.x, t.data.y, radius, 0, Math.PI * 2);
      context.stroke();
      context.globalAlpha = 0.12;
      context.fillStyle = "#ff3b6b";
      context.fill();
      context.restore();
    } else if (t.kind === "charge") {
      context.save();
      context.globalAlpha = 0.5 + Math.sin(model.elapsed * 24) * 0.3;
      context.strokeStyle = "#ffcf4b";
      context.lineWidth = 3;
      context.beginPath();
      context.arc(enemy.x, enemy.y, enemy.r * 1.25, 0, Math.PI * 2);
      context.stroke();
      context.restore();
    }
  });
}

function drawHazards(context: CanvasRenderingContext2D, model: GameModel) {
  model.hazards.forEach((hazard) => {
    const alpha = clamp(1 - hazard.age / (hazard.telegraphTime + hazard.life), 0, 1);
    context.save();
    context.globalAlpha = alpha * 0.7;
    const gradient = context.createRadialGradient(hazard.x, hazard.y, 0, hazard.x, hazard.y, hazard.r);
    gradient.addColorStop(0, "#ff8f6b");
    gradient.addColorStop(1, "rgba(255, 59, 107, 0)");
    context.fillStyle = gradient;
    context.beginPath();
    context.arc(hazard.x, hazard.y, hazard.r, 0, Math.PI * 2);
    context.fill();
    context.restore();
  });
}

function drawBullet(context: CanvasRenderingContext2D, bullet: Bullet, assets: GameAssets) {
  const velocityAngle = Math.atan2(bullet.vy, bullet.vx);
  const topDownAngle = velocityAngle + Math.PI / 2;
  // ponytail: atlas enemy shots point up-right; generated top-down weapons point straight up.
  const enemyAtlasAngle = velocityAngle + Math.PI / 4;
  const speed = Math.hypot(bullet.vx, bullet.vy) || 1;
  const trailLength =
    bullet.kind === "laser"
      ? 34
      : bullet.kind === "missile" || bullet.kind === "bomb"
        ? 22
        : bullet.source === "player" || bullet.source === "drone"
          ? 16
          : 0;

  if (trailLength > 0) {
    const color =
      bullet.kind === "laser"
        ? "#8df6ff"
        : bullet.kind === "bomb"
          ? "#ff6b8f"
          : bullet.kind === "missile"
            ? "#ffb23f"
            : bullet.source === "drone"
              ? "#c9a8ff"
              : "#fff0c5";
    const backX = bullet.x - (bullet.vx / speed) * trailLength;
    const backY = bullet.y - (bullet.vy / speed) * trailLength;
    const gradient = context.createLinearGradient(backX, backY, bullet.x, bullet.y);
    gradient.addColorStop(0, hexToRgba(color, 0));
    gradient.addColorStop(1, hexToRgba(color, 0.78));
    context.save();
    context.globalCompositeOperation = "lighter";
    context.strokeStyle = gradient;
    context.lineCap = "round";
    context.lineWidth = Math.max(2, bullet.r * 0.9);
    context.shadowBlur = 12;
    context.shadowColor = color;
    context.beginPath();
    context.moveTo(backX, backY);
    context.lineTo(bullet.x, bullet.y);
    context.stroke();
    context.restore();
  }

  if (
    bullet.kind === "missile" &&
    drawCenteredImage(
      context,
      assets.missileProjectileTopdown,
      bullet.x,
      bullet.y,
      bullet.r * 3.2 * PROJECTILE_VISUAL_SCALE,
      bullet.r * 3.2 * PROJECTILE_VISUAL_SCALE,
      topDownAngle,
    )
  ) {
    return;
  }
  if (
    bullet.kind === "laser" &&
    drawCenteredImage(
      context,
      assets.laserBoltTopdown,
      bullet.x,
      bullet.y,
      bullet.r * 2.2 * PROJECTILE_VISUAL_SCALE,
      bullet.r * 5.2 * PROJECTILE_VISUAL_SCALE,
      topDownAngle,
    )
  ) {
    return;
  }
  if (
    bullet.kind === "bomb" &&
    drawCenteredImage(
      context,
      assets.bombProjectileTopdown,
      bullet.x,
      bullet.y,
      bullet.r * 3 * PROJECTILE_VISUAL_SCALE,
      bullet.r * 3 * PROJECTILE_VISUAL_SCALE,
      topDownAngle,
    )
  ) {
    return;
  }

  if (bullet.source === "enemy") {
    const sprite = bullet.kind === "feather" ? "feather" : bullet.kind === "meteor" ? "meteor" : "egg";
    const drawScale =
      (bullet.kind === "meteor" ? 3.7 : 3.1) * PROJECTILE_VISUAL_SCALE;
    if (drawAtlasSprite(context, assets.cluckerAtlas, CLUCKER_SPRITES, sprite, bullet.x, bullet.y, bullet.r * drawScale, bullet.r * drawScale, enemyAtlasAngle)) {
      return;
    }
  }

  context.save();
  context.translate(bullet.x, bullet.y);
  context.rotate(topDownAngle);
  context.shadowBlur = bullet.kind === "laser" ? 16 : 9;
  context.shadowColor = bullet.kind === "laser" ? "#8df6ff" : bullet.source === "drone" ? "#c9a8ff" : "#ffd36a";
  context.fillStyle =
    bullet.source === "player"
      ? bullet.kind === "laser"
        ? "#8df6ff"
        : bullet.kind === "missile"
          ? "#ffb23f"
          : bullet.kind === "rapidBolt"
            ? "#ffe45e"
            : bullet.kind === "spreadPellet"
              ? "#7dffb0"
              : "#fff0c5"
      : bullet.source === "drone"
        ? "#c9a8ff"
        : "#ff6bdb";

  if (bullet.kind === "laser") {
    context.fillRect(-bullet.r * 0.4, -18, bullet.r * 0.8, 32);
  } else if (bullet.kind === "missile") {
    context.beginPath();
    context.moveTo(0, -12);
    context.lineTo(7, 10);
    context.lineTo(0, 6);
    context.lineTo(-7, 10);
    context.closePath();
    context.fill();
  } else if (bullet.kind === "bomb") {
    context.beginPath();
    context.arc(0, 0, bullet.r, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = "#fff0c5";
    context.lineWidth = 2;
    context.stroke();
  } else {
    context.beginPath();
    context.arc(0, 0, bullet.r, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawDrones(context: CanvasRenderingContext2D, model: GameModel, assets: GameAssets) {
  model.player.drones.forEach((drone) => {
    const angle = model.elapsed * 2.1 + drone.angleOffset;
    const x = model.player.x + Math.cos(angle) * 46;
    const y = model.player.y + Math.sin(angle) * 26 - 8;
    drawAtlasSprite(context, assets.spaceAtlas, SPACE_SPRITES, "drone", x, y, 30, 30, angle + Math.PI / 2, clamp(drone.life / 4, 0.5, 1));
  });
}

/** The legacy courierShip source art is a 3/4 dynamic-angle illustration, not a
 * straight top-down sprite — its nose sits ~120deg off from "up" in the raw
 * image. This constant corrects for that so bankTilt reads as a lean around
 * a genuinely forward-facing ship instead of compounding the skew. Empirically
 * chosen by rendering the sprite at every 5deg and picking the best "nose up,
 * wings level" read; replace with 0 once a proper top-down sprite is in. */
const SHIP_BASE_ROTATION = (120 * Math.PI) / 180;

function drawPlayerShip(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
  alpha = 1,
) {
  const player = model.player;
  if (model.shipSkin === "classic") {
    return drawAtlasSprite(
      context,
      assets.spaceAtlas,
      SPACE_SPRITES,
      "courierShip",
      player.x,
      player.y,
      player.r * 5.35,
      player.r * 4.75,
      SHIP_BASE_ROTATION + player.bankTilt,
      alpha,
    );
  }

  const filters = {
    circuit: "none",
    ghost: "hue-rotate(145deg) saturate(0.55) brightness(1.35)",
    solar: "sepia(0.65) saturate(1.8) hue-rotate(325deg) brightness(1.08)",
  } as const;
  context.save();
  context.filter = filters[model.shipSkin];
  const drew = drawCenteredImage(
    context,
    assets.playerCourierTopdown,
    player.x,
    player.y,
    player.r * 4.6,
    player.r * 4.6,
    player.bankTilt,
    alpha,
  );
  context.restore();
  return drew;
}

function drawPlayer(context: CanvasRenderingContext2D, model: GameModel, assets: GameAssets) {
  const player = model.player;
  drawContactShadow(context, player.x, player.y, player.r * 2.1, 0.3);

  if (player.respawnTimer > 0) {
    const fadeIn = 1 - player.respawnTimer / 1.4;
    drawPlayerShip(context, model, assets, clamp(fadeIn, 0, 1));
    return;
  }

  const speed = Math.hypot(player.vx, player.vy);
  const flicker =
    (player.invincibleTimer > 0 || player.powerInvincibleTimer > 0) &&
    Math.floor(model.elapsed * 18) % 2 === 0;

  if (player.shieldHp > 0 || player.powerInvincibleTimer > 0) {
    const glowColor = player.powerInvincibleTimer > 0 ? "#fff566" : "#65eaff";
    context.save();
    context.globalAlpha = player.powerInvincibleTimer > 0 ? 0.5 : clamp(player.shieldHp / player.shieldMax, 0.25, 0.6);
    context.shadowColor = glowColor;
    context.shadowBlur = 18;
    const shieldRadius = player.r * (2.35 + Math.sin(model.elapsed * 7) * 0.08);
    context.strokeStyle = glowColor;
    context.lineWidth = 3;
    context.beginPath();
    context.arc(player.x, player.y, shieldRadius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }

  if (speed > 18) {
    drawAtlasSprite(
      context,
      assets.spaceAtlas,
      SPACE_SPRITES,
      "engineFlame",
      player.x,
      player.y + player.r * 1.65,
      player.r * 2.15,
      player.r * 3.25,
      0,
      clamp(speed / 420, 0.25, 0.82),
    );
  }

  const drew = drawPlayerShip(context, model, assets, flicker ? 0.36 : 1);

  if (!drew) {
    context.save();
    context.translate(player.x, player.y);
    context.fillStyle = "#8df6ff";
    context.beginPath();
    context.moveTo(0, -player.r * 1.4);
    context.lineTo(player.r, player.r);
    context.lineTo(0, player.r * 0.55);
    context.lineTo(-player.r, player.r);
    context.closePath();
    context.fill();
    context.restore();
  }

  if (player.hull < player.hullMax * 0.3) {
    context.save();
    context.globalAlpha = 0.16 + Math.sin(model.elapsed * 8) * 0.06;
    const vignette = context.createRadialGradient(
      player.x,
      player.y,
      10,
      model.width / 2,
      model.height / 2,
      model.width * 0.7,
    );
    vignette.addColorStop(0, "rgba(255,72,111,0)");
    vignette.addColorStop(1, "rgba(255,72,111,0.55)");
    context.fillStyle = vignette;
    context.fillRect(0, 0, model.width, model.height);
    context.restore();
  }
}

function drawParticlesAndFloats(context: CanvasRenderingContext2D, model: GameModel) {
  model.particles.forEach((particle) => {
    const alpha = clamp(1 - particle.age / particle.life, 0, 1);
    context.globalAlpha = alpha;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.r * (0.8 + alpha), 0, Math.PI * 2);
    context.fill();
    context.globalAlpha = 1;
  });

  context.font = "700 12px monospace";
  context.textAlign = "center";
  model.floats.forEach((float) => {
    const alpha = clamp(1 - float.age / float.life, 0, 1);
    context.globalAlpha = alpha;
    context.fillStyle = float.color;
    context.fillText(float.text, float.x, float.y);
    context.globalAlpha = 1;
  });
}

function drawShockwaves(context: CanvasRenderingContext2D, model: GameModel) {
  model.shockwaves.forEach((wave) => {
    const progress = clamp(wave.age / wave.life, 0, 1);
    const radius = wave.maxRadius * (0.25 + progress * 0.75);
    const alpha = (1 - progress) * 0.55;
    context.save();
    context.globalAlpha = alpha;
    context.strokeStyle = wave.color;
    context.lineWidth = 3 * (1 - progress) + 1;
    context.beginPath();
    context.arc(wave.x, wave.y, radius, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  });
}

function drawScreenFlash(context: CanvasRenderingContext2D, model: GameModel) {
  if (!model.screenFlash) return;
  const alpha = clamp(model.screenFlash.timer / 0.22, 0, 1) * 0.16;
  context.save();
  context.globalAlpha = alpha;
  const gradient = context.createRadialGradient(
    model.width / 2,
    model.height / 2,
    model.height * 0.2,
    model.width / 2,
    model.height / 2,
    model.height * 0.75,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, model.screenFlash.color);
  context.fillStyle = gradient;
  context.fillRect(0, 0, model.width, model.height);
  context.restore();
}

function drawBanner(context: CanvasRenderingContext2D, model: GameModel) {
  const banner = model.banner;
  if (!banner || banner.timer <= -0.6) return;

  const alpha = banner.timer > 0 ? clamp(banner.timer > 1.4 ? 1 : banner.timer / 0.5, 0, 1) : clamp(1 + banner.timer / 0.6, 0, 1);

  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "rgba(0, 0, 0, 0.32)";
  context.fillRect(0, model.height * 0.4 - 34, model.width, 68);
  context.fillStyle = banner.kind === "boss" ? "#ff6bdb" : banner.kind === "victory" ? "#7dffb0" : "#fff0c5";
  context.font = "900 20px monospace";
  context.textAlign = "center";
  context.fillText(banner.title, model.width / 2, model.height * 0.4 - 2);
  context.font = "700 11px monospace";
  context.fillStyle = "rgba(255, 240, 197, 0.78)";
  context.fillText(banner.subtitle, model.width / 2, model.height * 0.4 + 18);
  context.restore();
}

/** Always-on, barely-visible edge darkening for a cinematic arcade-cabinet
 * frame. Intensifies naturally alongside the existing low-health vignette
 * in drawPlayer and the boss-phase-3 red wash in drawBackground — this one
 * never goes away, it's just very subtle at full health. */
function drawAmbientVignette(context: CanvasRenderingContext2D, model: GameModel) {
  const { width, height } = model;
  const gradient = context.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.42,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.72,
  );
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(1, "rgba(0,0,0,0.4)");
  context.save();
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);
  context.restore();
}

export function renderGame(
  context: CanvasRenderingContext2D,
  model: GameModel,
  assets: GameAssets,
  options: RenderOptions = { reducedMotion: false },
) {
  context.setTransform(model.dpr, 0, 0, model.dpr, 0, 0);
  context.clearRect(0, 0, model.width, model.height);

  const shakeMagnitude = options.reducedMotion ? model.shake * 0.25 : model.shake;
  const shakeX = shakeMagnitude > 0 ? randomBetween(-shakeMagnitude, shakeMagnitude) : 0;
  const shakeY = shakeMagnitude > 0 ? randomBetween(-shakeMagnitude, shakeMagnitude) : 0;

  context.save();
  context.translate(shakeX, shakeY);
  drawBackground(context, model, assets, options);

  model.weaponPickups.forEach((pickup) => {
    const size =
      pickup.r *
      (3.4 + Math.sin(model.elapsed * 5 + pickup.age) * 0.12) *
      PICKUP_VISUAL_SCALE;
    drawWeaponIcon(context, pickup.weapon, pickup.x, pickup.y, size, pickup.age, model.elapsed, assets);
  });
  model.powerUps.forEach((power) => {
    const size =
      power.r *
      (3.4 + Math.sin(model.elapsed * 5 + power.age) * 0.12) *
      PICKUP_VISUAL_SCALE;
    drawPowerIcon(context, power.kind, power.x, power.y, size, power.age, model.elapsed, assets);
  });

  drawHazards(context, model);

  model.bullets.filter((bullet) => bullet.source !== "enemy").forEach((bullet) => drawBullet(context, bullet, assets));
  model.enemies.forEach((enemy) => drawEnemy(context, enemy, model, assets));
  drawTelegraphs(context, model);
  model.bullets.filter((bullet) => bullet.source === "enemy").forEach((bullet) => drawBullet(context, bullet, assets));

  drawShockwaves(context, model);
  drawParticlesAndFloats(context, model);
  drawDrones(context, model, assets);
  drawPlayer(context, model, assets);
  drawScreenFlash(context, model);

  if (model.combo >= 12) {
    drawCenteredImage(
      context,
      assets.speedRing,
      model.player.x,
      model.player.y,
      model.player.r * 5.9,
      model.player.r * 5.9,
      -model.elapsed * 1.8,
      clamp((model.combo - 8) / 22, 0.2, 0.72),
    );
  }

  drawBanner(context, model);
  drawAmbientVignette(context, model);

  if (model.status !== "running") {
    context.fillStyle = "rgba(0, 0, 0, 0.26)";
    context.fillRect(0, 0, model.width, model.height);
  }
  context.restore();
}
