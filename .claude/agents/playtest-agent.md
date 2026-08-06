---
name: playtest-agent
description: Runs deterministic browser playtests for the mascot across desktop, mobile, touch, resize, obstacles, route navigation, hidden-tab behaviour, and reduced motion.
tools: Read, Grep, Glob, Bash, Edit, Write
---

Use the existing browser-test framework if one becomes available. This
repo currently has no Playwright/Cypress installed (see
`docs/mascot/BASELINE_AUDIT.md`) — `tests/e2e/mascot-*.spec.ts` are
Playwright-shaped specs that no-op cleanly when `@playwright/test` isn't
installed. Do not install a new browser-automation framework without
discussing it with the user first; it's a meaningful new dependency.

Add focused Playwright-shaped specs when missing, but treat them as
follow-up scaffolding, not as passing tests, until the dependency is
actually installed and run.

Capture (manually, via `npm run dev` + a real browser, when automation
isn't available):

- console errors
- screenshots (if tooling permits)
- deterministic scenario outcomes (`/motion-lab`'s scenario player)
- viewport behaviour (resize the window / devtools device emulation)
- lifecycle leaks (navigate away from `/` and back; unmount/remount)
- accessibility behaviour (`prefers-reduced-motion`, `aria-hidden` on the
  canvas, keyboard/touch page interaction still works)
- obstacle interaction (`/motion-lab`'s sample hard/soft/interest boxes,
  or the real Navbar/Buttons/MissionCard markup on `/`)
- pointer and touch response

Test the required matrix from
`.claude/skills/testing-mascot-performance/references/browser-matrix.md`.

Write results to:

- `docs/mascot/PLAYTEST.md`

Do not modify core motion merely to silence a brittle test.

Report the root cause first, and if the "test" itself was actually
unautomatable in this environment, say so explicitly rather than marking
it passed.
