# Baseline Audit

Date: 2026-08-06
Branch: `proceduralaniamtion` (tracking `origin/proceduralaniamtion`)
Working tree at audit time: clean, no staged/unstaged/untracked changes.

## Repository

- Framework: Next.js 13.4.10, `app/` router, React 18.2.0, TypeScript 5.1.6.
- Styling: Tailwind CSS 3.3.3, plus CSS Modules and hand-written `app/globals.css`.
- Animation stack already in use: `framer-motion` 10.13, `gsap` 3.15, `@studio-freight/lenis`
  (smooth scroll, via `components/providers/SmoothScrollProvider.tsx`), CSS keyframes.
- `@chenglou/pretext` 0.0.8 is installed and used by `components/PretextCopyLab.tsx`
  (an existing, unrelated text-layout experiment). No other Pretext usage found.
- No PixiJS, no Three.js, no WebGL usage anywhere in the repo.
- `next.config.js` sets `typescript.ignoreBuildErrors: true` and
  `eslint.ignoreDuringBuilds: true` — the production build does **not** gate on
  type or lint errors today. This is pre-existing behavior, unrelated to this work.

## Package manager

Both `package-lock.json` and `pnpm-lock.yaml` are present and committed. The
`node_modules` mtime matches `package-lock.json` exactly, and the most recent
commit touching a lockfile (`Add sprite generation script using Gemini API`)
updated `package-lock.json`. **npm is the currently authoritative package
manager**; `pnpm-lock.yaml` appears stale. `scripts/mascot/verify.mjs` detects
the package manager at runtime instead of hardcoding this.

## Existing "mascot" prototype

None found. This spec's "Prototype Ideas That Must Be Preserved" section
describes prior art (`SecondOrderDynamics`, `repel-creature`, etc.) that does
**not** exist anywhere in this repository — greped for
`SecondOrderDynamics|ProceduralMascot|ProceduralCreature|repel-creature` across
all source and doc files and found no matches outside the spec document
itself. This is a greenfield build. The "mandatory corrections" in the spec
are treated as design constraints to build correctly from the start, not as
patches to prior code.

## Existing Canvas / rAF experiences (unrelated, preserved as-is)

- `components/easter-egg/SecretArcade.tsx` + `components/easter-egg/game/*` — a
  full Canvas 2D shoot-em-up easter egg ("Cluckstorm"), with its own game loop,
  sprite system, and `logic.test.ts` unit test run via `tsx --test`.
- `components/IntrectiveComponents/StringInstrument.tsx` — a Canvas-drawn,
  physically-simulated playable instrument in the Hero section.
- `components/providers/SmoothScrollProvider.tsx` — Lenis-driven smooth scroll,
  uses `requestAnimationFrame`.
- `components/PretextCopyLab.tsx` — Pretext text-layout experiment.
- `bladeshift/` — a separate sub-project (own `package.json`, hand-tracking
  controller) unrelated to the main portfolio route tree.

None of these are touched by this work except to register safe DOM obstacle
markers around content they render, and only where it is genuinely useful
(e.g. not inside the arcade's own canvas).

## Relevant components for obstacle/interest markup

- `components/Navbar.tsx` — top navigation, must be a hard obstacle.
- `components/ui/Buttons.tsx` — shared `Button` component used for CTAs.
- `components/Projects.tsx` + `components/MissionCard.tsx` — project cards,
  candidates for `interest` markers.
- `app/layout.tsx` — root layout; mascot loader will mount here so it is
  present across all routes without altering existing providers.
- `app/page.tsx` — home route; renders `Navbar`, `Projects`, etc. inside
  `<main className="text-clip">`, wrapped by `SmoothScrollProvider`.

## Test tooling

- No Jest, Vitest, or Playwright installed.
- The one existing unit test (`components/easter-egg/game/logic.test.ts`) runs
  via Node's built-in test runner through `tsx --test` (`package.json` script
  `test:game`). This repo's established convention for lightweight unit tests
  is **`tsx --test` + `node:test` + `node:assert`**, not a third-party
  framework. Mascot unit tests follow the same convention
  (`tests/mascot/*.test.ts`, script `test:mascot`) to avoid adding a
  duplicate test runner.
- No browser-automation framework (Playwright/Cypress) is installed and none
  is added by this work — see `docs/mascot/PLAYTEST.md` for how this
  limitation is handled (manual test matrix + deterministic scenarios exposed
  via `window.__MASCOT_DEBUG__` in development).
- `eslint` 8.45 with `next/core-web-vitals`, `standard`, `plugin:tailwindcss`,
  `prettier` configs. `prettier` 3.1 with `prettier-plugin-tailwindcss` is a
  devDependency; no `.prettierrc` was found, so Prettier uses its defaults.
- `tsc` is available via `typescript` 5.1.6; there is no dedicated
  `type-check` script yet (added by this work as part of
  `scripts/mascot/verify.mjs`, without changing the top-level `build` script).

## Build status before this work

Not modified prior to this audit. `next build` was not run as part of the
audit itself (no source changed yet); the production build result after
mascot integration is recorded in `docs/mascot/PERFORMANCE.md` and
`docs/mascot/FINAL_REPORT.md`.

## Risks / decisions flagged for the implementation phases

1. **No Playwright** — full E2E automation from the spec's `tests/e2e/*`
   list cannot run in this environment without adding a new, heavy
   dependency and downloading browser binaries. Spec files are still created
   (`tests/e2e/mascot-*.spec.ts`) as Playwright-shaped specs with a top-level
   guard that skips cleanly when `@playwright/test` is not installed, plus a
   manual test matrix in `PLAYTEST.md`. Installing Playwright for real is left
   as an explicit follow-up rather than silently adding a multi-hundred-MB
   dependency during an unattended run.
2. **Dual lockfiles** — resolved by treating npm as authoritative (see
   above). Not touching `pnpm-lock.yaml`.
3. **`ignoreBuildErrors` / `ignoreDuringBuilds`** — the production build will
   succeed even if new mascot code has type or lint errors. `verify.mjs` runs
   `tsc --noEmit` and `next lint` explicitly so mascot code is still gated
   even though the Next build itself does not enforce it.
4. **No PixiJS/WebGL** — per spec, Canvas 2D is used exclusively for this
   pass; the PixiJS renderer module is a documented, gated stub only
   (`lib/mascot/rendering/PixiMascotRenderer.ts` is intentionally **not**
   created since no code path uses it yet — creating an empty/unused file
   would violate the "no unused placeholder files" rule. The gate and
   migration path are documented in `docs/mascot/ARCHITECTURE.md` instead).
5. **FABRIK legs** — implemented as pure, tested math
   (`lib/mascot/motion/FabrikSolver.ts`) but not wired into the default
   creature rig, per the spec's explicit phase gate ("do not implement legs
   before body motion is approved").
6. **Pretext mascot integration** — out of scope for this pass (Phase 13 is
   explicitly optional and gated on core completion). The existing
   `PretextCopyLab.tsx` experiment is left untouched.
