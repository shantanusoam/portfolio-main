import assert from "node:assert/strict";
import test from "node:test";
import {
  READABILITY_FLOOR,
  clientToWorld,
  computeFit,
} from "../../lib/space-impact/pocket/fit";
import { PRESETS, POCKET_PALETTE } from "../../lib/space-impact/pocket/palette";
import {
  emptyPocketSave,
  parsePocketSave,
  persistPocketGame,
  POCKET_STORAGE_KEY,
} from "../../lib/space-impact/pocket/save";
import {
  fromGrid,
  getAtlasGrids,
  rasterShape,
} from "../../lib/space-impact/pocket/atlas-frames";
import { createGame } from "../../lib/space-impact/model";
import { emptyProfile } from "../../lib/space-impact/storage";

test("fitting policy matches the phone table", () => {
  const tall = 900;
  // [width, dpr, expected mode, expected world width]
  const cases: Array<[number, number, "integer" | "nearest", number]> = [
    [296, 1, "nearest", 296],
    [296, 2, "nearest", 296],
    [296, 2.625, "integer", 274.2857],
    [296, 3, "nearest", 296],
    [336, 1, "nearest", 336],
    [336, 2, "nearest", 336],
    [336, 2.625, "nearest", 336],
    [336, 3, "integer", 320],
    [360, 1, "nearest", 360],
    [360, 2, "integer", 360],
    [360, 2.625, "nearest", 360],
    [360, 3, "integer", 320],
  ];
  for (const [width, dpr, mode, worldWidth] of cases) {
    const fit = computeFit(width, tall, dpr);
    assert.equal(fit.mode, mode, `mode for ${width}@${dpr}`);
    assert.ok(
      Math.abs(fit.cssWidth - worldWidth) < 0.01,
      `world width for ${width}@${dpr}: ${fit.cssWidth}`,
    );
  }
});

test("readability floor collapses before claiming a smaller view", () => {
  const fit = computeFit(200, 900, 2);
  assert.equal(fit.floorFailed, true);
  assert.ok(fit.cssWidth < READABILITY_FLOOR);
});

test("integer enlargement never exceeds 6x or the available box", () => {
  const fit = computeFit(2000, 2000, 1);
  assert.ok(fit.deviceScale <= 6);
  assert.ok(fit.cssWidth <= 2000);
  const nearest = computeFit(1000, 1000, 1);
  if (nearest.mode === "nearest") {
    assert.equal(nearest.backingWidth, Math.round(nearest.cssWidth));
  }
});

test("pointer mapping uses the displayed world rectangle", () => {
  const world = clientToWorld(100, 50, {
    left: 40,
    top: 20,
    width: 320,
    height: 180,
  });
  assert.ok(Math.abs(world.x - (60 * 480) / 320) < 1e-9);
  assert.ok(Math.abs(world.y - (30 * 270) / 180) < 1e-9);
});

test("pocket save round-trips and rejects malformed envelopes", () => {
  const save = emptyPocketSave();
  save.checkpoint = {
    sector: 1,
    weapon: "rail",
    level: 2,
    score: 4500,
    seed: 99,
    assist: false,
  };
  save.best = { "campaign:standard": 7300 };
  const parsed = parsePocketSave(JSON.stringify(save));
  assert.deepEqual(parsed.checkpoint, save.checkpoint);
  assert.equal(parsed.best["campaign:standard"], 7300);
  assert.equal(parsed.settings.preset, "crt");

  const malformed = parsePocketSave("{not json");
  assert.equal(malformed.version, 2);
  assert.equal(malformed.checkpoint, null);
  const wrongVersion = parsePocketSave(
    JSON.stringify({ version: 99, edition: "pocket" }),
  );
  assert.equal(wrongVersion.checkpoint, null);
  assert.equal(wrongVersion.settings.preset, "crt");
  assert.notEqual(POCKET_STORAGE_KEY, "portfolio-space-impact:v1");
});

test("persisting a game keeps best scores and the sector checkpoint", () => {
  const save = emptyPocketSave();
  const game = createGame(emptyProfile(), "campaign", 0, 77);
  game.score = 1234;
  game.checkpoint = {
    sector: 0,
    weapon: "pulse",
    level: 1,
    score: 1234,
    seed: 77,
    assist: false,
  };
  const persisted = persistPocketGame(save, game);
  assert.equal(persisted.best["campaign:standard"], 1234);
  assert.equal(persisted.checkpoint?.score, 1234);
});

test("presets keep hazard-visible defaults", () => {
  assert.equal(PRESETS.clean.persistenceMs, 0);
  assert.ok(PRESETS.pocket.persistenceMs >= 40);
  assert.ok(PRESETS.pocket.persistenceMs <= 80);
  assert.ok(PRESETS.worn.persistenceMs <= 80);
  for (const preset of Object.values(PRESETS)) {
    assert.ok(preset.cell < 0.2, "cell texture stays subtle");
    assert.ok(preset.clearance >= 1, "every preset keeps a clearance border");
  }
});

test("the pocket palette keeps essential core contrast", () => {
  const lum = (hex: string) => {
    const channel = [0, 2, 4].map((offset) => {
      const raw = parseInt(hex.slice(offset + 1, offset + 3), 16) / 255;
      return raw <= 0.03928
        ? raw / 12.92
        : Math.pow((raw + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * channel[0] + 0.7152 * channel[1] + 0.0722 * channel[2];
  };
  const ink = lum(POCKET_PALETTE[1]);
  const backlight = lum(POCKET_PALETTE[4]);
  const ratio = (backlight + 0.05) / (ink + 0.05);
  assert.ok(ratio > 7.5, `ink/backlight ratio ${ratio.toFixed(2)}`);
});

test("authored frames stay on the shared grid and palette", () => {
  const grids = getAtlasGrids();
  for (const [id, rows] of Object.entries(grids)) {
    const width = rows[0].length;
    for (const row of rows) {
      assert.equal(row.length, width, `${id} rows are rectangular`);
      for (const ch of row) {
        assert.ok(
          ch === "." || "1234".includes(ch),
          `${id} uses palette indices only`,
        );
      }
    }
  }
});

test("ship, enemies and watcher have their animation frame budgets", () => {
  const shape = rasterShape();
  assert.equal(shape.shipIdle, 4);
  assert.equal(shape.shipUp, 4);
  assert.equal(shape.shipDown, 4);
  assert.equal(shape.shipBreakup, 8);
  assert.equal(shape.scout, 2);
  assert.equal(shape.sentry, 2);
  assert.equal(shape.diver, 2);
  assert.equal(shape.watcher, 3);
  assert.equal(shape.cannon, 3);
});

test("breakup frames dissolve away from the hull", () => {
  const early = fromGrid(["111", "141", "111"]);
  assert.equal(early.w, 3);
  assert.ok(early.data.reduce((sum, tone) => sum + (tone ? 1 : 0), 0) > 0);
});

test("existing LCD preferences survive the CRT release and partial saves retain sound defaults", () => {
  const parsed = parsePocketSave(
    JSON.stringify({
      version: 2,
      edition: "pocket",
      settings: { preset: "worn", palette: "mint" },
    }),
  );
  assert.equal(parsed.settings.preset, "worn");
  assert.equal(parsed.settings.palette, "mint");
  assert.equal(parsed.settings.music, 0.3);
  assert.equal(parsed.settings.effects, 0.55);
  const silent = parsePocketSave(
    JSON.stringify({
      version: 2,
      edition: "pocket",
      settings: { music: 0, effects: 0, muted: true },
    }),
  );
  assert.equal(silent.settings.music, 0);
  assert.equal(silent.settings.effects, 0);
  assert.equal(silent.settings.muted, true);
});
test("high-DPR post-processing is capped without reducing the CSS playfield", () => {
  const fit = computeFit(1600, 900, 3);
  assert.equal(fit.cssWidth, 1600);
  assert.equal(fit.backingWidth, 1440);
  assert.equal(fit.backingHeight, 810);
});
