# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A personal portfolio built on Next.js 15 (App Router) + React 18 + TypeScript,
styled with Tailwind + CSS Modules. Beyond the standard portfolio sections
(Hero, About, Projects, Experience, Contact) it contains several
self-contained interactive/simulation subsystems (a procedural canvas
mascot, playable games, a physics-driven guitar-string instrument, a
"living canvas" ambient field) and a small headless CMS with an MCP server
that lets an external agent (Claude) publish content.

There is a subdirectory-scoped `.claude/CLAUDE.md` with detailed rules for
the procedural mascot subsystem specifically — read it before touching
anything under `lib/mascot`, `components/mascot`, `app/motion-lab`, or
`tests/mascot`. This file covers the rest of the repo plus commands shared
by everything.

## Commands

Package manager: **npm** is authoritative (both `package-lock.json` and
`pnpm-lock.yaml` exist; `pnpm-lock.yaml` is stale — see
`docs/mascot/BASELINE_AUDIT.md`). Use `npm run <script>`, not `pnpm`.

```bash
npm run dev                       # next dev
npm run build                     # next build (does NOT gate on type/lint errors, see below)
npm run lint                      # next lint

# Focused unit tests (Node's built-in test runner via tsx, no Jest/Vitest/Playwright)
npm run test:mascot               # tsx --test over tests/mascot/**/*.test.ts
npm run test:mascot:watch
npm run test:procedural-character # tests/procedural-character/**/*.test.ts
npm run test:living-canvas        # tests/living-canvas/*.test.ts
npm run test:game                 # components/easter-egg/game/logic.test.ts (Cluckstorm)
npm run test:break404             # components/not-found-breaker/game/logic.test.ts

# Run one test file directly, e.g.:
tsx --test tests/mascot/SpineSolver.test.ts

# Mascot-specific gates (see docs/mascot/*.md)
npm run verify:mascot             # format/lint/typecheck (scoped) + unit tests + build
npm run perf:mascot               # performance budget report -> docs/mascot/PERFORMANCE.md

# Database (Drizzle + Postgres)
npm run db:migrate                # tsx scripts/migrate.ts
npm run db:seed:archive           # tsx scripts/seed-archive.ts
npm run db:tunnel                 # ssh tunnel to the remote Postgres box
```

There is no top-level Jest/Vitest config and no top-level `npm test` — each
subsystem has its own `test:*` script, and `tests/e2e/mascot-*.spec.ts`
files are Playwright-shaped specs that no-op until `@playwright/test` is
installed (do not add it without discussing first).

**`next.config.js` sets `typescript.ignoreBuildErrors: true` and
`eslint.ignoreDuringBuilds: true`.** `npm run build` alone will not catch
type or lint regressions. The repo has pre-existing type/lint errors
outside the mascot paths (`lib/mascot`, `components/mascot`,
`components/resonance-weaver`, `app/motion-lab`, `tests/mascot`,
`tests/e2e/mascot-*`) — run `npx tsc --noEmit` / `next lint` yourself when
changing non-mascot code, and judge new errors against what's already
there rather than expecting a clean baseline.

## Architecture

### Routing / page composition

Standard `app/` router. `app/page.tsx` composes the single-page portfolio
sections (`components/Hero.tsx`, `components/AboutStudioSection.tsx`,
`components/Projects.tsx`, `components/Experience.tsx`,
`components/Contact.tsx`, etc.). Content for these sections lives as typed
data in `constants/*.ts` (`projects.ts`, `resume.ts`, `experiences.ts`,
`combos.ts`, ...) with matching types in `@types/*.type.ts` — prefer
editing content there over hardcoding it in JSX.

Standalone routes worth knowing about:
- `app/(archive)/blog`, `app/(archive)/worth-your-time`, `app/(archive)/raq`,
  `app/(archive)/inspo` — the "Signal Archive" content section, backed by
  Postgres (see below).
- `app/learning/*` — interactive courses (procedural animation, string
  instrument), content driven by `lib/learning/*`.
- `app/motion-lab`, `app/creature-lab`, `app/octopod-lab`, `app/ss-lab` —
  isolated tuning/prototyping playgrounds for character motion, kept out
  of the main page so experiments don't risk production performance.
- `app/systems/[slug]` — write-ups for individual engineered systems.
- `app/admin/*` + `app/api/admin/*` — the CMS UI/API, gated by
  `middleware.ts` (cookie session, see `lib/admin/auth.ts`).
- `app/api/mcp` + `app/oauth/*` + `app/.well-known/oauth-*` — an MCP
  server (`lib/mcp/tools.ts`) exposed over OAuth (`lib/oauth/*`) so an
  external agent can create blog posts / learning entries through the
  same admin API the UI uses (`lib/mcp/admin-client.ts` calls
  `app/api/admin/*` routes, `middleware.ts` accepts either the admin
  cookie or a bearer token with `portfolio:write` scope for those
  routes).

### Database

Drizzle ORM + Postgres, schema in `db/schema.ts`, migrations in
`db/migrations/`, config in `drizzle.config.ts`. `lib/db/client.ts` is the
connection; `lib/db/control-plane.ts` and `lib/portfolio/*` hold the
read/write logic for content entries and learning tracks. `DATABASE_URL`
and friends live in `.env.local` (see `.env.example` for the full set,
including admin session and OAuth secrets).

### Interactive/simulation subsystems

Each of these is a self-contained engine with its own directory under
`lib/`, its own components, and (mostly) its own tests — treat them as
separate modules, not shared infrastructure:

- **Procedural mascot** (`lib/mascot/`, `components/mascot/`) — canvas
  creature that roams the page and reacts to DOM layout. Fully specified
  in `.claude/CLAUDE.md` — read that file before editing anything here.
- **Strumrise game** (`lib/mascot/game/`, `components/strumrise/`) — a
  vertical auto-bounce platformer built on top of the mascot engine's
  rig/physics, gated behind `components/mascot/StrumriseGate.tsx`.
- **Procedural character lab** (`lib/procedural-character/`) — a separate,
  earlier soft-body/FABRIK character engine used by the `*-lab` playground
  routes; independent of `lib/mascot`.
- **Living canvas** (`lib/living-canvas/`, `components/living-canvas/`) —
  an ambient WebGL/Canvas-2D-fallback signal field with its own renderer
  and pulse/zone field simulation.
- **Canvas arcade games** (`components/easter-egg/game/` — "Cluckstorm",
  `components/not-found-breaker/game/` — 404-page brick breaker) — plain
  `requestAnimationFrame` Canvas 2D games with `model`/`update`/`render`
  split and `logic.test.ts` unit tests via `tsx --test`. Predate the
  mascot work; keep them independent of `lib/mascot`.
- **Hero string instrument** (`components/IntrectiveComponents/`) — a
  physics-simulated, Web-Audio-driven playable instrument in the Hero
  section.

Animation stack used across the rest of the site: `framer-motion`, `gsap`,
`@studio-freight/lenis` (via `components/providers/SmoothScrollProvider.tsx`).
None of these are used inside `lib/mascot`, which is a hand-rolled
fixed-step simulation with zero animation-library and zero React
dependencies by design (see `.claude/CLAUDE.md`).

## Notes

- No README.md exists; this file plus `docs/mascot/*.md` and the
  top-level `*_MASTER_SPEC*.md` / `*_MASTER_PLAN.md` files are the design
  record for the mascot/game work. `TASK.md` is a running changelog of
  completed and discovered work — useful for "why is this the way it is"
  context, not a task queue to execute from.
- Don't reset or overwrite unrelated changes, and don't commit or push
  unless asked (repo-wide convention, not just the mascot subsystem).
