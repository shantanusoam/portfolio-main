# Strumrise playtest

## What was actually verified this pass

No browser-automation tool was available in this environment (same
documented gap as the base build — see `docs/mascot/PLAYTEST.md`). No real
rendered/interactive browser session was used. This is explicitly a gap,
not something to gloss over — see "Not verified" below.

### Automated (real, performed)

- `npm run test:mascot`: 330/330 passing, including
  `tests/mascot/game/*.test.ts` (physics, landing detection, platform
  generation reachability, camera, score, persistence, state machine — 60
  new tests across 7 files).
- `tests/mascot/game/PlatformGenerator.test.ts`'s reachability property
  test specifically: every `(dx, dy)` pair produced by 25 different seeds
  × 60 platforms each (1,500 generated platforms total) verified reachable
  under the real physics constants via `isReachable` — this is the
  concrete evidence behind the design doc's "generated platforms are
  reachable" acceptance criterion, not an assumption.
- `node scripts/mascot/verify-upgrade.mjs` (full run, upgrade-scoped
  paths including `components/strumrise`): typecheck ✔, lint ✔, format ✔,
  test:mascot ✔, build ✔.
- `node scripts/mascot/perf-budget.mjs`: no PixiJS/Three.js markers in any
  client chunk.
- `npm run build`: succeeds. `/` route First Load JS unchanged at 259 kB
  from before this work — confirms `StrumriseGate`/`StrumriseOverlay`
  (loaded via `next/dynamic(..., { ssr: false })`) are not bundled into
  the homepage's initial load.

### Server-rendered smoke test (real, performed)

With `npm run dev` on `http://localhost:3002`:

- `GET /` → `HTTP 200`.
- `GET /motion-lab` → `HTTP 200`.
- The dev-mode `Warning: forwardRef render functions accept exactly two
parameters` message appeared in the server log for both routes. This is
  the **same pre-existing warning documented in `docs/mascot/PLAYTEST.md`**
  (confirmed there as present before any mascot edits in the base build)
  — not something introduced by Strumrise. No other new console/compile
  errors appeared.
- Did not confirm the "Play Strumrise" button's literal text renders in
  the static HTML fetch (`ProceduralMascotLoader`/`StrumriseGate` mount
  client-side after browser idle time, so a plain `curl` of the
  server-rendered shell won't show it — this is expected, not a bug, and
  matches how `MascotSoundControl` already behaves).

## Not verified (documented gap)

The following require an actual rendered, interactive browser and were
**not** performed. Do not treat them as passing.

| Scenario                                                                                          | Status       |
| ------------------------------------------------------------------------------------------------- | ------------ |
| "Play Strumrise" button click actually pauses the homepage mascot and shows the tumble transition | Not verified |
| Transition respects `prefers-reduced-motion` (instant switch, no tumble)                          | Not verified |
| Keyboard steering (arrows/A-D) feels responsive                                                   | Not verified |
| Touch zone steering works on a real touch device                                                  | Not verified |
| Pause (P/Escape) and resume round-trip visually                                                   | Not verified |
| A real landing visually bends/plucks the drawn platform and plays audible sound                   | Not verified |
| Mute toggle actually silences audio without breaking gameplay                                     | Not verified |
| A miss with lives remaining respawns the mascot visibly, not just in state                        | Not verified |
| Game over → retry starts a genuinely new run without a page reload                                | Not verified |
| Reaching the height target shows the victory screen                                               | Not verified |
| Best score/height persist across a real retry/reload                                              | Not verified |
| Exit returns cleanly to the homepage with the mascot resuming motion                              | Not verified |
| Frame rate stays smooth with the full platform window active                                      | Not verified |
| Mobile viewport layout (HUD safe-area padding, touch zones not obstructing controls)              | Not verified |
| Screen-reader announcement of HUD state changes                                                   | Not verified |

## How to perform this playtest manually

1. `npm run dev`, open `/` in a browser.
2. Wait for the mascot to appear (idle-loaded), then click "Play Strumrise"
   (bottom-right).
3. Confirm the tumble transition plays (or is skipped if OS reduced-motion
   is enabled), then the full-screen game appears.
4. Click "Start", steer with arrow keys / A-D / touch drag, confirm the
   mascot auto-bounces off strings and a note is audible per landing
   (after unmuting if needed).
5. Press P or Escape to pause, confirm the pause menu appears and Resume
   works.
6. Deliberately miss a platform (stop steering near a gap) to test a life
   loss and respawn, then exhaust all lives to reach Game Over → Retry.
7. Climb to the sector height target (or lower
   `STRUMRISE_CONFIG.sector.heightTarget` locally for a faster test) to
   confirm the victory screen.
8. Click "Exit to portfolio", confirm the homepage mascot resumes moving
   and the button reappears.
9. Toggle OS-level reduced-motion and repeat step 2 to confirm the
   transition is skipped.
10. Repeat on a touch device or with browser DevTools' touch emulation.
