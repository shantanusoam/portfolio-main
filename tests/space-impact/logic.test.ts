import assert from "node:assert/strict";
import test from "node:test";
import { performance } from "node:perf_hooks";
import {
  activatePulse,
  bullet,
  damagePlayer,
  discover,
  killEnemy,
} from "../../lib/space-impact/combat";
import { circleRect, segmentCircle } from "../../lib/space-impact/collision";
import { STEP } from "../../lib/space-impact/config";
import {
  bossVulnerable,
  createBoss,
} from "../../lib/space-impact/content/bosses";
import { FRAGMENTS, SECRET_IDS } from "../../lib/space-impact/content/secrets";
import { SECTORS } from "../../lib/space-impact/content/sectors";
import {
  declineRelay,
  enterRoom,
  finishBoss,
  nextSector,
  submitCode,
  spawnEnemy,
  updateDirector,
} from "../../lib/space-impact/director";
import { InputController } from "../../lib/space-impact/input";
import {
  createGame,
  emptyInput,
  pauseGame,
  resumeGame,
} from "../../lib/space-impact/model";
import { hashSeed } from "../../lib/space-impact/random";
import { FixedClock } from "../../lib/space-impact/runtime";
import {
  emptyProfile,
  parseProfile,
  persistGame,
} from "../../lib/space-impact/storage";
import { updateGame } from "../../lib/space-impact/update";
import type { Game, Input } from "../../lib/space-impact/types";

function running(sector = 0): Game {
  const game = createGame(emptyProfile(), "campaign", sector);
  game.status = "running";
  game.stageStarted = true;
  return game;
}
function advance(game: Game, ticks: number, input: Input = emptyInput()): void {
  for (let i = 0; i < ticks; i++) {
    updateGame(game, input);
    game.events = [];
  }
}

test("swept collision catches tunneling, initial overlap, and zero travel", () => {
  assert.equal(
    segmentCircle({ x: 0, y: 10 }, { x: 300, y: 10 }, { x: 150, y: 10 }, 4),
    true,
  );
  assert.equal(
    segmentCircle({ x: 0, y: 10 }, { x: 300, y: 10 }, { x: 150, y: 20 }, 4),
    false,
  );
  assert.equal(
    segmentCircle({ x: 4, y: 4 }, { x: 4, y: 4 }, { x: 4, y: 4 }, 1),
    true,
  );
  assert.equal(
    circleRect({ x: 8, y: 15 }, 3, { x: 10, y: 10, w: 15, h: 15 }),
    true,
  );
});

test("render schedules at 30, 60 and 120 Hz produce identical gameplay", () => {
  const simulate = (fps: number) => {
    const game = running();
    const clock = new FixedClock();
    clock.advance(0, () => undefined);
    for (let frame = 1; frame <= fps * 20; frame++) {
      clock.advance((frame * 1000) / fps, () => {
        const input = {
          ...emptyInput(),
          target: { x: 86, y: 135 + Math.sin(game.tick / 180) * 55 },
        };
        updateGame(game, input);
        game.events = [];
      });
    }
    return game;
  };
  assert.deepEqual(simulate(30), simulate(60));
  assert.deepEqual(simulate(120), simulate(60));
});

test("pause freezes the game and clock reset prevents background catch-up", () => {
  const game = running();
  advance(game, 60);
  pauseGame(game);
  const frozen = JSON.stringify(game);
  advance(game, 120);
  assert.equal(JSON.stringify(game), frozen);
  const clock = new FixedClock();
  let ticks = 0;
  clock.advance(0, () => ticks++);
  clock.advance(16.667, () => ticks++);
  clock.reset();
  clock.advance(60000, () => ticks++);
  assert.equal(ticks, 1);
  resumeGame(game);
  assert.equal(game.status, "countdown");
  advance(game, 121);
  assert.equal(game.status, "running");
});

test("touch anchors never teleport and a second finger cannot steal steering", () => {
  const controls = new InputController(() => ({ x: 86, y: 135 }));
  assert.equal(controls.pointerDown(1, { x: 220, y: 500 }), true);
  assert.deepEqual(controls.sample().target, { x: 86, y: 135 });
  assert.equal(controls.pointerDown(2, { x: 0, y: 0 }), false);
  controls.pointerMove(2, { x: 100, y: 100 }, 1, "drag");
  assert.deepEqual(controls.sample().target, { x: 86, y: 135 });
  controls.pointerMove(1, { x: 240, y: 510 }, 0.5, "drag");
  assert.deepEqual(controls.sample().target, { x: 126, y: 155 });
  controls.pulse();
  assert.equal(controls.sample().pulse, true);
  assert.equal(controls.sample().pulse, false);
  controls.pointerUp(2);
  assert.notEqual(controls.sample().target, null);
  controls.clear();
  assert.deepEqual(controls.sample(), emptyInput());
});

test("virtual stick and diagonal movement stay bounded", () => {
  const controls = new InputController(() => ({ x: 86, y: 135 }));
  controls.pointerDown(1, { x: 100, y: 100 });
  controls.pointerMove(1, { x: 500, y: -500 }, 1, "stick");
  assert.equal(controls.sample().x, 1);
  assert.equal(controls.sample().y, -1);
  const game = running();
  const before = { ...game.player };
  updateGame(game, { ...emptyInput(), x: 1, y: 1 });
  assert.ok(
    Math.hypot(game.player.x - before.x, game.player.y - before.y) <=
      170 * STEP + 1e-8,
  );
});

test("one projectile grants one graze and invulnerability cannot farm charge", () => {
  const game = running();
  game.player.invincible = 0;
  bullet(game, game.player.x, game.player.y + 16, 0, 0);
  advance(game, 20, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.grazes, 1);
  assert.equal(game.player.charge, 33);
  game.player.invincible = 2;
  bullet(game, game.player.x, game.player.y + 16, 0, 0);
  advance(game, 20, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.grazes, 1);
});

test("Pulse clears bullets before they can damage the ship and only spends once", () => {
  const game = running();
  game.player.invincible = 0;
  game.player.charge = 100;
  bullet(game, game.player.x + 2, game.player.y, -30, 0);
  updateGame(game, { ...emptyInput(), pulse: true });
  assert.equal(game.player.hull, 3);
  assert.equal(game.player.charge, 0);
  assert.equal(game.bullets.filter((b) => b.enemy).length, 0);
  assert.equal(activatePulse(game), false);
});

test("damage is applied once during the recovery interval", () => {
  const game = running();
  game.player.invincible = 0;
  assert.equal(damagePlayer(game), true);
  assert.equal(damagePlayer(game), false);
  assert.equal(game.player.hull, 2);
});

test("fast rail shots hit a target only once", () => {
  const game = running();
  const enemy = spawnEnemy(game, "armored", 150, 135)!;
  Object.assign(enemy, { id: 77, hp: 100, maxHp: 100, fire: 10, phase: 0 });
  bullet(game, 149, 135, 1, 0, false, 30, true);
  advance(game, 5, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.enemies[0].hp, 70);
});

test("boss parts independently remove cannons and phase changes clear threats", () => {
  const game = running(2);
  game.boss = createBoss(game);
  game.boss.awakened = true;
  game.boss.x = 390;
  game.boss.age = 3;
  game.boss.hp = game.boss.maxHp * 0.5;
  bullet(game, 200, 100, -30, 0);
  updateGame(game, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.boss.phase, 2);
  assert.ok(game.boss.transition > 0);
  assert.equal(game.bullets.filter((b) => b.enemy).length, 0);
  assert.equal(bossVulnerable(game.boss), false);
});

test("all campaign encounters are ordered and authored corridors remain traversable", () => {
  assert.equal(SECTORS.length, 5);
  SECTORS.forEach((sector, index) => {
    const game = running(index);
    game.player.invincible = 1e6;
    for (let i = 1; i < sector.encounters.length; i++)
      assert.ok(sector.encounters[i].at >= sector.encounters[i - 1].at);
    while (!game.boss && game.sectorTick <= sector.duration * 60 + 2) {
      updateDirector(game);
      for (const top of game.terrain.filter((t) => t.y === 0)) {
        const bottom = game.terrain.find((t) => t.id === top.id + 1 && t.y > 0);
        assert.ok(bottom);
        assert.ok(bottom.y - top.h >= 120);
      }
    }
    assert.ok(game.boss, sector.name + " must reach its boss");
    assert.ok(game.boss!.hp > 0);
  });
});

test("checkpoint survives parsing at the next unlocked sector", () => {
  const profile = emptyProfile();
  const game = running();
  game.player.weapon = "rail";
  game.player.level = 3;
  game.boss = createBoss(game);
  game.boss.hp = 0;
  finishBoss(game);
  assert.equal(game.status, "cleared");
  const saved = parseProfile(JSON.stringify(persistGame(profile, game)));
  assert.equal(saved.highestSector, 1);
  assert.equal(saved.checkpoint?.sector, 1);
  assert.equal(saved.checkpoint?.weapon, "rail");
  assert.equal(saved.checkpoint?.level, 3);
  nextSector(game);
  assert.equal(game.sector, 1);
  assert.equal(game.status, "countdown");
});

test("malformed and future saves fail safely; values and known secrets are validated", () => {
  assert.deepEqual(parseProfile("{"), emptyProfile());
  assert.deepEqual(parseProfile('{"version":99}'), emptyProfile());
  const parsed = parseProfile(
    JSON.stringify({
      version: 1,
      highestSector: 999,
      secrets: ["lcd", "lcd", "made-up"],
      settings: { music: 500, effects: -2, skin: "lcd", assist: "yes" },
      ghost: {
        sector: 0,
        points: [
          { x: 99999, y: -100 },
          { x: "oops", y: 1 },
        ],
      },
    }),
  );
  assert.equal(parsed.highestSector, 4);
  assert.equal(parsed.settings.music, 1);
  assert.equal(parsed.settings.effects, 0);
  assert.equal(parsed.settings.assist, false);
  assert.deepEqual(parsed.secrets, ["lcd"]);
  assert.deepEqual(parsed.ghost?.points, [{ x: 480, y: 0 }]);
});

test("secret rewards are idempotent and the full registry has eight entries", () => {
  const game = running();
  assert.equal(SECRET_IDS.length, 8);
  assert.equal(discover(game, "window"), true);
  assert.equal(discover(game, "window"), false);
  assert.deepEqual(game.discovered, ["window"]);
  assert.equal(game.events.filter((event) => event.kind === "save").length, 1);
});

test("blinking window opens salvage and the beacon accepts only its actual code", () => {
  const game = running();
  game.features.push({
    id: 20,
    kind: "window",
    x: 250,
    y: 55,
    age: 0,
    progress: 0,
  });
  bullet(game, 244, 55, 300, 0, false, 10);
  updateGame(game, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.room?.kind, "salvage");
  assert.ok(game.secrets.includes("window"));
  game.room = null;
  game.console = "beacon";
  game.status = "console";
  assert.equal(submitCode(game, "123"), false);
  assert.equal(submitCode(game, "404"), true);
  assert.equal((game as Game).room?.kind, "glitch");
  assert.ok(game.secrets.includes("404"));
});

test("patient probe needs sustained nearby silence and grants a persistent fragment", () => {
  const game = running(2);
  game.player.invincible = 100;
  game.features.push({
    id: 20,
    kind: "probe",
    x: game.player.x + 20,
    y: game.player.y,
    age: 0,
    progress: 0,
  });
  advance(game, 150);
  assert.equal(game.secrets.includes("patient"), false);
  advance(game, 302, { ...emptyInput(), ceaseFire: true });
  assert.ok(game.secrets.includes("patient"));
  assert.equal(game.companion, true);
});

test("side rooms pause campaign time and return without stale enemy shots", () => {
  const game = running();
  game.player.invincible = 100;
  const time = game.sectorTick;
  enterRoom(game, "observatory");
  advance(game, 601, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.room, null);
  assert.ok(game.sectorTick <= time + 1);
  assert.ok(game.secrets.includes("blue-dot"));
  assert.equal(game.bullets.filter((b) => b.enemy).length, 0);
});

test("final relay requires fragments and leads to a real additional boss phase", () => {
  const game = running(4);
  game.secrets = [...FRAGMENTS];
  game.boss = createBoss(game);
  game.boss.hp = 0;
  finishBoss(game);
  assert.equal(game.status, "console");
  assert.equal(game.console, "relay");
  assert.equal(submitCode(game, "321"), false);
  assert.equal(submitCode(game, "123"), true);
  assert.equal(game.boss.truePhase, true);
  game.boss.hp = 0;
  finishBoss(game);
  assert.equal(game.status, "victory");
  assert.equal(game.ending, "signal");
  assert.ok(game.secrets.includes("signal"));
  const normal = running(4);
  normal.boss = createBoss(normal);
  normal.boss.hp = 0;
  finishBoss(normal);
  assert.equal(normal.ending, "home");
  const leave = running(4);
  leave.console = "relay";
  declineRelay(leave);
  assert.equal(leave.ending, "home");
});

test("assisted and practice scores cannot replace standard campaign scores", () => {
  const profile = emptyProfile();
  const game = running();
  game.assist = true;
  game.score = 9000;
  game.mode = "practice";
  const saved = persistGame(profile, game);
  assert.equal(saved.best["practice:assist"], 9000);
  assert.equal(saved.best["campaign:standard"], undefined);
  assert.equal(saved.checkpoint, null);
});

test("challenge ends on its three-minute boundary and uses a reproducible versioned seed", () => {
  const game = running();
  game.mode = "challenge";
  game.tick = 10800 - 1;
  updateGame(game, emptyInput());
  assert.equal(game.ending, "challenge");
  assert.equal(game.status, "victory");
  assert.equal(
    hashSeed("lost-signal-1:2026-09-08"),
    hashSeed("lost-signal-1:2026-09-08"),
  );
  assert.notEqual(
    hashSeed("lost-signal-1:2026-09-08"),
    hashSeed("lost-signal-1:2026-09-09"),
  );
});

test("extended simulation keeps entity collections bounded", () => {
  const game = running(4);
  game.player.invincible = 1e6;
  const start = performance.now();
  advance(game, 36000, { ...emptyInput(), ceaseFire: true });
  assert.ok(game.bullets.length <= 320);
  assert.ok(game.particles.length <= 160);
  assert.ok(game.enemies.length <= 45);
  assert.ok(game.trace.length <= 300);
  assert.ok(game.events.length <= 64);
  console.log(
    "10-minute headless simulation: " +
      Math.round(performance.now() - start) +
      " ms",
  );
});

test("late feather collection still opens the waiting Cluckstorm portal", () => {
  const game = running(2);
  game.sectorTick = 72 * 60 - 1;
  game.feathers = 2;
  updateDirector(game);
  const portal = game.features.find((feature) => feature.kind === "portal");
  assert.ok(portal);
  game.player.x = portal.x;
  game.player.y = portal.y;
  updateGame(game, { ...emptyInput(), interact: true, ceaseFire: true });
  assert.equal(game.room, null);
  game.feathers = 3;
  updateGame(game, { ...emptyInput(), interact: true, ceaseFire: true });
  assert.equal((game as Game).room?.kind, "cluck");
});

test("probe sanctuary removes a contact shot before damage resolves", () => {
  const game = running(2);
  game.player.invincible = 0;
  game.features.push({
    id: 30,
    kind: "probe",
    x: game.player.x,
    y: game.player.y,
    age: 0,
    progress: 0,
  });
  bullet(game, game.player.x, game.player.y, 0, 0);
  updateGame(game, { ...emptyInput(), ceaseFire: true });
  assert.equal(game.player.hull, 3);
});

test("combat drops let every weapon reach level three", () => {
  for (const weapon of ["pulse", "split", "rail", "seeker"] as const) {
    const game = running();
    game.player.weapon = weapon;
    for (let index = 0; index < 24; index++) {
      const enemy = spawnEnemy(game, "scout", game.player.x, game.player.y)!;
      killEnemy(game, enemy);
      updateGame(game, { ...emptyInput(), ceaseFire: true });
    }
    assert.equal(game.player.weapon, weapon);
    assert.equal(game.player.level, 3);
  }
});

test("next-sector and restored-checkpoint encounter seeds agree", () => {
  const game = running();
  game.status = "cleared";
  nextSector(game);
  const restored = createGame(
    emptyProfile(),
    "campaign",
    game.sector,
    game.seed,
  );
  assert.equal(game.random, restored.random);
});

// A deterministic input-only pilot checks reachable responses, not human game feel.
function bossPilot(g: Game) {
  const p = g.player;
  let best = { x: 130, y: g.boss?.y ?? 135 };
  let cost = Infinity;
  const danger = g.bullets.filter((b) => b.enemy);
  for (let y = 22; y <= 248; y += 8) {
    const x = 130;
    const dx = x - p.x;
    const dy = y - p.y;
    const d = Math.hypot(dx, dy);
    let value = Math.abs(y - (g.boss?.y ?? 135)) * 0.07 + Math.abs(dy) * 0.02;
    for (const b of danger) {
      for (let t = 0.05; t <= 0.75; t += 0.1) {
        const travel = Math.min(1, (170 * t) / Math.max(1, d));
        const distance = Math.hypot(
          b.x + b.vx * t - p.x - dx * travel,
          b.y + b.vy * t - p.y - dy * travel,
        );
        value += Math.max(0, 22 - distance) ** 2 * 2;
      }
    }
    if (value < cost) {
      cost = value;
      best = { x, y };
    }
  }
  return {
    ...emptyInput(),
    target: best,
    pulse:
      p.charge >= 100 &&
      danger.some((b) => Math.hypot(b.x - p.x, b.y - p.y) < 40),
  };
}

test("all five bosses are clearable with the normal hitbox and level-one weapon", () => {
  for (let sector = 0; sector < 5; sector++) {
    const game = createGame(emptyProfile(), "practice", sector);
    game.status = "running";
    for (
      let tick = 0;
      tick < 60 * 180 && !["dead", "cleared"].includes(game.status);
      tick++
    ) {
      updateGame(game, bossPilot(game));
      game.events = [];
    }
    assert.equal(
      game.status,
      "cleared",
      SECTORS[sector].bossName + " must have a survivable response",
    );
    assert.ok(game.player.hull > 0);
  }
});
