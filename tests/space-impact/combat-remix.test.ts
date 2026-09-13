import assert from "node:assert/strict";
import test from "node:test";
import {
  activatePulse,
  collectPickup,
  cycleWeapon,
  damagePlayer,
  fire,
  killEnemy,
  pickup,
  resolveSquad,
} from "../../lib/space-impact/combat";
import { selectSounds } from "../../lib/space-impact/audio";
import { MAX_BULLETS, STEP, WEAPON_ORDER } from "../../lib/space-impact/config";
import {
  enterRoom,
  spawnEnemy,
  spawnFormation,
} from "../../lib/space-impact/director";
import { attackAngles, updateEnemies } from "../../lib/space-impact/enemies";
import { InputController } from "../../lib/space-impact/input";
import {
  createGame,
  emptyInput,
  pauseGame,
} from "../../lib/space-impact/model";
import {
  composeStep,
  DEFAULT_SCENE,
  musicTempo,
} from "../../lib/space-impact/music";
import {
  emptyPocketSave,
  parsePocketSave,
  persistPocketGame,
} from "../../lib/space-impact/pocket/save";
import {
  checkpointFor,
  emptyProfile,
  parseProfile,
} from "../../lib/space-impact/storage";
import type {
  Formation,
  Game,
  Input,
  Pickup,
} from "../../lib/space-impact/types";
import { updateGame } from "../../lib/space-impact/update";

const idle = { ...emptyInput(), ceaseFire: true };

function running(): Game {
  const game = createGame(emptyProfile());
  Object.assign(game, {
    status: "running",
    stageStarted: true,
    encounter: 999,
    featureCursor: 999,
  });
  return game;
}

function advance(game: Game, ticks: number, input: Input = idle): void {
  for (let i = 0; i < ticks; i++) {
    updateGame(game, input);
    game.events = [];
  }
}

function collect(game: Game, kind: Pickup["kind"]): void {
  pickup(game, game.player.x, game.player.y, kind);
  collectPickup(game, game.pickups[game.pickups.length - 1]);
}

test("the opening supplies a collectible split gun before five seconds even during ceasefire", () => {
  const game = createGame(emptyProfile());
  game.status = "running";
  let acquired = 0;
  for (let tick = 1; tick <= 300; tick++) {
    updateGame(game, idle);
    if (game.player.weapon === "split") {
      acquired = tick;
      break;
    }
  }
  assert.ok(acquired > 120 && acquired < 300, `upgrade tick: ${acquired}`);
  assert.equal(game.player.arsenal.pulse, 1);
  assert.equal(game.player.arsenal.split, 1);
  assert.match(game.combatNotice?.title ?? "", /SPLIT/);
});

test("four guns have distinct shot patterns and seekers turn gradually toward a visible target", () => {
  const shots = WEAPON_ORDER.map((weapon) => {
    const game = running();
    game.player.weapon = weapon;
    fire(game);
    return game.bullets;
  });
  assert.equal(shots[0].length, 1);
  assert.equal(shots[1].length, 3);
  assert.ok(shots[1].some((b) => b.vy < 0));
  assert.ok(shots[1].some((b) => b.vy > 0));
  assert.equal(shots[2].length, 1);
  assert.equal(shots[2][0].rail, true);
  assert.ok(shots[2][0].damage > shots[0][0].damage);
  assert.equal(shots[3].length, 2);
  assert.ok(shots[3].every((b) => b.seeker));

  const game = running();
  game.player.weapon = "seeker";
  const enemy = spawnEnemy(game, "armored", 330, 55)!;
  enemy.fire = 99;
  fire(game);
  const missile = game.bullets[0];
  const startAngle = Math.atan2(missile.vy, missile.vx);
  advance(game, 1);
  const nextAngle = Math.atan2(missile.vy, missile.vx);
  assert.ok(Math.abs(nextAngle - startAngle) <= 2.8 * STEP + 1e-10);
  advance(game, 15);
  assert.ok(missile.vy < -30, "missile bends upward toward the target");
});

test("weapon pods preserve the arsenal and switching cannot bypass the fire cooldown", () => {
  const game = running();
  collect(game, "split");
  collect(game, "split");
  collect(game, "rail");
  assert.deepEqual(game.player.arsenal, {
    pulse: 1,
    split: 2,
    rail: 1,
    seeker: 0,
  });
  game.player.fire = 0.4;
  for (let i = 0; i < 12; i++) {
    assert.equal(cycleWeapon(game), true);
    fire(game);
  }
  assert.equal(game.bullets.length, 0);
  assert.equal(game.player.fire, 0.4);
  collect(game, "split");
  const score = game.score;
  collect(game, "split");
  assert.equal(game.player.level, 3);
  assert.equal(game.score, score + 200);
  assert.equal(game.player.arsenal.rail, 1);
});

test("keyboard and pointer weapon changes are consumed once per deliberate press", () => {
  const input = new InputController(() => ({ x: 86, y: 135 }));
  input.keyDown("KeyQ");
  assert.equal(input.sample().cycleWeapon, true);
  input.keyDown("KeyQ");
  assert.equal(input.sample().cycleWeapon, false);
  input.keyUp("KeyQ");
  input.keyDown("KeyQ");
  assert.equal(input.sample().cycleWeapon, true);
  input.cycleWeapon();
  assert.equal(input.sample().cycleWeapon, true);
  assert.equal(input.sample().cycleWeapon, false);
  input.cycleWeapon();
  input.clear();
  assert.equal(input.sample().cycleWeapon, false);
});

test("a shield absorbs one hit without breaking a chain and respects recovery invincibility", () => {
  const game = running();
  game.player.invincible = 0;
  game.combo = 7;
  collect(game, "shield");
  assert.equal(damagePlayer(game), true);
  assert.equal(game.player.hull, 3);
  assert.equal(game.combo, 7);
  assert.equal(game.player.shield, 0);
  assert.equal(damagePlayer(game), false);
  game.player.invincible = 0;
  assert.equal(damagePlayer(game), true);
  assert.equal(game.player.hull, 2);
  assert.equal(game.combo, 0);
});

test("overdrive and drones add firepower while timed powers freeze on pause and honor ceasefire", () => {
  const normal = running();
  const boosted = running();
  collect(boosted, "overdrive");
  collect(boosted, "drone");
  collect(boosted, "shield");
  assert.equal(boosted.player.overdrive, 8);
  assert.equal(boosted.player.drones, 12);
  assert.equal(boosted.player.shield, 15);
  advance(normal, 60, emptyInput());
  advance(boosted, 60, emptyInput());
  assert.ok(boosted.bullets.length > normal.bullets.length * 1.5);
  const timers = [
    boosted.player.overdrive,
    boosted.player.drones,
    boosted.player.shield,
  ];
  pauseGame(boosted);
  advance(boosted, 600, emptyInput());
  assert.deepEqual(
    [boosted.player.overdrive, boosted.player.drones, boosted.player.shield],
    timers,
  );
  boosted.status = "running";
  boosted.bullets = [];
  advance(boosted, 60);
  assert.equal(boosted.bullets.length, 0);
  advance(boosted, 900);
  assert.deepEqual(
    [boosted.player.overdrive, boosted.player.drones, boosted.player.shield],
    [0, 0, 0],
  );
});

test("formations retain their coordinated geometry and the wall leaves a traversable lane", () => {
  for (const formation of [
    "chevron",
    "weave",
    "pincer",
    "wall",
  ] as Formation[]) {
    const game = running();
    spawnFormation(game, "scout", formation, 0.5, 5);
    for (let i = 0; i < 120; i++) updateEnemies(game);
    assert.ok(game.enemies.length >= 4);
    assert.ok(game.enemies.every((e) => e.squad === game.squads[0].id));
    assert.ok(game.enemies.every((e) => e.y >= 22 && e.y <= 248));
    if (formation === "chevron") {
      const [left, , center, , right] = game.enemies;
      assert.equal(left.x, right.x);
      assert.ok(left.x > center.x);
      assert.ok(Math.abs((left.y + right.y) / 2 - center.y) < 1e-9);
    }
    if (formation === "wall")
      assert.ok(game.enemies.every((e) => Math.abs(e.y - 135) > 42));
  }
});

test("sentries telegraph a locked aim and space their bursts without firing offscreen or at contact range", () => {
  const game = running();
  const enemy = spawnEnemy(game, "sentry", 520, 135)!;
  enemy.fire = 0;
  updateEnemies(game);
  assert.equal(game.bullets.length, 0);
  enemy.x = 330;
  enemy.fire = 0.76;
  updateEnemies(game);
  assert.ok(enemy.telegraph > 0.7);
  const lockedY = enemy.targetY;
  game.player.y = 45;
  for (let i = 0; i < 40; i++) updateEnemies(game);
  assert.equal(enemy.targetY, lockedY);
  assert.equal(game.bullets.length, 0);
  for (let i = 0; i < 8; i++) updateEnemies(game);
  assert.equal(game.bullets.length, 1);
  updateEnemies(game);
  assert.equal(game.bullets.length, 1);
  for (let i = 0; i < 27; i++) updateEnemies(game);
  assert.equal(game.bullets.length, 3);
  enemy.x = game.player.x + 80;
  enemy.fire = 0;
  game.bullets = [];
  updateEnemies(game);
  assert.equal(game.bullets.length, 0);
});

test("fan and cross volleys follow the same rays shown by their telegraphs", () => {
  for (const kind of ["armored", "prism"] as const) {
    const game = running();
    const enemy = spawnEnemy(game, kind, 350, 135)!;
    Object.assign(enemy, {
      fire: 0,
      targetX: 86,
      targetY: 135,
      telegraph: 0.001,
    });
    updateEnemies(game);
    assert.equal(game.bullets.length, kind === "armored" ? 3 : 2);
    const expected = attackAngles(enemy);
    game.bullets.forEach((shot, i) => {
      const difference = Math.atan2(shot.vy, shot.vx) - expected[i];
      assert.ok(
        Math.abs(Math.atan2(Math.sin(difference), Math.cos(difference))) < 1e-9,
      );
    });
    if (kind === "prism") {
      assert.ok(game.bullets.some((b) => b.vy < 0));
      assert.ok(game.bullets.some((b) => b.vy > 0));
    }
  }
});

test("friendly shots cannot kill an unseen enemy but resolve against a visible enemy", () => {
  const game = running();
  const enemy = spawnEnemy(game, "scout", 510, game.player.y)!;
  enemy.hp = 1;
  game.player.x = 455;
  advance(game, 18, emptyInput());
  assert.equal(game.kills, 0);
  assert.ok(enemy.x > 480);
  enemy.x = 400;
  enemy.baseY = game.player.y;
  game.player.x = 340;
  advance(game, 40, emptyInput());
  assert.equal(enemy.dead, true);
});

test("a complete formation gives one reward while escape or a room change closes its bookkeeping", () => {
  const game = running();
  spawnFormation(game, "scout", "chevron", 0.5, 4, "drone");
  for (const enemy of game.enemies) killEnemy(game, enemy);
  assert.equal(game.formationsCleared, 1);
  assert.equal(game.squads.length, 0);
  assert.equal(game.pickups.filter((p) => p.kind === "drone").length, 1);
  const score = game.score;
  killEnemy(game, game.enemies[0]);
  assert.equal(game.score, score);

  const escaped = running();
  spawnFormation(escaped, "scout", "wall", 0.5, 5, "drone");
  const [first, ...remaining] = escaped.enemies;
  first.dead = true;
  resolveSquad(escaped, first, true);
  for (const enemy of remaining) killEnemy(escaped, enemy);
  assert.equal(escaped.formationsCleared, 0);
  assert.equal(escaped.squads.length, 0);
  assert.equal(escaped.pickups.filter((p) => p.kind === "drone").length, 0);
  spawnFormation(escaped, "scout", "weave");
  enterRoom(escaped, "observatory");
  assert.equal(escaped.squads.length, 0);
  assert.equal(escaped.enemies.length, 0);
});

test("checkpoints keep the earned arsenal without leaking later death progress and migrate older saves", () => {
  const game = running();
  collect(game, "split");
  collect(game, "split");
  collect(game, "seeker");
  game.score = 1200;
  game.checkpoint = checkpointFor(game, 1);
  let saved = parsePocketSave(
    JSON.stringify(persistPocketGame(emptyPocketSave(), game)),
  );
  assert.equal(saved.checkpoint?.weapon, "seeker");
  assert.deepEqual(saved.checkpoint?.arsenal, {
    pulse: 1,
    split: 2,
    rail: 0,
    seeker: 1,
  });
  game.score = 9000;
  collect(game, "rail");
  saved = persistPocketGame(saved, game);
  assert.equal(saved.checkpoint?.score, 1200);
  assert.equal(saved.checkpoint?.arsenal?.rail, 0);

  const migrated = parsePocketSave(
    JSON.stringify({
      ...emptyPocketSave(),
      checkpoint: {
        sector: 0,
        seed: 55,
        weapon: "rail",
        level: 2,
        arsenal: { split: 99, seeker: -10 },
      },
    }),
  );
  assert.deepEqual(migrated.checkpoint?.arsenal, {
    pulse: 1,
    split: 3,
    rail: 2,
    seeker: 0,
  });
  assert.equal(
    parsePocketSave(JSON.stringify({ ...saved, checkpoint: { sector: 50 } }))
      .checkpoint,
    null,
  );
  const original = parseProfile(
    JSON.stringify({
      ...emptyProfile(),
      highestSector: 1,
      checkpoint: game.checkpoint,
    }),
  );
  assert.equal(original.checkpoint?.weapon, "seeker");
  assert.equal(original.checkpoint?.arsenal?.seeker, 1);
});

test("three minutes of authored challenge combat stay bounded and deterministic", () => {
  const simulate = () => {
    const game = createGame(emptyProfile(), "challenge", 0, 331042);
    game.status = "running";
    for (let tick = 0; tick < 10800; tick++) {
      game.player.invincible = 2;
      if (tick % 600 === 0) {
        collect(game, "overdrive");
        collect(game, "drone");
        collect(game, "seeker");
      }
      updateGame(game, {
        ...emptyInput(),
        y: Math.sin(tick / 90),
        cycleWeapon: tick % 240 === 0,
        pulse: tick % 180 === 0,
      });
      game.events = [];
      assert.ok(game.bullets.length <= MAX_BULLETS);
      assert.ok(game.enemies.length <= 45);
      assert.ok(game.squads.length <= 12);
      assert.ok(game.pickups.length <= 30);
    }
    assert.ok(game.kills > 0);
    return {
      score: game.score,
      kills: game.kills,
      random: game.random,
      clears: game.formationsCleared,
      sector: game.sector,
    };
  };
  assert.deepEqual(simulate(), simulate());
});

test("the eight-bar soundtrack varies its melody and pressure layers within note budgets", () => {
  const flight = Array.from({ length: 128 }, (_, step) =>
    composeStep(step, DEFAULT_SCENE),
  );
  const bossScene = { ...DEFAULT_SCENE, boss: true };
  const boss = Array.from({ length: 128 }, (_, step) =>
    composeStep(step, bossScene),
  );
  const quiet = Array.from({ length: 128 }, (_, step) =>
    composeStep(step, { ...DEFAULT_SCENE, quiet: true }),
  );
  assert.notDeepEqual(flight.slice(0, 16), flight.slice(16, 32));
  assert.ok(flight.flat().some((note) => note.target === 38));
  assert.ok(boss.flat().length > flight.flat().length);
  assert.ok(musicTempo(bossScene) > musicTempo(DEFAULT_SCENE));
  assert.ok([...flight, ...boss].every((notes) => notes.length <= 5));
  assert.ok(quiet.every((notes) => notes.length <= 1));
  assert.ok(
    flight
      .flat()
      .every(
        (note) =>
          note.frequency > 20 && note.gain <= 0.85 && note.duration <= 0.25,
      ),
  );
});

test("Nova cannot erase unseen formations and its sound survives a fleet destruction burst", () => {
  const edge = running();
  edge.player.x = 440;
  edge.player.charge = 100;
  spawnFormation(edge, "scout", "chevron", 0.5, 4);
  assert.equal(activatePulse(edge), true);
  assert.equal(edge.kills, 0);
  assert.equal(edge.formationsCleared, 0);

  const visible = running();
  visible.player.charge = 100;
  for (let i = 0; i < 5; i++) spawnEnemy(visible, "scout", 200, 70 + i * 25);
  assert.equal(activatePulse(visible), true);
  assert.equal(visible.kills, 5);
  const sounds = selectSounds(visible.events);
  assert.ok(sounds.includes("pulse"));
  assert.ok(sounds.length <= 6);
});
