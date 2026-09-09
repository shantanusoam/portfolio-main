# Lost Signal: Pocket Edition — build & critic record

Status: **first-sector slice implemented, critic loop exhausted at 8.2/10 (pass ≥ 8.5)**.
Branch: `feat/lost-signal-pocket-edition`. The original edition is untouched;
the v1 save key is never read or written.

## What was built

| Path | Responsibility |
| --- | --- |
| `app/arcade/space-impact/pocket/page.tsx` | New edition route + metadata |
| `components/space-impact/pocket/PocketEdition.tsx` | LCD handset, HUD strip, presets, mobile controls, overlays |
| `components/space-impact/pocket/PocketEdition.module.css` | Receiver chrome, HUD, short-landscape/portrait contracts |
| `lib/space-impact/pocket/palette.ts` | 4-tone indexed palette, mint preset, preset FX configs |
| `lib/space-impact/pocket/atlas-frames.ts` | Pure deterministic pixel-art builders (no DOM, testable) |
| `lib/space-impact/pocket/atlas.ts` | Canvas baking + 1px backlight clearance dilate + manifest |
| `lib/space-impact/pocket/renderer.ts` | `render/setPreset/resize/resetHistory/dispose` adapter: 240×135 art surface, persistence ping-pong, safe-corridor marking, protected critical layer, cell mask, backlight, wear |
| `lib/space-impact/pocket/fit.ts` | Plan §3 fitting policy + pointer mapping (unit-tested against the plan's 12-row table) |
| `lib/space-impact/pocket/save.ts` | `portfolio-space-impact:pocket:v2` envelope, validated, v1 key untouched |
| `tests/space-impact/pocket.test.ts` | 11 unit tests (fit table, floor, mapping, save, presets, contrast, atlas integrity) |

The existing simulation (`lib/space-impact/*`) is reused unmodified; the
presentation layer reads only simulation snapshots.

## Critic loop (independent subagent, no code access; rubric per commission)

| Round | Score | Verdict highlights |
| --- | --- | --- |
| 1 | 6.6 FAIL | Blocker: fragmented hostile shot; halo boxes; invisible cannons; dark title; no motion evidence |
| 2 | 7.9 FAIL | Blocker fixed; clue invisible; adverse scene incomplete; 48px misses; perf holes |
| 3 | 7.7 FAIL | Stills improved but bank clip captured a death screen; landscape button 45.7px; volley missing from still |
| 4 | 8.2 FAIL | Motion + volley + veil fixed; ASSIST OPTIONS still <48px; floor state is a text pileup; motif too faint |

**Pass condition was ≥ 8.5 with zero console errors and sustained 60 FPS.**
Final measured state: zero console errors, zero failed requests, CPU render
p95 0.6–0.7 ms in every viewport, presented rate at/above the per-viewport
blank-page rAF ceiling of the capture environment (headless Chromium +
SwiftShader, blank baseline 45–59 fps). Sustained 60 FPS on real 60 Hz
hardware remains plausible-but-unproven; the plan's 10–15 minute device
pacing gate is untouched.

## Outstanding issues (from the final critic round)

1. **MAJOR — ASSIST OPTIONS button** (game-over overlay) measured ~46 CSS px at 640×360. *Fixed after the loop closed:* `.menuButton` now carries a global `min-height: 48px` + `box-sizing: border-box`; unverified by a further critic round.
2. **MAJOR — destruction clip** shows hit-blink → one spray frame → overlay; the 8-frame breakup runs in-engine (atlas `shipBreakup` 8 frames) but the game-over overlay covers it too early. Fix direction: hold the overlay until the breakup completes.
3. **MINOR — floor state** is now a dedicated card (`!floorWarning` gates all other overlays), but the captured still predates the fix.
4. **MINOR — adverse still** was captured between telegraphs, so the corridor veil shows only in `clip-corridor-crossing.gif`, not the still.
5. **MINOR — portrait constellation motif** contrast raised to 0.32 after the loop closed; unverified by a further round.

## Environment notes

- Evidence captured with headless Chromium + SwiftShader via CDP
  (`/tmp/opencode/pocket/drive2.mjs`): per-viewport rAF baselines, presented
  FPS, draw-interval percentiles, CPU render cost, console + network capture,
  8 fps frame-quantized GIFs.
- The environment's own blank-page rAF ceiling swings 45–59 fps run-to-run;
  the game-owned signals (CPU render p95, draw pacing) are the stable ones.
- Vercel Analytics is gated to production so dev/QA has zero console noise.
