// Offline renderer evidence only; does not simulate browser CSS or Web Audio.
// Optional QA dependency: @napi-rs/canvas (not needed by the shipped game).
const { createCanvas } = require("@napi-rs/canvas");
const fs = require("node:fs");
const path = require("node:path");
const base = process.argv[2];
const output = process.argv[3];
const preset = process.argv[4] || "crt";
const palette = process.argv[5] || "olive";
global.document = {
  createElement(tag) {
    if (tag !== "canvas") throw new Error(tag);
    const c = createCanvas(1, 1);
    c.style = {};
    return c;
  },
};
const { createPocketRenderer } = require(
  path.join(base, "lib/space-impact/pocket/renderer.ts"),
);
const { createGame, startGame, emptyInput } = require(
  path.join(base, "lib/space-impact/model.ts"),
);
const { emptyProfile } = require(
  path.join(base, "lib/space-impact/storage.ts"),
);
const { updateGame } = require(path.join(base, "lib/space-impact/update.ts"));
const { defaultPocketSettings } = require(
  path.join(base, "lib/space-impact/pocket/save.ts"),
);
const settings = { ...defaultPocketSettings(), preset, palette };
const game = createGame(emptyProfile(), "campaign", 0, 331042);
startGame(game);
const display = document.createElement("canvas");
const renderer = createPocketRenderer(display);
renderer.resize(960, 540, 1);
for (let i = 0; i < 630; i++) {
  game.player.invincible = 99;
  game.player.hull = game.player.maxHull;
  const input = {
    ...emptyInput(),
    y: Math.sin(i / 55) * 0.4,
    ceaseFire: false,
  };
  updateGame(game, input);
  game.events.length = 0;
  renderer.render(
    game,
    input,
    settings,
    preset,
    palette,
    (i * 1000) / 60 + 1000,
  );
}
fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, display.toBuffer("image/png"));
console.log(
  JSON.stringify({
    output,
    preset,
    palette,
    status: game.status,
    tick: game.tick,
    enemies: game.enemies.length,
    bullets: game.bullets.length,
    canvas: [display.width, display.height],
  }),
);
renderer.dispose();
