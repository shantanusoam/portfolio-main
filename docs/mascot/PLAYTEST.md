# Playtest

## What was actually verified this pass

No browser-automation tool was available in this environment (Chrome DevTools
MCP/claude-in-chrome was offered and the user chose not to connect it; no
Playwright installed — see `docs/mascot/BASELINE_AUDIT.md`). Verification
below was done via `npm run dev` + `curl` (server-rendered HTML inspection)
and static analysis, not a real rendered browser session. This is
explicitly a gap, not something to gloss over — see "Not verified" below.

### Server-rendered smoke test (real, performed)

With `npm run dev` running on `http://localhost:3002`:

- `GET /` → `HTTP 200`, real portfolio content present (`Cluckstorm`,
  `Navbar`, `Shantanu` all found in the response body), no
  `application error` / `unhandled runtime error` / `error boundary`
  markers in the HTML.
- `GET /motion-lab` → `HTTP 200`, `<canvas class="Mascot_canvas__V2Zve"
  aria-hidden="true">` present in the server-rendered HTML.
- `data-mascot-obstacle="hard"` present 6 times in the home page's
  server-rendered HTML (Navbar logo, resume button via the shared `Button`
  component, hamburger menu toggle — counted across both mobile/desktop
  render paths).
- `data-mascot-interest="project"` present 12 times (6 real project cards
  × the mobile/desktop-duplicated render path; locked/placeholder missions
  correctly excluded via `isLocked ? undefined : "project"` in
  `MissionCard.tsx`).
- Dev server terminal log showed successful recompiles after every edit
  (Navbar, Buttons, MenuToggle, MissionCard, layout.tsx), zero new
  TypeScript/webpack compile errors introduced. One pre-existing warning
  (`forwardRef render functions accept exactly two parameters`) was present
  **before** any mascot edits were made (confirmed by its first appearance
  in the log immediately after the very first, pre-edit homepage fetch) —
  documented as pre-existing, not fixed, per "do not fix unrelated systems."
- Production build (`npm run build`) succeeds; see `docs/mascot/PERFORMANCE.md`
  for the per-route bundle size evidence.

### Automated (real, performed)

- `npm run test:mascot`: 131/131 passing.
- `node scripts/mascot/verify.mjs` (full, including production build):
  typecheck ✔, lint ✔, format ✔, test:mascot ✔, build ✔ — all scoped to
  mascot-owned paths (pre-existing repo-wide issues outside those paths do
  not fail the gate; see `scripts/mascot/verify.mjs`'s own doc comment).
- `node scripts/mascot/perf-budget.mjs`: no PixiJS/Three.js markers found
  in any mascot-attributed client chunk.

## Not verified (documented gap)

The following require an actual rendered browser and were **not**
performed. Do not treat them as passing.

| Scenario | Status |
|---|---|
| Pointer follow feels responsive, not distracting | Not verified |
| Idle → wander transition has no visible snap | Not verified |
| Hard-turn spine/tail readability | Not verified |
| Obstacle corner gliding (no jitter) | Not verified |
| Project-card inspection (approach, orient, leave) | Not verified |
| Fast scrolling → scroll-current visual response | Not verified |
| Resize while moving | Not verified |
| Hidden tab for 10s → pause/resume without a jump | Not verified |
| Component unmount/remount → no duplicate loop | Not verified (code review only — see the lifecycle checklist) |
| Route navigation cleanup | Not verified (code review only) |
| `prefers-reduced-motion` end-to-end visual behavior | Not verified (code review only — `VisibilityController`/`reducedMotion` behavior state logic is unit-testable, but the actual on-screen result is not) |
| Click scatter / reform visual quality | Not verified |
| Console cleanliness during real interaction (not just initial SSR) | Not verified |
| Desktop/mobile actual frame rate | Not verified |

## How to complete this playtest

1. `npm run dev`.
2. Open `/motion-lab` in a real browser.
3. Walk through each row above manually; use the debug panel's scenario
   player, pause/slow-motion, and the "Debug overlay" toggle
   (spine/normals/obstacles) to inspect specific claims.
4. Open `/` and interact with the real portfolio — move the pointer near
   the Navbar/buttons (hard obstacles), scroll, resize, hide the tab, and
   navigate to `/motion-lab` and back.
5. Toggle `prefers-reduced-motion` in devtools and re-check `/` and
   `/motion-lab`.
6. Record pass/fail and any console errors in the table above, replacing
   "Not verified" with the actual result.
7. If Playwright is later installed, remove `tests/e2e` from
   `tsconfig.json`'s `exclude` array and run the specs in
   `tests/e2e/mascot-*.spec.ts`, which already encode most of the table
   above as assertions.
