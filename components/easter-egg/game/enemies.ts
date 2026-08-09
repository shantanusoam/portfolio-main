import { DIFFICULTY_PRESETS, DIFFICULTY_TUNING } from "./config";
import type { FormationSlot } from "./formations";
import type {
  BulletKind,
  Enemy,
  EnemyKind,
  GameModel,
  WaveModifierKind,
} from "./types";
import { angleTo, clamp, distanceSquared, nextId, randomBetween } from "./utils";

export function getEnemyStats(
  kind: EnemyKind,
  wave: number,
  modifiers: WaveModifierKind[],
  difficulty: GameModel["difficulty"] = "easy",
) {
  const scale =
    (1 + wave * DIFFICULTY_TUNING.hpScalePerWave) *
    DIFFICULTY_PRESETS[difficulty].enemyHp;
  const armorBoost = modifiers.includes("armoredUp") ? 1.32 : 1;
  switch (kind) {
    case "shooter":
      return { hp: 3.2 * scale, r: 25, score: 180 };
    case "armored":
      return { hp: 5.6 * scale * armorBoost, r: 29, score: 260 };
    case "ufo":
      return { hp: 4.2 * scale, r: 27, score: 230 };
    case "popcorn":
      return { hp: 3.8 * scale, r: 27, score: 210 };
    case "diver":
      return { hp: 2.6 * scale, r: 21, score: 170 };
    case "healer":
      return { hp: 3.4 * scale, r: 23, score: 240 };
    case "splitter":
      return { hp: 4.4 * scale, r: 25, score: 220 };
    case "splitterling":
      return { hp: 1, r: 12, score: 60 };
    case "elite":
      return { hp: 9.5 * scale, r: 30, score: 520 };
    default:
      return { hp: 2.2 * scale, r: 22, score: 130 };
  }
}

export function createEnemyFromSlot(
  model: GameModel,
  kind: EnemyKind,
  slotDef: FormationSlot,
  modifiers: WaveModifierKind[],
): Enemy {
  const stats = getEnemyStats(kind, model.wave, modifiers, model.difficulty);
  const fastEntry = modifiers.includes("fastEntry");
  const spawnY =
    slotDef.formationCenterY !== undefined
      ? slotDef.formationCenterY - 30
      : fastEntry
        ? -30 - randomBetween(0, 20)
        : -70 - randomBetween(0, 60);
  return {
    age: 0,
    aiState: "entering",
    baseX: slotDef.x,
    dead: false,
    enrageTimer: 0,
    fireCooldown: randomBetween(0.9, 2.6),
    flashTimer: 0,
    formation: slotDef.formation,
    formationCenterX: slotDef.formationCenterX,
    formationCenterY: slotDef.formationCenterY,
    formationRadius: slotDef.formationRadius,
    hasSpawnedAdd: false,
    homeY: slotDef.homeY,
    hp: stats.hp,
    id: nextId(),
    kind,
    maxHp: stats.hp,
    phase: slotDef.phase,
    r: stats.r,
    score: stats.score,
    stateTimer: 0,
    vx: randomBetween(0.75, 1.35),
    vy: randomBetween(16, 42),
    x: slotDef.x,
    y: spawnY,
  };
}

function fireInterval(kind: EnemyKind, difficulty: number) {
  const base =
    kind === "elite"
      ? 2.4
      : kind === "shooter" || kind === "ufo"
        ? 1.25
        : kind === "splitter"
          ? 1.6
          : kind === "armored"
            ? 1.9
            : 2.2;
  return randomBetween(base, base + 0.85) / clamp(difficulty * 0.45, 0.8, 2.2);
}

function addEnemyBullet(
  model: GameModel,
  kind: BulletKind,
  x: number,
  y: number,
  angle: number,
  speed: number,
  damage = 8,
  radius = 8,
) {
  model.bullets.push({
    age: 0,
    damage,
    id: nextId(),
    kind,
    pierce: 0,
    r: radius,
    source: "enemy",
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    x,
    y,
  });
}

function leadAngle(enemy: Enemy, model: GameModel) {
  const player = model.player;
  const predictX = player.x + player.vx * 0.32;
  const predictY = player.y + player.vy * 0.32;
  return angleTo(enemy.x, enemy.y, predictX, predictY);
}

export function fireEnemy(model: GameModel, enemy: Enemy, difficulty: number) {
  const speed = 160 + difficulty * 32;

  switch (enemy.kind) {
    case "shooter": {
      const angle = leadAngle(enemy, model);
      [-0.1, 0.1].forEach((offset) => {
        addEnemyBullet(model, "egg", enemy.x, enemy.y + 18, angle + offset, speed, 10, 8);
      });
      return;
    }
    case "armored": {
      const angle = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
      addEnemyBullet(model, "meteor", enemy.x, enemy.y + 22, angle, speed * 0.82, 16, 11);
      return;
    }
    case "ufo": {
      const angle = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
      addEnemyBullet(model, "feather", enemy.x, enemy.y + 16, angle - 0.1, speed + 20, 9, 7);
      addEnemyBullet(model, "feather", enemy.x, enemy.y + 16, angle + 0.1, speed + 20, 9, 7);
      return;
    }
    case "splitter": {
      const angle = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
      addEnemyBullet(model, "egg", enemy.x, enemy.y + 18, angle, speed, 9, 8);
      return;
    }
    case "elite": {
      const count = 10;
      for (let index = 0; index < count; index += 1) {
        const angle = (index / count) * Math.PI * 2 + enemy.age * 0.4;
        addEnemyBullet(model, "feather", enemy.x, enemy.y, angle, speed * 0.72, 8, 7);
      }
      model.shake = Math.max(model.shake, 4);
      return;
    }
    default: {
      const angle = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
      addEnemyBullet(model, "egg", enemy.x, enemy.y + 18, angle, speed, 8, 8);
    }
  }
}

function updateFormationHold(
  model: GameModel,
  enemy: Enemy,
  dt: number,
  difficulty: number,
  lowGravity: boolean,
) {
  if (enemy.formation === "orbitRing" && enemy.formationCenterX !== undefined) {
    const rotationSpeed = 0.42;
    const angle = enemy.phase + enemy.age * rotationSpeed;
    enemy.x = clamp(
      enemy.formationCenterX + Math.cos(angle) * (enemy.formationRadius || 60),
      enemy.r + 8,
      model.width - enemy.r - 8,
    );
    enemy.y = clamp(
      (enemy.formationCenterY || 160) + Math.sin(angle) * (enemy.formationRadius || 60) * 0.52,
      40,
      model.height * 0.55,
    );
    enemy.aiState = "attacking";
    return;
  }

  if (enemy.aiState === "entering") {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.7);
    if (Math.abs(enemy.y - enemy.homeY) < 4) {
      enemy.aiState = "forming";
      enemy.stateTimer = 0.4;
    }
  } else if (enemy.aiState === "forming") {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.7);
    enemy.stateTimer -= dt;
    if (enemy.stateTimer <= 0) enemy.aiState = "attacking";
  } else if (enemy.aiState !== "stunned") {
    const descendRate = lowGravity ? 4 + difficulty : 7 + difficulty * 2;
    const descend = Math.min(
      enemy.homeY + Math.max(0, enemy.age - 5) * descendRate,
      model.height * 0.52,
    );
    enemy.y += (descend - enemy.y) * Math.min(1, dt * 1.7);
  }

  const swayAmp = lowGravity ? enemy.vy * 1.35 : enemy.vy;
  enemy.x = clamp(
    enemy.baseX + Math.sin(model.elapsed * enemy.vx + enemy.phase) * swayAmp,
    enemy.r + 8,
    model.width - enemy.r - 8,
  );
}

function updateDrifter(model: GameModel, enemy: Enemy, dt: number) {
  enemy.y += (28 + enemy.vy * 0.4) * dt;
  enemy.x = clamp(
    enemy.baseX + Math.sin(model.elapsed * enemy.vx + enemy.phase) * (enemy.vy * 0.5),
    enemy.r,
    model.width - enemy.r,
  );
  if (enemy.y > model.height + enemy.r) {
    enemy.dead = true;
  }
}

function updateDiver(model: GameModel, enemy: Enemy, dt: number, difficulty: number, aggressive: boolean) {
  if (enemy.aiState === "entering") {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.7);
    enemy.x = clamp(
      enemy.baseX + Math.sin(model.elapsed * enemy.vx + enemy.phase) * enemy.vy,
      enemy.r + 8,
      model.width - enemy.r - 8,
    );
    if (Math.abs(enemy.y - enemy.homeY) < 4) {
      enemy.aiState = "forming";
      enemy.stateTimer = randomBetween(aggressive ? 0.5 : 1.1, aggressive ? 1.4 : 2.6);
    }
    return;
  }

  if (enemy.aiState === "forming") {
    enemy.x = clamp(
      enemy.baseX + Math.sin(model.elapsed * enemy.vx + enemy.phase) * enemy.vy,
      enemy.r + 8,
      model.width - enemy.r - 8,
    );
    enemy.stateTimer -= dt;
    if (enemy.stateTimer <= 0) {
      enemy.aiState = "diving";
      enemy.stateTimer = 0.32;
      enemy.flashTimer = 0.32;
    }
    return;
  }

  if (enemy.aiState === "diving") {
    if (enemy.stateTimer > 0) {
      enemy.stateTimer -= dt;
      return;
    }
    const targetX = model.player.x;
    enemy.x += clamp(targetX - enemy.x, -240, 240) * Math.min(1, dt * 2.4);
    enemy.y += (300 + difficulty * 40) * dt;
    if (enemy.y > model.height + enemy.r) {
      enemy.dead = true;
    }
  }
}

function updateHealerSupport(model: GameModel, enemy: Enemy, dt: number) {
  enemy.stateTimer -= dt;
  if (enemy.stateTimer > 0) return;
  enemy.stateTimer = 3.4;

  let target: Enemy | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  model.enemies.forEach((other) => {
    if (other.dead || other === enemy) return;
    if (other.kind === "boss" || other.kind === "miniBoss") return;
    if (other.hp >= other.maxHp * 0.92) return;
    const dist = distanceSquared(enemy.x, enemy.y, other.x, other.y);
    if (dist < bestDistance && dist < 220 * 220) {
      bestDistance = dist;
      target = other;
    }
  });

  if (target) {
    target.hp = Math.min(target.maxHp, target.hp + target.maxHp * 0.3);
    enemy.aiState = "supporting";
    enemy.stateTimer = Math.max(enemy.stateTimer, 0.6);
    for (let index = 0; index < 10; index += 1) {
      const angle = (index / 10) * Math.PI * 2;
      model.particles.push({
        age: 0,
        color: "#7dffb0",
        life: randomBetween(0.3, 0.5),
        r: randomBetween(1.6, 3.2),
        vx: Math.cos(angle) * 60,
        vy: Math.sin(angle) * 60 - 20,
        x: target.x,
        y: target.y,
      });
    }
  }
}

export function updateEnemyAI(
  model: GameModel,
  enemy: Enemy,
  dt: number,
  difficulty: number,
  modifiers: WaveModifierKind[],
) {
  enemy.age += dt;
  enemy.enrageTimer = Math.max(0, enemy.enrageTimer - dt);
  enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);

  const enraged = enemy.enrageTimer > 0;
  const fireRateMul = enraged ? 0.76 : 1;
  const lowGravity = modifiers.includes("lowGravity");
  const regen = modifiers.includes("regen");
  const aggressiveDivers = modifiers.includes("aggressiveDivers");

  if (regen && enemy.hp < enemy.maxHp) {
    enemy.hp = Math.min(enemy.maxHp, enemy.hp + enemy.maxHp * 0.045 * dt);
  }

  switch (enemy.kind) {
    case "diver":
      updateDiver(model, enemy, dt, difficulty, aggressiveDivers);
      break;
    case "popcorn":
    case "splitterling":
      updateDrifter(model, enemy, dt);
      break;
    case "healer":
      updateFormationHold(model, enemy, dt, difficulty, lowGravity);
      updateHealerSupport(model, enemy, dt);
      break;
    default:
      updateFormationHold(model, enemy, dt, difficulty, lowGravity);
  }

  if (enemy.dead) return;
  if (enemy.kind === "popcorn" || enemy.kind === "splitterling" || enemy.kind === "healer") return;
  if (enemy.kind === "diver" && enemy.aiState !== "entering") return;

  enemy.fireCooldown -= dt;
  if (enemy.kind === "elite" && enemy.fireCooldown > 0 && enemy.fireCooldown <= 0.3) {
    enemy.flashTimer = Math.max(enemy.flashTimer, 0.05);
  }
  const canShoot =
    enemy.y > -10 &&
    enemy.aiState !== "entering" &&
    (enemy.kind !== "grunt" || model.wave > 2);

  if (canShoot && enemy.fireCooldown <= 0) {
    fireEnemy(model, enemy, difficulty);
    enemy.fireCooldown = fireInterval(enemy.kind, difficulty) * fireRateMul;
  }
}

export function applyEnrageNearby(model: GameModel, x: number, y: number, radius = 130) {
  const radiusSq = radius * radius;
  model.enemies.forEach((enemy) => {
    if (enemy.dead) return;
    if (enemy.kind === "boss" || enemy.kind === "miniBoss") return;
    if (distanceSquared(x, y, enemy.x, enemy.y) <= radiusSq) {
      enemy.enrageTimer = Math.max(enemy.enrageTimer, 3.4);
    }
  });
}

/** Splitter birds fracture into two weaker splitterlings on death. Pure
 * enough to unit test: given a dying splitter, returns the fragments to add. */
export function trySplitOnDeath(model: GameModel, enemy: Enemy): Enemy[] {
  if (enemy.kind !== "splitter") return [];
  const stats = getEnemyStats("splitterling", model.wave, [], model.difficulty);
  return [-1, 1].map((side) => ({
    age: 0,
    aiState: "attacking" as const,
    baseX: enemy.x + side * 30,
    dead: false,
    enrageTimer: 0,
    fireCooldown: 999,
    flashTimer: 0,
    hasSpawnedAdd: false,
    homeY: enemy.y,
    hp: stats.hp,
    id: nextId(),
    kind: "splitterling" as const,
    maxHp: stats.hp,
    phase: randomBetween(0, Math.PI * 2),
    r: stats.r,
    score: stats.score,
    stateTimer: 0,
    vx: randomBetween(1.4, 2.2),
    vy: side * randomBetween(40, 70),
    x: enemy.x,
    y: enemy.y,
  }));
}
