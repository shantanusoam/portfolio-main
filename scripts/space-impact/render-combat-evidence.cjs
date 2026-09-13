// Offline Canvas fixtures only: no browser CSS, touch input, or device audio QA.
// Optional QA dependency: @napi-rs/canvas. Run with node --import tsx.
const { createCanvas } = require("@napi-rs/canvas");
const fs = require("node:fs");
const path = require("node:path");
const base = path.resolve(__dirname, "../..");
global.document = {
  createElement(tag) {
    if (tag !== "canvas") throw new Error(tag);
    const canvas = createCanvas(1, 1);
    canvas.style = {};
    return canvas;
  },
};
const { createPocketRenderer } = require(
  path.join(base, "lib/space-impact/pocket/renderer.ts"),
);
const { createGame, emptyInput } = require(
  path.join(base, "lib/space-impact/model.ts"),
);
const { emptyProfile } = require(
  path.join(base, "lib/space-impact/storage.ts"),
);
const { spawnFormation } = require(
  path.join(base, "lib/space-impact/director.ts"),
);
const { updateGame } = require(path.join(base, "lib/space-impact/update.ts"));
const { pickup, collectPickup } = require(
  path.join(base, "lib/space-impact/combat.ts"),
);
const { defaultPocketSettings } = require(
  path.join(base, "lib/space-impact/pocket/save.ts"),
);
const output = path.join(
  base,
  "docs/space-impact/pocket/evidence/combat-remix",
);
fs.mkdirSync(output, { recursive: true });
const fixtures = [];
for (const [formation, enemy, weapon, preset] of [
  ["chevron", "armored", "split", "crt"],
  ["weave", "prism", "seeker", "crt"],
  ["wall", "sentry", "rail", "crt"],
  ["pincer", "choir", "pulse", "pocket"],
]) {
  const game = createGame(emptyProfile());
  Object.assign(game, {
    status: "running",
    stageStarted: true,
    encounter: 999,
    featureCursor: 999,
  });
  Object.assign(game.player, { weapon, level: 2 });
  game.player.arsenal[weapon] = 2;
  spawnFormation(game, enemy, formation, 0.5, 5, "drone");
  const canvas = document.createElement("canvas");
  const renderer = createPocketRenderer(canvas);
  renderer.resize(960, 540, 1);
  const settings = { ...defaultPocketSettings(), preset };
  for (let i = 0; i < 266; i++) {
    game.player.invincible = 10;
    if (i === 245) {
      for (const kind of ["shield", "overdrive", "drone"]) {
        pickup(game, game.player.x, game.player.y, kind);
        collectPickup(game, game.pickups[game.pickups.length - 1]);
      }
      pickup(game, 200, 205, "seeker");
      pickup(game, 240, 220, "overdrive");
    }
    const input = { ...emptyInput(), ceaseFire: i < 245 };
    updateGame(game, input);
    renderer.render(
      game,
      input,
      settings,
      preset,
      "olive",
      (i * 1000) / 60 + 1000,
    );
    game.events.length = 0;
  }
  const filename = `${formation}-${weapon}-${preset}.png`;
  fs.writeFileSync(path.join(output, filename), canvas.toBuffer("image/png"));
  fixtures.push({
    filename,
    tick: game.tick,
    enemies: game.enemies.length,
    shots: game.bullets.length,
    warnings: game.enemies.filter((enemy) => enemy.telegraph > 0).length,
  });
  renderer.dispose();
}
const report = {
  scope:
    "offline Canvas fixtures; synthetic invincibility and power grants; no DOM or device-audio QA",
  fixtures,
};
fs.writeFileSync(
  path.join(output, "fixtures.json"),
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
