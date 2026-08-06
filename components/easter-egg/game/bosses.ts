import { BOSS_NAMES, DIFFICULTY_PRESETS, MINI_BOSS_NAMES } from "./config";
import type {
  BossArchetype,
  BossComponent,
  BulletKind,
  Enemy,
  GameModel,
  MiniBossArchetype,
} from "./types";
import { angleTo, clamp, nextId, randomBetween } from "./utils";

function baseBossHp(archetype: BossArchetype) {
  switch (archetype) {
    case "admiralDrumstick":
      return 760;
    case "omeletteEngine":
      return 700;
    default:
      return 640;
  }
}

function buildComponents(archetype: BossArchetype, wave: number): BossComponent[] {
  if (archetype === "mothercluckerPrime") {
    const hp = 90 + wave * 9;
    return [
      {
        destroyed: false,
        hp,
        id: "leftWing",
        label: "Left Wing Cannon",
        maxHp: hp,
        offsetX: -96,
        offsetY: 12,
        radius: 30,
      },
      {
        destroyed: false,
        hp,
        id: "rightWing",
        label: "Right Wing Cannon",
        maxHp: hp,
        offsetX: 96,
        offsetY: 12,
        radius: 30,
      },
    ];
  }
  if (archetype === "admiralDrumstick") {
    const hp = 210 + wave * 16;
    return [
      {
        destroyed: false,
        hp,
        id: "armorPlate",
        label: "Armor Plating",
        maxHp: hp,
        offsetX: 0,
        offsetY: 36,
        radius: 38,
      },
    ];
  }
  return [];
}

export function createBoss(model: GameModel, archetype: BossArchetype): Enemy {
  const wave = model.wave;
  const hp =
    (baseBossHp(archetype) + wave * 66) *
    DIFFICULTY_PRESETS[model.difficulty].enemyHp;
  return {
    age: 0,
    aiState: "entering",
    baseX: model.width / 2,
    bossArchetype: archetype,
    bossPhase: 1,
    components: buildComponents(archetype, wave),
    dead: false,
    enrageTimer: 0,
    fireCooldown: 1.4,
    flashTimer: 0,
    hasSpawnedAdd: false,
    homeY: 148,
    hp,
    id: nextId(),
    kind: "boss",
    maxHp: hp,
    phase: 0,
    r: 74,
    score: 7200 + wave * 260,
    stateTimer: 0,
    vx: 1,
    vy: 1,
    x: model.width / 2,
    y: -140,
  };
}

export function createMiniBoss(model: GameModel, archetype: MiniBossArchetype): Enemy {
  const wave = model.wave;
  const hp =
    ((archetype === "colonelCluckles" ? 150 : 168) + wave * 25) *
    DIFFICULTY_PRESETS[model.difficulty].enemyHp;
  return {
    age: 0,
    aiState: "entering",
    baseX: model.width / 2,
    dead: false,
    enrageTimer: 0,
    fireCooldown: 1.1,
    flashTimer: 0,
    hasSpawnedAdd: false,
    homeY: 132,
    hp,
    id: nextId(),
    kind: "miniBoss",
    maxHp: hp,
    miniBossArchetype: archetype,
    phase: 0,
    r: 46,
    score: 2600 + wave * 130,
    stateTimer: 0,
    vx: 1,
    vy: 1,
    x: model.width / 2,
    y: -110,
  };
}

export function getBossDisplayName(enemy: Enemy): string {
  if (enemy.kind === "boss" && enemy.bossArchetype) {
    return BOSS_NAMES[enemy.bossArchetype].name;
  }
  if (enemy.kind === "miniBoss" && enemy.miniBossArchetype) {
    return MINI_BOSS_NAMES[enemy.miniBossArchetype].name;
  }
  return "Unknown Hostile";
}

export function getComponentWorldPosition(enemy: Enemy, component: BossComponent) {
  return { x: enemy.x + component.offsetX, y: enemy.y + component.offsetY };
}

export function onComponentDestroyed(model: GameModel, enemy: Enemy, component: BossComponent) {
  const pos = getComponentWorldPosition(enemy, component);
  model.score += 300 + model.wave * 22 + Math.round(component.maxHp * 0.6);
  model.shake = Math.max(model.shake, 10);
  model.sfxQueue.push("enemyDeath");
  for (let index = 0; index < 22; index += 1) {
    const angle = randomBetween(0, Math.PI * 2);
    const speed = randomBetween(80, 260);
    model.particles.push({
      age: 0,
      color: "#ffb23f",
      life: randomBetween(0.3, 0.7),
      r: randomBetween(1.5, 4),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      x: pos.x,
      y: pos.y,
    });
  }
}

function addBullet(
  model: GameModel,
  kind: BulletKind,
  x: number,
  y: number,
  vx: number,
  vy: number,
  damage: number,
  r: number,
  pierce = 0,
) {
  model.bullets.push({
    age: 0,
    damage,
    id: nextId(),
    kind,
    pierce,
    r,
    source: "enemy",
    vx,
    vy,
    x,
    y,
  });
}

function radialBurst(model: GameModel, x: number, y: number, count: number, speed: number, kind: BulletKind = "feather") {
  for (let index = 0; index < count; index += 1) {
    const angle = (index / count) * Math.PI * 2;
    addBullet(model, kind, x, y, Math.cos(angle) * speed, Math.sin(angle) * speed, 8, 7);
  }
}

function isComponentAlive(enemy: Enemy, id: string) {
  return Boolean(enemy.components?.find((component) => component.id === id && !component.destroyed));
}

function updateMothercluckerPrime(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  enemy.x = clamp(
    model.width / 2 + Math.sin(model.elapsed * 0.7) * model.width * (0.16 + (enemy.bossPhase || 1) * 0.05),
    enemy.r + 20,
    model.width - enemy.r - 20,
  );

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown > 0) return;

  const phase = enemy.bossPhase || 1;
  const speed = 190 + difficulty * 26;
  const aimed = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);

  if (isComponentAlive(enemy, "leftWing")) {
    [-0.16, 0, 0.16].forEach((offset) => {
      addBullet(model, "egg", enemy.x - 96, enemy.y + 20, Math.cos(aimed + offset) * speed, Math.sin(aimed + offset) * speed, 10, 8);
    });
  }
  if (isComponentAlive(enemy, "rightWing")) {
    [-0.16, 0, 0.16].forEach((offset) => {
      addBullet(model, "egg", enemy.x + 96, enemy.y + 20, Math.cos(aimed + offset) * speed, Math.sin(aimed + offset) * speed, 10, 8);
    });
  }

  if (phase >= 2) {
    radialBurst(model, enemy.x, enemy.y + 30, 12 + phase, speed * 0.7);
    if (phase === 2 && !enemy.hasSpawnedAdd) {
      enemy.hasSpawnedAdd = true;
    }
  }

  if (phase >= 3) {
    if (!enemy.telegraph) {
      enemy.telegraph = {
        data: { y: enemy.y + 90 },
        duration: 0.9,
        kind: "sweepLaser",
        timer: 0.9,
      };
    }
  }

  enemy.fireCooldown = phase >= 3 ? 0.62 : phase === 2 ? 0.85 : 1.15;
}

function updateAdmiralDrumstick(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  const phase = enemy.bossPhase || 1;

  if (enemy.aiState === "diving") {
    enemy.y += 480 * dt;
    if (enemy.y > enemy.homeY + 70) {
      enemy.aiState = "attacking";
      enemy.stateTimer = 0;
    }
  } else if (enemy.stateTimer > 0) {
    enemy.stateTimer -= dt;
    enemy.x = clamp(
      model.width / 2 + Math.sin(model.elapsed * 0.5) * model.width * 0.18,
      enemy.r + 20,
      model.width - enemy.r - 20,
    );
  } else {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.6);
    enemy.x = clamp(
      model.width / 2 + Math.sin(model.elapsed * 0.6) * model.width * 0.2,
      enemy.r + 20,
      model.width - enemy.r - 20,
    );
  }

  if (phase >= 2 && enemy.aiState !== "diving" && !enemy.telegraph && enemy.stateTimer <= 0) {
    enemy.telegraph = { data: {}, duration: 0.7, kind: "charge", timer: 0.7 };
  }

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown <= 0 && enemy.aiState !== "diving") {
    const speed = 150 + difficulty * 22;
    const aimed = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
    const shots = phase >= 3 ? 6 : phase === 2 ? 4 : 3;
    for (let index = 0; index < shots; index += 1) {
      const spread = (index - (shots - 1) / 2) * (phase >= 3 ? 0.5 : 0.28);
      addBullet(model, "missile", enemy.x, enemy.y + 30, Math.cos(aimed + spread) * speed, Math.sin(aimed + spread) * speed, 12, 8);
    }
    enemy.fireCooldown = phase >= 3 ? 0.9 : phase === 2 ? 1.3 : 1.8;
  }
}

function updateOmeletteEngine(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  const phase = enemy.bossPhase || 1;
  enemy.x = clamp(
    model.width / 2 + Math.sin(model.elapsed * 0.35) * model.width * 0.12,
    enemy.r + 20,
    model.width - enemy.r - 20,
  );
  enemy.phase += dt * (0.6 + phase * 0.35);

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown <= 0) {
    if (phase >= 3) {
      const count = 16;
      for (let index = 0; index < count; index += 1) {
        const angle = enemy.phase * 2 + (index / count) * Math.PI * 2;
        addBullet(model, "egg", enemy.x, enemy.y, Math.cos(angle) * (150 + difficulty * 20), Math.sin(angle) * (150 + difficulty * 20), 9, 7);
      }
      enemy.fireCooldown = 0.5;
    } else {
      for (let index = 0; index < 3; index += 1) {
        addBullet(model, "meteor", randomBetween(60, model.width - 60), -30, randomBetween(-30, 30), 200 + difficulty * 26, 14, 12);
      }
      enemy.fireCooldown = phase === 2 ? 1.3 : 1.9;
    }
  }

  if (phase >= 2 && !enemy.telegraph) {
    enemy.stateTimer -= dt;
    if (enemy.stateTimer <= 0) {
      enemy.telegraph = {
        data: {
          x: clamp(model.player.x + randomBetween(-70, 70), 60, model.width - 60),
          y: clamp(model.player.y + randomBetween(-40, 40), model.height * 0.45, model.height - 60),
        },
        duration: 1.1,
        kind: "hazard",
        timer: 1.1,
      };
      enemy.stateTimer = randomBetween(2.2, 3.4);
    }
  }
}

export function updateBoss(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  enemy.age += dt;
  enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);

  if (enemy.aiState === "entering") {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.1);
    if (Math.abs(enemy.y - enemy.homeY) < 4) {
      enemy.aiState = "attacking";
      enemy.stateTimer = 2;
    }
    return;
  }

  const hpRatio = enemy.hp / enemy.maxHp;
  const nextPhase = hpRatio > 0.7 ? 1 : hpRatio > 0.35 ? 2 : 3;
  if (nextPhase !== enemy.bossPhase) {
    enemy.bossPhase = nextPhase;
    enemy.aiState = "phaseTransition";
    enemy.stateTimer = 0.85;
    enemy.flashTimer = 0.85;
    enemy.telegraph = undefined;
    model.score += 900 + model.wave * 40;
    model.shake = Math.max(model.shake, 16);
    model.hitStop = Math.max(model.hitStop, 0.09);
    model.sfxQueue.push("bossPhase");
    model.banner = {
      kind: "boss",
      subtitle: "The fight escalates",
      timer: 1.8,
      title: `${getBossDisplayName(enemy)}: PHASE ${nextPhase}`,
    };
  }

  if (enemy.aiState === "phaseTransition") {
    enemy.stateTimer -= dt;
    if (enemy.stateTimer <= 0) enemy.aiState = "attacking";
    return;
  }

  if (enemy.telegraph) {
    enemy.telegraph.timer -= dt;
    if (enemy.telegraph.timer <= 0) {
      resolveTelegraph(model, enemy);
      enemy.telegraph = undefined;
    }
    if (enemy.telegraph?.kind === "charge") return;
  }

  switch (enemy.bossArchetype) {
    case "admiralDrumstick":
      updateAdmiralDrumstick(model, enemy, dt, difficulty);
      break;
    case "omeletteEngine":
      updateOmeletteEngine(model, enemy, dt, difficulty);
      break;
    default:
      updateMothercluckerPrime(model, enemy, dt, difficulty);
  }
}

function resolveTelegraph(model: GameModel, enemy: Enemy) {
  if (!enemy.telegraph) return;
  if (enemy.telegraph.kind === "sweepLaser") {
    const y = enemy.telegraph.data.y;
    addBullet(model, "laser", -60, y, 780, 0, 15, 20, 40);
    model.shake = Math.max(model.shake, 10);
  } else if (enemy.telegraph.kind === "charge") {
    enemy.aiState = "diving";
    model.shake = Math.max(model.shake, 6);
  } else if (enemy.telegraph.kind === "hazard") {
    model.hazards.push({
      age: 0,
      damage: 24,
      hit: false,
      id: nextId(),
      life: 0.5,
      r: 56,
      telegraphTime: 0,
      x: enemy.telegraph.data.x,
      y: enemy.telegraph.data.y,
    });
  }
}

function updateColonelCluckles(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  const rage = enemy.hp < enemy.maxHp * 0.4;

  if (enemy.aiState === "diving") {
    enemy.y += 420 * dt;
    if (enemy.y > enemy.homeY + 90) {
      enemy.aiState = "attacking";
      enemy.stateTimer = randomBetween(2, 3.2);
    }
    return;
  }

  enemy.x = clamp(
    model.width / 2 + Math.sin(model.elapsed * 0.9) * model.width * 0.24,
    enemy.r + 16,
    model.width - enemy.r - 16,
  );

  enemy.stateTimer -= dt;
  if (enemy.stateTimer <= 0 && !enemy.telegraph) {
    enemy.telegraph = { data: {}, duration: rage ? 0.4 : 0.6, kind: "charge", timer: rage ? 0.4 : 0.6 };
    enemy.flashTimer = enemy.telegraph.duration;
  }
  if (enemy.telegraph?.kind === "charge") {
    enemy.telegraph.timer -= dt;
    if (enemy.telegraph.timer <= 0) {
      enemy.aiState = "diving";
      enemy.telegraph = undefined;
    }
    return;
  }

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown <= 0) {
    const aimed = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
    const speed = 190 + difficulty * 24;
    const count = rage ? 7 : 5;
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.14;
      addBullet(model, "egg", enemy.x, enemy.y + 20, Math.cos(aimed + spread) * speed, Math.sin(aimed + spread) * speed, 10, 8);
    }
    if (rage) radialBurst(model, enemy.x, enemy.y, 10, speed * 0.6);
    enemy.fireCooldown = rage ? 1.1 : 1.6;
    enemy.stateTimer = randomBetween(2, 3.2);
  }
}

function updateSergeantYolk(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  const rage = enemy.hp < enemy.maxHp * 0.4;
  enemy.stateTimer -= dt;

  if (enemy.stateTimer <= 0) {
    enemy.x = clamp(randomBetween(60, model.width - 60), enemy.r + 10, model.width - enemy.r - 10);
    enemy.flashTimer = 0.25;
    model.particles.push({ age: 0, color: "#8df6ff", life: 0.35, r: 3, vx: 0, vy: 0, x: enemy.x, y: enemy.y });
    enemy.stateTimer = randomBetween(rage ? 1.4 : 2, rage ? 2.2 : 3.2);
  }

  enemy.y = enemy.homeY + Math.sin(model.elapsed * 1.4) * 14;

  enemy.fireCooldown -= dt;
  if (enemy.fireCooldown <= 0) {
    const speed = 150 + difficulty * 18;
    for (let index = 0; index < (rage ? 6 : 4); index += 1) {
      addBullet(model, "egg", enemy.x + randomBetween(-30, 30), enemy.y + 10, randomBetween(-40, 40), speed, 9, 8);
    }
    if (rage) {
      const aimed = angleTo(enemy.x, enemy.y, model.player.x, model.player.y);
      [-0.1, 0.1].forEach((offset) => {
        addBullet(model, "feather", enemy.x, enemy.y, Math.cos(aimed + offset) * speed, Math.sin(aimed + offset) * speed, 9, 7);
      });
    }
    enemy.fireCooldown = rage ? 1 : 1.5;
  }
}

export function updateMiniBoss(model: GameModel, enemy: Enemy, dt: number, difficulty: number) {
  enemy.age += dt;
  enemy.flashTimer = Math.max(0, enemy.flashTimer - dt);

  if (enemy.aiState === "entering") {
    enemy.y += (enemy.homeY - enemy.y) * Math.min(1, dt * 1.2);
    if (Math.abs(enemy.y - enemy.homeY) < 4) {
      enemy.aiState = "attacking";
      enemy.stateTimer = 2;
    }
    return;
  }

  if (enemy.miniBossArchetype === "sergeantYolk") {
    updateSergeantYolk(model, enemy, dt, difficulty);
  } else {
    updateColonelCluckles(model, enemy, dt, difficulty);
  }
}
