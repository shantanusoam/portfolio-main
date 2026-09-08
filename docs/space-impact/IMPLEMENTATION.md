# Lost Signal — implementation and review

Route: `/arcade/space-impact`  
Base: `5798910845af25f0e3a18d5174c9a6492e241e81`  
Review date: 2026-09-08

The complete five-sector implementation is ready for code review. The real-device acceptance gates in `PLAN.md` remain open; this is a draft release, not a claim that phone performance or human game feel has been validated.

## Included

- A 480 × 270 horizontal Canvas 2D world, deterministic 60 Hz updates, bounded catch-up, swept projectile collision, and separate DOM menus/HUD.
- Relative drag and virtual-stick steering; one movement-pointer owner plus independent Pulse/Inspect buttons. Keyboard support, portrait thumb area, landscape layout, handedness, explicit pause, interrupted-input cleanup, and countdown resume.
- Auto-fire, three weapon families with three reachable upgrade levels, one-time graze rewards, Phase Pulse, repair drops, and recovery invulnerability.
- Five authored sectors, readable corridor gaps, reflected projectiles, currents, five bosses with telegraphs, recovery windows, health phases, and independently destructible cannon parts.
- Campaign checkpoints, one-run arcade, unlocked boss practice, and a three-minute daily seeded challenge. Challenge routes exclude secret-room detours. Scores are local and separated by mode and assistance.
- All eight secrets, touch keypads, a clue journal with explicit hint reveals, optional rooms, a recorded local ghost, a companion, the final relay, two endings, LCD presentation, and constellation ship livery.
- Original generated orbital environment art, code-native pixel sprites and geometry, procedural Web Audio music/effects, mute and separate volume settings.
- Reduced motion, low flashes, high contrast, battery saver, five-hull assistance, downloadable PNG flight cards, and user-initiated sharing.
- Arcade entry in the command index and existing arcade. Cluckstorm remains available, including its recovered-cartridge link. Existing developer shortcuts only run in development.
- `PortfolioRuntime` unmounts ambient animation/audio/input providers on `/arcade/*`, while preserving the existing portfolio composition elsewhere.

The planned cinematic moments are represented by original code-native boss arrivals and sector geometry. Hand-animated cinematic sequences, human balancing, and physical-device polish can continue during draft review; they are not measured completion claims.

## Controls

| Action | Touch / pointer | Keyboard |
| --- | --- | --- |
| Move | Drag on the board or the separate thumb pad; optional virtual stick | WASD / arrows |
| Shoot | Automatic; Hold fire toggles it off | Hold F to cease fire |
| Phase Pulse | Pulse button when charged | Space |
| Inspect | Inspect button near a signal | E |
| Pause / resume | Pause / Resume buttons | P / Escape |
| Secret codes | Receiver and in-world touch keypads | Use the same focusable buttons |

Settings, the journal, and flight paths are native modal dialogs. Closing an in-game dialog leaves the flight paused. A stopped audio device or failed decorative image does not prevent play. Storage failure shows a visible notice.

## Code map

| Location | Responsibility |
| --- | --- |
| `app/arcade/space-impact/page.tsx` | Dedicated route and metadata |
| `components/space-impact/` | DOM interface, lifecycle, pointer wiring, responsive CSS |
| `lib/space-impact/model.ts`, `types.ts`, `config.ts` | Explicit run state and tuning |
| `lib/space-impact/update.ts`, `collision.ts`, `combat.ts` | Fixed-step motion, damage, shooting, rewards |
| `lib/space-impact/director.ts`, `content/` | Authored campaign, bosses, rooms, secrets |
| `lib/space-impact/input.ts`, `runtime.ts` | Pointer ownership and independent simulation clock |
| `lib/space-impact/render.ts`, `audio.ts`, `share.ts` | Presentation, procedural sound, exported card |
| `lib/space-impact/storage.ts` | Validated version-one saves and checkpoint reconstruction |
| `tests/space-impact/logic.test.ts` | Gameplay and reachability regression coverage |

No game engine or dependency was added. `npm` remains authoritative. The development wrapper accepts the preview supervisor's `--host` and `--strictPort` arguments and passes ordinary arguments through to `next dev`.

## Run and verify

```bash
npm ci
npm run dev
# Open /arcade/space-impact
npm run test:space-impact
node --import tsx --test components/easter-egg/game/logic.test.ts components/not-found-breaker/game/logic.test.ts
npx tsc --noEmit
npx eslint lib/space-impact components/space-impact app/arcade components/providers/PortfolioRuntime.tsx tests/space-impact app/layout.tsx components/easter-egg/SecretArcade.tsx components/home/HomeInteractiveLayer.tsx lib/archive/command-index.ts
npm run build
```

The build configuration skips type and lint validation, so the separate commands are required. Browser-facing behavior needs the device checks in `QA.md`.

## Persistence

The only new key is `portfolio-space-impact:v1`. Data stays on the device. Saves contain validated settings, known secret IDs, reached sectors, per-mode best scores, an optional sector-start checkpoint, and up to 300 local ghost positions. Unsupported versions and malformed values load safe defaults. There is no full in-flight save, account, leaderboard, analytics event stream, or uploaded replay.

A new sector restores one hull segment. Retrying a checkpoint reconstructs that sector with a fresh hull and the checkpoint's weapon, upgrade, score, seed, and assistance category. Secrets persist immediately. Changing assistance affects a new flight; continuing a checkpoint keeps its original category.

## Assets

| Asset | Origin and use |
| --- | --- |
| `public/space-impact/orbit.webp` | Original environment generated for this implementation, optimized to WebP; decorative only |
| Ship, enemies, bosses, feathers, terrain, effects | Original pixel patterns and Canvas geometry in `render.ts`; collisions use independent logical shapes |
| Music and effects | Original oscillator sequences in `audio.ts`; no downloaded sound recordings |
| Interface icons | Existing `lucide-react` dependency |

Every secret has a clue and an explicit revealable hint in `content/secrets.ts`. The window, 404 beacon, and patient probe provide the three fragments for the final relay. The signal livery and companion are cosmetic and do not change scoring or damage.
